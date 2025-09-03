import { useState, useEffect } from 'react'
import Login from '@/features/auth'
import Onboarding from '@/features/onboarding'
import Dashboard from '@/features/dashboard'
import Wallet from '@/features/wallet'
import Mining from '@/features/mining'
import Network from '@/features/network'
import Settings from '@/features/settings'
import { useWalletStore } from '@/store/wallet'
import { useAppStore } from '@/store'
import { Layout, Header, type Page } from '@/components'
import { useWallet } from '@/hooks/useWallet'
import './App.css'

export default function App() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const isLoaded = useWalletStore((s) => s.isLoaded)
  const { refresh, newAddress } = useWallet()
  const [page, setPage] = useState<Page>('dashboard')
  useEffect(() => {
    if (isLoaded) {
      refresh()
      newAddress()
    }
  }, [isLoaded, refresh, newAddress])
  if (!isAuthenticated) {
    return <Login />
  }
  if (!isLoaded) {
    return <Onboarding />
  }

  return (
    <Layout header={<Header onNavigate={setPage} />}>
      {page === 'dashboard' && <Dashboard />}
      {page === 'wallet' && <Wallet />}
      {page === 'mining' && <Mining />}
      {page === 'network' && <Network />}
      {page === 'settings' && <Settings />}
    </Layout>
  )
}
