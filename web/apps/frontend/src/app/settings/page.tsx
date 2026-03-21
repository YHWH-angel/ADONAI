'use client';

import { useState } from 'react';
import { useWalletStore, PUBLIC_NODE, DEFAULT_NODE } from '@/store/wallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Server,
  Wallet,
  Globe,
  HardDrive,
  Shield,
  Trash2,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const {
    activeWallet,
    walletMode,
    usePublicNode,
    nodeConfig,
    setUsePublicNode,
    setNodeConfig,
    clearWallet,
  } = useWalletStore();

  const [customApiUrl, setCustomApiUrl] = useState(nodeConfig.apiUrl);
  const [customWsUrl, setCustomWsUrl] = useState(nodeConfig.wsUrl);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => fetch(nodeConfig.apiUrl.replace('/api/v1', '') + '/health').then((r) => r.json()) as Promise<{ status: string; nodeUptime?: number }>,
    refetchInterval: 30_000,
    retry: 1,
  });

  const handleSaveCustomNode = () => {
    setNodeConfig({
      apiUrl: customApiUrl,
      wsUrl: customWsUrl,
      label: 'Nodo personalizado',
    });
    setUsePublicNode(false);
  };

  return (
    <div className="space-y-4 py-4">
      {/* Wallet Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Wallet size={14} />
            Wallet activa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeWallet ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm">{activeWallet}</span>
                <Badge variant={walletMode === 'hd' ? 'success' : 'secondary'}>
                  {walletMode === 'hd' ? 'HD (sin custodia)' : 'Nodo'}
                </Badge>
              </div>
              {walletMode === 'hd' && (
                <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-xs text-green-400">
                  <Shield size={12} />
                  Claves guardadas localmente. El servidor no tiene acceso.
                </div>
              )}
              {!showClearConfirm ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => setShowClearConfirm(true)}
                >
                  <Trash2 size={13} /> Eliminar wallet de este dispositivo
                </Button>
              ) : (
                <div className="space-y-2 rounded-lg border border-destructive/30 p-3">
                  <p className="text-xs text-destructive">
                    ¿Seguro? Sin copia de seguridad perderás acceso.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => { clearWallet(); setShowClearConfirm(false); }}
                    >
                      Eliminar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowClearConfirm(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sin wallet</span>
              <Button size="sm" asChild>
                <a href="/wallet/create">
                  Crear <ChevronRight size={12} />
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Node Connection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Server size={14} />
            Conexión al nodo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Node status */}
          <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
            <div>
              <p className="text-xs font-medium">{nodeConfig.label}</p>
              <p className="font-mono text-[10px] text-muted-foreground">
                {nodeConfig.apiUrl}
              </p>
            </div>
            {health?.status === 'ok' ? (
              <CheckCircle2 size={14} className="text-green-400" />
            ) : (
              <div className="h-2 w-2 rounded-full bg-destructive" />
            )}
          </div>

          {/* Public vs custom toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setUsePublicNode(true)}
              className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-colors ${
                usePublicNode
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-border/80'
              }`}
            >
              <Globe size={14} className={usePublicNode ? 'text-primary' : 'text-muted-foreground'} />
              <div>
                <p className="text-xs font-medium">Servidor público</p>
                <p className="text-[10px] text-muted-foreground">ADONAI oficial</p>
              </div>
            </button>
            <button
              onClick={() => setUsePublicNode(false)}
              className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-colors ${
                !usePublicNode
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-border/80'
              }`}
            >
              <HardDrive size={14} className={!usePublicNode ? 'text-primary' : 'text-muted-foreground'} />
              <div>
                <p className="text-xs font-medium">Nodo propio</p>
                <p className="text-[10px] text-muted-foreground">Máxima privacidad</p>
              </div>
            </button>
          </div>

          {/* Custom node config */}
          {!usePublicNode && (
            <div className="space-y-2 border-t border-border pt-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">URL API</label>
                <Input
                  className="font-mono text-xs"
                  placeholder="http://192.168.1.100:3001/api/v1"
                  value={customApiUrl}
                  onChange={(e) => setCustomApiUrl(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">URL WebSocket</label>
                <Input
                  className="font-mono text-xs"
                  placeholder="ws://192.168.1.100:3001/ws"
                  value={customWsUrl}
                  onChange={(e) => setCustomWsUrl(e.target.value)}
                />
              </div>
              <Button size="sm" className="w-full" onClick={handleSaveCustomNode}>
                Guardar configuración
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardContent className="space-y-1 p-4 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>ADONAI Wallet</span>
            <span>v0.1.0</span>
          </div>
          <div className="flex justify-between">
            <span>Red</span>
            <span className="font-mono">mainnet</span>
          </div>
          <div className="flex justify-between">
            <span>Tiempo de bloque</span>
            <span>~45 seg</span>
          </div>
          <div className="flex justify-between">
            <span>Suministro máximo</span>
            <span>100,915,200 ADO</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
