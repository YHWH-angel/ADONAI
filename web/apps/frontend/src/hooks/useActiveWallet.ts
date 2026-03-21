'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWalletStore } from '@/store/wallet';

/**
 * Returns the effective wallet name to use for queries.
 * Falls back to the first node wallet while Zustand is still hydrating.
 * Also auto-sets activeWallet in the store once the wallet list is available.
 */
export function useActiveWallet(): string | null {
  const { activeWallet, setActiveWallet } = useWalletStore();

  const { data: walletList } = useQuery({
    queryKey: ['wallet-list'],
    queryFn: api.listWallets,
    staleTime: 60_000,
  });

  const firstNodeWallet = walletList?.wallets?.[0] ?? null;

  // Auto-set Zustand store when it hasn't been initialised yet
  useEffect(() => {
    if (!activeWallet && firstNodeWallet) {
      setActiveWallet(firstNodeWallet);
    }
  }, [activeWallet, firstNodeWallet, setActiveWallet]);

  // Return the store value if hydrated, otherwise fall back to node's first wallet
  return activeWallet ?? firstNodeWallet;
}
