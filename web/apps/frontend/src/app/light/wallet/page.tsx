'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useLightWalletStore } from '@/store/lightWallet';
import { api } from '@/lib/api';
import { parseDescPath, deriveKeyAtIndex } from '@/lib/wallet-core';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatAdo, formatDate, shortenHash, copyToClipboard } from '@/lib/utils';
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Send, Download, RefreshCw,
  LogOut, Loader2, Coins, Copy, CheckCheck, Pickaxe, ChevronDown, ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import { useT } from '@/hooks/useLocale';
import type { LightUTXO } from '@/lib/wallet-core';
import type { ScannedUTXO, WalletTransaction } from '@adonai/rpc-client';

export default function LightWalletPage() {
  const router = useRouter();
  const t = useT();
  const store = useLightWalletStore();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'utxos' | 'history'>('utxos');

  // Redirect to connect page if no wallet in memory
  useEffect(() => {
    if (!store.mnemonic || !store.xpub) {
      router.replace('/light');
    }
  }, [store.mnemonic, store.xpub, router]);

  // Derive receive address at current index
  const receiveAddress = store.mnemonic
    ? deriveKeyAtIndex(store.mnemonic, store.receiveIndex, false).address
    : null;

  // Refresh scan
  const { isFetching, refetch } = useQuery({
    queryKey: ['light-scan', store.xpub],
    queryFn: async () => {
      if (!store.xpub) throw new Error('No xpub');
      const scanResult = await api.lightScan(store.xpub);
      const utxos: LightUTXO[] = scanResult.utxos
        .map((u: ScannedUTXO) => {
          const path = parseDescPath(u.desc);
          if (!path) return null;
          return { txid: u.txid, vout: u.vout, amountAdo: u.amount, scriptPubKey: u.scriptPubKey, isChange: path.isChange, index: path.index };
        })
        .filter((u): u is LightUTXO => u !== null);

      const receiveIndices = utxos.filter((u) => !u.isChange).map((u) => u.index);
      const changeIndices = utxos.filter((u) => u.isChange).map((u) => u.index);
      store.setScanResult(
        scanResult.balance,
        utxos,
        scanResult.height,
        receiveIndices.length > 0 ? Math.max(...receiveIndices) + 1 : 0,
        changeIndices.length > 0 ? Math.max(...changeIndices) + 1 : 0
      );
      return scanResult;
    },
    enabled: !!store.xpub,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // Fetch transaction history from watch-only descriptor wallet
  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['light-txs', store.walletId],
    queryFn: () => api.lightTransactions(store.walletId!),
    enabled: !!store.walletId,
    refetchInterval: 30_000,
  });

  async function handleCopy() {
    if (!receiveAddress) return;
    await navigator.clipboard.writeText(receiveAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!store.mnemonic) return null;

  return (
    <div className="space-y-4 py-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t.light.lightWallet}</p>
            <p className="text-xs font-mono text-muted-foreground">{shortenHash(store.xpub ?? '', 8)}</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title={t.light.refresh}
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { store.clear(); router.push('/light'); }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title={t.light.disconnect}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* Balance card */}
      <Card className="border-primary/20">
        <CardContent className="py-5 px-5 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t.light.availableBalance}</p>
          <p className="text-3xl font-bold text-primary font-mono">
            {formatAdo(store.balance)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {store.utxos.length} UTXO{store.utxos.length !== 1 ? 's' : ''} · {t.light.blockLabel} {store.blockHeight.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button asChild size="lg" className="w-full">
          <Link href="/light/send">
            <Send size={16} />
            {t.common.send}
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/light/receive">
            <Download size={16} />
            {t.common.receive}
          </Link>
        </Button>
      </div>

      {/* Receive address */}
      {receiveAddress && (
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground mb-1.5">{t.light.receiveAddress}</p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] break-all flex-1">{receiveAddress}</span>
              <button
                onClick={handleCopy}
                className="shrink-0 p-1.5 rounded-lg hover:bg-secondary transition-colors"
              >
                {copied
                  ? <CheckCheck size={14} className="text-green-400" />
                  : <Copy size={14} className="text-muted-foreground" />}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab bar: UTXOs / History */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('utxos')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            activeTab === 'utxos'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          UTXOs ({store.utxos.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t.light.historyLabel}
        </button>
      </div>

      {/* UTXOs tab */}
      {activeTab === 'utxos' && (
        <>
          {store.utxos.length > 0 ? (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {store.utxos.map((u) => (
                <Card key={`${u.txid}:${u.vout}`}>
                  <CardContent className="py-2 px-3 flex items-center gap-3">
                    <div className="h-7 w-7 shrink-0 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <Coins size={12} className="text-yellow-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11px] text-muted-foreground truncate">
                        {shortenHash(u.txid, 6)}:{u.vout}
                        <span className="ml-1.5 text-[10px] text-muted-foreground/60">
                          {u.isChange ? t.light.change : t.light.received} #{u.index}
                        </span>
                      </p>
                    </div>
                    <p className="font-mono text-sm font-semibold text-green-400 shrink-0">
                      +{formatAdo(u.amountAdo)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <ArrowUpRight className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">{t.light.noFunds}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.light.scanned}</p>
            </div>
          )}
        </>
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <>
          {!store.walletId ? (
            <div className="py-8 text-center">
              <Loader2 className="mx-auto h-8 w-8 text-muted-foreground/40 animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">{t.light.loadingHistory}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.light.historyIndexing}</p>
            </div>
          ) : txLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-muted-foreground" />
            </div>
          ) : !txData || txData.transactions.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">{t.light.noHistory}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t.light.historyRescan}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {txData.transactions.map((tx) => (
                <LightTxCard key={tx.txid + tx.category} tx={tx} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LightTxCard({ tx }: { tx: WalletTransaction }) {
  const [expanded, setExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const t = useT();

  const isReceive = tx.amount > 0;
  const isMining = tx.category === 'generate' || tx.category === 'immature';

  const iconBg = isMining ? 'bg-yellow-500/20' : isReceive ? 'bg-green-500/20' : 'bg-red-500/20';
  const amountColor = isMining ? 'text-yellow-400' : isReceive ? 'text-green-400' : 'text-red-400';
  const icon = isMining
    ? <Pickaxe size={14} className="text-yellow-400" />
    : isReceive
    ? <ArrowDownLeft size={14} className="text-green-400" />
    : <ArrowUpRight size={14} className="text-red-400" />;

  const label = isMining
    ? t.light.miningReward
    : isReceive
    ? t.transactions.receive
    : t.transactions.send;

  async function handleCopy(text: string, field: string) {
    await copyToClipboard(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  return (
    <Card className="transition-colors hover:bg-secondary/20 overflow-hidden">
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
            <LightDetailRow
              label="TXID"
              value={tx.txid}
              onCopy={() => handleCopy(tx.txid, 'txid')}
              copied={copiedField === 'txid'}
            />
            {/* Address */}
            {tx.address && (
              <LightDetailRow
                label={t.common.address}
                value={tx.address}
                onCopy={() => handleCopy(tx.address!, 'address')}
                copied={copiedField === 'address'}
              />
            )}
            {/* Block height */}
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

function LightDetailRow({
  label, value, onCopy, copied,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}) {
  const t = useT();
  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="font-mono text-right break-all text-[10px]">{value}</span>
        <button
          onClick={onCopy}
          className="shrink-0 rounded p-0.5 hover:bg-secondary transition-colors"
          title={t.common.copy}
        >
          {copied
            ? <CheckCheck size={12} className="text-green-400" />
            : <Copy size={12} className="text-muted-foreground" />}
        </button>
      </div>
    </div>
  );
}
