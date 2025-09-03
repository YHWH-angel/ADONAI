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
import { Layout, Header, PAGES, type Page } from '@/components'
import './App.css'

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

  const labels = PAGES.reduce(
    (acc, p) => {
      acc[p] = t(p)
      return acc
    },
    {} as Record<Page, string>,
  )

  return (
    <Layout
      header={
        <Header
          pages={PAGES}
          labels={labels}
          current={page}
          theme={theme}
          language={i18n.language}
          onNavigate={setPage}
          onToggleTheme={toggle}
          onToggleLanguage={switchLang}
        />
      }
    >
      {PAGE_COMPONENTS[page]}
    </Layout>
  )
}
