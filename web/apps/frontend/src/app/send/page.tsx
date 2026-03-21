'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWalletStore } from '@/store/wallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatAdo } from '@/lib/utils';
import { Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function SendPage() {
  const { activeWallet } = useWalletStore();
  const queryClient = useQueryClient();

  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [subtractFee, setSubtractFee] = useState(false);

  const { data: walletData } = useQuery({
    queryKey: ['wallet-info', activeWallet],
    queryFn: () => api.getWalletInfo(activeWallet!),
    enabled: !!activeWallet,
  });

  const { data: feeData } = useQuery({
    queryKey: ['fee-estimate'],
    queryFn: () => api.getFeeEstimate(6),
  });

  const { data: validation } = useQuery({
    queryKey: ['validate-address', address],
    queryFn: () => api.validateAddress(address),
    enabled: address.length > 10,
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      api.send(activeWallet!, address, parseFloat(amount), subtractFee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-info'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  if (!activeWallet) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">Necesitas una wallet activa para enviar.</p>
        <Button asChild>
          <Link href="/wallet/create">Crear wallet</Link>
        </Button>
      </div>
    );
  }

  const amountNum = parseFloat(amount);
  const balance = walletData?.balance ?? 0;
  const isValidAddress = validation?.isvalid === true;
  const isValidAmount =
    !isNaN(amountNum) && amountNum > 0 && amountNum <= balance;
  const canSend = isValidAddress && isValidAmount && !sendMutation.isPending;

  if (sendMutation.isSuccess) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <CheckCircle2 className="h-14 w-14 text-green-400" />
        <h2 className="text-xl font-bold">Transacción enviada</h2>
        <p className="font-mono text-xs text-muted-foreground break-all px-4">
          {sendMutation.data.txid}
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              sendMutation.reset();
              setAddress('');
              setAmount('');
            }}
          >
            Nueva transacción
          </Button>
          <Button asChild>
            <Link href="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      {/* Balance disponible */}
      <Card className="border-primary/20">
        <CardContent className="py-3 px-5">
          <p className="text-xs text-muted-foreground">Saldo disponible</p>
          <p className="text-2xl font-bold text-primary">
            {formatAdo(balance)}
          </p>
        </CardContent>
      </Card>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Send size={16} />
            Enviar ADO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dirección */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Dirección destino</label>
            <Input
              placeholder="ad1q... o A..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={
                address.length > 10
                  ? isValidAddress
                    ? 'border-green-500/50'
                    : 'border-destructive/50'
                  : ''
              }
            />
            {address.length > 10 && !isValidAddress && (
              <p className="text-xs text-destructive">Dirección no válida</p>
            )}
          </div>

          {/* Cantidad */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Cantidad (ADO)</label>
              <button
                className="text-xs text-primary"
                onClick={() => setAmount(balance.toString())}
              >
                Máximo
              </button>
            </div>
            <Input
              type="number"
              placeholder="0.00000000"
              min="0"
              step="0.00000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={
                amount && !isValidAmount ? 'border-destructive/50' : ''
              }
            />
            {amount && !isNaN(amountNum) && amountNum > balance && (
              <p className="text-xs text-destructive">Saldo insuficiente</p>
            )}
          </div>

          {/* Comisión estimada */}
          {feeData && (
            <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Comisión estimada</span>
                <span className="font-mono">
                  ~{feeData.estimate.feerate?.toFixed(8) ?? '—'} ADO/kvB
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="subtract-fee"
                  checked={subtractFee}
                  onChange={(e) => setSubtractFee(e.target.checked)}
                  className="accent-primary"
                />
                <label htmlFor="subtract-fee">
                  Descontar comisión del importe enviado
                </label>
              </div>
            </div>
          )}

          {/* Error */}
          {sendMutation.isError && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle size={14} />
              {sendMutation.error?.message ?? 'Error al enviar'}
            </div>
          )}

          <Button
            className="w-full"
            disabled={!canSend}
            onClick={() => sendMutation.mutate()}
            size="lg"
          >
            {sendMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {sendMutation.isPending ? 'Enviando...' : 'Confirmar envío'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
