'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWalletStore } from '@/store/wallet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatAdo, formatDate, shortenHash } from '@/lib/utils';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Loader2,
  AlertCircle,
  Pickaxe,
} from 'lucide-react';
import type { WalletTransaction } from '@adonai/rpc-client';
import Link from 'next/link';

const PAGE_SIZE = 20;

export default function TransactionsPage() {
  const { activeWallet } = useWalletStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<'all' | 'send' | 'receive' | 'generate'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', activeWallet, page],
    queryFn: () => api.getTransactions(activeWallet!, PAGE_SIZE, page * PAGE_SIZE),
    enabled: !!activeWallet,
    refetchInterval: 30_000,
  });

  if (!activeWallet) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">Conecta una wallet para ver el historial.</p>
        <Button asChild>
          <Link href="/wallet/create">Crear wallet</Link>
        </Button>
      </div>
    );
  }

  const filtered = (data?.transactions ?? []).filter((tx) => {
    if (filter !== 'all' && tx.category !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        tx.txid.toLowerCase().includes(q) ||
        (tx.address?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  return (
    <div className="space-y-3 py-4">
      {/* Filter bar */}
      <div className="flex gap-2">
        {(['all', 'receive', 'send', 'generate'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'all'
              ? 'Todas'
              : f === 'receive'
              ? 'Recibidas'
              : f === 'send'
              ? 'Enviadas'
              : 'Minado'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Buscar por txid o dirección..."
          className="pl-8 text-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Transactions list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No hay transacciones
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((tx) => (
            <TxCard key={tx.txid + tx.category} tx={tx} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!search && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">Pág. {page + 1}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={(data?.transactions.length ?? 0) < PAGE_SIZE}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}

function TxCard({ tx }: { tx: WalletTransaction }) {
  const isReceive = tx.amount > 0;
  const isMining = tx.category === 'generate' || tx.category === 'immature';

  const icon = isMining ? (
    <Pickaxe size={14} className="text-yellow-400" />
  ) : isReceive ? (
    <ArrowDownLeft size={14} className="text-green-400" />
  ) : (
    <ArrowUpRight size={14} className="text-red-400" />
  );

  const iconBg = isMining
    ? 'bg-yellow-500/20'
    : isReceive
    ? 'bg-green-500/20'
    : 'bg-red-500/20';

  const amountColor = isMining
    ? 'text-yellow-400'
    : isReceive
    ? 'text-green-400'
    : 'text-red-400';

  return (
    <Card className="transition-colors hover:bg-secondary/30">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconBg}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium">
              {isMining ? 'Recompensa minado' : isReceive ? 'Recibido' : 'Enviado'}
            </span>
            <Badge
              variant={tx.confirmations >= 6 ? 'success' : 'warning'}
              className="text-[9px]"
            >
              {tx.confirmations >= 6 ? '✓' : `${tx.confirmations}`}
            </Badge>
          </div>
          <p className="truncate font-mono text-[11px] text-muted-foreground">
            {shortenHash(tx.txid, 8)}
          </p>
          {tx.address && (
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              {shortenHash(tx.address, 8)}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground">{formatDate(tx.time)}</p>
        </div>
        <div className="text-right">
          <p className={`font-mono text-sm font-semibold ${amountColor}`}>
            {tx.amount > 0 ? '+' : ''}
            {formatAdo(tx.amount)}
          </p>
          {tx.fee && (
            <p className="text-[10px] text-muted-foreground">
              fee: {formatAdo(Math.abs(tx.fee))}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
