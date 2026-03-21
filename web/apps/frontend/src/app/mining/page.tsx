'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useActiveWallet } from '@/hooks/useActiveWallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatAdo, formatDate, formatRelativeTime } from '@/lib/utils';
import { Pickaxe, TrendingUp, Clock, Coins, AlertCircle, Play, Square, Zap, HelpCircle, X, Cpu, Layers, Gift, Timer, ChevronDown, ChevronUp, Copy, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function MiningPage() {
  const activeWallet = useActiveWallet();
  const queryClient = useQueryClient();
  const [mineError, setMineError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const { data: rewards, isLoading } = useQuery({
    queryKey: ['mining-rewards', activeWallet],
    queryFn: () => api.getMiningRewards(activeWallet!, 500),
    enabled: !!activeWallet,
    refetchInterval: 15_000,
  });

  const { data: stats } = useQuery({
    queryKey: ['blockchain-stats'],
    queryFn: api.getStats,
    refetchInterval: 30_000,
  });

  const { data: minerStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['miner-status'],
    queryFn: api.getMiningStatus,
    refetchInterval: 3_000,
  });

  const startMutation = useMutation({
    mutationFn: () => api.startMining(activeWallet!),
    onSuccess: () => {
      setMineError(null);
      refetchStatus();
    },
    onError: (e: Error) => setMineError(e.message),
  });

  const stopMutation = useMutation({
    mutationFn: api.stopMining,
    onSuccess: () => {
      refetchStatus();
      queryClient.invalidateQueries({ queryKey: ['mining-rewards', activeWallet] });
      queryClient.invalidateQueries({ queryKey: ['blockchain-stats'] });
    },
  });

  const mineOneMutation = useMutation({
    mutationFn: () => api.mineBlocks(activeWallet!, 1),
    onSuccess: (data) => {
      setMineError(null);
      if (data.hashes.length === 0) {
        setMineError('No se encontró bloque con los intentos disponibles. Intenta de nuevo.');
      }
      queryClient.invalidateQueries({ queryKey: ['mining-rewards', activeWallet] });
      queryClient.invalidateQueries({ queryKey: ['blockchain-stats'] });
      refetchStatus();
    },
    onError: (e: Error) => setMineError(e.message),
  });

  const miningInfo = stats?.mining;

  if (!activeWallet) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">Conecta una wallet para ver las recompensas.</p>
        <Button asChild>
          <Link href="/wallet/create">Crear wallet</Link>
        </Button>
      </div>
    );
  }

  const allRewards = rewards?.rewards ?? [];
  const confirmedRewards = allRewards.filter((r) => r.category === 'generate');
  const immatureRewards  = allRewards.filter((r) => r.category === 'immature');
  const immatureTotal  = immatureRewards.reduce((s, r)  => s + r.amount, 0);
  const confirmedTotal = confirmedRewards.reduce((s, r) => s + r.amount, 0);
  const isMining = minerStatus?.active ?? false;
  const [rewardFilter, setRewardFilter] = useState<'all' | 'generate' | 'immature'>('all');
  const visibleRewards = rewardFilter === 'all' ? allRewards
    : rewardFilter === 'generate' ? confirmedRewards
    : immatureRewards;

  return (
    <div className="space-y-4 py-4">
      {/* Help Modal */}
      {showHelp && <MiningHelpModal onClose={() => setShowHelp(false)} />}

      {/* Mining Control */}
      <Card className={isMining ? 'border-green-500/40 bg-gradient-to-br from-card to-green-500/5' : ''}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Pickaxe size={14} className={isMining ? 'text-green-400 animate-pulse' : ''} />
            Control de Minado
            {isMining && (
              <Badge variant="success" className="text-[9px]">ACTIVO</Badge>
            )}
            <button
              onClick={() => setShowHelp(true)}
              className="ml-auto flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
              title="¿Qué es el minado?"
            >
              <HelpCircle size={11} />
              ¿Qué es esto?
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isMining && minerStatus && (
            <div className="rounded-lg bg-green-500/10 p-3 text-xs space-y-1">
              <p className="text-green-400 font-medium">Minando en progreso...</p>
              <p className="text-muted-foreground truncate">Dirección: {minerStatus.address}</p>
              <p className="text-muted-foreground">
                Bloques encontrados: <span className="text-green-400 font-bold">{minerStatus.blocksFound}</span>
              </p>
              {minerStatus.startedAt && (
                <p className="text-muted-foreground">
                  Iniciado: {formatRelativeTime(Math.floor(minerStatus.startedAt / 1000))}
                </p>
              )}
            </div>
          )}

          {mineError && (
            <p className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">{mineError}</p>
          )}

          <div className="flex gap-2">
            {!isMining ? (
              <Button
                className="flex-1 gap-2"
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
              >
                <Play size={14} />
                {startMutation.isPending ? 'Iniciando...' : 'Iniciar Minado Continuo'}
              </Button>
            ) : (
              <Button
                variant="destructive"
                className="flex-1 gap-2"
                onClick={() => stopMutation.mutate()}
                disabled={stopMutation.isPending}
              >
                <Square size={14} />
                {stopMutation.isPending ? 'Deteniendo...' : 'Detener Minado'}
              </Button>
            )}
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => mineOneMutation.mutate()}
              disabled={mineOneMutation.isPending || isMining}
              title="Minar un bloque (puede tardar varios minutos)"
            >
              <Zap size={14} />
              {mineOneMutation.isPending ? 'Minando...' : '1 Bloque'}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            El minado CPU puede tardar varios minutos por bloque
          </p>
        </CardContent>
      </Card>

      {/* Network Mining Stats */}
      {miningInfo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp size={14} />
              Red ADONAI
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Hashrate red</p>
              <p className="font-mono text-sm font-bold">
                {formatHashrate(miningInfo.networkhashps)}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Dificultad</p>
              <p className="font-mono text-sm font-bold">
                {miningInfo.difficulty.toExponential(3)}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Bloques minados</p>
              <p className="font-mono text-sm font-bold">
                {miningInfo.blocks.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Tx en mempool</p>
              <p className="font-mono text-sm font-bold">
                {miningInfo.pooledtx.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Rewards Summary */}
      <Card className="border-yellow-500/20 bg-gradient-to-br from-card to-yellow-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Coins size={14} className="text-yellow-400" />
            Mis recompensas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Two stat boxes side by side */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-yellow-500/10 p-3">
              <p className="text-[10px] text-muted-foreground mb-0.5">
                Confirmado · {confirmedRewards.length} bloques
              </p>
              <p className="text-lg font-bold text-yellow-400 font-mono">
                {isLoading ? '...' : formatAdo(confirmedTotal)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Gastable ahora</p>
            </div>
            <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-3">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                <Clock size={10} />
                Madurando · {immatureRewards.length} bloques
              </div>
              <p className="text-lg font-bold text-yellow-400/60 font-mono">
                {isLoading ? '...' : formatAdo(immatureTotal)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Disponible tras 100 conf.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rewards List */}
      {!isLoading && allRewards.length > 0 && (
        <div className="space-y-2">
          {/* Header + filter tabs */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Historial · {allRewards.length} bloques
            </h3>
            <div className="flex gap-1">
              {([
                ['all',      `Todos (${allRewards.length})`],
                ['generate', `✓ ${confirmedRewards.length}`],
                ['immature', `⏳ ${immatureRewards.length}`],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setRewardFilter(key)}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                    rewardFilter === key
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable list — all visible, no truncation */}
          <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
            {visibleRewards.map((tx) => (
              <RewardCard key={tx.txid + tx.category} tx={tx} />
            ))}
          </div>
        </div>
      )}

      {!isLoading && allRewards.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          <Pickaxe className="mx-auto mb-3 h-8 w-8 opacity-40" />
          No hay recompensas de minado en esta wallet
        </div>
      )}
    </div>
  );
}

function RewardCard({ tx }: { tx: import('@adonai/rpc-client').WalletTransaction }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="transition-colors hover:bg-secondary/30 overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-500/20">
            <Pickaxe size={13} className="text-yellow-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant={tx.category === 'generate' ? 'success' : 'warning'} className="text-[9px]">
                {tx.category === 'generate' ? 'Confirmada' : 'Madurando'}
              </Badge>
              {tx.blockheight && (
                <span className="text-[10px] text-muted-foreground">bloque #{tx.blockheight.toLocaleString()}</span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">{formatRelativeTime(tx.time)} · {formatDate(tx.time)}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <p className="font-mono text-sm font-semibold text-yellow-400">+{formatAdo(tx.amount)}</p>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? 'Ocultar' : 'Detalles'}
              {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 space-y-2 border-t border-border pt-3">
            {/* TXID */}
            <div className="flex items-start justify-between gap-2 text-xs">
              <span className="text-muted-foreground shrink-0">TXID</span>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-mono text-[10px] break-all">{tx.txid}</span>
                <button onClick={() => handleCopy(tx.txid)} className="shrink-0 rounded p-0.5 hover:bg-secondary">
                  {copied ? <CheckCheck size={12} className="text-green-400" /> : <Copy size={12} className="text-muted-foreground" />}
                </button>
              </div>
            </div>
            {tx.address && (
              <div className="flex items-start justify-between gap-2 text-xs">
                <span className="text-muted-foreground shrink-0">Dirección</span>
                <span className="font-mono text-[10px] break-all text-right">{tx.address}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Confirmaciones</span>
              <span className="font-mono">{tx.confirmations}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MiningHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/20">
              <Pickaxe size={16} className="text-yellow-400" />
            </div>
            <h2 className="font-semibold text-base">¿Qué es el minado?</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 p-5 text-sm">

          <p className="text-muted-foreground leading-relaxed">
            Minar es el proceso por el que se crean nuevos bloques en la blockchain ADONAI
            y se generan nuevas monedas ADO como recompensa.
          </p>

          {/* Steps */}
          <div className="space-y-3">
            <HelpStep
              icon={<Cpu size={15} className="text-blue-400" />}
              color="blue"
              title="Tu CPU trabaja resolviendo un puzzle"
              desc='El ordenador calcula millones de funciones hash BLAKE3 por segundo buscando un número especial (el "nonce") que hace que el hash del bloque empiece por muchos ceros.'
            />
            <HelpStep
              icon={<Layers size={15} className="text-purple-400" />}
              color="purple"
              title="Se añade un bloque a la cadena"
              desc="Cuando se encuentra ese número, el bloque con todas las transacciones pendientes se sella y se añade permanentemente a la blockchain. Todos los nodos lo aceptan y actualizan su copia."
            />
            <HelpStep
              icon={<Gift size={15} className="text-yellow-400" />}
              color="yellow"
              title="Recibes 18 ADO de recompensa"
              desc="El protocolo crea 18 ADO nuevos y los envía automáticamente a tu dirección. Esos fondos aparecen primero como 'madurando' y se vuelven gastables tras 100 confirmaciones (~75 minutos)."
            />
            <HelpStep
              icon={<Timer size={15} className="text-green-400" />}
              color="green"
              title="Tiempo estimado por bloque"
              desc="Con un solo CPU puede tardar entre 1 y 20 minutos por bloque dependiendo de la dificultad actual de la red. Cuanta más gente mine a la vez, más difícil se vuelve."
            />
          </div>

          {/* What runs behind the scenes */}
          <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-2">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Cpu size={12} className="text-muted-foreground" />
              ¿Qué se ejecuta por detrás?
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Al pulsar <span className="font-mono bg-background rounded px-1">Iniciar Minado</span>, el servidor lanza este comando en bucle:
            </p>
            <pre className="rounded-lg bg-black/40 px-3 py-2 text-[10px] text-green-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
{`adonai-cli generatetoaddress 1 <tu_dirección> 2000000000`}
            </pre>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ese comando intenta hasta 2.000 millones de hashes para encontrar un bloque válido.
              Si no lo consigue, vuelve a empezar automáticamente. Cuando lo consigue, los ADO van
              directo a tu wallet.
            </p>
          </div>

          {/* Buttons explanation */}
          <div className="rounded-xl border border-border p-4 space-y-2.5">
            <p className="text-xs font-semibold text-foreground">Los tres botones</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex items-center gap-1 rounded bg-primary/20 px-1.5 py-0.5 text-primary text-[10px] font-medium shrink-0">
                  <Play size={9} /> Iniciar
                </span>
                <span>Minado continuo en segundo plano. El servidor sigue minando aunque cierres el navegador.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex items-center gap-1 rounded bg-destructive/20 px-1.5 py-0.5 text-destructive text-[10px] font-medium shrink-0">
                  <Square size={9} /> Detener
                </span>
                <span>Para el proceso de minado inmediatamente.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-foreground text-[10px] font-medium shrink-0">
                  <Zap size={9} /> 1 Bloque
                </span>
                <span>Intenta minar un único bloque y espera el resultado. Útil para probar sin dejar el minado corriendo.</span>
              </div>
            </div>
          </div>

        </div>

        <div className="border-t border-border px-5 py-3 text-center">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

function HelpStep({
  icon, color, title, desc,
}: {
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'yellow' | 'green';
  title: string;
  desc: string;
}) {
  const bg = { blue: 'bg-blue-500/10', purple: 'bg-purple-500/10', yellow: 'bg-yellow-500/10', green: 'bg-green-500/10' }[color];
  return (
    <div className="flex gap-3">
      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${bg}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground leading-snug">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function formatHashrate(hps: number): string {
  if (hps >= 1e18) return (hps / 1e18).toFixed(2) + ' EH/s';
  if (hps >= 1e15) return (hps / 1e15).toFixed(2) + ' PH/s';
  if (hps >= 1e12) return (hps / 1e12).toFixed(2) + ' TH/s';
  if (hps >= 1e9) return (hps / 1e9).toFixed(2) + ' GH/s';
  if (hps >= 1e6) return (hps / 1e6).toFixed(2) + ' MH/s';
  return (hps / 1e3).toFixed(2) + ' KH/s';
}
