'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLightWalletStore } from '@/store/lightWallet';
import { deriveKeyAtIndex } from '@/lib/wallet-core';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, CheckCheck, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useT } from '@/hooks/useLocale';

export default function LightReceivePage() {
  const router = useRouter();
  const t = useT();
  const store = useLightWalletStore();
  const [index, setIndex] = useState(store.receiveIndex);
  const [copied, setCopied] = useState(false);

  if (!store.mnemonic) {
    router.replace('/light');
    return null;
  }

  const { address } = deriveKeyAtIndex(store.mnemonic, index, false);

  async function handleCopy() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4 py-4 max-w-sm mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/light/wallet"><ArrowLeft size={14} /> {t.light.back}</Link>
        </Button>
      </div>

      <h1 className="text-xl font-bold">{t.receive.title}</h1>

      <Card>
        <CardContent className="py-5 flex flex-col items-center gap-4">
          <div className="rounded-xl bg-white p-3">
            <QRCodeSVG value={address} size={180} />
          </div>

          <div className="w-full space-y-1.5">
            <p className="text-xs text-muted-foreground text-center">{t.light.addressIndex}{index}</p>
            <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-2.5">
              <span className="font-mono text-[11px] break-all flex-1">{address}</span>
              <button
                onClick={handleCopy}
                className="shrink-0 p-1.5 rounded-lg hover:bg-secondary transition-colors"
              >
                {copied
                  ? <CheckCheck size={14} className="text-green-400" />
                  : <Copy size={14} className="text-muted-foreground" />}
              </button>
            </div>
          </div>

          {/* Navigate between addresses */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline" size="sm"
              disabled={index === 0}
              onClick={() => setIndex((i) => i - 1)}
            >
              <ChevronLeft size={14} /> {t.transactions.prev}
            </Button>
            <span className="text-xs text-muted-foreground">#{index}</span>
            <Button
              variant="outline" size="sm"
              onClick={() => setIndex((i) => i + 1)}
            >
              {t.transactions.next} <ChevronRight size={14} />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {t.light.privacyNote}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
