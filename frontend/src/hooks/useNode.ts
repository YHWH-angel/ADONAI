import { useCallback } from 'react'
import { useAppStore } from '@/store'

export function useNode() {
  const { csrfToken, setHeight, setDifficulty, setNetHashrate } = useAppStore(
    (s) => ({
      csrfToken: s.csrfToken,
      setHeight: s.setHeight,
      setDifficulty: s.setDifficulty,
      setNetHashrate: s.setNetHashrate,
    }),
  )

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/getmininginfo', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
        credentials: 'include',
      })
      const data = await res.json()
      if (data.blocks !== undefined) setHeight(data.blocks)
      if (data.difficulty !== undefined) setDifficulty(data.difficulty)
      if (data.networkhashps !== undefined) setNetHashrate(data.networkhashps)
    } catch (e) {
      console.error('node info fetch failed', e)
    }
  }, [csrfToken, setHeight, setDifficulty, setNetHashrate])

  return { refresh }
}
