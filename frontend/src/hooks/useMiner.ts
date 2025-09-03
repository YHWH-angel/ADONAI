import { useCallback } from 'react'
import { useAppStore } from '@/store'

export function useMiner() {
  const { isMining, mode, setIsMining, setMinerHashrate } = useAppStore(
    (s) => ({
      isMining: s.isMining,
      mode: s.mode,
      setIsMining: s.setIsMining,
      setMinerHashrate: s.setMinerHashrate,
    }),
  )

  const start = useCallback(async () => {
    try {
      await fetch('/api/setgenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([true, 1]),
      })
      setIsMining(true)
    } catch (err) {
      console.error('start mining failed', err)
    }
  }, [setIsMining])

  const stop = useCallback(async () => {
    try {
      await fetch('/api/setgenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([false]),
      })
      setIsMining(false)
      setMinerHashrate(0)
    } catch (err) {
      console.error('stop mining failed', err)
    }
  }, [setIsMining, setMinerHashrate])

  return { isMining, mode, start, stop }
}
