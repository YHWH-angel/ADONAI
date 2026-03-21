'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WalletMode = 'hd' | 'node';

export interface NodeConfig {
  apiUrl: string;
  wsUrl: string;
  label: string;
}

export const DEFAULT_NODE: NodeConfig = {
  apiUrl: 'http://localhost:3001/api/v1',
  wsUrl: 'ws://localhost:3001/ws',
  label: 'Nodo propio',
};

export const PUBLIC_NODE: NodeConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001/ws',
  label: 'Servidor público ADONAI',
};

interface WalletState {
  // Active wallet
  activeWallet: string | null;
  walletMode: WalletMode;

  // HD wallet (client-side keys)
  mnemonic: string | null;         // Only in memory, never persisted
  encryptedMnemonic: string | null; // Persisted (AES-encrypted)
  addresses: string[];

  // Node connection
  nodeConfig: NodeConfig;
  usePublicNode: boolean;

  // Actions
  setActiveWallet: (name: string | null) => void;
  setMnemonic: (mnemonic: string | null) => void;
  setEncryptedMnemonic: (enc: string | null) => void;
  addAddress: (address: string) => void;
  setNodeConfig: (config: NodeConfig) => void;
  setUsePublicNode: (value: boolean) => void;
  setWalletMode: (mode: WalletMode) => void;
  clearWallet: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      activeWallet: null,
      walletMode: 'node',
      mnemonic: null,
      encryptedMnemonic: null,
      addresses: [],
      nodeConfig: PUBLIC_NODE,
      usePublicNode: true,

      setActiveWallet: (name) => set({ activeWallet: name }),
      setMnemonic: (mnemonic) => set({ mnemonic }),
      setEncryptedMnemonic: (enc) => set({ encryptedMnemonic: enc }),
      addAddress: (address) =>
        set((s) => ({ addresses: [...new Set([...s.addresses, address])] })),
      setNodeConfig: (config) => set({ nodeConfig: config }),
      setUsePublicNode: (value) =>
        set({ usePublicNode: value, nodeConfig: value ? PUBLIC_NODE : DEFAULT_NODE }),
      setWalletMode: (mode) => set({ walletMode: mode }),
      clearWallet: () =>
        set({
          activeWallet: null,
          mnemonic: null,
          encryptedMnemonic: null,
          addresses: [],
        }),
    }),
    {
      name: 'adonai-wallet',
      // Never persist the plaintext mnemonic
      partialize: (state) => ({
        activeWallet: state.activeWallet,
        walletMode: state.walletMode,
        encryptedMnemonic: state.encryptedMnemonic,
        addresses: state.addresses,
        nodeConfig: state.nodeConfig,
        usePublicNode: state.usePublicNode,
      }),
    }
  )
);
