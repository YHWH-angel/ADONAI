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
  Wallet, ArrowDownLeft, Send, Download, RefreshCw,
  LogOut, Loader2, Copy, CheckCheck, ChevronDown, ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import { useT } from '@/hooks/useLocale';
import type { LightUTXO } from '@/lib/wallet-core';
import type { ScannedUTXO, Transaction } from '@adonai/rpc-client';

export default function LightWalletPage() {
  const router = useRouter();
  const t = useT();
  const store = useLightWalletStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!store.mnemonic || !store.xpub) {
      router.replace('/light');
    }
  }, [store.mnemonic, store.xpub, router]);

  const receiveAddress = store.mnemonic
    ? deriveKeyAtIndex(store.mnemonic, store.receiveIndex, false).address
    : null;

  // Scan UTXOs
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

  // Build history from UTXOs: fetch tx details for each unique txid
  const uniqueTxids = [...new Set(store.utxos.map((u) => u.txid))];
  const { data: txDetails, isLoading: txLoading } = useQuery({
    queryKey: ['light-tx-details', uniqueTxids],
    queryFn: async () => {
      const results = await Promise.all(
        uniqueTxids.map((txid) => api.getTx(txid).catch(() => null))
      );
      return Object.fromEntries(
        uniqueTxids.map((txid, i) => [txid, results[i]])
      ) as Record<string, Transaction | null>;
    },
    enabled: uniqueTxids.length > 0,
    staleTime: 60_000,
  });

  async function handleCopy() {
    if (!receiveAddress) return;
    await navigator.clipboard.writeText(receiveAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!store.mnemonic) return null;

  // Build history entries: one per unique txid, sum all UTXOs from that tx
  const historyEntries = uniqueTxids.map((txid) => {
    const utxosForTx = store.utxos.filter((u) => u.txid === txid);
    const totalAdo = utxosForTx.reduce((s, u) => s + u.amountAdo, 0);
    const tx = txDetails?.[txid] ?? null;
    return { txid, totalAdo, utxos: utxosForTx, tx };
  }).sort((a, b) => (b.tx?.blocktime ?? 0) - (a.tx?.blocktime ?? 0));

  return (
    <div className="space-y-4 py-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet size={16} className="text-primary" />
          </div>
          <p className="text-sm font-medium">{t.light.lightWallet}</p>
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

      {/* History — built from UTXOs, no watch-only wallet needed */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 px-0.5">{t.light.historyLabel}</p>

        {isFetching && store.utxos.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        ) : historyEntries.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">{t.light.noHistory}</p>
            <p className="text-xs text-muted-foreground mt-1">{t.light.scanned}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {txLoading && (
              <p className="text-[10px] text-muted-foreground text-center pb-1">
                {t.light.scanning}
              </p>
            )}
            {historyEntries.map((entry) => (
              <HistoryEntry
                key={entry.txid}
                txid={entry.txid}
                totalAdo={entry.totalAdo}
                utxos={entry.utxos}
                tx={entry.tx}
                mnemonic={store.mnemonic!}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryEntry({
  txid, totalAdo, utxos, tx, mnemonic,
}: {
  txid: string;
  totalAdo: number;
  utxos: LightUTXO[];
  tx: Transaction | null;
  mnemonic: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const t = useT();

  async function handleCopy(text: string, field: string) {
    await copyToClipboard(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  const confirmations = tx?.confirmations ?? 0;
  const time = tx?.blocktime ?? tx?.time;

  return (
    <Card className="transition-colors hover:bg-secondary/20 overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-500/20">
            <ArrowDownLeft size={14} className="text-green-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium">{t.transactions.receive}</span>
              <Badge variant={confirmations >= 6 ? 'success' : 'warning'} className="text-[9px]">
                {confirmations >= 6 ? '✓' : tx ? `${confirmations} conf.` : '...'}
              </Badge>
            </div>
            <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
              {shortenHash(txid, 6)}
            </p>
            {time && (
              <p className="text-[10px] text-muted-foreground">{formatDate(time)}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <p className="font-mono text-sm font-semibold text-green-400">
              +{formatAdo(totalAdo)}
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

        {expanded && (
          <div className="mt-3 space-y-2 border-t border-border pt-3">
            <DetailRow
              label="TXID"
              value={txid}
              onCopy={() => handleCopy(txid, 'txid')}
              copied={copiedField === 'txid'}
            />
            {utxos.map((u) => {
              const address = deriveKeyAtIndex(mnemonic, u.index, u.isChange).address;
              return (
                <DetailRow
                  key={`${u.txid}:${u.vout}`}
                  label={`${t.common.address} (vout ${u.vout})`}
                  value={address}
                  onCopy={() => handleCopy(address, `addr-${u.vout}`)}
                  copied={copiedField === `addr-${u.vout}`}
                />
              );
            })}
            {tx?.blockhash && (
              <DetailRow
                label={t.common.block}
                value={tx.blockhash}
                onCopy={() => handleCopy(tx.blockhash!, 'block')}
                copied={copiedField === 'block'}
              />
            )}
            {confirmations > 0 && (
              <div className="flex items-start justify-between gap-2 text-xs">
                <span className="text-muted-foreground shrink-0">{t.common.confirmations}</span>
                <span className="font-mono text-right">{confirmations}</span>
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
