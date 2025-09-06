import React, { useMemo, useState, useEffect } from 'react'
import {
  Home,
  Send,
  Inbox,
  List,
  Pickaxe,
  Wifi,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Play
} from 'lucide-react'

export default function AdonaiWalletUI() {
  const [activeTab, setActiveTab] = useState('overview')
  const [now, setNow] = useState(new Date())
  const [nodesConnected] = useState(12)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const balances = {
    available: 0,
    pending: 0,
    immature: 1458,
    total: 1458
  }

  const txs = useMemo(
    () => [
      { id: 1, dt: '5 Sep 2025 22:30', amount: '+18.00000000 ADO', addr: 'ad1q7d9x6fa46pr50fn4vxxyx4682fc7qcfhu5xf' },
      { id: 2, dt: '5 Sep 2025 22:30', amount: '+18.00000000 ADO', addr: 'ad1qx4fzd9va75yvqzqy8tww4ad9ohg8nuuk3' },
      { id: 3, dt: '5 Sep 2025 22:30', amount: '+18.00000000 ADO', addr: 'ad1qkwtujmy2k9e4llgdptlgg8esde4z4p2psed' },
      { id: 4, dt: '5 Sep 2025 22:30', amount: '+18.00000000 ADO', addr: 'ad1qtuaxwkfmqs64gpspfpdm8v0uklz86gk23d' },
      { id: 5, dt: '1 Sep 2025 01:22', amount: '+18.00000000 ADO', addr: 'ad1qt2axxqhf8ehpn3aak30mwq62rt6nwfjlzt6' }
    ],
    []
  )

  return (
    <div className='min-h-screen w-full bg-neutral-100 text-neutral-900 flex items-start justify-center py-6'>
      <div className='w-[760px] rounded-lg bg-[#e9e9e9] shadow-xl ring-1 ring-black/10 overflow-hidden'>
        {/* Title bar */}
        <div className='bg-[#dbdbdb] text-[13px] px-3 py-1.5 flex items-center justify-center border-b border-black/10'>
          <span className='font-medium tracking-tight'>ADONAI - miwallet</span>
        </div>

        {/* Menu bar */}
        <div className='bg-[#efefef] text-[13px] px-2 border-b border-black/10'>
          <div className='flex gap-6 py-1.5 select-none'>
            {['File', 'Settings', 'Window', 'Help'].map((m) => (
              <button key={m} className='hover:bg-black/5 px-1.5 py-0.5 rounded focus:outline-none' type='button'>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar Tabs */}
        <div className='bg-[#f7f7f7] px-2 border-b border-black/10'>
          <div className='flex gap-1 py-1.5'>
            <ToolbarTab icon={<Home className='h-4 w-4' />} label='Overview' active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <ToolbarTab icon={<Send className='h-4 w-4' />} label='Send' active={activeTab === 'send'} onClick={() => setActiveTab('send')} />
            <ToolbarTab icon={<Inbox className='h-4 w-4' />} label='Receive' active={activeTab === 'receive'} onClick={() => setActiveTab('receive')} />
            <ToolbarTab icon={<List className='h-4 w-4' />} label='Transactions' active={activeTab === 'txs'} onClick={() => setActiveTab('txs')} />
          </div>
        </div>

        {/* Warning banner */}
        <div className='bg-[#fff5cc] text-[12px] text-neutral-900 px-3 py-2 border-y border-[#e7c74d]'>
          This is a pre-release test build - use at your own risk - do not use for mining or merchant applications
        </div>

        {/* Content */}
        <div className='p-3'>
          {activeTab === 'overview' && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              {/* Balances */}
              <div className='bg-white rounded border border-black/10 flex flex-col'>
                <div className='px-3 py-2 border-b border-black/10 text-[13px] font-semibold'>Balances</div>
                <div className='p-3 text-[13px]'>
                  <BalanceRow label='Available:' value={`${balances.available.toFixed(8)} ADO`} />
                  <BalanceRow label='Pending:' value={`${balances.pending.toFixed(8)} ADO`} />
                  <BalanceRow label='Immature:' value={`${balances.immature.toLocaleString()} .00000000 ADO`.replace(' .', '.')} />
                  <div className='my-2 border-t border-dashed border-black/20' />
                  <BalanceRow label='Total:' value={`${balances.total.toLocaleString()} .00000000 ADO`.replace(' .', '.')} bold />
                </div>
                <div className='px-3 pb-3'>
                  <button type='button' className='w-full flex items-center justify-center gap-2 rounded bg-sky-600 text-white text-[13px] px-3 py-1.5 hover:bg-sky-700'>
                    <Play className='h-4 w-4' />
                    Empezar a minar
                  </button>
                </div>
                <div className='px-3 pb-3 text-[12px] text-neutral-700 space-y-1'>
                  <div>Fecha y hora actual: {now.toLocaleString()}</div>
                  <div>Nodos conectados: {nodesConnected}</div>
                </div>
              </div>

              {/* Recent transactions */}
              <div className='bg-white rounded border border-black/10 flex flex-col'>
                <div className='px-3 py-2 border-b border-black/10 text-[13px] font-semibold'>Recent transactions</div>
                <div className='p-2'>
                  <ul className='space-y-2'>
                    {txs.map((t) => (
                      <li key={t.id} className='flex items-start gap-2'>
                        <div className='pt-0.5'>
                          <Pickaxe className='h-5 w-5 text-sky-600' />
                        </div>
                        <div className='flex-1 text-[12px] leading-tight'>
                          <div className='flex items-center gap-2'>
                            <span className='text-[13px]'>{t.dt}</span>
                            <span className='ml-auto text-[13px]'>[{t.amount}]</span>
                          </div>
                          <div className='text-neutral-500 truncate'>{t.addr}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'send' && <Placeholder title='Send' />}
          {activeTab === 'receive' && <Placeholder title='Receive' />}
          {activeTab === 'txs' && <Placeholder title='Transactions' />}
        </div>

        {/* Status bar */}
        <div className='bg-[#efefef] border-t border-black/10 text-[12px] px-3 py-1.5 flex items-center justify-end gap-3'>
          <div className='flex items-center gap-1 text-neutral-700'>
            <Wifi className='h-4 w-4' />
            <span>8</span>
          </div>
          <div className='flex items-center gap-1 text-neutral-700'>
            <ShieldCheck className='h-4 w-4' />
            <span>ADO HD</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToolbarTab({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button type='button' onClick={onClick} className={['flex items-center gap-1.5 rounded px-2 py-1 text-[13px]', active ? 'bg-white shadow-inner border border-black/10' : 'hover:bg-black/5'].join(' ')}>
      {icon}
      <span>{label}</span>
    </button>
  )
}

function BalanceRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className='flex items-baseline justify-between py-1'>
      <span className='text-neutral-700'>{label}</span>
      <span className={bold ? 'font-semibold' : ''}>{value}</span>
    </div>
  )
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className='bg-white border border-dashed border-black/20 rounded p-6 text-center text-sm text-neutral-600'>
      <div className='flex items-center justify-center gap-1 mb-1'>
        <ChevronRight className='h-4 w-4' />
        <span className='font-medium'>{title}</span>
        <ChevronDown className='h-4 w-4' />
      </div>
      <p>Content not implemented in this mock. Replace with real functionality.</p>
    </div>
  )
}

