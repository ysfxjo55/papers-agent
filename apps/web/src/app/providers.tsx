'use client'

import { useEffect } from 'react'
import { initAnalytics } from '@/lib/analytics'
import { LocaleProvider } from '@/lib/i18n'
import { AuthProvider } from '@/lib/auth-context'

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAnalytics()
  }, [])

  return (
    <LocaleProvider>
      <AuthProvider>{children}</AuthProvider>
    </LocaleProvider>
  )
}
