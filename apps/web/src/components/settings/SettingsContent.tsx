'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { LangToggle } from '@/components/LangToggle'
import { useLocale } from '@/lib/i18n'
import { loadState, saveState, createInitialState, cancelPendingNotebookSync, resetNotebookOnApi, exportNotebookAsJson } from '@/lib/store'
import { getGuestTurns, GUEST_LIMIT } from '@/lib/guest'
import { capture } from '@/lib/analytics'
import { useAuth } from '@/lib/auth-context'

const THEME_KEY = 'ai-mind-theme'

const iconProps = { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true } as const

function IconAccount() {
  return <svg {...iconProps}><circle cx="8" cy="5.6" r="2.6" stroke="currentColor" strokeWidth="1.3"/><path d="M2.6 13.4c1-3 3-4.2 5.4-4.2s4.4 1.2 5.4 4.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
}
function IconNotebook() {
  return <svg {...iconProps}><path d="M2 3.4c1.8-.9 4-.9 6 0v9.2c-2-.9-4.2-.9-6 0V3.4ZM14 3.4c-1.8-.9-4-.9-6 0v9.2c2-.9 4.2-.9 6 0V3.4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
}
function IconUsage() {
  return <svg {...iconProps}><path d="M3 13V8M8 13V3M13 13V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function IconPlan() {
  return <svg {...iconProps}><rect x="1.5" y="4" width="13" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 7h13" stroke="currentColor" strokeWidth="1.3"/></svg>
}
function IconPreferences() {
  return <svg {...iconProps}><path d="M3 4h10M3 8h10M3 12h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="6" cy="4" r="1.3" fill="var(--paper)" stroke="currentColor" strokeWidth="1.3"/><circle cx="10" cy="8" r="1.3" fill="var(--paper)" stroke="currentColor" strokeWidth="1.3"/><circle cx="5.5" cy="12" r="1.3" fill="var(--paper)" stroke="currentColor" strokeWidth="1.3"/></svg>
}
function IconDanger() {
  return <svg {...iconProps}><path d="M8 2.5 14.5 13.3H1.5L8 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M8 6.7v3M8 11.3h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
}
function IconClose() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}

type SectionId = 'account' | 'notebook' | 'usage' | 'plan' | 'preferences' | 'danger'

export function SettingsContent() {
  const { t } = useLocale()
  const { user, signOut } = useAuth()
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [nodeCount, setNodeCount] = useState(0)
  const [edgeCount, setEdgeCount] = useState(0)
  const [guestTurns, setGuestTurns] = useState(0)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [section, setSection] = useState<SectionId>('account')

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') setTheme(saved)
    const s = loadState()
    setNodeCount(s.nodes.length)
    setEdgeCount(s.edges.length)
    setGuestTurns(getGuestTurns())
    const hash = window.location.hash.replace('#', '')
    if (['account', 'notebook', 'usage', 'plan', 'preferences', 'danger'].includes(hash)) {
      setSection(hash as SectionId)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  function toggleTheme() {
    setTheme((cur) => (cur === 'dark' ? 'light' : 'dark'))
  }

  function goToSection(id: SectionId) {
    setSection(id)
    window.history.replaceState(null, '', `#${id}`)
  }

  function handleExport() {
    const s = exportNotebookAsJson()
    capture('graph_exported', { nodes: s.nodes.length, edges: s.edges.length, source: 'settings' })
  }

  async function handleReset() {
    if (resetting) return
    cancelPendingNotebookSync()
    setResetting(true)
    try {
      await resetNotebookOnApi()
      const next = createInitialState()
      saveState(next)
      setNodeCount(0)
      setEdgeCount(0)
      capture('notebook_reset', { source: 'settings' })
    } catch (err) {
      console.warn('Reset failed:', err)
    } finally {
      setResetting(false)
      setShowResetConfirm(false)
    }
  }

  const usagePct = Math.min(100, Math.round((guestTurns / GUEST_LIMIT) * 100))

  const NAV: { id: SectionId; label: string; icon: React.ReactNode }[] = [
    { id: 'account', label: t.settings_section_account, icon: <IconAccount /> },
    { id: 'notebook', label: t.settings_section_notebook, icon: <IconNotebook /> },
    { id: 'usage', label: t.settings_section_usage, icon: <IconUsage /> },
    { id: 'plan', label: t.settings_section_plan, icon: <IconPlan /> },
    { id: 'preferences', label: t.settings_section_preferences, icon: <IconPreferences /> },
    { id: 'danger', label: t.settings_section_danger, icon: <IconDanger /> },
  ]

  const TIERS = [
    { name: t.tier_free_name, price: t.tier_free_price, cadence: '', blurb: t.tier_free_blurb, points: t.tier_free_points, current: true },
    { name: t.tier_scholar_name, price: t.tier_scholar_price, cadence: t.cadence_month, blurb: t.tier_scholar_blurb, points: t.tier_scholar_points, featured: true },
    { name: t.tier_patron_name, price: t.tier_patron_price, cadence: t.cadence_month, blurb: t.tier_patron_blurb, points: t.tier_patron_points },
  ]

  const active = NAV.find((n) => n.id === section)!

  return (
    <div className="settings-page">
      <nav className="settings-topbar">
        <Link href="/" className="settings-brand">
          <BrandLogo size={20} />
          AI Mind
        </Link>
        <div className="settings-topbar-actions">
          <LangToggle />
          <button className="settings-icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? t.theme_dark : t.theme_light}
          </button>
        </div>
      </nav>

      <div className="settings-backdrop" role="dialog" aria-modal="true" aria-label={t.settings_title}>
        <div className="settings-dialog">
          <nav className="settings-dialog-nav" aria-label={t.settings_title}>
            <div className="settings-account-summary">
              <div className="settings-avatar">{user ? user.name[0]?.toUpperCase() : 'G'}</div>
              <div className="settings-account-name">{user ? user.name : t.settings_guest_value}</div>
              <div className="settings-account-plan">{t.tier_free_name}</div>
            </div>
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`settings-nav-item${item.id === section ? ' active' : ''}`}
                onClick={() => goToSection(item.id)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          <div className="settings-dialog-content">
            <div className="settings-dialog-header">
              <div className="settings-dialog-title">{active.icon}{active.label}</div>
              <Link href="/app" className="settings-dialog-close" aria-label={t.close} title={t.close}>
                <IconClose />
              </Link>
            </div>

            <div className="settings-dialog-body">
              {/* ── Account ───────────────────────────────────────────── */}
              {section === 'account' && (
                <>
                  {!user && (
                    <div className="settings-guest-notice">
                      <p>{t.settings_guest_notice}</p>
                      <div className="settings-guest-actions">
                        <Link href="/register" className="settings-guest-btn settings-guest-btn--filled">{t.auth_signup_submit}</Link>
                        <Link href="/login" className="settings-guest-btn settings-guest-btn--ghost">{t.auth_sign_in}</Link>
                      </div>
                    </div>
                  )}
                  <div className="settings-row">
                    <span className="settings-row-label">{t.auth_name_label}</span>
                    <span className="settings-row-value">{user ? user.name : t.settings_guest_value}</span>
                  </div>
                  <div className="settings-row">
                    <span className="settings-row-label">{t.auth_email_label}</span>
                    <span className="settings-row-value">{user ? user.email : '—'}</span>
                  </div>
                  <div className="settings-row">
                    <span className="settings-row-label">{t.auth_password_label}</span>
                    <button className="settings-btn" disabled>{t.settings_change_password}</button>
                  </div>
                  {user ? (
                    <div className="settings-row">
                      <span className="settings-row-label">{t.settings_sign_out}</span>
                      <button className="settings-btn" onClick={() => void signOut()}>{t.settings_sign_out}</button>
                    </div>
                  ) : (
                    <p className="settings-preview-notice">{t.auth_preview_notice}</p>
                  )}
                </>
              )}

              {/* ── Notebook ──────────────────────────────────────────── */}
              {section === 'notebook' && (
                <>
                  <div className="settings-row">
                    <span className="settings-row-label">{t.nodes_edges(nodeCount, edgeCount)}</span>
                  </div>
                  <div className="settings-row">
                    <span className="settings-row-label">{t.export_btn}</span>
                    <button className="settings-btn" onClick={handleExport}>{t.export_btn}</button>
                  </div>
                  <div className="settings-row">
                    <span className="settings-row-label">{t.reset_btn}</span>
                    <button
                      className="settings-btn settings-btn--danger"
                      onClick={() => setShowResetConfirm(true)}
                      disabled={resetting}
                    >
                      {resetting ? t.resetting : t.reset_btn}
                    </button>
                  </div>
                </>
              )}

              {/* ── Usage ─────────────────────────────────────────────── */}
              {section === 'usage' && (
                <>
                  <p className="settings-usage-value">{guestTurns} / {GUEST_LIMIT}</p>
                  <div className="settings-usage-track">
                    <div className="settings-usage-fill" style={{ width: `${usagePct}%` }} />
                  </div>
                  <p className="settings-usage-note">{t.settings_usage_body(guestTurns, GUEST_LIMIT)} — {t.settings_usage_note}</p>
                </>
              )}

              {/* ── Plan ──────────────────────────────────────────────── */}
              {section === 'plan' && (
                <>
                  <div className="settings-plan-grid">
                    {TIERS.map((tier) => (
                      <div key={tier.name} className={`settings-plan-card${tier.featured ? ' settings-plan-card--featured' : ''}`}>
                        {tier.featured && <span className="settings-plan-recommended">{t.tier_recommended}</span>}
                        <div className="settings-plan-head">
                          <span className="settings-plan-name">{tier.name}</span>
                          {tier.current && <span className="settings-plan-current">{t.settings_current_plan}</span>}
                        </div>
                        <div>
                          <span className="settings-plan-price">{tier.price}</span>
                          {tier.cadence && <span className="settings-plan-cadence">{tier.cadence}</span>}
                        </div>
                        <div className="settings-plan-blurb">{tier.blurb}</div>
                        <ul className="settings-plan-points">
                          {(tier.points as readonly string[]).map((p) => (
                            <li key={p}>
                              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 6.2 4.8 9 10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              {p}
                            </li>
                          ))}
                        </ul>
                        {!tier.current && (
                          <button className="settings-btn" disabled style={{ marginTop: 2, alignSelf: 'flex-start' }}>{t.settings_upgrade}</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="settings-preview-notice">{t.auth_preview_notice}</p>
                </>
              )}

              {/* ── Preferences ───────────────────────────────────────── */}
              {section === 'preferences' && (
                <>
                  <div className="settings-row">
                    <span className="settings-row-label">{t.settings_pref_language}</span>
                    <LangToggle />
                  </div>
                  <div className="settings-row">
                    <span className="settings-row-label">{t.settings_pref_theme}</span>
                    <button className="settings-icon-btn" onClick={toggleTheme}>
                      {theme === 'dark' ? t.theme_dark : t.theme_light}
                    </button>
                  </div>
                </>
              )}

              {/* ── Danger zone ───────────────────────────────────────── */}
              {section === 'danger' && (
                <>
                  <div className="settings-row">
                    <span className="settings-row-label settings-danger-title">{t.settings_delete_account}</span>
                    <button className="settings-btn settings-btn--danger" disabled>{t.settings_delete_account}</button>
                  </div>
                  <p className="settings-usage-note" style={{ marginTop: 10 }}>{t.settings_delete_body}</p>
                  <p className="settings-preview-notice">{t.auth_preview_notice}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <div className="reset-modal-backdrop" onClick={() => setShowResetConfirm(false)} role="presentation">
          <div
            className="reset-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-reset-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="reset-modal-title" id="settings-reset-modal-title">{t.reset_modal_title}</div>
            <div className="reset-modal-body">{t.reset_modal_body}</div>
            <div className="reset-modal-actions">
              <button type="button" className="reset-modal-btn cancel" onClick={() => setShowResetConfirm(false)} autoFocus>
                {t.cancel}
              </button>
              <button type="button" className="reset-modal-btn confirm" disabled={resetting} onClick={() => void handleReset()}>
                {resetting ? t.resetting : t.reset_btn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
