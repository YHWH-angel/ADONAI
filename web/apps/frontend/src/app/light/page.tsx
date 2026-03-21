'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getDescriptors, parseDescPath } from '@/lib/wallet-core';
import { useLightWalletStore } from '@/store/lightWallet';
import { validateMnemonic } from '@/lib/wallet-core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Wallet, ShieldCheck, Eye } from 'lucide-react';
import type { LightUTXO } from '@/lib/wallet-core';
import type { ScannedUTXO } from '@adonai/rpc-client';

export default function LightConnectPage() {
  const router = useRouter();
  const { setWallet, setScanResult } = useLightWalletStore();

  const [mnemonic, setMnemonic] = useState('');
  const [step, setStep] = useState<'input' | 'scanning'>('input');
  const [error, setError] = useState('');

  const words = mnemonic.trim().split(/\s+/).filter(Boolean);
  const isValid = validateMnemonic(mnemonic);

  async function handleConnect() {
    setError('');
    setStep('scanning');
    try {
      const { receive, change, xpub } = getDescriptors(mnemonic.trim());

      // Extract xpub without wpkh(...) wrapper for the API
      const scanResult = await api.lightScan(xpub);

      // Convert ScannedUTXO[] → LightUTXO[]
      const utxos: LightUTXO[] = scanResult.utxos
        .map((u: ScannedUTXO) => {
          const path = parseDescPath(u.desc);
          if (!path) return null;
          return {
            txid: u.txid,
            vout: u.vout,
            amountAdo: u.amount,
            scriptPubKey: u.scriptPubKey,
            isChange: path.isChange,
            index: path.index,
          } satisfies LightUTXO;
        })
        .filter((u): u is LightUTXO => u !== null);

      // Find next unused receive index (highest receive index + 1)
      const receiveIndices = utxos.filter((u) => !u.isChange).map((u) => u.index);
      const receiveIndex = receiveIndices.length > 0 ? Math.max(...receiveIndices) + 1 : 0;
      const changeIndices = utxos.filter((u) => u.isChange).map((u) => u.index);
      const changeIndex = changeIndices.length > 0 ? Math.max(...changeIndices) + 1 : 0;

      setWallet(mnemonic.trim(), xpub);
      setScanResult(scanResult.balance, utxos, scanResult.height, receiveIndex, changeIndex);

      // Clear sensitive input
      setMnemonic('');
      router.push('/light/wallet');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar');
      setStep('input');
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6 py-6">
      <div className="text-center space-y-2">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
          <Wallet size={28} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Wallet ligera</h1>
        <p className="text-sm text-muted-foreground">
          Introduce tus 24 palabras para acceder a tu wallet sin necesidad de un nodo propio.
          Las claves privadas <strong>nunca salen del navegador</strong>.
        </p>
      </div>

      {/* Security note */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-3 px-4 flex gap-3 items-start text-xs text-muted-foreground">
          <ShieldCheck size={16} className="text-primary shrink-0 mt-0.5" />
          <p>
            Las palabras semilla se usan solo para derivar las claves en tu dispositivo.
            No se envían al servidor. Se borran de memoria al cerrar la página.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye size={16} />
            Introduce tus palabras semilla
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="w-full min-h-[120px] rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            placeholder="palabra1 palabra2 palabra3 ... (12 o 24 palabras)"
            value={mnemonic}
            onChange={(e) => setMnemonic(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
          />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{words.length} palabras</span>
            {words.length >= 12 && (
              <span className={isValid ? 'text-green-400' : 'text-destructive'}>
                {isValid ? '✓ Válida' : '✗ No válida'}
              </span>
            )}
          </div>

          {error && (
            <p className="text-xs text-destructive rounded-lg bg-destructive/10 p-2">{error}</p>
          )}

          <Button
            className="w-full"
            disabled={!isValid || step === 'scanning'}
            onClick={handleConnect}
            size="lg"
          >
            {step === 'scanning' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Escaneando UTXO...
              </>
            ) : (
              <>
                <Wallet size={16} />
                Conectar wallet
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
