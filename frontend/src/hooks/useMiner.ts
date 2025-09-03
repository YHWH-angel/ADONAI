import { useCallback, useEffect } from 'react'
import { useAppStore } from '@/store'

export function useMiner() {
  const { isMining, mode, csrfToken, setIsMining, setMinerHashrate } =
    useAppStore((s) => ({
      isMining: s.isMining,
      mode: s.mode,
      csrfToken: s.csrfToken,
      setIsMining: s.setIsMining,
      setMinerHashrate: s.setMinerHashrate,
    }))

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:17001/ws')
    ws.onopen = () => {
      ws.send(JSON.stringify({ subscribe: 'miner' }))
    }
    ws.onmessage = (e) => {
      try {
        const { event, data } = JSON.parse(e.data)
        if (event === 'miner') {
          if (data.isMining !== undefined) setIsMining(data.isMining)
          if (data.hashrate !== undefined) setMinerHashrate(data.hashrate)
        }
      } catch (err) {
        console.error('miner ws error', err)
      }
    }
    return () => ws.close()
  }, [setIsMining, setMinerHashrate])

  const start = useCallback(async () => {
    try {
      await fetch('/api/miner/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ mode }),
      })
      setIsMining(true)
    } catch (err) {
      console.error('start mining failed', err)
    }
  }, [mode, csrfToken, setIsMining])

  const stop = useCallback(async () => {
    try {
      await fetch('/api/miner/stop', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
        credentials: 'include',
      })
      setIsMining(false)
    } catch (err) {
      console.error('stop mining failed', err)
    }
  }, [csrfToken, setIsMining])

  return { isMining, mode, start, stop }
}
