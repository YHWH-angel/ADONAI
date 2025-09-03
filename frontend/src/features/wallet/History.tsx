import { useState } from 'react'
import { useAppStore } from '@/store'
import { useTranslation } from 'react-i18next'

export default function History() {
  const { t } = useTranslation()
  const transactions = useAppStore((s) => s.transactions)
  const [filter, setFilter] = useState('')

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
