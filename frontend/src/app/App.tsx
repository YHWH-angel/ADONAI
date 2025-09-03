import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Onboarding from '@/features/onboarding'
import Dashboard from '@/features/dashboard'
import Wallet from '@/features/wallet'
import Mining from '@/features/mining'
import Network from '@/features/network'
import Settings from '@/features/settings'
import { useTheme } from '@/lib/theme'
import { useWalletStore } from '@/store/wallet'
import './App.css'

const PAGES = ['dashboard', 'wallet', 'mining', 'network', 'settings'] as const
type Page = (typeof PAGES)[number]

const PAGE_COMPONENTS: Record<Page, JSX.Element> = {
  dashboard: <Dashboard />,
  wallet: <Wallet />,
  mining: <Mining />,
  network: <Network />,
  settings: <Settings />,
}

export default function App() {
  const { t, i18n } = useTranslation()
  const { theme, toggle } = useTheme()
  const isLoaded = useWalletStore((s) => s.isLoaded)
  const [page, setPage] = useState<Page>('dashboard')

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
        {PAGES.map((p) => (
          <button key={p} onClick={() => setPage(p)} aria-label={p}>
            {t(p)}
          </button>
        ))}
      </nav>
      {PAGE_COMPONENTS[page]}
    </div>
  )
}
