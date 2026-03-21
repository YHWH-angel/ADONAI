'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWalletStore } from '@/store/wallet';
import { useActiveWallet } from '@/hooks/useActiveWallet';
import { cn } from '@/lib/utils';
import { formatAdo } from '@/lib/utils';
import {
  Home,
  Send,
  Download,
  List,
  Pickaxe,
  Settings,
  Wifi,
  WifiOff,
  Loader2,
  Wallet,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { href: '/', icon: Home, label: 'Inicio' },
  { href: '/send', icon: Send, label: 'Enviar' },
  { href: '/receive', icon: Download, label: 'Recibir' },
  { href: '/transactions', icon: List, label: 'Historial' },
  { href: '/mining', icon: Pickaxe, label: 'Minado' },
  { href: '/settings', icon: Settings, label: 'Ajustes' },
];

export function SideNav() {
  const pathname = usePathname();

  const { activeWallet } = useWalletStore();
  const effectiveWallet = useActiveWallet();

  const { data: stats, isError, isLoading: statsLoading } = useQuery({
    queryKey: ['blockchain-stats'],
    queryFn: api.getStats,
    refetchInterval: 15_000,
    retry: 2,
    retryDelay: 2000,
  });

  const { data: walletData } = useQuery({
    queryKey: ['wallet-info', effectiveWallet],
    queryFn: () => api.getWalletInfo(effectiveWallet!),
    enabled: !!effectiveWallet,
    refetchInterval: 15_000,
  });

  // Only show "disconnected" after a confirmed error (not during initial load)
  const isConnected = !isError && !!stats;
  const isConnecting = statsLoading && !stats;

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-50 flex w-56 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <span className="text-2xl text-primary">⬡</span>
        <div>
          <span className="text-base font-bold tracking-tight text-foreground">ADONAI</span>
          <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Blockchain</p>
        </div>
      </div>

      {/* Wallet Balance */}
      {activeWallet ? (
        <div className="mx-3 mt-3 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
            <Wallet size={10} />
            <span className="truncate">{activeWallet}</span>
          </div>
          <div className="text-xl font-bold text-primary leading-tight">
            {walletData ? formatAdo(walletData.balance) : '— ADO'}
          </div>
          {walletData && walletData.unconfirmed > 0 && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              +{formatAdo(walletData.unconfirmed)} pendiente
            </p>
          )}
        </div>
      ) : (
        <Link
          href="/wallet/create"
          className="mx-3 mt-3 flex items-center justify-between rounded-xl border border-dashed border-primary/30 px-4 py-3 hover:border-primary/60 transition-colors"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wallet size={14} />
            <span className="text-xs">Conectar wallet</span>
          </div>
          <ChevronRight size={14} className="text-muted-foreground" />
        </Link>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 pt-4">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
              {label}
              {active && <ChevronRight size={13} className="ml-auto text-primary/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Node Status */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2 text-xs">
          {isConnecting ? (
            <>
              <Loader2 size={12} className="text-muted-foreground shrink-0 animate-spin" />
              <span className="text-muted-foreground">Conectando...</span>
            </>
          ) : isConnected ? (
            <>
              <Wifi size={12} className="text-green-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-green-400 font-medium">Conectado</span>
                <span className="text-muted-foreground ml-1">
                  #{stats.blockchain.blocks.toLocaleString()}
                </span>
              </div>
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-destructive shrink-0" />
              <span className="text-destructive">Sin conexión</span>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
