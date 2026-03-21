'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '@/lib/api';
import { useWalletStore } from '@/store/wallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { copyToClipboard } from '@/lib/utils';
import { Copy, RefreshCw, CheckCheck, Download, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ReceivePage() {
  const { activeWallet } = useWalletStore();
  const [label, setLabel] = useState('');
  const [copied, setCopied] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);

  const generateMutation = useMutation({
    mutationFn: () => api.newAddress(activeWallet!, label),
    onSuccess: (data) => setCurrentAddress(data.address),
  });

  // Auto-generate on load
  useQuery({
    queryKey: ['new-address', activeWallet],
    queryFn: () => api.newAddress(activeWallet!, ''),
    enabled: !!activeWallet && !currentAddress,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  // Set initial address when query succeeds
  const { data: initialAddress } = useQuery({
    queryKey: ['new-address', activeWallet],
    queryFn: () => api.newAddress(activeWallet!, ''),
    enabled: !!activeWallet && !currentAddress,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const address = currentAddress ?? initialAddress?.address ?? null;

  const handleCopy = async () => {
    if (!address) return;
    await copyToClipboard(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!activeWallet) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">Necesitas una wallet activa para recibir.</p>
        <Button asChild>
          <Link href="/wallet/create">Crear wallet</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download size={16} />
            Recibir ADO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* QR Code */}
          <div className="flex justify-center">
            {address ? (
              <div className="rounded-2xl bg-white p-4 shadow-lg">
                <QRCodeSVG
                  value={`adonai:${address}`}
                  size={200}
                  level="M"
                  includeMargin={false}
                />
              </div>
            ) : (
              <div className="flex h-[200px] w-[200px] items-center justify-center rounded-2xl bg-secondary">
                <RefreshCw className="animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Address */}
          {address && (
            <div className="space-y-2">
              <p className="text-center text-xs text-muted-foreground">
                Tu dirección ADONAI
              </p>
              <div className="flex items-center gap-2 rounded-lg bg-secondary p-3">
                <span className="min-w-0 flex-1 break-all font-mono text-xs">
                  {address}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <CheckCheck size={14} className="text-green-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                </Button>
              </div>
              {copied && (
                <p className="text-center text-xs text-green-400">
                  Copiado al portapapeles
                </p>
              )}
            </div>
          )}

          {/* Label + generate new */}
          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-sm font-medium">Generar nueva dirección</p>
            <div className="flex gap-2">
              <Input
                placeholder="Etiqueta (opcional)"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="secondary"
                size="icon"
                disabled={generateMutation.isPending}
                onClick={() => generateMutation.mutate()}
              >
                <RefreshCw
                  size={14}
                  className={generateMutation.isPending ? 'animate-spin' : ''}
                />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Cada transacción debería usar una dirección nueva para mayor privacidad.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
