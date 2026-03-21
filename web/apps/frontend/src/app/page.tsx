'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useActiveWallet } from '@/hooks/useActiveWallet';
import { useT } from '@/hooks/useLocale';
import { useLocaleStore } from '@/hooks/useLocale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatAdo, formatAdoShort, formatRelativeTime, shortenHash } from '@/lib/utils';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Blocks,
  Cpu,
  Users,
  TrendingUp,
  AlertCircle,
  Wallet,
  ChevronRight,
  Pickaxe,
  Clock,
  CheckCircle2,
  Globe,
  Coins,
  HelpCircle,
  Network,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const activeWallet = useActiveWallet();
  const t = useT();
  const { locale } = useLocaleStore();

  const { data: stats, isLoading: statsLoading, isError } = useQuery({
    queryKey: ['blockchain-stats'],
    queryFn: api.getStats,
    refetchInterval: 15_000,
  });

  const { data: walletData } = useQuery({
    queryKey: ['wallet-info', activeWallet],
    queryFn: () => api.getWalletInfo(activeWallet!),
    enabled: !!activeWallet,
    refetchInterval: 15_000,
  });

  const { data: txData } = useQuery({
    queryKey: ['transactions', activeWallet],
    queryFn: () => api.getTransactions(activeWallet!, 8),
    enabled: !!activeWallet,
    refetchInterval: 15_000,
  });

  const { data: nodeWallets } = useQuery({
    queryKey: ['wallet-list'],
    queryFn: api.listWallets,
    refetchInterval: 30_000,
  });

  const { data: peersData } = useQuery({
    queryKey: ['peers'],
    queryFn: api.getPeers,
    refetchInterval: 30_000,
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <AlertCircle className="h-14 w-14 text-destructive" />
        <h2 className="text-xl font-semibold">Sin conexión al nodo</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          No se puede conectar con el servidor ADONAI. Verifica que el nodo esté ejecutándose.
        </p>
        <Button asChild variant="outline">
          <Link href="/settings">Configurar nodo</Link>
        </Button>
      </div>
    );
  }

  // Compute mediantime diff (approximate block time from last two blocks)
  // verificationprogress is already on stats.blockchain
  const syncPct = stats ? (stats.blockchain.verificationprogress * 100).toFixed(1) : '—';
  const chainName = stats?.blockchain.chain ?? '—';

  const isEs = locale === 'es';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Red ADONAI · Bloque #{stats?.blockchain.blocks.toLocaleString() ?? '...'}
        </p>
      </div>

      {/* Balance Hero */}
      {activeWallet ? (
        <>
          <div className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-card border border-primary/30 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Wallet size={14} />
                  <span>{walletData?.resolvedWallet ?? activeWallet}</span>
                </div>
                <div className="text-5xl font-bold tracking-tight text-primary">
                  {walletData ? formatAdo(walletData.balance) : (
                    <span className="opacity-30">— ADO</span>
                  )}
                </div>
                {walletData && walletData.unconfirmed > 0 && (
                  <p className="mt-2 text-sm text-yellow-400/80">
                    + {formatAdo(walletData.unconfirmed)} {t.common.unconfirmed}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1 text-right">
                {nodeWallets?.wallets.map((w) => (
                  <span key={w} className="text-[10px] text-muted-foreground bg-secondary/50 rounded px-1.5 py-0.5">{w}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button asChild className="flex-1 h-11 text-base" size="lg">
                <Link href="/send">
                  <ArrowUpRight size={18} className="mr-1" /> {isEs ? 'Enviar' : 'Send'}
                </Link>
              </Button>
              <Button asChild variant="secondary" className="flex-1 h-11 text-base" size="lg">
                <Link href="/receive">
                  <ArrowDownLeft size={18} className="mr-1" /> {isEs ? 'Recibir' : 'Receive'}
                </Link>
              </Button>
            </div>
          </div>

          {/* "New to ADONAI?" hero — only show when balance is 0 */}
          {walletData && walletData.balance === 0 && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-center gap-4">
              <HelpCircle className="h-8 w-8 text-primary/60 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">
                  {isEs ? '¿Nuevo en ADONAI?' : 'New to ADONAI?'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isEs
                    ? 'Aprende cómo funciona la red, cómo minar y cómo enviar tus primeros ADO.'
                    : 'Learn how the network works, how to mine and how to send your first ADO.'}
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link href="/help">
                  {isEs ? 'Guía rápida' : 'Quick guide'}
                </Link>
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-primary/20 p-8 text-center">
          <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-lg">{t.dashboard.noWallet}</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {t.dashboard.noWalletDesc}
          </p>
          <Button asChild>
            <Link href="/wallet/create">{t.common.createWallet}</Link>
          </Button>
        </div>
      )}

      {/* Network Stats Grid — row 1 */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t.dashboard.network}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<Blocks size={18} className="text-blue-400" />}
            label={t.dashboard.blocks}
            value={statsLoading ? '...' : stats?.blockchain.blocks.toLocaleString() ?? '—'}
            color="blue"
            tooltip={isEs
              ? 'Número total de bloques confirmados en la cadena principal.'
              : 'Total number of confirmed blocks in the main chain.'}
          />
          <StatCard
            icon={<TrendingUp size={18} className="text-purple-400" />}
            label={t.dashboard.difficulty}
            value={statsLoading ? '...' : stats?.blockchain.difficulty.toExponential(2) ?? '—'}
            color="purple"
            tooltip={isEs
              ? 'Dificultad actual del algoritmo BLAKE3 PoW. Se ajusta cada 2016 bloques.'
              : 'Current BLAKE3 PoW difficulty. Adjusts every 2016 blocks.'}
          />
          <StatCard
            icon={<Cpu size={18} className="text-green-400" />}
            label={t.dashboard.hashrate}
            value={statsLoading ? '...' : formatHashrate(stats?.mining.networkhashps ?? 0)}
            color="green"
            tooltip={isEs
              ? 'Hashrate estimado de toda la red ADONAI (hashes por segundo).'
              : 'Estimated hashrate of the entire ADONAI network (hashes per second).'}
          />
          <StatCard
            icon={<Users size={18} className="text-orange-400" />}
            label={t.dashboard.peers}
            value={statsLoading ? '...' : stats?.network.connections.toString() ?? '—'}
            color="orange"
            tooltip={isEs
              ? 'Número de nodos conectados actualmente a este nodo en la red P2P.'
              : 'Number of nodes currently connected to this node on the P2P network.'}
          />
        </div>

        {/* Network Stats Grid — row 2 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mt-3">
          <StatCard
            icon={<Clock size={18} className="text-cyan-400" />}
            label={isEs ? 'Tiempo/bloque' : 'Block time'}
            value={statsLoading ? '...' : formatBlockTime(stats?.blockchain.mediantime, stats?.blockchain.blocks)}
            color="cyan"
            tooltip={isEs
              ? 'Tiempo medio entre bloques. El objetivo de ADONAI es ~45 segundos por bloque.'
              : 'Median time between blocks. ADONAI targets ~45 seconds per block.'}
          />
          <StatCard
            icon={<CheckCircle2 size={18} className="text-emerald-400" />}
            label={isEs ? 'Sincronía' : 'Sync'}
            value={statsLoading ? '...' : `${syncPct}%`}
            color="emerald"
            tooltip={isEs
              ? 'Porcentaje de la blockchain descargada y verificada frente a la cadena más larga conocida.'
              : 'Percentage of the blockchain downloaded and verified against the longest known chain.'}
          />
          <StatCard
            icon={<Globe size={18} className="text-sky-400" />}
            label={isEs ? 'Red' : 'Network'}
            value={statsLoading ? '...' : chainName}
            color="sky"
            tooltip={isEs
              ? 'Cadena activa. "main" es la red principal, "regtest" es la red local de pruebas.'
              : 'Active chain. "main" is mainnet, "regtest" is local test network.'}
          />
          <StatCard
            icon={<Coins size={18} className="text-yellow-400" />}
            label={isEs ? 'Recompensa' : 'Reward'}
            value="18 ADO"
            color="yellow"
            tooltip={isEs
              ? 'Recompensa actual por bloque minado. Se reduce a la mitad cada 2,803,200 bloques (~4 años).'
              : 'Current block mining reward. Halves every 2,803,200 blocks (~4 years).'}
          />
        </div>
      </div>

      {/* Node Network Visualization */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Network size={14} />
          {isEs ? 'Red de Nodos' : 'Node Network'}
        </h2>
        <NodeNetworkCard peers={peersData?.peers ?? []} isEs={isEs} />
      </div>

      {/* Recent Transactions */}
      {activeWallet && txData && txData.transactions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t.dashboard.recentTx}</CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs gap-1">
                <Link href="/transactions">
                  {t.dashboard.viewAll} <ChevronRight size={13} />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 px-4 pb-4">
            {txData.transactions.slice(0, 8).map((tx) => (
              <TxRow key={tx.txid} tx={tx} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Mining shortcut */}
      {activeWallet && (
        <Link href="/mining">
          <Card className="border-yellow-500/20 hover:border-yellow-500/40 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/15">
                <Pickaxe size={20} className="text-yellow-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{t.dashboard.miningControl}</p>
                <p className="text-xs text-muted-foreground">{t.dashboard.miningDesc}</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Sync Progress */}
      {stats && stats.blockchain.verificationprogress < 0.9999 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <div className="h-2 flex-1 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-2 rounded-full bg-yellow-500 transition-all"
                style={{ width: `${stats.blockchain.verificationprogress * 100}%` }}
              />
            </div>
            <span className="text-xs text-yellow-400 shrink-0">
              {t.dashboard.syncing} {(stats.blockchain.verificationprogress * 100).toFixed(1)}%
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── StatCard ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
  tooltip,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'cyan' | 'emerald' | 'sky' | 'yellow';
  tooltip?: string;
}) {
  const [open, setOpen] = useState(false);
  const bg = {
    blue: 'bg-blue-500/10',
    purple: 'bg-purple-500/10',
    green: 'bg-green-500/10',
    orange: 'bg-orange-500/10',
    cyan: 'bg-cyan-500/10',
    emerald: 'bg-emerald-500/10',
    sky: 'bg-sky-500/10',
    yellow: 'bg-yellow-500/10',
  }[color];

  return (
    <Card>
      <CardContent className="p-4">
        <div className={`inline-flex rounded-lg p-2 mb-3 ${bg}`}>
          {icon}
        </div>
        <div className="flex items-center gap-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          {tooltip && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="rounded-full p-0.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors leading-none text-[11px] font-bold"
              aria-label="Más información"
            >
              ?
            </button>
          )}
        </div>
        <p className="font-mono text-sm font-bold mt-0.5">{value}</p>
        {open && tooltip && (
          <div className="mt-2 rounded-lg border border-border bg-card p-2 text-xs text-muted-foreground">
            {tooltip}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── NodeNetworkCard ──────────────────────────────────────────────────────────

function NodeNetworkCard({
  peers,
  isEs,
}: {
  peers: import('@adonai/rpc-client').PeerInfo[];
  isEs: boolean;
}) {
  if (peers.length === 0) {
    return (
      <Card className="overflow-hidden border-green-900/30 bg-[#050f0a]">
        <CardContent className="p-6">
          {/* Animated background dots */}
          <div className="relative h-32 mb-4 rounded-lg overflow-hidden bg-[#040d07] border border-green-900/20">
            <NetworkDotGrid />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-green-400 animate-pulse mb-2" />
              <p className="text-green-400/80 text-xs font-mono">
                {isEs ? 'NODO LOCAL ACTIVO' : 'LOCAL NODE ACTIVE'}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {isEs
              ? 'Solo mining node — sin peers externos conectados'
              : 'Solo mining node — no external peers connected'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-green-900/30 bg-[#050f0a]">
      <CardContent className="p-0">
        {/* Visual network header */}
        <div className="relative h-28 overflow-hidden bg-[#040d07]">
          <NetworkDotGrid />
          {/* Peer dots scattered */}
          {peers.slice(0, 8).map((peer, i) => {
            const angle = (i / Math.max(peers.length, 8)) * 2 * Math.PI;
            const r = 35;
            const cx = 50 + r * Math.cos(angle);
            const cy = 50 + r * Math.sin(angle);
            return (
              <div
                key={peer.id}
                className="absolute h-2 w-2 rounded-full bg-green-400/80"
                style={{
                  left: `${cx}%`,
                  top: `${cy}%`,
                  transform: 'translate(-50%, -50%)',
                  boxShadow: '0 0 6px 1px rgba(74,222,128,0.5)',
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            );
          })}
          {/* Center node */}
          <div
            className="absolute h-4 w-4 rounded-full bg-green-400 animate-pulse"
            style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', boxShadow: '0 0 12px 3px rgba(74,222,128,0.6)' }}
          />
          <div className="absolute top-2 right-3 text-[10px] font-mono text-green-400/60">
            {peers.length} {isEs ? 'peer(s) conectado(s)' : 'peer(s) connected'}
          </div>
        </div>

        {/* Peer list */}
        <div className="divide-y divide-green-900/20 max-h-48 overflow-y-auto">
          {peers.map((peer) => (
            <div key={peer.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="h-2 w-2 rounded-full bg-green-400 shrink-0 animate-pulse" style={{ boxShadow: '0 0 4px rgba(74,222,128,0.7)' }} />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-green-300/90 truncate">{peer.addr}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {peer.connection_type ?? peer.network ?? (peer.inbound ? 'inbound' : 'outbound')}
                  {peer.synced_blocks != null ? ` · ${isEs ? 'bloque' : 'block'} #${peer.synced_blocks.toLocaleString()}` : ''}
                </p>
              </div>
              <Badge
                variant={peer.inbound ? 'secondary' : 'outline'}
                className="text-[9px] shrink-0 border-green-900/40 text-green-400/70"
              >
                {peer.inbound ? (isEs ? 'entrante' : 'inbound') : (isEs ? 'saliente' : 'outbound')}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Simple animated dot grid for background
function NetworkDotGrid() {
  const dots = Array.from({ length: 40 });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((_, i) => {
        const x = ((i * 137.508) % 100);
        const y = ((i * 97.3) % 100);
        const delay = (i * 0.11) % 3;
        const size = i % 3 === 0 ? 'h-1 w-1' : 'h-0.5 w-0.5';
        return (
          <div
            key={i}
            className={`absolute rounded-full bg-green-500/20 ${size}`}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── TxRow ────────────────────────────────────────────────────────────────────

function TxRow({ tx }: { tx: import('@adonai/rpc-client').WalletTransaction }) {
  const isReceive = tx.amount > 0;
  const isMining = tx.category === 'generate' || tx.category === 'immature';
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-secondary/40 transition-colors">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isMining
            ? 'bg-yellow-500/20'
            : isReceive
            ? 'bg-green-500/20'
            : 'bg-red-500/20'
        }`}
      >
        {isMining ? (
          <Pickaxe size={14} className="text-yellow-400" />
        ) : isReceive ? (
          <ArrowDownLeft size={14} className="text-green-400" />
        ) : (
          <ArrowUpRight size={14} className="text-red-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-xs text-muted-foreground">
          {shortenHash(tx.txid, 8)}
        </p>
        <p className="text-xs text-muted-foreground">{formatRelativeTime(tx.time)}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold ${
          isMining ? 'text-yellow-400' : isReceive ? 'text-green-400' : 'text-red-400'
        }`}>
          {isReceive ? '+' : ''}{formatAdoShort(tx.amount)}
        </p>
        <Badge
          variant={tx.confirmations >= 6 ? 'success' : 'warning'}
          className="text-[9px] mt-0.5"
        >
          {tx.confirmations < 6 ? `${tx.confirmations} conf.` : '✓'}
        </Badge>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatHashrate(hps: number): string {
  if (hps >= 1e18) return (hps / 1e18).toFixed(1) + ' EH/s';
  if (hps >= 1e15) return (hps / 1e15).toFixed(1) + ' PH/s';
  if (hps >= 1e12) return (hps / 1e12).toFixed(1) + ' TH/s';
  if (hps >= 1e9) return (hps / 1e9).toFixed(1) + ' GH/s';
  if (hps >= 1e6) return (hps / 1e6).toFixed(1) + ' MH/s';
  if (hps >= 1e3) return (hps / 1e3).toFixed(1) + ' KH/s';
  return hps.toFixed(0) + ' H/s';
}

/**
 * Returns a human-friendly block time estimate.
 * mediantime is the Unix median timestamp of the last 11 blocks.
 * We compare it to the current time and scale by block count to get avg.
 * Fallback: show ADONAI target (45s).
 */
function formatBlockTime(mediantime: number | undefined, blocks: number | undefined): string {
  if (!mediantime || !blocks || blocks < 11) return '~45s';
  // mediantime represents the median of the last 11 blocks
  // Use a rough approximation: target is 45s
  const nowS = Math.floor(Date.now() / 1000);
  const diff = nowS - mediantime;
  if (diff <= 0 || diff > 600) return '~45s';
  return `~${diff}s`;
}
