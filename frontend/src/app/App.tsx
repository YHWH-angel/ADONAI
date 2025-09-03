import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Onboarding from '@/features/onboarding'
import Dashboard from '@/features/dashboard'
import Wallet from '@/features/wallet'
import { useTheme } from '@/lib/theme'
import { useWalletStore } from '@/store/wallet'
import './App.css'

export default function App() {
  const { t, i18n } = useTranslation()
  const { theme, toggle } = useTheme()
  const isLoaded = useWalletStore((s) => s.isLoaded)
  const [page, setPage] = useState<'dashboard' | 'wallet'>('dashboard')

  const switchLang = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'es' : 'en')
  }

  if (!isLoaded) {
    return <Onboarding />
  }

  return (
    <div className="container">
      <div className="actions">
        <button onClick={toggle} aria-label="toggle theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <button onClick={switchLang} aria-label="toggle language">
          {i18n.language === 'en' ? 'ES' : 'EN'}
        </button>
      </div>
      <nav className="main-nav">
        <button onClick={() => setPage('dashboard')} aria-label="dashboard">
          {t('dashboard')}
        </button>
        <button onClick={() => setPage('wallet')} aria-label="wallet">
          {t('wallet')}
        </button>
      </nav>
      {page === 'dashboard' ? <Dashboard /> : <Wallet />}
    </div>
  )
}
