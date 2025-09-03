import { useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import { useTranslation } from 'react-i18next'

export default function History() {
  const { t } = useTranslation()
  const { transactions, setTransactions } = useAppStore((s) => ({
    transactions: s.transactions,
    setTransactions: s.setTransactions,
  }))
  const [filter, setFilter] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/listtransactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '[]',
        })
        const data = await res.json()
        if (Array.isArray(data.result))
          setTransactions(data.result.map((tx: any) => tx.txid))
      } catch (err) {
        console.error('listtransactions failed', err)
      }
    })()
  }, [setTransactions])

  const filtered = transactions.filter((tx) => tx.includes(filter))

  return (
    <div className="history">
      <input
        aria-label={t('filter')}
        placeholder={t('filter') || ''}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <ul>
        {filtered.map((tx) => (
          <li key={tx}>{tx}</li>
        ))}
      </ul>
    </div>
  )
}
