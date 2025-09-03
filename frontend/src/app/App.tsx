import { useState } from 'react'
import Onboarding from '@/features/onboarding'
import Dashboard from '@/features/dashboard'
import Wallet from '@/features/wallet'
import Mining from '@/features/mining'
import Network from '@/features/network'
import { useWalletStore } from '@/store/wallet'
import { Layout, Header, type Page } from '@/components'
import './App.css'

export default function App() {
  const isLoaded = useWalletStore((s) => s.isLoaded)
  const [page, setPage] = useState<Page>('dashboard')
  if (!isLoaded) {
    return <Onboarding />
  }

  return (
    <Layout header={<Header onNavigate={setPage} />}>
      {page === 'dashboard' && <Dashboard />}
      {page === 'wallet' && <Wallet />}
      {page === 'mining' && <Mining />}
      {page === 'network' && <Network />}
    </Layout>
  )
}
