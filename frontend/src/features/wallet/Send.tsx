import { useState, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'

export default function Send() {
  const { t } = useTranslation()
  const { balance, setTransactions, setBalance } = useAppStore((s) => ({
    balance: s.balance,
    setTransactions: s.setTransactions,
    setBalance: s.setBalance,
  }))

  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [fee, setFee] = useState('0.001')

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!to || isNaN(amt) || amt <= 0 || amt > balance) {
      alert(t('invalidAmount'))
      return
    }
    try {
      const res = await fetch('/api/sendtoaddress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([to, amt]),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const txid = data.result
      const txRes = await fetch('/api/listtransactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '[]',
      })
      const txData = await txRes.json()
      if (Array.isArray(txData.result))
        setTransactions(txData.result.map((tx: any) => tx.txid))
      const balRes = await fetch('/api/getbalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '[]',
      })
      const balData = await balRes.json()
      if (typeof balData.result === 'number') setBalance(balData.result)
      setTo('')
      setAmount('')
      setMemo('')
      alert(t('sent'))
      return txid
    } catch (err) {
      console.error('send failed', err)
      alert('send failed')
    }
  }

  return (
    <form className="send" onSubmit={handleSend}>
      <label htmlFor="to">{t('to')}</label>
      <input
        id="to"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        required
      />

      <label htmlFor="amount">{t('amount')}</label>
      <input
        id="amount"
        type="number"
        step="0.0001"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />

      <label htmlFor="memo">{t('memo')}</label>
      <input id="memo" value={memo} onChange={(e) => setMemo(e.target.value)} />

      <label htmlFor="fee">{t('fee')}</label>
      <input
        id="fee"
        type="number"
        step="0.0001"
        value={fee}
        onChange={(e) => setFee(e.target.value)}
      />

      <button type="submit">{t('send')}</button>
    </form>
  )
}
