'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useActiveWallet } from '@/hooks/useActiveWallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatAdo, formatAdoShort, formatRelativeTime, shortenHash } from '@/lib/utils';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Blocks,
  Cpu,
  Users,
  TrendingUp,
  AlertCircle,
  Wallet,
  ChevronRight,
  Pickaxe,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const activeWallet = useActiveWallet();

  const { data: stats, isLoading: statsLoading, isError } = useQuery({
    queryKey: ['blockchain-stats'],
    queryFn: api.getStats,
    refetchInterval: 15_000,
  });

  const { data: walletData } = useQuery({
    queryKey: ['wallet-info', activeWallet],
    queryFn: () => api.getWalletInfo(activeWallet!),
    enabled: !!activeWallet,
    refetchInterval: 15_000,
  });

  const { data: txData } = useQuery({
    queryKey: ['transactions', activeWallet],
    queryFn: () => api.getTransactions(activeWallet!, 8),
    enabled: !!activeWallet,
    refetchInterval: 15_000,
  });

  const { data: nodeWallets } = useQuery({
    queryKey: ['wallet-list'],
    queryFn: api.listWallets,
    refetchInterval: 30_000,
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <AlertCircle className="h-14 w-14 text-destructive" />
        <h2 className="text-xl font-semibold">Sin conexión al nodo</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          No se puede conectar con el servidor ADONAI. Verifica que el nodo esté ejecutándose.
        </p>
        <Button asChild variant="outline">
          <Link href="/settings">Configurar nodo</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Red ADONAI · Bloque #{stats?.blockchain.blocks.toLocaleString() ?? '...'}
        </p>
      </div>

      {/* Balance Hero */}
      {activeWallet ? (
        <div className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-card border border-primary/30 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Wallet size={14} />
                <span>{walletData?.resolvedWallet ?? activeWallet}</span>
              </div>
              <div className="text-5xl font-bold tracking-tight text-primary">
                {walletData ? formatAdo(walletData.balance) : (
                  <span className="opacity-30">— ADO</span>
                )}
              </div>
              {walletData && walletData.unconfirmed > 0 && (
                <p className="mt-2 text-sm text-yellow-400/80">
                  + {formatAdo(walletData.unconfirmed)} pendiente de confirmar
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1 text-right">
              {nodeWallets?.wallets.map((w) => (
                <span key={w} className="text-[10px] text-muted-foreground bg-secondary/50 rounded px-1.5 py-0.5">{w}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button asChild className="flex-1 h-11 text-base" size="lg">
              <Link href="/send">
                <ArrowUpRight size={18} className="mr-1" /> Enviar
              </Link>
            </Button>
            <Button asChild variant="secondary" className="flex-1 h-11 text-base" size="lg">
              <Link href="/receive">
                <ArrowDownLeft size={18} className="mr-1" /> Recibir
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-primary/20 p-8 text-center">
          <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-lg">No hay wallet activa</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Crea o conecta una wallet para ver tu saldo
          </p>
          <Button asChild>
            <Link href="/wallet/create">Crear wallet</Link>
          </Button>
        </div>
      )}

      {/* Network Stats Grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Estado de la red
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<Blocks size={18} className="text-blue-400" />}
            label="Bloques"
            value={statsLoading ? '...' : stats?.blockchain.blocks.toLocaleString() ?? '—'}
            color="blue"
          />
          <StatCard
            icon={<TrendingUp size={18} className="text-purple-400" />}
            label="Dificultad"
            value={statsLoading ? '...' : stats?.blockchain.difficulty.toExponential(2) ?? '—'}
            color="purple"
          />
          <StatCard
            icon={<Cpu size={18} className="text-green-400" />}
            label="Hashrate"
            value={statsLoading ? '...' : formatHashrate(stats?.mining.networkhashps ?? 0)}
            color="green"
          />
          <StatCard
            icon={<Users size={18} className="text-orange-400" />}
            label="Peers"
            value={statsLoading ? '...' : stats?.network.connections.toString() ?? '—'}
            color="orange"
          />
        </div>
      </div>

      {/* Recent Transactions */}
      {activeWallet && txData && txData.transactions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Transacciones recientes</CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs gap-1">
                <Link href="/transactions">
                  Ver todas <ChevronRight size={13} />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 px-4 pb-4">
            {txData.transactions.slice(0, 8).map((tx) => (
              <TxRow key={tx.txid} tx={tx} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Mining shortcut */}
      {activeWallet && (
        <Link href="/mining">
          <Card className="border-yellow-500/20 hover:border-yellow-500/40 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/15">
                <Pickaxe size={20} className="text-yellow-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Control de Minado</p>
                <p className="text-xs text-muted-foreground">Iniciar / detener minado · Ver recompensas</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Sync Progress */}
      {stats && stats.blockchain.verificationprogress < 0.9999 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <div className="h-2 flex-1 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-2 rounded-full bg-yellow-500 transition-all"
                style={{ width: `${stats.blockchain.verificationprogress * 100}%` }}
              />
            </div>
            <span className="text-xs text-yellow-400 shrink-0">
              Sincronizando {(stats.blockchain.verificationprogress * 100).toFixed(1)}%
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'blue' | 'purple' | 'green' | 'orange';
}) {
  const bg = {
    blue: 'bg-blue-500/10',
    purple: 'bg-purple-500/10',
    green: 'bg-green-500/10',
    orange: 'bg-orange-500/10',
  }[color];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className={`inline-flex rounded-lg p-2 mb-3 ${bg}`}>
          {icon}
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-mono text-sm font-bold mt-0.5">{value}</p>
      </CardContent>
    </Card>
  );
}

function TxRow({ tx }: { tx: import('@adonai/rpc-client').WalletTransaction }) {
  const isReceive = tx.amount > 0;
  const isMining = tx.category === 'generate' || tx.category === 'immature';
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-secondary/40 transition-colors">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isMining
            ? 'bg-yellow-500/20'
            : isReceive
            ? 'bg-green-500/20'
            : 'bg-red-500/20'
        }`}
      >
        {isMining ? (
          <Pickaxe size={14} className="text-yellow-400" />
        ) : isReceive ? (
          <ArrowDownLeft size={14} className="text-green-400" />
        ) : (
          <ArrowUpRight size={14} className="text-red-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-xs text-muted-foreground">
          {shortenHash(tx.txid, 8)}
        </p>
        <p className="text-xs text-muted-foreground">{formatRelativeTime(tx.time)}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold ${
          isMining ? 'text-yellow-400' : isReceive ? 'text-green-400' : 'text-red-400'
        }`}>
          {isReceive ? '+' : ''}{formatAdoShort(tx.amount)}
        </p>
        <Badge
          variant={tx.confirmations >= 6 ? 'success' : 'warning'}
          className="text-[9px] mt-0.5"
        >
          {tx.confirmations < 6 ? `${tx.confirmations} conf.` : '✓'}
        </Badge>
      </div>
    </div>
  );
}

function formatHashrate(hps: number): string {
  if (hps >= 1e18) return (hps / 1e18).toFixed(1) + ' EH/s';
  if (hps >= 1e15) return (hps / 1e15).toFixed(1) + ' PH/s';
  if (hps >= 1e12) return (hps / 1e12).toFixed(1) + ' TH/s';
  if (hps >= 1e9) return (hps / 1e9).toFixed(1) + ' GH/s';
  if (hps >= 1e6) return (hps / 1e6).toFixed(1) + ' MH/s';
  if (hps >= 1e3) return (hps / 1e3).toFixed(1) + ' KH/s';
  return hps.toFixed(0) + ' H/s';
}
