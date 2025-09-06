import React, { useMemo, useState, useEffect } from 'react'
import {
  Home,
  Send,
  Inbox,
  List,
  Pickaxe,
  Wifi,
  ShieldCheck,
  AlertTriangle,
  Play,
  Clock,
  Network,
} from 'lucide-react'
import Onboarding from '@/features/onboarding'
import { useWalletStore } from '@/store/wallet'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [now, setNow] = useState(new Date())
  const [nodesConnected] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const isWalletLoaded = useWalletStore((s) => s.isLoaded)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const balances = {
    available: 0,
    pending: 0,
    immature: 0,
    total: 0,
  }

  const txs = useMemo(() => [], [])

  if (showOnboarding) {
    return <Onboarding />
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900 flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-5xl">
        {/* App header */}
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
            ADONAI Wallet
          </h1>
          <div className="text-xs md:text-sm text-slate-500">m iwallet</div>
        </header>

        {/* Nav tabs */}
        <nav className="flex items-center gap-2 mb-4">
          {[
            {
              key: 'overview',
              label: 'Overview',
              icon: <Home className="h-4 w-4" />,
            },
            { key: 'send', label: 'Send', icon: <Send className="h-4 w-4" /> },
            {
              key: 'receive',
              label: 'Receive',
              icon: <Inbox className="h-4 w-4" />,
            },
            {
              key: 'txs',
              label: 'Transactions',
              icon: <List className="h-4 w-4" />,
            },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={[
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm',
                activeTab === t.key
                  ? 'bg-white shadow-sm ring-1 ring-slate-200'
                  : 'bg-slate-100 hover:bg-white hover:shadow-sm ring-1 ring-transparent hover:ring-slate-200',
              ].join(' ')}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        {/* Warning */}
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 text-sm flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <p>
            This is a{' '}
            <span className="font-medium">pre-release test build</span> — use at
            your own risk. Do not use for mining or merchant applications.
          </p>
        </div>

        {/* Content */}
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {isWalletLoaded ? (
            <>
              {/* Balances Card */}
              <Card>
                <SectionTitle title="Balances" />
                <div className="p-4">
                  <BalanceRow
                    label="Available"
                    value={`${balances.available.toFixed(8)} ADO`}
                  />
                  <BalanceRow
                    label="Pending"
                    value={`${balances.pending.toFixed(8)} ADO`}
                  />
                  <BalanceRow
                    label="Immature"
                    value={`${balances.immature.toLocaleString()} .00000000 ADO`.replace(
                      ' .',
                      '.',
                    )}
                  />
                  <div className="my-3 h-px bg-slate-200" />
                  <BalanceRow
                    label="Total"
                    value={`${balances.total.toLocaleString()} .00000000 ADO`.replace(
                      ' .',
                      '.',
                    )}
                    bold
                  />
                </div>

                <div className="px-4 pb-4">
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 text-white text-sm px-4 py-2.5 hover:bg-sky-700 transition-colors shadow-sm"
                  >
                    <Play className="h-4 w-4" />
                    Empezar a minar
                  </button>
                </div>

                <div className="px-4 pb-4 text-sm text-slate-700 grid sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Fecha y hora:</span>
                    <span className="ml-auto font-mono text-slate-900">
                      {now.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    <span>Nodos conectados:</span>
                    <span className="ml-auto font-semibold">
                      {nodesConnected}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Recent transactions */}
              <Card>
                <SectionTitle title="Recent transactions" />
                <ul className="p-2 sm:p-3 divide-y divide-slate-100">
                  {txs.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-start gap-3 p-2 sm:p-3 hover:bg-slate-50 rounded-lg"
                    >
                      <div className="mt-0.5">
                        <Pickaxe className="h-5 w-5 text-sky-600" />
                      </div>
                      <div className="flex-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {t.dt}
                          </span>
                          <span className="ml-auto text-slate-700">
                            [{t.amount}]
                          </span>
                        </div>
                        <div className="text-slate-500 truncate text-xs">
                          {t.addr}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          ) : (
            <div className="col-span-1 lg:col-span-2 flex flex-col items-center justify-center py-20">
              <p className="text-sm text-slate-600 mb-2 text-center">
                No wallet has been loaded. Go to File &gt; Open Wallet to load a
                wallet.
              </p>
              <p className="text-sm text-slate-600 mb-4">- OR -</p>
              <button
                type="button"
                onClick={() => setShowOnboarding(true)}
                className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-white text-sm hover:bg-sky-700 transition-colors"
              >
                Create a new wallet
              </button>
            </div>
          )}
        </main>

        {/* Footer / status */}
        <footer className="mt-6 flex items-center justify-end gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-1">
            <Wifi className="h-4 w-4" /> {nodesConnected}
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" /> ADO HD
          </div>
        </footer>
      </div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
      {children}
    </section>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
    </div>
  )
}

function BalanceRow({
  label,
  value,
  bold,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between py-1.5">
      <span className="text-slate-600">{label}</span>
      <span
        className={bold ? 'font-semibold text-slate-900' : 'text-slate-900'}
      >
        {value}
      </span>
    </div>
  )
}
