import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'
import { useMiner } from '@/hooks/useMiner'
import { useNode } from '@/hooks/useNode'
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
    setTransactions,
  } = useAppStore((s) => ({
    height: s.height,
    difficulty: s.difficulty,
    netHashrate: s.netHashrate,
    balance: s.balance,
    transactions: s.transactions,
    isMining: s.isMining,
    minerHashrate: s.minerHashrate,
    setTransactions: s.setTransactions,
  }))

  const { start, stop } = useMiner()
  const { refresh: refreshNode } = useNode()

  useEffect(() => {
    refreshNode()
    const ws = new WebSocket('ws://localhost:17001/ws')
    ws.onopen = () => {
      ws.send(JSON.stringify({ subscribe: 'newBlock' }))
      ws.send(JSON.stringify({ subscribe: 'newTx' }))
    }
    ws.onmessage = (e) => {
      try {
        const { event, data } = JSON.parse(e.data)
        if (event === 'newBlock') refreshNode()
        if (event === 'newTx' && data.txid) {
          setTransactions((t) => [{ txid: data.txid, amount: 0 }, ...t])
        }
      } catch (err) {
        console.error('ws message error', err)
      }
    }
    return () => ws.close()
  }, [refreshNode, setTransactions])

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
            <li key={tx.txid}>{tx.txid}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
