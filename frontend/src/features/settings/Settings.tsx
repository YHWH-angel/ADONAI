import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'
import { useWalletStore } from '@/store/wallet'
import './settings.css'

export default function Settings() {
  const { t } = useTranslation()
  const {
    datadir,
    logs,
    verbosity,
    zmqEndpoint,
    setDatadir,
    setLogs,
    setVerbosity,
    setZmqEndpoint,
  } = useAppStore((s) => ({
    datadir: s.datadir,
    logs: s.logs,
    verbosity: s.verbosity,
    zmqEndpoint: s.zmqEndpoint,
    setDatadir: s.setDatadir,
    setLogs: s.setLogs,
    setVerbosity: s.setVerbosity,
    setZmqEndpoint: s.setZmqEndpoint,
  }))

  const seed = useWalletStore((s) => s.seed)
  const loadWallet = useWalletStore((s) => s.loadWallet)
  const [file, setFile] = useState<File | null>(null)

  const exportWallet = () => {
    const data = JSON.stringify({ seed })
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wallet.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importWallet = () => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (window.confirm(t('confirmImport'))) {
        try {
          const data = JSON.parse(reader.result as string)
          if (Array.isArray(data.seed)) {
            loadWallet(data.seed)
          }
        } catch (e) {
          console.error('import error', e)
        }
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="settings">
      <h2>{t('settings')}</h2>
      <label>
        {t('datadir')}
        <input
          value={datadir}
          onChange={(e) => setDatadir(e.target.value)}
          aria-label="datadir"
        />
      </label>
      <label>
        {t('logs')}
        <input
          value={logs}
          onChange={(e) => setLogs(e.target.value)}
          aria-label="logs"
        />
      </label>
      <label>
        {t('verbosity')}
        <input
          type="number"
          value={verbosity}
          onChange={(e) => setVerbosity(Number(e.target.value))}
          aria-label="verbosity"
        />
      </label>
      <label>
        {t('zmqEndpoint')}
        <input
          value={zmqEndpoint}
          onChange={(e) => setZmqEndpoint(e.target.value)}
          aria-label="zmqEndpoint"
        />
      </label>
      <div className="wallet-actions">
        <button onClick={exportWallet} aria-label="export wallet">
          {t('exportWallet')}
        </button>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          aria-label="wallet file"
        />
        <button
          onClick={importWallet}
          disabled={!file}
          aria-label="import wallet"
        >
          {t('importWallet')}
        </button>
      </div>
    </div>
  )
}
