import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'
import { useMiner } from '@/hooks/useMiner'
import './mining.css'

export default function Mining() {
  const { t } = useTranslation()
  const { isMining, minerHashrate, mode, setMode } = useAppStore((s) => ({
    isMining: s.isMining,
    minerHashrate: s.minerHashrate,
    mode: s.mode,
    setMode: s.setMode,
  }))
  const { start, stop } = useMiner()

  const toggle = () => {
    if (isMining) {
      stop()
    } else {
      start()
    }
  }

  return (
    <div className="mining-page">
      <h2>{t('mining')}</h2>
      <div className="controls">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as 'solo' | 'pool')}
        >
          <option value="solo">{t('solo')}</option>
          <option value="pool">{t('pool')}</option>
        </select>
        <button onClick={toggle} aria-label="toggle mining">
          {isMining ? t('stopMining') : t('startMining')}
        </button>
      </div>
      <div className="stats">
        {t('minerHashrate')}: {minerHashrate} H/s
      </div>
    </div>
  )
}
