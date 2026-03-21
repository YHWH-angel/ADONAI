'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Wifi, WifiOff, ChevronLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const pageTitles: Record<string, string> = {
  '/': 'ADONAI Wallet',
  '/send': 'Enviar ADO',
  '/receive': 'Recibir ADO',
  '/transactions': 'Historial',
  '/mining': 'Recompensas de Minado',
  '/settings': 'Configuración',
  '/wallet/create': 'Crear Wallet',
};

const rootPages = new Set(['/', '/send', '/receive', '/transactions', '/mining', '/settings']);

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const title = pageTitles[pathname] ?? 'ADONAI';
  const showBack = !rootPages.has(pathname);

  const { data: stats, isError } = useQuery({
    queryKey: ['blockchain-stats'],
    queryFn: api.getStats,
    refetchInterval: 30_000,
    retry: 1,
  });

  const isConnected = !isError && !!stats;

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-card safe-top">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {showBack ? (
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors -ml-1 pr-1"
              aria-label="Volver"
            >
              <ChevronLeft size={20} />
            </button>
          ) : (
            <span className="text-xl font-bold tracking-tight text-primary">⬡</span>
          )}
          <h1 className="text-base font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isConnected ? (
            <>
              <Wifi size={14} className="text-green-400" />
              <span className="text-green-400">
                #{stats.blockchain.blocks.toLocaleString()}
              </span>
            </>
          ) : (
            <>
              <WifiOff size={14} className="text-destructive" />
              <span className="text-destructive">Sin conexión</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
