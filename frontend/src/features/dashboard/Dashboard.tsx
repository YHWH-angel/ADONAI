import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'
import { useMiner } from '@/hooks/useMiner'
import './dashboard.css'

export default function Dashboard() {
  const { t } = useTranslation()
  const {
    height,
    difficulty,
    netHashrate,
    balance,
    transactions,
    isMining,
    minerHashrate,
    setHeight,
    setDifficulty,
    setNetHashrate,
    setBalance,
    setTransactions,
    setIsMining,
    setMinerHashrate,
  } = useAppStore((s) => ({
    height: s.height,
    difficulty: s.difficulty,
    netHashrate: s.netHashrate,
    balance: s.balance,
    transactions: s.transactions,
    isMining: s.isMining,
    minerHashrate: s.minerHashrate,
    setHeight: s.setHeight,
    setDifficulty: s.setDifficulty,
    setNetHashrate: s.setNetHashrate,
    setBalance: s.setBalance,
    setTransactions: s.setTransactions,
    setIsMining: s.setIsMining,
    setMinerHashrate: s.setMinerHashrate,
  }))

  const { start, stop } = useMiner()

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws')
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.height !== undefined) setHeight(data.height)
        if (data.difficulty !== undefined) setDifficulty(data.difficulty)
        if (data.netHashrate !== undefined) setNetHashrate(data.netHashrate)
        if (data.balance !== undefined) setBalance(data.balance)
        if (data.transactions !== undefined) setTransactions(data.transactions)
        if (data.isMining !== undefined) setIsMining(data.isMining)
        if (data.minerHashrate !== undefined) {
          setMinerHashrate(data.minerHashrate)
        }
      } catch (err) {
        console.error('ws message error', err)
      }
    }
    return () => ws.close()
  }, [
    setHeight,
    setDifficulty,
    setNetHashrate,
    setBalance,
    setTransactions,
    setIsMining,
    setMinerHashrate,
  ])

  return (
    <div className="dashboard">
      <section className="stats">
        <div>
          {t('height')}: {height}
        </div>
        <div>
          {t('difficulty')}: {difficulty}
        </div>
        <div>
          {t('hashrate')}: {netHashrate} H/s
        </div>
        <div>
          {t('balance')}: {balance}
        </div>
        <div className="mining">
          <button onClick={isMining ? stop : start} aria-label="toggle mining">
            {isMining ? t('stopMining') : t('startMining')}
          </button>
          {isMining && (
            <span>
              {t('minerHashrate')}: {minerHashrate} H/s
            </span>
          )}
        </div>
      </section>
      <section className="transactions">
        <h2>{t('latestTransactions')}</h2>
        <ul>
          {transactions.slice(0, 5).map((tx) => (
            <li key={tx}>{tx}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
