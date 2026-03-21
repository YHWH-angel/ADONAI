'use client';

import { LOCALES } from '@/lib/i18n';
import { useLocaleStore } from '@/hooks/useLocale';
import { cn } from '@/lib/utils';

export function LangSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useLocaleStore();

  return (
    <div className="flex items-center gap-1">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLocale(l.code)}
          title={l.label}
          className={cn(
            'rounded-md px-1.5 py-0.5 text-sm transition-colors',
            locale === l.code
              ? 'bg-primary/20 ring-1 ring-primary/40'
              : 'opacity-50 hover:opacity-80'
          )}
        >
          {l.flag}
          {!compact && (
            <span className="ml-1 text-[10px] font-medium text-muted-foreground">
              {l.code.toUpperCase()}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
