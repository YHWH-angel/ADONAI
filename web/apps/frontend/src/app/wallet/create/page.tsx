'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  generateMnemonic,
  validateMnemonic,
  encryptMnemonic,
  deriveAddress,
} from '@/lib/wallet-core';
import { useWalletStore } from '@/store/wallet';
import { useT } from '@/hooks/useLocale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  CheckCheck,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';

type Step = 'choose' | 'generate' | 'backup' | 'verify' | 'password' | 'done';

export default function CreateWalletPage() {
  const router = useRouter();
  const t = useT();
  const { setEncryptedMnemonic, setMnemonic, addAddress, setActiveWallet, setWalletMode } =
    useWalletStore();

  const [step, setStep] = useState<Step>('choose');
  const [mnemonic, setMnemonicLocal] = useState('');
  const [importMnemonic, setImportMnemonic] = useState('');
  const [verifyWords, setVerifyWords] = useState<string[]>(['', '', '']);
  const [verifyIndices] = useState([2, 7, 14]); // words to verify (0-indexed)
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'create' | 'import'>('create');

  const handleGenerate = () => {
    setMnemonicLocal(generateMnemonic(24));
    setStep('backup');
  };

  const handleCopy = async () => {
    await copyToClipboard(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const words = mnemonic.split(' ');

  const isVerifyCorrect =
    verifyWords[0] === words[verifyIndices[0]] &&
    verifyWords[1] === words[verifyIndices[1]] &&
    verifyWords[2] === words[verifyIndices[2]];

  const isPasswordValid =
    password.length >= 8 && password === passwordConfirm;

  const handleFinish = async () => {
    setIsLoading(true);
    setError('');
    try {
      const finalMnemonic = mode === 'import' ? importMnemonic.trim() : mnemonic;
      const encrypted = await encryptMnemonic(finalMnemonic, password);
      const { address } = deriveAddress(finalMnemonic, 0);

      setEncryptedMnemonic(encrypted);
      setMnemonic(finalMnemonic);
      addAddress(address);
      setWalletMode('hd');
      setActiveWallet('HD Wallet');
      setStep('done');
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : t.wallet.createError);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center gap-5 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
          <ShieldCheck className="h-8 w-8 text-green-400" />
        </div>
        <h2 className="text-xl font-bold">{t.wallet.doneTitle}</h2>
        <p className="text-sm text-muted-foreground">
          {t.wallet.doneDesc}
        </p>
        <Button size="lg" onClick={() => router.push('/')}>
          {t.wallet.goHome} <ChevronRight size={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      {/* Step: choose */}
      {step === 'choose' && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold">{t.wallet.title}</h2>
          <p className="text-sm text-muted-foreground">
            {t.wallet.titleDesc}
          </p>
          <Card
            className="cursor-pointer border-primary/30 hover:border-primary/60 transition-colors"
            onClick={() => { setMode('create'); handleGenerate(); }}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                <ShieldCheck size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{t.wallet.createNew}</p>
                <p className="text-xs text-muted-foreground">
                  {t.wallet.createNewDesc}
                </p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:border-border/80 transition-colors"
            onClick={() => { setMode('import'); setStep('backup'); }}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <RefreshCw size={18} className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{t.wallet.importExisting}</p>
                <p className="text-xs text-muted-foreground">
                  {t.wallet.importExistingDesc}
                </p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: backup (show mnemonic) */}
      {step === 'backup' && mode === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle size={16} className="text-yellow-400" />
              {t.wallet.backupTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t.wallet.backupDesc}
            </p>

            <div className="relative rounded-xl bg-secondary p-4">
              {!showMnemonic && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-secondary/95 backdrop-blur-sm">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowMnemonic(true)}
                  >
                    <Eye size={14} /> {t.wallet.showPhrase}
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                {words.map((word, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 rounded-lg bg-background/50 px-2 py-1.5"
                  >
                    <span className="w-5 text-right text-[10px] text-muted-foreground">
                      {i + 1}.
                    </span>
                    <span className="font-mono text-xs font-medium">{word}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleCopy}
              >
                {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
                {copied ? t.wallet.copied : t.wallet.copy}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMnemonic(!showMnemonic)}
              >
                {showMnemonic ? <EyeOff size={14} /> : <Eye size={14} />}
              </Button>
            </div>

            <Button
              className="w-full"
              disabled={!showMnemonic}
              onClick={() => setStep('verify')}
            >
              {t.wallet.savedPhrase} <ChevronRight size={14} />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: import */}
      {step === 'backup' && mode === 'import' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.wallet.importTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              className="w-full rounded-lg border border-input bg-secondary p-3 font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              rows={4}
              placeholder={t.wallet.importPlaceholder}
              value={importMnemonic}
              onChange={(e) => setImportMnemonic(e.target.value)}
            />
            {importMnemonic && !validateMnemonic(importMnemonic) && (
              <p className="text-xs text-destructive">{t.wallet.invalidMnemonic}</p>
            )}
            <Button
              className="w-full"
              disabled={!validateMnemonic(importMnemonic)}
              onClick={() => setStep('password')}
            >
              {t.wallet.continue} <ChevronRight size={14} />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: verify */}
      {step === 'verify' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.wallet.verifyTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t.wallet.verifyDesc}
            </p>
            {verifyIndices.map((wordIndex, i) => (
              <div key={i} className="space-y-1">
                <label className="text-sm">
                  {t.wallet.wordLabel}{wordIndex + 1}
                </label>
                <Input
                  placeholder={`${t.wallet.wordPlaceholder} ${wordIndex + 1}`}
                  value={verifyWords[i]}
                  onChange={(e) => {
                    const next = [...verifyWords];
                    next[i] = e.target.value;
                    setVerifyWords(next);
                  }}
                  className={
                    verifyWords[i] && verifyWords[i] !== words[wordIndex]
                      ? 'border-destructive/50'
                      : verifyWords[i] === words[wordIndex]
                      ? 'border-green-500/50'
                      : ''
                  }
                />
              </div>
            ))}
            <Button
              className="w-full"
              disabled={!isVerifyCorrect}
              onClick={() => setStep('password')}
            >
              {t.wallet.verified} <ChevronRight size={14} />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: password */}
      {step === 'password' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.wallet.passwordTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t.wallet.passwordDesc}
            </p>
            <div className="space-y-1.5">
              <label className="text-sm">{t.wallet.passwordLabel}</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm">{t.wallet.passwordConfirm}</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className={
                  passwordConfirm && password !== passwordConfirm
                    ? 'border-destructive/50'
                    : ''
                }
              />
            </div>
            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              className="w-full"
              disabled={!isPasswordValid || isLoading}
              onClick={handleFinish}
              size="lg"
            >
              {isLoading ? t.wallet.creating : t.wallet.createBtn}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
