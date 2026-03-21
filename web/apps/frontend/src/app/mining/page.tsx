'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWalletStore } from '@/store/wallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatAdo, formatDate, formatRelativeTime } from '@/lib/utils';
import { Pickaxe, TrendingUp, Clock, Coins, AlertCircle, Play, Square, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function MiningPage() {
  const { activeWallet } = useWalletStore();
  const queryClient = useQueryClient();
  const [mineError, setMineError] = useState<string | null>(null);

  const { data: rewards, isLoading } = useQuery({
    queryKey: ['mining-rewards', activeWallet],
    queryFn: () => api.getMiningRewards(activeWallet!, 200),
    enabled: !!activeWallet,
    refetchInterval: 60_000,
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

  const confirmedRewards =
    rewards?.rewards.filter((r) => r.category === 'generate') ?? [];
  const immatureRewards =
    rewards?.rewards.filter((r) => r.category === 'immature') ?? [];
  const immatureTotal = immatureRewards.reduce((s, r) => s + r.amount, 0);
  const confirmedTotal = confirmedRewards.reduce((s, r) => s + r.amount, 0);
  const isMining = minerStatus?.active ?? false;

  return (
    <div className="space-y-4 py-4">
      {/* Mining Control */}
      <Card className={isMining ? 'border-green-500/40 bg-gradient-to-br from-card to-green-500/5' : ''}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Pickaxe size={14} className={isMining ? 'text-green-400 animate-pulse' : ''} />
            Control de Minado
            {isMining && (
              <Badge variant="success" className="text-[9px]">ACTIVO</Badge>
            )}
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
          <div>
            <p className="text-xs text-muted-foreground">Total confirmado</p>
            <p className="text-2xl font-bold text-yellow-400">
              {isLoading ? '...' : formatAdo(confirmedTotal)}
            </p>
          </div>
          {immatureTotal > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-yellow-500/10 p-3">
              <div className="flex items-center gap-2 text-xs text-yellow-400">
                <Clock size={12} />
                Madurando (inmaduro)
              </div>
              <span className="font-mono text-sm font-semibold text-yellow-400">
                {formatAdo(immatureTotal)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Coins size={12} />
            <span>{confirmedRewards.length} bloques confirmados</span>
            {immatureRewards.length > 0 && (
              <span className="text-yellow-400">
                + {immatureRewards.length} madurando
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rewards List */}
      {!isLoading && rewards?.rewards && rewards.rewards.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Historial de recompensas
          </h3>
          {rewards.rewards.slice(0, 50).map((tx) => (
            <Card key={tx.txid} className="transition-colors hover:bg-secondary/30">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-500/20">
                  <Pickaxe size={13} className="text-yellow-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={tx.category === 'generate' ? 'success' : 'warning'}
                      className="text-[9px]"
                    >
                      {tx.category === 'generate' ? 'Confirmada' : 'Madurando'}
                    </Badge>
                    {tx.blockheight && (
                      <span className="text-[10px] text-muted-foreground">
                        bloque #{tx.blockheight.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {formatRelativeTime(tx.time)} · {formatDate(tx.time)}
                  </p>
                </div>
                <p className="font-mono text-sm font-semibold text-yellow-400">
                  +{formatAdo(tx.amount)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (rewards?.rewards.length ?? 0) === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          <Pickaxe className="mx-auto mb-3 h-8 w-8 opacity-40" />
          No hay recompensas de minado en esta wallet
        </div>
      )}
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
