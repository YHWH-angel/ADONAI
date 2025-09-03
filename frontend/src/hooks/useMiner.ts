import { useCallback, useEffect } from 'react'
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

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws')
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      setIsMining(true)
    } catch (err) {
      console.error('start mining failed', err)
    }
  }, [mode, setIsMining])

  const stop = useCallback(async () => {
    try {
      await fetch('/api/miner/stop', { method: 'POST' })
      setIsMining(false)
    } catch (err) {
      console.error('stop mining failed', err)
    }
  }, [setIsMining])

  return { isMining, mode, start, stop }
}
