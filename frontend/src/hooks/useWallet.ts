import { useCallback } from 'react'
import { useAppStore } from '@/store'

const WALLET_NAME = 'adonai'

export function useWallet() {
  const setBalance = useAppStore((s) => s.setBalance)
  const setTransactions = useAppStore((s) => s.setTransactions)
  const setAddress = useAppStore((s) => s.setAddress)
  const setUtxos = useAppStore((s) => s.setUtxos)
  const csrfToken = useAppStore((s) => s.csrfToken)

  const refresh = useCallback(async () => {
    try {
      const [b, t, u] = await Promise.all([
        fetch(`/wallets/${WALLET_NAME}/balance`, { credentials: 'include' }),
        fetch(`/wallets/${WALLET_NAME}/transactions`, {
          credentials: 'include',
        }),
        fetch(`/wallets/${WALLET_NAME}/utxos`, { credentials: 'include' }),
      ])
      const bal = await b.json()
      const txs = await t.json()
      const utxos = await u.json()
      setBalance(bal.balance || 0)
      setTransactions(txs || [])
      setUtxos(utxos || [])
    } catch (e) {
      console.error('wallet refresh failed', e)
    }
  }, [setBalance, setTransactions, setUtxos])

  const newAddress = useCallback(async () => {
    try {
      const res = await fetch(`/wallets/${WALLET_NAME}/newaddress`, {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
        credentials: 'include',
      })
      const data = await res.json()
      setAddress(data.address)
      return data.address
    } catch (e) {
      console.error('new address failed', e)
    }
  }, [csrfToken, setAddress])

  const send = useCallback(
    async (address: string, amount: number) => {
      try {
        await fetch(`/wallets/${WALLET_NAME}/sendtoaddress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          credentials: 'include',
          body: JSON.stringify({ address, amount }),
        })
        await refresh()
      } catch (e) {
        console.error('send failed', e)
        throw e
      }
    },
    [csrfToken, refresh],
  )

  return { refresh, newAddress, send }
}
