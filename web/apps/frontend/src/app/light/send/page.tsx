'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useLightWalletStore } from '@/store/lightWallet';
import { api } from '@/lib/api';
import { buildAndSignTx, deriveKeyAtIndex, estimateLightFee, validateMnemonic } from '@/lib/wallet-core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatAdo } from '@/lib/utils';
import { Send, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LightSendPage() {
  const router = useRouter();
  const store = useLightWalletStore();

  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [txid, setTxid] = useState('');
  const [error, setError] = useState('');

  const { data: feeData } = useQuery({
    queryKey: ['fee-estimate'],
    queryFn: () => api.getFeeEstimate(6),
  });

  const { data: validation } = useQuery({
    queryKey: ['validate-address', address],
    queryFn: () => api.validateAddress(address),
    enabled: address.length > 10,
  });

  if (!store.mnemonic) {
    router.replace('/light');
    return null;
  }

  const amountNum = parseFloat(amount);
  const balance = store.balance;
  const isValidAddress = validation?.isvalid === true;
  const isValidAmount = !isNaN(amountNum) && amountNum > 0 && amountNum <= balance;

  const model = feeData?.model;
  const estimatedFee = model
    ? estimateLightFee(model.alpha, model.beta, model.min, isNaN(amountNum) ? 0 : amountNum, store.utxos.length)
    : 0.000001;

  const canSend = isValidAddress && isValidAmount && !sending && store.utxos.length > 0;

  async function handleSend() {
    if (!canSend || !store.mnemonic) return;
    setError('');
    setSending(true);

    try {
      // Pick UTXOs (greedy, largest first)
      const sorted = [...store.utxos].sort((a, b) => b.amountAdo - a.amountAdo);
      const target = amountNum + estimatedFee;
      const selected: typeof sorted = [];
      let total = 0;
      for (const u of sorted) {
        selected.push(u);
        total += u.amountAdo;
        if (total >= target) break;
      }
      if (total < target) throw new Error('Fondos insuficientes');

      // Derive change address
      const changeKey = deriveKeyAtIndex(store.mnemonic, store.changeIndex, true);

      const hex = buildAndSignTx({
        utxos: selected,
        recipientAddress: address,
        amountAdo: amountNum,
        changeAddress: changeKey.address,
        feeAdo: estimatedFee,
        mnemonic: store.mnemonic,
      });

      const result = await api.lightBroadcast(hex);
      setTxid(result.txid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar');
    } finally {
      setSending(false);
    }
  }

  if (txid) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center max-w-md mx-auto">
        <CheckCircle2 className="h-14 w-14 text-green-400" />
        <h2 className="text-xl font-bold">Transacción enviada</h2>
        <p className="text-xs text-muted-foreground font-mono break-all px-4">{txid}</p>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/light/wallet">
              <ArrowLeft size={14} />
              Volver
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4 max-w-md mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/light/wallet"><ArrowLeft size={14} /> Volver</Link>
        </Button>
      </div>

      {/* Balance */}
      <Card className="border-primary/20">
        <CardContent className="py-3 px-5">
          <p className="text-xs text-muted-foreground">Saldo disponible</p>
          <p className="text-2xl font-bold text-primary">{formatAdo(balance)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Send size={16} />
            Enviar ADO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Address */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Dirección destino</label>
            <Input
              placeholder="ad1q..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={address.length > 10 ? (isValidAddress ? 'border-green-500/50' : 'border-destructive/50') : ''}
            />
            {address.length > 10 && !isValidAddress && (
              <p className="text-xs text-destructive">Dirección no válida</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Cantidad (ADO)</label>
              <button
                className="text-xs text-primary"
                onClick={() => setAmount(Math.max(0, balance - estimatedFee).toFixed(8))}
              >
                Máximo
              </button>
            </div>
            <Input
              type="number"
              placeholder="0.00000000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={amount && !isValidAmount ? 'border-destructive/50' : ''}
            />
            {amount && !isNaN(amountNum) && amountNum > balance && (
              <p className="text-xs text-destructive">Saldo insuficiente</p>
            )}
          </div>

          {/* Fee */}
          <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Comisión estimada</span>
              <span className="font-mono text-foreground">~{estimatedFee.toFixed(8)} ADO</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>UTXOs seleccionados</span>
              <span className="font-mono">{store.utxos.length} disponibles</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Firma</span>
              <span className="font-mono text-green-400">Local · P2WPKH</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <Button className="w-full" disabled={!canSend} onClick={handleSend} size="lg">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {sending ? 'Firmando y enviando...' : 'Confirmar envío'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
