#!/usr/bin/env python3
# Copyright (c) 2025 The Adonai Core developers
# Distributed under the MIT software license, see the accompanying
# file COPYING or http://www.opensource.org/licenses/mit-license.php.
"""Test restoring descriptor wallets from a BIP39 mnemonic."""

from decimal import Decimal
from test_framework.test_framework import BitcoinTestFramework
from test_framework.util import assert_equal

MNEMONIC = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"


class WalletRestoreFromMnemonicTest(BitcoinTestFramework):
    def set_test_params(self):
        self.num_nodes = 1

    def skip_test_if_missing_module(self):
        self.skip_if_no_wallet()

    def run_test(self):
        node = self.nodes[0]

        node.createwalletfrommnemonic("w1", MNEMONIC)
        w1 = node.get_wallet_rpc("w1")
        addr_ext = w1.getnewaddress()
        addr_int = w1.getrawchangeaddress()
        self.generate(node, 101, addr_ext)
        assert_equal(w1.getbalance(), Decimal("50"))

        node.createwalletfrommnemonic("w2", MNEMONIC, "", "m/84'/5353'/0'", 0, False)
        w2 = node.get_wallet_rpc("w2")
        assert_equal(w2.getnewaddress(), addr_ext)
        assert_equal(w2.getrawchangeaddress(), addr_int)
        assert_equal(w2.getbalance(), w1.getbalance())


if __name__ == '__main__':
    WalletRestoreFromMnemonicTest().main()
