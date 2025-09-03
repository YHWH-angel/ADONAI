import { useState, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'

export default function Send() {
  const { t } = useTranslation()
  const { balance, transactions, utxos, setTransactions, setBalance } =
    useAppStore((s) => ({
      balance: s.balance,
      transactions: s.transactions,
      utxos: s.utxos,
      setTransactions: s.setTransactions,
      setBalance: s.setBalance,
    }))

  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [fee, setFee] = useState('0.001')

  const handleSend = (e: FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    const feeValue = parseFloat(fee)
    const available = utxos.reduce((s, u) => s + u.amount, 0)
    if (!to || isNaN(amt) || amt <= 0 || amt + feeValue > available) {
      alert(t('invalidAmount'))
      return
    }
    const txid = `${Date.now()}`
    setTransactions([...transactions, txid])
    setBalance(balance - amt - feeValue)
    setTo('')
    setAmount('')
    setMemo('')
    alert(t('sent'))
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
