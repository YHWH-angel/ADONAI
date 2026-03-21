'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useLightWalletStore } from '@/store/lightWallet';
import { api } from '@/lib/api';
import { parseDescPath, deriveKeyAtIndex } from '@/lib/wallet-core';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatAdo, shortenHash } from '@/lib/utils';
import {
  Wallet, ArrowUpRight, Send, Download, RefreshCw,
  LogOut, Loader2, Coins, Copy, CheckCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { LightUTXO } from '@/lib/wallet-core';
import type { ScannedUTXO } from '@adonai/rpc-client';

export default function LightWalletPage() {
  const router = useRouter();
  const store = useLightWalletStore();
  const [copied, setCopied] = useState(false);

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
            <p className="text-xs text-muted-foreground">Wallet ligera</p>
            <p className="text-xs font-mono text-muted-foreground">{shortenHash(store.xpub ?? '', 8)}</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Actualizar"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { store.clear(); router.push('/light'); }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Desconectar"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* Balance card */}
      <Card className="border-primary/20">
        <CardContent className="py-5 px-5 text-center">
          <p className="text-xs text-muted-foreground mb-1">Saldo disponible</p>
          <p className="text-3xl font-bold text-primary font-mono">
            {formatAdo(store.balance)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {store.utxos.length} UTXO{store.utxos.length !== 1 ? 's' : ''} · bloque {store.blockHeight.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button asChild size="lg" className="w-full">
          <Link href="/light/send">
            <Send size={16} />
            Enviar
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/light/receive">
            <Download size={16} />
            Recibir
          </Link>
        </Button>
      </div>

      {/* Receive address */}
      {receiveAddress && (
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground mb-1.5">Tu dirección de recepción</p>
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

      {/* UTXO list */}
      {store.utxos.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">UTXOs disponibles</p>
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
                        {u.isChange ? 'cambio' : `recibido`} #{u.index}
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
        </div>
      )}

      {store.utxos.length === 0 && (
        <div className="py-10 text-center">
          <ArrowUpRight className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No hay fondos en esta wallet</p>
          <p className="text-xs text-muted-foreground mt-1">Las 200 primeras direcciones han sido escaneadas</p>
        </div>
      )}
    </div>
  );
}
