import type { AppSlice, AuthSlice } from './types'

export const createAuthSlice: AppSlice<AuthSlice> = (set) => {
  const fetchToken = async () => {
    try {
      const tokenRes = await fetch('/csrf-token', { credentials: 'include' })
      const data = await tokenRes.json()
      set({ csrfToken: data.csrfToken || '' })
    } catch {
      // ignore errors
    }
  }

  void fetchToken()

  return {
    isAuthenticated: true,
    csrfToken: '',
    login: async () => {
      await fetchToken()
      return true
    },
    logout: () => set({ isAuthenticated: true, csrfToken: '' }),
  }
}
