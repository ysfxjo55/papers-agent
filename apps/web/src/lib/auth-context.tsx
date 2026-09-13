'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { getCurrentUser, logout, type CurrentUser } from '@/lib/auth'

interface AuthCtx {
  user: CurrentUser | null
  loading: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  refresh: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setUser(await getCurrentUser())
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [])

  async function signOut() {
    await logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
