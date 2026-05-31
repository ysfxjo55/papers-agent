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
    setState(loadState())
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
          <span className="brand-mark">The Notebook</span>
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
