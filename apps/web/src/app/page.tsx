'use client'

import { useState, useMemo, useEffect } from 'react'
import { Graph, Inspector } from '@/components/Graph'
import { ChatPanel } from '@/components/ChatPanel'
import { loadState, saveState, resetState, setFocus, sendUserMessage } from '@/lib/store'
import { getCategoryStyles, REL_LABELS } from '@/lib/data'
import type { AppState } from '@/lib/types'

const THEME_KEY = 'ai-mind-theme'

export default function Home() {
  const [state, setState] = useState<AppState>({ nodes: [], edges: [], messages: [], focusId: null, newIds: [] })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    async function loadFromApi() {
      try {
        const res = await fetch('http://127.0.0.1:8000/notebooks/seed')
        if (!res.ok) throw new Error(`seed ${res.status}`)
        const data = await res.json()
        const nodes = (data.nodes ?? []).map((n: any) => ({
          ...n,
          parent_id: n.parent_id ?? undefined,
          rotation: n.rotation ?? 0,
          annotations: (n.annotations ?? []).map((a: any) =>
            typeof a === 'string' ? { text: a, ts: Date.now() } : a
          ),
        }))
        const next: AppState = {
          nodes,
          edges: data.edges ?? [],
          messages: [],
          focusId: null,
          newIds: [],
        }
        saveState(next)
        setState(next)
      } catch (err) {
        console.warn('API load failed, using localStorage:', err)
        setState(loadState())
      }
    }
    loadFromApi()
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'dark' || saved === 'light') setTheme(saved)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'ai-mind-state-v7' && e.newValue) {
        try { setState(JSON.parse(e.newValue)) } catch {}
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const focused = state.focusId ? state.nodes.find((n) => n.id === state.focusId) ?? null : null
  const selectedNode = selectedId ? state.nodes.find((n) => n.id === selectedId) ?? null : null
  const inspectorNode = selectedNode || focused

  const relatedForInspector = useMemo(() => {
    if (!inspectorNode) return []
    const id = inspectorNode.id
    const out: { label: string }[] = []
    for (const e of state.edges) {
      if (e.from === id) {
        const n = state.nodes.find((x) => x.id === e.to)
        const rel = REL_LABELS[e.type]
        if (n && rel) out.push({ label: `${rel.en} → ${n.label}` })
      } else if (e.to === id) {
        const n = state.nodes.find((x) => x.id === e.from)
        const rel = REL_LABELS[e.type]
        if (n && rel) out.push({ label: `${n.label} ${rel.en} →` })
      }
    }
    return out
  }, [inspectorNode, state.edges, state.nodes])

  function handleSelect(id: string) {
    setSelectedId(id)
    setFocus(id)
  }

  function handleClearSelection() {
    setSelectedId(null)
    setFocus(null)
  }

  function handleReset() {
    if (confirm('Reset the notebook? All discussion and added nodes will be cleared.')) {
      const s = resetState()
      setState(s)
      setSelectedId(null)
    }
  }

  async function handleSendMessage(text: string) {
    const optimistic = loadState()
    optimistic.messages.push({ role: 'user', content: text })
    optimistic.pending = true
    saveState(optimistic)
    setState(optimistic)

    const next = await sendUserMessage(text)
    setState(next)
  }

  return (
    <div className="app graph-only">
      <header className="header">
        <div className="brand">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="14" cy="14" r="5" fill="#A67C52"/>
            <circle cx="6" cy="8" r="3" fill="#A67C52" opacity="0.7"/>
            <circle cx="22" cy="8" r="3.5" fill="#A67C52" opacity="0.85"/>
            <circle cx="5" cy="20" r="2.5" fill="#7A9B7F" opacity="0.8"/>
            <circle cx="22" cy="20" r="2" fill="#7A9B7F" opacity="0.7"/>
            <circle cx="14" cy="4" r="2" fill="#A67C52" opacity="0.5"/>
            <line x1="14" y1="14" x2="6" y2="8" stroke="#C9B8A8" strokeWidth="1"/>
            <line x1="14" y1="14" x2="22" y2="8" stroke="#C9B8A8" strokeWidth="1"/>
            <line x1="14" y1="14" x2="5" y2="20" stroke="#C9B8A8" strokeWidth="1"/>
            <line x1="14" y1="14" x2="22" y2="20" stroke="#C9B8A8" strokeWidth="1"/>
            <line x1="14" y1="14" x2="14" y2="4" stroke="#C9B8A8" strokeWidth="1"/>
            <line x1="6" y1="8" x2="14" y2="4" stroke="#C9B8A8" strokeWidth="0.75"/>
          </svg>
          <span className="brand-mark">AI Mind</span>
        </div>
        <div className="legend">
          {(['foundations', 'vision', 'language', 'rl', 'architecture'] as const).map((cat) => {
            const cs = getCategoryStyles(theme)[cat]
            return (
              <div key={cat} className="legend-item">
                <span className="legend-swatch"
                  style={{ background: cs.fill, color: cs.stroke }} />
                <span>{cs.label}</span>
              </div>
            )
          })}
          <span className="legend-stat">
            {state.nodes.length} nodes · {state.edges.length} edges
          </span>
          <button className="header-btn ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme">
            {theme === 'dark' ? '☽ Dark' : '☼ Light'}
          </button>
          <button className="header-btn ghost" onClick={handleReset} title="Reset notebook">Reset</button>
        </div>
      </header>

      <div className="canvas-wrap">
        <Graph
          state={state}
          selectedId={selectedId}
          onSelectNode={handleSelect}
          onClearSelection={handleClearSelection}
          theme={theme}
        />
        <Inspector
          node={inspectorNode}
          related={relatedForInspector}
          onClose={handleClearSelection}
        />
        <div className="folio">folio I · {new Date().getFullYear()}</div>
      </div>

      <div className="chat-sidebar">
        <ChatPanel
          messages={state.messages}
          pending={state.pending}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  )
}
