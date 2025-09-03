import type { AppSlice, AuthSlice } from './types'

export const createAuthSlice: AppSlice<AuthSlice> = (set) => ({
  isAuthenticated: false,
  csrfToken: '',
  login: async (username, password) => {
    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      })
      if (!res.ok) return false
      const tokenRes = await fetch('/csrf-token', { credentials: 'include' })
      const data = await tokenRes.json()
      set({ isAuthenticated: true, csrfToken: data.csrfToken || '' })
      return true
    } catch {
      return false
    }
  },
  logout: () => set({ isAuthenticated: false, csrfToken: '' }),
})
