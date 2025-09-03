import { useAppStore } from '@/store'
import { useTranslation } from 'react-i18next'

export default function UtxoView() {
  const { t } = useTranslation()
  const utxos = useAppStore((s) => s.utxos)

  if (!utxos.length) {
    return <p>{t('noUtxos')}</p>
  }

  return (
    <table className="utxos">
      <thead>
        <tr>
          <th>{t('txid')}</th>
          <th>{t('vout')}</th>
          <th>{t('amount')}</th>
        </tr>
      </thead>
      <tbody>
        {utxos.map((u) => (
          <tr key={`${u.txid}:${u.vout}`}>
            <td>{u.txid}</td>
            <td>{u.vout}</td>
            <td>{u.amount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
