'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Graph, Inspector } from '@/components/Graph'
import { ChatPanel } from '@/components/ChatPanel'
import { LangToggle } from '@/components/LangToggle'
import { loadState, saveState, createInitialState, cancelPendingNotebookSync, resetNotebookOnApi, setFocus, sendUserMessage, exportNotebookAsJson } from '@/lib/store'
import { getCategoryStyles, REL_LABELS, STORAGE_KEY, layoutPaperNodes, CANVAS_W, enrichNodesWithKeyPoints } from '@/lib/data'
import { API_BASE_URL } from '@/lib/config'
import { capture } from '@/lib/analytics'
import { getGuestTurns, incrementGuestTurns, guestTurnsRemaining, isGuestLimitReached } from '@/lib/guest'
import { BrandLogo } from '@/components/BrandLogo'
import { useLocale } from '@/lib/i18n'
import { useAuth } from '@/lib/auth-context'
import type { AppState } from '@/lib/types'

const THEME_KEY = 'ai-mind-theme'

function mapSeedToState(data: any): AppState {
  const nodes = (data.nodes ?? []).map((n: any) => ({
    ...n,
    parent_id: n.parent_id ?? undefined,
    rotation: n.rotation ?? 0,
    annotations: (n.annotations ?? []).map((a: any) =>
      typeof a === 'string' ? { text: a, ts: Date.now() } : a
    ),
  }))
  return {
    nodes: enrichNodesWithKeyPoints(nodes),
    edges: data.edges ?? [],
    messages: (data.messages ?? []).map((m: any) => ({
      role: m.role,
      content: m.content,
    })),
    focusId: null,
    newIds: [],
    pending: false,
  }
}

async function fetchSeedState(): Promise<AppState> {
  const res = await fetch(`${API_BASE_URL}/notebooks/seed`)
  if (!res.ok) throw new Error(`seed ${res.status}`)
  return mapSeedToState(await res.json())
}

export default function Home() {
  const { t, isRTL } = useLocale()
  const { user, signOut } = useAuth()
  const [state, setState] = useState<AppState>({ nodes: [], edges: [], messages: [], focusId: null, newIds: [] })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatFullscreen, setChatFullscreen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetNotice, setResetNotice] = useState<string | null>(null)
  const [notebookKey, setNotebookKey] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [guestTurns, setGuestTurns] = useState(0)

  useEffect(() => {
    capture('notebook_opened')
    setGuestTurns(getGuestTurns())
  }, [])

  useEffect(() => {
    if (!resetNotice) return
    const timer = window.setTimeout(() => setResetNotice(null), 5000)
    return () => window.clearTimeout(timer)
  }, [resetNotice])

  useEffect(() => {
    let cancelled = false
    async function init() {
      if (localStorage.getItem(STORAGE_KEY)) {
        if (!cancelled) {
          const loaded = loadState()
          saveState(loaded)
          if (!cancelled) setState(loaded)
          setLoading(false)
        }
        return
      }
      try {
        const next = await fetchSeedState()
        next.nodes = layoutPaperNodes(next.nodes)
        saveState(next)
        if (!cancelled) setState(next)
      } catch (err) {
        console.warn('API seed load failed, using localStorage:', err)
        if (!cancelled) setState(loadState())
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'dark' || saved === 'light') setTheme(saved)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (showResetConfirm) { setShowResetConfirm(false); return }
      if (selectedId || state.focusId) {
        setSelectedId(null)
        setFocus(null)
        setState((prev) => ({ ...prev, focusId: null }))
        return
      }
      if (chatFullscreen) setChatFullscreen(false)
      else if (chatOpen) setChatOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showResetConfirm, chatOpen, chatFullscreen, selectedId, state.focusId])

  const focused = state.focusId ? state.nodes.find((n) => n.id === state.focusId) ?? null : null
  const selectedNode = selectedId ? state.nodes.find((n) => n.id === selectedId) ?? null : null
  const inspectorNode = selectedNode || focused

  const inspectorSide = useMemo((): 'left' | 'right' => {
    if (!inspectorNode || inspectorNode.kind === 'concept' || !Number.isFinite(inspectorNode.x)) {
      return isRTL ? 'left' : 'right'
    }
    const nodeOnRight = inspectorNode.x > CANVAS_W / 2
    return isRTL ? (nodeOnRight ? 'right' : 'left') : (nodeOnRight ? 'left' : 'right')
  }, [inspectorNode, isRTL])

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
    setState((prev) => ({ ...prev, focusId: id }))
  }

  function handleClearSelection() {
    setSelectedId(null)
    setFocus(null)
    setState((prev) => ({ ...prev, focusId: null }))
  }

  async function handleReset() {
    if (resetting) return
    cancelPendingNotebookSync()
    setSelectedId(null)
    setChatOpen(false)
    setChatFullscreen(false)
    setResetting(true)
    setResetNotice(null)
    try {
      await resetNotebookOnApi()
      const next = createInitialState()
      saveState(next)
      setState(next)
      setNotebookKey((k) => k + 1)
      setResetNotice(t.notice_cleared)
      capture('notebook_reset')
    } catch (err) {
      console.warn('Reset failed:', err)
      setResetNotice(t.notice_failed)
    } finally {
      setResetting(false)
    }
  }

  function handleExport() {
    const s = exportNotebookAsJson()
    capture('graph_exported', { nodes: s.nodes.length, edges: s.edges.length })
  }

  async function handleSendMessage(text: string) {
    if (isGuestLimitReached(guestTurns)) return

    const optimistic = loadState()
    optimistic.messages.push({ role: 'user', content: text })
    optimistic.pending = true
    saveState(optimistic)
    setState(optimistic)
    const turnCount = optimistic.messages.filter((m) => m.role === 'user').length
    capture('tutor_message_sent', { turn: turnCount, length: text.length })
    setGuestTurns(incrementGuestTurns())

    const next = await sendUserMessage(text)
    setState(next)
  }

  const categoryStyles = getCategoryStyles(theme)

  return (
    <div className={`app graph-only${chatOpen ? ' chat-open' : ''}`}>
      <header className="header">
        <div className="brand">
          <BrandLogo />
          <span className="brand-mark">AI Mind</span>
          <span className="brand-tag">{t.brand_tag}</span>
        </div>
        <div className="legend">
          {(['foundations', 'vision', 'language', 'rl', 'architecture'] as const).map((cat) => {
            const cs = categoryStyles[cat]
            return (
              <div key={cat} className="legend-item">
                <span className="legend-swatch" style={{ background: cs.fill, color: cs.stroke }} />
                <span>{t.categories[cat]}</span>
              </div>
            )
          })}
          <span className="legend-stat">
            {t.nodes_edges(state.nodes.length, state.edges.length)}
          </span>
          <LangToggle />
          <button className="header-btn ghost header-btn--theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme">
            {theme === 'dark' ? t.theme_dark : t.theme_light}
          </button>
          <Link href="/settings" className="header-btn ghost header-btn--settings" title={t.settings_title} aria-label={t.settings_title}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M8 1.5v1.6M8 12.9v1.6M14.5 8h-1.6M3.1 8H1.5M12.7 3.3l-1.1 1.1M4.4 11.6l-1.1 1.1M12.7 12.7l-1.1-1.1M4.4 4.4 3.3 3.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </Link>
          {user && (
            <button
              className="header-btn ghost header-btn--signout"
              onClick={() => void signOut()}
              title={t.settings_sign_out}
            >
              {t.settings_sign_out}
            </button>
          )}
          <button className="header-btn ghost header-btn--export" onClick={handleExport} title={t.export_btn}>{t.export_btn}</button>
          <button
            className="header-btn ghost header-btn--reset"
            onClick={() => setShowResetConfirm(true)}
            title={t.reset_btn}
            disabled={resetting}
          >
            {resetting ? t.resetting : t.reset_btn}
          </button>
          <button
            className="header-btn ghost header-btn--overflow"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label="More actions"
            aria-expanded={mobileMenuOpen}
          >
            ···
          </button>
        </div>
      </header>

      {/* Canvas: always LTR — timeline has fixed visual direction */}
      <div className="canvas-wrap" dir="ltr">
        <Graph
          key={notebookKey}
          state={state}
          selectedId={selectedId}
          onSelectNode={handleSelect}
          onClearSelection={handleClearSelection}
          theme={theme}
        />
        {loading && state.nodes.length === 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Fraunces', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 16,
              color: 'var(--ink-muted, #6b5d4f)',
              pointerEvents: 'none',
            }}
          >
            {t.loading}
          </div>
        )}
        <div className="folio">{t.folio} · {new Date().getFullYear()}</div>
      </div>

      <Inspector
        node={inspectorNode}
        related={relatedForInspector}
        onClose={handleClearSelection}
        theme={theme}
        side={inspectorSide}
      />

      <button
        className={`chat-fab${chatOpen ? ' chat-fab--hidden' : ''}`}
        onClick={() => setChatOpen(true)}
        aria-label={t.ai_tutor_label}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M14 1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2v3l3-3h7a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
        </svg>
        <span>{t.chat_fab}</span>
      </button>

      <ChatPanel
        key={notebookKey}
        messages={state.messages}
        pending={state.pending}
        onSendMessage={handleSendMessage}
        open={chatOpen}
        fullscreen={chatFullscreen}
        onClose={() => { setChatOpen(false); setChatFullscreen(false) }}
        onToggleFullscreen={() => { setChatFullscreen(f => !f); if (!chatOpen) setChatOpen(true) }}
        guestTurnsUsed={guestTurns}
        guestTurnsLeft={guestTurnsRemaining(guestTurns)}
        guestLimitReached={isGuestLimitReached(guestTurns)}
      />

      {resetNotice && (
        <div className="reset-notice" role="status">
          {resetNotice}
          <button type="button" className="reset-notice-dismiss" onClick={() => setResetNotice(null)} aria-label={t.close}>
            ×
          </button>
        </div>
      )}

      {mobileMenuOpen && (
        <>
          <div
            className="mobile-menu-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="mobile-menu-sheet" role="menu">
            <div className="mobile-menu-handle" aria-hidden="true" />
            <Link
              href="/settings"
              className="mobile-menu-item"
              role="menuitem"
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M8 1.5v1.6M8 12.9v1.6M14.5 8h-1.6M3.1 8H1.5M12.7 3.3l-1.1 1.1M4.4 11.6l-1.1 1.1M12.7 12.7l-1.1-1.1M4.4 4.4 3.3 3.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              {t.settings_title}
            </Link>
            {user && (
              <button
                className="mobile-menu-item"
                role="menuitem"
                onClick={() => { void signOut(); setMobileMenuOpen(false) }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t.settings_sign_out}
              </button>
            )}
            <button
              className="mobile-menu-item"
              role="menuitem"
              onClick={() => { handleExport(); setMobileMenuOpen(false) }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 10v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3M8 2v8M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t.export_btn}
            </button>
            <button
              className="mobile-menu-item mobile-menu-item--danger"
              role="menuitem"
              onClick={() => { setShowResetConfirm(true); setMobileMenuOpen(false) }}
              disabled={resetting}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l.8 9.1A1 1 0 0 0 4.8 14h6.4a1 1 0 0 0 1-.9L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {resetting ? t.resetting : t.reset_btn}
            </button>
          </div>
        </>
      )}

      {showResetConfirm && (
        <div
          className="reset-modal-backdrop"
          onClick={() => setShowResetConfirm(false)}
          role="presentation"
        >
          <div
            className="reset-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="reset-modal-title" id="reset-modal-title">{t.reset_modal_title}</div>
            <div className="reset-modal-body">{t.reset_modal_body}</div>
            <div className="reset-modal-actions">
              <button
                type="button"
                className="reset-modal-btn cancel"
                onClick={() => setShowResetConfirm(false)}
                autoFocus
              >
                {t.cancel}
              </button>
              <button
                type="button"
                className="reset-modal-btn confirm"
                disabled={resetting}
                onClick={() => {
                  setShowResetConfirm(false)
                  void handleReset()
                }}
              >
                {resetting ? t.resetting : t.reset_btn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
