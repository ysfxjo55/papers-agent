import { API_BASE_URL } from './config'

export interface CurrentUser {
  id: number
  name: string
  email: string
}

async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || 'Request failed')
  }
  return res.json()
}

export function register(name: string, email: string, password: string): Promise<CurrentUser> {
  return authFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
}

export function login(email: string, password: string): Promise<CurrentUser> {
  return authFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function logout(): Promise<void> {
  return authFetch('/auth/logout', { method: 'POST' })
}

export function getCurrentUser(): Promise<CurrentUser | null> {
  return authFetch<CurrentUser>('/auth/me', { method: 'GET' }).catch(() => null)
}
