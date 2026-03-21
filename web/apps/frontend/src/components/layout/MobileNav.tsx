'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Send, Download, List, Pickaxe, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/hooks/useLocale';
import { LangSwitcher } from './LangSwitcher';

export function MobileNav() {
  const pathname = usePathname();
  const t = useT();

  const items = [
    { href: '/', icon: Home, label: t.nav.home },
    { href: '/send', icon: Send, label: t.nav.send },
    { href: '/receive', icon: Download, label: t.nav.receive },
    { href: '/transactions', icon: List, label: t.nav.transactions },
    { href: '/mining', icon: Pickaxe, label: t.nav.mining },
    { href: '/help', icon: HelpCircle, label: t.nav.help },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card lg:hidden">
      {/* Language switcher strip */}
      <div className="flex justify-end px-3 pt-1.5 pb-0">
        <LangSwitcher compact />
      </div>
      <div className="flex">
        {items.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="leading-none truncate max-w-full px-0.5">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
