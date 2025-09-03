import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Receive from './Receive'
import Send from './Send'
import History from './History'
import UtxoView from './UtxoView'
import './wallet.css'

export default function Wallet() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'receive' | 'send' | 'history' | 'utxos'>(
    'receive',
  )

  return (
    <div className="wallet">
      <nav className="wallet-nav">
        <button onClick={() => setTab('receive')} aria-label="receive tab">
          {t('receive')}
        </button>
        <button onClick={() => setTab('send')} aria-label="send tab">
          {t('send')}
        </button>
        <button onClick={() => setTab('history')} aria-label="history tab">
          {t('history')}
        </button>
        <button onClick={() => setTab('utxos')} aria-label="utxos tab">
          {t('utxos')}
        </button>
      </nav>
      {tab === 'receive' && <Receive />}
      {tab === 'send' && <Send />}
      {tab === 'history' && <History />}
      {tab === 'utxos' && <UtxoView />}
    </div>
  )
}
