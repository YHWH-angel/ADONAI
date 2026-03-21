import { create } from 'zustand';
import type { LightUTXO } from '@/lib/wallet-core';

export interface LightWalletState {
  /** Mnemonic in memory only — NEVER persisted */
  mnemonic: string | null;
  xpub: string | null;
  balance: number;
  utxos: LightUTXO[];
  blockHeight: number;
  /** Next unused receive address index */
  receiveIndex: number;
  /** Next unused change address index */
  changeIndex: number;

  setWallet: (mnemonic: string, xpub: string) => void;
  setScanResult: (balance: number, utxos: LightUTXO[], height: number, receiveIndex: number, changeIndex: number) => void;
  clear: () => void;
}

export const useLightWalletStore = create<LightWalletState>()((set) => ({
  mnemonic: null,
  xpub: null,
  balance: 0,
  utxos: [],
  blockHeight: 0,
  receiveIndex: 0,
  changeIndex: 0,

  setWallet: (mnemonic, xpub) => set({ mnemonic, xpub }),

  setScanResult: (balance, utxos, blockHeight, receiveIndex, changeIndex) =>
    set({ balance, utxos, blockHeight, receiveIndex, changeIndex }),

  clear: () => set({
    mnemonic: null, xpub: null, balance: 0, utxos: [],
    blockHeight: 0, receiveIndex: 0, changeIndex: 0,
  }),
}));
