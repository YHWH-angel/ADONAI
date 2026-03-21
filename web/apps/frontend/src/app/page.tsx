'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWalletStore } from '@/store/wallet';
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
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { activeWallet } = useWalletStore();

  const { data: stats, isLoading: statsLoading, isError } = useQuery({
    queryKey: ['blockchain-stats'],
    queryFn: api.getStats,
    refetchInterval: 15_000,
  });

  const { data: walletData } = useQuery({
    queryKey: ['wallet-info', activeWallet],
    queryFn: () => api.getWalletInfo(activeWallet!),
    enabled: !!activeWallet,
    refetchInterval: 20_000,
  });

  const { data: txData } = useQuery({
    queryKey: ['transactions', activeWallet],
    queryFn: () => api.getTransactions(activeWallet!, 5),
    enabled: !!activeWallet,
    refetchInterval: 20_000,
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-lg font-semibold">Sin conexión al nodo</h2>
        <p className="text-sm text-muted-foreground">
          No se puede conectar con el servidor ADONAI. Verifica la configuración.
        </p>
        <Button asChild variant="outline">
          <Link href="/settings">Configurar nodo</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      {/* Balance Card */}
      {activeWallet ? (
        <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet size={12} />
              {activeWallet}
            </CardDescription>
            <div className="mt-1">
              <div className="text-3xl font-bold tracking-tight text-primary">
                {walletData
                  ? formatAdo(walletData.balance)
                  : '— ADO'}
              </div>
              {walletData && walletData.unconfirmed > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  + {formatAdo(walletData.unconfirmed)} sin confirmar
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button asChild size="sm" className="flex-1">
                <Link href="/send">
                  <ArrowUpRight size={14} /> Enviar
                </Link>
              </Button>
              <Button asChild size="sm" variant="secondary" className="flex-1">
                <Link href="/receive">
                  <ArrowDownLeft size={14} /> Recibir
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-primary/30">
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <Wallet className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">No hay wallet activa</p>
              <p className="text-sm text-muted-foreground">
                Crea o conecta una wallet para empezar
              </p>
            </div>
            <Button asChild>
              <Link href="/wallet/create">Crear wallet</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Network Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Blocks size={16} />}
          label="Bloques"
          value={
            statsLoading ? '...' : stats?.blockchain.blocks.toLocaleString() ?? '—'
          }
        />
        <StatCard
          icon={<TrendingUp size={16} />}
          label="Dificultad"
          value={
            statsLoading
              ? '...'
              : stats?.blockchain.difficulty.toExponential(2) ?? '—'
          }
        />
        <StatCard
          icon={<Cpu size={16} />}
          label="Hashrate"
          value={
            statsLoading
              ? '...'
              : formatHashrate(stats?.mining.networkhashps ?? 0)
          }
        />
        <StatCard
          icon={<Users size={16} />}
          label="Conexiones"
          value={
            statsLoading ? '...' : stats?.network.connections.toString() ?? '—'
          }
        />
      </div>

      {/* Recent Transactions */}
      {activeWallet && txData && txData.transactions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Transacciones recientes</CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link href="/transactions">Ver todas</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-4">
            {txData.transactions.slice(0, 5).map((tx) => (
              <TxRow key={tx.txid} tx={tx} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sync Progress */}
      {stats && stats.blockchain.verificationprogress < 0.9999 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="flex items-center gap-3 py-3">
            <div className="h-2 flex-1 rounded-full bg-secondary">
              <div
                className="h-2 rounded-full bg-yellow-500 transition-all"
                style={{ width: `${stats.blockchain.verificationprogress * 100}%` }}
              />
            </div>
            <span className="text-xs text-yellow-400">
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <span className="font-mono text-sm font-semibold">{value}</span>
      </CardContent>
    </Card>
  );
}

function TxRow({ tx }: { tx: import('@adonai/rpc-client').WalletTransaction }) {
  const isReceive = tx.amount > 0;
  return (
    <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-secondary/50">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full ${
          isReceive ? 'bg-green-500/20' : 'bg-red-500/20'
        }`}
      >
        {isReceive ? (
          <ArrowDownLeft size={14} className="text-green-400" />
        ) : (
          <ArrowUpRight size={14} className="text-red-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-xs text-muted-foreground">
          {shortenHash(tx.txid, 6)}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatRelativeTime(tx.time)}
        </p>
      </div>
      <div className="text-right">
        <p
          className={`text-sm font-semibold ${
            isReceive ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {isReceive ? '+' : ''}
          {formatAdoShort(tx.amount)}
        </p>
        <Badge
          variant={tx.confirmations >= 6 ? 'success' : 'warning'}
          className="text-[10px]"
        >
          {tx.confirmations < 6 ? `${tx.confirmations} conf.` : 'Confirmada'}
        </Badge>
      </div>
    </div>
  );
}

function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm text-muted-foreground ${className ?? ''}`} {...props}>
      {children}
    </p>
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
