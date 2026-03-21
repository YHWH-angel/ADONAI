'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useActiveWallet } from '@/hooks/useActiveWallet';
import { useT } from '@/hooks/useLocale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatAdo, formatDate, shortenHash, copyToClipboard } from '@/lib/utils';
import {
  ArrowUpRight, ArrowDownLeft, Search, Loader2,
  AlertCircle, Pickaxe, ChevronDown, ChevronUp, Copy, CheckCheck,
} from 'lucide-react';
import type { WalletTransaction } from '@adonai/rpc-client';
import Link from 'next/link';

const PAGE_SIZE = 20;

export default function TransactionsPage() {
  const activeWallet = useActiveWallet();
  const t = useT();
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
        <p className="text-muted-foreground">{t.transactions.needWallet}</p>
        <Button asChild><Link href="/wallet/create">{t.common.createWallet}</Link></Button>
      </div>
    );
  }

  const filtered = (data?.transactions ?? []).filter((tx) => {
    if (filter !== 'all' && tx.category !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return tx.txid.toLowerCase().includes(q) || (tx.address?.toLowerCase().includes(q) ?? false);
    }
    return true;
  });

  return (
    <div className="space-y-3 py-2">
      <h1 className="text-xl font-bold">{t.transactions.title}</h1>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
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
            {f === 'all' ? t.transactions.all
              : f === 'receive' ? t.transactions.received
              : f === 'send' ? t.transactions.sent
              : t.transactions.mining}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t.transactions.search}
          className="pl-8 text-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">{t.transactions.noTx}</div>
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
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            {t.transactions.prev}
          </Button>
          <span className="text-xs text-muted-foreground">{t.transactions.page} {page + 1}</span>
          <Button variant="outline" size="sm" disabled={(data?.transactions.length ?? 0) < PAGE_SIZE} onClick={() => setPage((p) => p + 1)}>
            {t.transactions.next}
          </Button>
        </div>
      )}
    </div>
  );
}

function TxCard({ tx }: { tx: WalletTransaction }) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isReceive = tx.amount > 0;
  const isMining = tx.category === 'generate' || tx.category === 'immature';

  const iconBg = isMining ? 'bg-yellow-500/20' : isReceive ? 'bg-green-500/20' : 'bg-red-500/20';
  const amountColor = isMining ? 'text-yellow-400' : isReceive ? 'text-green-400' : 'text-red-400';
  const icon = isMining
    ? <Pickaxe size={14} className="text-yellow-400" />
    : isReceive
    ? <ArrowDownLeft size={14} className="text-green-400" />
    : <ArrowUpRight size={14} className="text-red-400" />;

  const label = isMining ? t.transactions.miningReward : isReceive ? t.transactions.receive : t.transactions.send;

  async function handleCopy(text: string, field: string) {
    await copyToClipboard(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  return (
    <Card className="transition-colors hover:bg-secondary/20 overflow-hidden">
      {/* Main row — always visible */}
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium">{label}</span>
              <Badge variant={tx.confirmations >= 6 ? 'success' : 'warning'} className="text-[9px]">
                {tx.confirmations >= 6 ? '✓' : `${tx.confirmations} conf.`}
              </Badge>
            </div>
            <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
              {shortenHash(tx.txid, 6)}
            </p>
            <p className="text-[10px] text-muted-foreground">{formatDate(tx.time)}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <p className={`font-mono text-sm font-semibold ${amountColor}`}>
              {tx.amount > 0 ? '+' : ''}{formatAdo(tx.amount)}
            </p>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? t.transactions.hideDetails : t.transactions.details}
              {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-3 space-y-2 border-t border-border pt-3">
            {/* TXID */}
            <DetailRow
              label={t.transactions.txid}
              value={tx.txid}
              onCopy={() => handleCopy(tx.txid, 'txid')}
              copied={copiedField === 'txid'}
            />
            {/* Address */}
            {tx.address && (
              <DetailRow
                label={t.common.address}
                value={tx.address}
                onCopy={() => handleCopy(tx.address!, 'address')}
                copied={copiedField === 'address'}
              />
            )}
            {/* Block */}
            {tx.blockheight && (
              <div className="flex items-start justify-between gap-2 text-xs">
                <span className="text-muted-foreground shrink-0">{t.common.block}</span>
                <span className="font-mono text-right">#{tx.blockheight.toLocaleString()}</span>
              </div>
            )}
            {/* Confirmations */}
            <div className="flex items-start justify-between gap-2 text-xs">
              <span className="text-muted-foreground shrink-0">{t.common.confirmations}</span>
              <span className="font-mono text-right">{tx.confirmations}</span>
            </div>
            {/* Fee */}
            {tx.fee !== undefined && tx.fee !== 0 && (
              <div className="flex items-start justify-between gap-2 text-xs">
                <span className="text-muted-foreground shrink-0">{t.common.fee}</span>
                <span className="font-mono text-right text-red-400">{formatAdo(Math.abs(tx.fee))}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DetailRow({
  label, value, onCopy, copied,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="font-mono text-right break-all text-[10px]">{value}</span>
        <button
          onClick={onCopy}
          className="shrink-0 rounded p-0.5 hover:bg-secondary transition-colors"
          title="Copiar"
        >
          {copied
            ? <CheckCheck size={12} className="text-green-400" />
            : <Copy size={12} className="text-muted-foreground" />}
        </button>
      </div>
    </div>
  );
}
