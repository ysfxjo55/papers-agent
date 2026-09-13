'use client'

import { useState, useEffect, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BrandLogo } from '@/components/BrandLogo'
import { LangToggle } from '@/components/LangToggle'
import { ArrowIcon } from '@/components/ArrowIcon'
import { useLocale } from '@/lib/i18n'
import { register, login } from '@/lib/auth'
import { useAuth } from '@/lib/auth-context'

const THEME_KEY = 'ai-mind-theme'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Mode = 'signin' | 'signup'
type Errors = Partial<Record<'name' | 'email' | 'password' | 'confirm' | 'form', string>>
type Status = 'idle' | 'submitting'

export function AuthContent({ mode }: { mode: Mode }) {
  const { t, isRTL } = useLocale()
  const router = useRouter()
  const { refresh } = useAuth()
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<Status>('idle')

  const isSignup = mode === 'signup'

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') setTheme(saved)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  function toggleTheme() {
    setTheme((cur) => (cur === 'dark' ? 'light' : 'dark'))
  }

  function validate(): Errors {
    const next: Errors = {}
    if (isSignup && !name.trim()) next.name = t.auth_err_name
    if (!EMAIL_RE.test(email.trim())) next.email = t.auth_err_email
    if (isSignup && password.length < 8) next.password = t.auth_err_password_len
    if (isSignup && confirm !== password) next.confirm = t.auth_err_password_match
    return next
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return
    setStatus('submitting')
    try {
      if (isSignup) await register(name.trim(), email.trim(), password)
      else await login(email.trim(), password)
      await refresh()
      router.push('/app')
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : t.auth_generic_error })
      setStatus('idle')
    }
  }

  return (
    <div className="auth-page">
      <nav className="auth-topbar">
        <Link href="/" className="auth-brand">
          <BrandLogo size={22} />
          AI Mind
        </Link>
        <div className="auth-topbar-actions">
          <LangToggle />
          <button className="auth-icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? t.theme_dark : t.theme_light}
          </button>
        </div>
      </nav>

      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-ornament">❧</div>
          <h1 className="auth-title">{isSignup ? t.auth_signup_title : t.auth_signin_title}</h1>
          <p className="auth-sub">{isSignup ? t.auth_signup_sub : t.auth_signin_sub}</p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {isSignup && (
              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-name">{t.auth_name_label}</label>
                <input
                  id="auth-name"
                  type="text"
                  className="auth-input"
                  placeholder={t.auth_name_placeholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
                {errors.name && <p className="auth-field-error">{errors.name}</p>}
              </div>
            )}

            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-email">{t.auth_email_label}</label>
              <input
                id="auth-email"
                type="email"
                className="auth-input"
                placeholder={t.email_placeholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              {errors.email && <p className="auth-field-error">{errors.email}</p>}
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-password">{t.auth_password_label}</label>
              <div className="auth-input-wrap">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder={isSignup ? t.auth_password_placeholder : t.auth_password_placeholder_signin}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  title={showPassword ? t.auth_hide_password : t.auth_show_password}
                  aria-label={showPassword ? t.auth_hide_password : t.auth_show_password}
                >
                  {showPassword ? (
                    <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M6.6 6.7a2.3 2.3 0 003.2 3.2M9.9 4.3A6.8 6.8 0 0114 8s-2.2 4-6 4a5.9 5.9 0 01-2.1-.4M4.2 5.3C2.7 6.3 2 8 2 8s2.2 4 6 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.2-4 6-4 6 4 6 4-2.2 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="8" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.4"/></svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="auth-field-error">{errors.password}</p>}
            </div>

            {isSignup && (
              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-confirm">{t.auth_confirm_label}</label>
                <input
                  id="auth-confirm"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder={t.auth_confirm_placeholder}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
                {errors.confirm && <p className="auth-field-error">{errors.confirm}</p>}
              </div>
            )}

            {errors.form && <p className="auth-field-error auth-form-error">{errors.form}</p>}

            <button type="submit" className="auth-btn auth-btn--filled auth-submit" disabled={status === 'submitting'}>
              {status === 'submitting' ? t.auth_submitting : (isSignup ? t.auth_signup_submit : t.auth_signin_submit)}
            </button>
          </form>

          <p className="auth-switch">
            {isSignup ? t.auth_have_account : t.auth_no_account}{' '}
            <Link href={isSignup ? '/login' : '/register'} className="auth-arrow-link">
              {isSignup ? t.auth_sign_in : t.auth_create_one}
              <ArrowIcon direction={isRTL ? 'left' : 'right'} />
            </Link>
          </p>
        </div>

        <Link href="/" className="auth-back auth-arrow-link auth-arrow-link--lead">
          <ArrowIcon direction={isRTL ? 'right' : 'left'} />
          {t.auth_back}
        </Link>
      </div>
    </div>
  )
}
