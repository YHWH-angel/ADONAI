import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'
import Input from '@/components/Input'
import './settings.css'
import { useNotifications } from '@/lib/notifications'

export default function Settings() {
  const { t } = useTranslation()
  const { notify } = useNotifications()
  const {
    datadir,
    logsPath,
    verbosity,
    zmqEndpoint,
    setDatadir,
    setLogsPath,
    setVerbosity,
    setZmqEndpoint,
    exportWallet,
    importWallet,
  } = useAppStore((s) => ({
    datadir: s.datadir,
    logsPath: s.logsPath,
    verbosity: s.verbosity,
    zmqEndpoint: s.zmqEndpoint,
    setDatadir: s.setDatadir,
    setLogsPath: s.setLogsPath,
    setVerbosity: s.setVerbosity,
    setZmqEndpoint: s.setZmqEndpoint,
    exportWallet: s.exportWallet,
    importWallet: s.importWallet,
  }))

  const handleExport = async () => {
    if (window.confirm(t('confirmExport'))) {
      await exportWallet()
      notify(t('walletExported'))
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (window.confirm(t('confirmImport'))) {
      await importWallet(file)
      notify(t('walletImported'))
    }
    e.target.value = ''
  }

  return (
    <div className="settings">
      <Input
        id="datadir"
        label={t('datadir')}
        value={datadir}
        onChange={(e) => setDatadir(e.target.value)}
      />
      <Input
        id="logsPath"
        label={t('logs')}
        value={logsPath}
        onChange={(e) => setLogsPath(e.target.value)}
      />
      <div className="form-control">
        <label htmlFor="verbosity">{t('verbosity')}</label>
        <select
          id="verbosity"
          value={verbosity}
          onChange={(e) =>
            setVerbosity(e.target.value as 'info' | 'debug' | 'error')
          }
        >
          <option value="info">info</option>
          <option value="debug">debug</option>
          <option value="error">error</option>
        </select>
      </div>
      <Input
        id="zmq"
        label={t('zmqEndpoint')}
        value={zmqEndpoint}
        onChange={(e) => setZmqEndpoint(e.target.value)}
      />
      <div className="form-control">
        <button onClick={handleExport} aria-label="export wallet">
          {t('exportWallet')}
        </button>
      </div>
      <div className="form-control">
        <label htmlFor="import-wallet">{t('importWallet')}</label>
        <input id="import-wallet" type="file" onChange={handleImport} />
      </div>
    </div>
  )
}
