'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  getDescriptors,
  parseDescPath,
  generateMnemonic,
  validateMnemonic,
  encryptMnemonic,
  decryptMnemonic,
} from '@/lib/wallet-core';
import { useLightWalletStore } from '@/store/lightWallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Wallet,
  ShieldCheck,
  Eye,
  EyeOff,
  Plus,
  Lock,
  Unlock,
} from 'lucide-react';
import type { LightUTXO } from '@/lib/wallet-core';
import type { ScannedUTXO } from '@adonai/rpc-client';

const SESSION_KEY = 'adonai-light-session';

type ActiveTab = 'import' | 'create';
type CreateStep = 'show' | 'save-session';
type ImportStep = 'input' | 'save-session';

function getStoredSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function storeSession(encrypted: string) {
  try {
    localStorage.setItem(SESSION_KEY, encrypted);
  } catch {
    // ignore
  }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export default function LightConnectPage() {
  const router = useRouter();
  const { setWallet, setScanResult, setWalletId } = useLightWalletStore();

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<ActiveTab>('import');

  // ── Import flow ───────────────────────────────────────────────────────────
  const [importMnemonic, setImportMnemonic] = useState('');
  const [importStep, setImportStep] = useState<ImportStep>('input');
  const importWords = importMnemonic.trim().split(/\s+/).filter(Boolean);
  const importIsValid = validateMnemonic(importMnemonic);

  // ── Create flow ───────────────────────────────────────────────────────────
  const [newMnemonic, setNewMnemonic] = useState('');
  const [savedChecked, setSavedChecked] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>('show');

  // Generate mnemonic once when tab becomes 'create'
  useEffect(() => {
    if (tab === 'create' && !newMnemonic) {
      setNewMnemonic(generateMnemonic(24));
    }
  }, [tab, newMnemonic]);

  // ── Save-session form (shared) ────────────────────────────────────────────
  const [savePassword, setSavePassword] = useState('');
  const [savePasswordConfirm, setSavePasswordConfirm] = useState('');
  const [showSavePassword, setShowSavePassword] = useState(false);
  const [savingSession, setSavingSession] = useState(false);

  // ── Stored session unlock ─────────────────────────────────────────────────
  const [storedSession, setStoredSession] = useState<string | null>(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [showUnlockPassword, setShowUnlockPassword] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    setStoredSession(getStoredSession());
  }, []);

  // ── Scanning / errors ─────────────────────────────────────────────────────
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  // ── Core connect logic ────────────────────────────────────────────────────
  async function connectWithMnemonic(mnemonic: string) {
    setError('');
    setScanning(true);
    try {
      const { xpub } = getDescriptors(mnemonic.trim());
      const scanResult = await api.lightScan(xpub);

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

      const receiveIndices = utxos.filter((u) => !u.isChange).map((u) => u.index);
      const receiveIndex = receiveIndices.length > 0 ? Math.max(...receiveIndices) + 1 : 0;
      const changeIndices = utxos.filter((u) => u.isChange).map((u) => u.index);
      const changeIndex = changeIndices.length > 0 ? Math.max(...changeIndices) + 1 : 0;

      setWallet(mnemonic.trim(), xpub);
      setScanResult(scanResult.balance, utxos, scanResult.height, receiveIndex, changeIndex);

      // Fire-and-forget: create watch-only descriptor wallet on the node for tx history
      api.lightImport(xpub).then((res) => setWalletId(res.walletId)).catch(() => { /* non-fatal */ });

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar');
      return false;
    } finally {
      setScanning(false);
    }
  }

  // ── Session save helper ───────────────────────────────────────────────────
  async function handleSaveAndRedirect(mnemonic: string) {
    if (!savePassword) {
      // Skip saving — just redirect
      router.push('/light/wallet');
      return;
    }
    if (savePassword !== savePasswordConfirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setError('');
    setSavingSession(true);
    try {
      const encrypted = await encryptMnemonic(mnemonic, savePassword);
      storeSession(encrypted);
    } catch {
      // Non-fatal — still redirect
    } finally {
      setSavingSession(false);
    }
    router.push('/light/wallet');
  }

  // ── Import handlers ───────────────────────────────────────────────────────
  async function handleImportConnect() {
    const ok = await connectWithMnemonic(importMnemonic);
    if (ok) {
      setImportMnemonic('');
      setImportStep('save-session');
    }
  }

  // ── Create handlers ───────────────────────────────────────────────────────
  async function handleCreateContinue() {
    const ok = await connectWithMnemonic(newMnemonic);
    if (ok) {
      setCreateStep('save-session');
    }
  }

  // ── Unlock session ────────────────────────────────────────────────────────
  async function handleUnlock() {
    if (!storedSession) return;
    setUnlockError('');
    setUnlocking(true);
    try {
      const mnemonic = await decryptMnemonic(storedSession, unlockPassword);
      const ok = await connectWithMnemonic(mnemonic);
      if (ok) router.push('/light/wallet');
    } catch {
      setUnlockError('Contraseña incorrecta');
    } finally {
      setUnlocking(false);
    }
  }

  function handleForgetSession() {
    clearSession();
    setStoredSession(null);
    setUnlockPassword('');
    setUnlockError('');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const activeMnemonic = tab === 'create' ? newMnemonic : importMnemonic;
  const isSaveSession =
    (tab === 'import' && importStep === 'save-session') ||
    (tab === 'create' && createStep === 'save-session');

  return (
    <div className="max-w-md mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
          <Wallet size={28} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Wallet ligera</h1>
        <p className="text-sm text-muted-foreground">
          Accede a tu wallet sin necesidad de un nodo propio.
          Las claves privadas <strong>nunca salen del navegador</strong>.
        </p>
      </div>

      {/* Security note */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-3 px-4 flex gap-3 items-start text-xs text-muted-foreground">
          <ShieldCheck size={16} className="text-primary shrink-0 mt-0.5" />
          <p>
            Las palabras semilla se usan solo para derivar las claves en tu dispositivo.
            No se envían al servidor.
          </p>
        </CardContent>
      </Card>

      {/* Stored session banner */}
      {storedSession && !isSaveSession && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lock size={15} className="text-amber-500" />
              Sesión guardada encontrada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Introduce tu contraseña para desbloquear la sesión cifrada.
            </p>
            <div className="relative">
              <Input
                type={showUnlockPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowUnlockPassword((v) => !v)}
                tabIndex={-1}
              >
                {showUnlockPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {unlockError && (
              <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
                {unlockError}
              </p>
            )}
            {error && (
              <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleUnlock}
                disabled={!unlockPassword || unlocking || scanning}
              >
                {unlocking || scanning ? (
                  <><Loader2 size={14} className="animate-spin" /> Desbloqueando...</>
                ) : (
                  <><Unlock size={14} /> Desbloquear</>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleForgetSession}>
                Olvidar sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save session step (after successful scan) */}
      {isSaveSession && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock size={16} />
              Guardar sesión cifrada (opcional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Puedes guardar tu wallet cifrada en este dispositivo para no tener que
              introducir las palabras cada vez. Se cifra con AES-256-GCM antes de guardarse.
            </p>
            <div className="relative">
              <Input
                type={showSavePassword ? 'text' : 'password'}
                placeholder="Contraseña para cifrar (dejar vacío para omitir)"
                value={savePassword}
                onChange={(e) => setSavePassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowSavePassword((v) => !v)}
                tabIndex={-1}
              >
                {showSavePassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {savePassword && (
              <Input
                type={showSavePassword ? 'text' : 'password'}
                placeholder="Confirmar contraseña"
                value={savePasswordConfirm}
                onChange={(e) => setSavePasswordConfirm(e.target.value)}
                autoComplete="new-password"
              />
            )}
            {error && (
              <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => handleSaveAndRedirect(activeMnemonic)}
                disabled={savingSession || (!!savePassword && savePassword !== savePasswordConfirm)}
              >
                {savingSession ? (
                  <><Loader2 size={14} className="animate-spin" /> Guardando...</>
                ) : savePassword ? (
                  <><Lock size={14} /> Guardar y continuar</>
                ) : (
                  <><Unlock size={14} /> Continuar sin guardar</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main card — hidden once we're in save-session step */}
      {!isSaveSession && (
        <Card>
          {/* Tab bar */}
          <div className="flex border-b border-border">
            <button
              type="button"
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                tab === 'import'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => { setTab('import'); setError(''); }}
            >
              <Eye size={14} />
              Importar wallet
            </button>
            <button
              type="button"
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                tab === 'create'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => { setTab('create'); setError(''); }}
            >
              <Plus size={14} />
              Crear nueva wallet
            </button>
          </div>

          <CardContent className="pt-4 space-y-4">
            {/* ── IMPORT TAB ── */}
            {tab === 'import' && (
              <>
                <textarea
                  className="w-full min-h-[120px] rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                  placeholder="palabra1 palabra2 palabra3 ... (12 o 24 palabras)"
                  value={importMnemonic}
                  onChange={(e) => setImportMnemonic(e.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{importWords.length} palabras</span>
                  {importWords.length >= 12 && (
                    <span className={importIsValid ? 'text-green-400' : 'text-destructive'}>
                      {importIsValid ? '✓ Válida' : '✗ No válida'}
                    </span>
                  )}
                </div>
                {error && (
                  <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">{error}</p>
                )}
                <Button
                  className="w-full"
                  disabled={!importIsValid || scanning}
                  onClick={handleImportConnect}
                  size="lg"
                >
                  {scanning ? (
                    <><Loader2 size={16} className="animate-spin" /> Escaneando UTXO...</>
                  ) : (
                    <><Wallet size={16} /> Conectar wallet</>
                  )}
                </Button>
              </>
            )}

            {/* ── CREATE TAB ── */}
            {tab === 'create' && (
              <>
                <p className="text-xs text-muted-foreground">
                  Se ha generado una nueva wallet. Anota estas 24 palabras en un lugar seguro
                  — son la <strong>única forma</strong> de recuperar tus fondos.
                </p>

                {/* Mnemonic grid */}
                {newMnemonic && (
                  <div className="grid grid-cols-3 gap-1.5 select-none">
                    {newMnemonic.split(' ').map((word, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-1.5 text-xs font-mono"
                      >
                        <span className="text-muted-foreground w-4 shrink-0 text-right">
                          {i + 1}.
                        </span>
                        <span className="font-medium">{word}</span>
                      </div>
                    ))}
                  </div>
                )}

                <label className="flex items-start gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-primary"
                    checked={savedChecked}
                    onChange={(e) => setSavedChecked(e.target.checked)}
                  />
                  <span>He guardado mis palabras en un lugar seguro</span>
                </label>

                {error && (
                  <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">{error}</p>
                )}

                <Button
                  className="w-full"
                  disabled={!savedChecked || scanning}
                  onClick={handleCreateContinue}
                  size="lg"
                >
                  {scanning ? (
                    <><Loader2 size={16} className="animate-spin" /> Escaneando UTXO...</>
                  ) : (
                    <><Wallet size={16} /> Continuar</>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
