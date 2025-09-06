#ifndef ADONAI_WALLET_BIP32_H
#define ADONAI_WALLET_BIP32_H

#include <array>
#include <string>
#include <vector>

#include <key.h>
#include <pubkey.h>

struct BIP32Root {
    CKey master_key;
    std::array<unsigned char, 32> chain_code;
    uint32_t fingerprint;
};

BIP32Root BIP32_FromSeed(const std::vector<uint8_t>& seed);
bool BIP32_Derive(const BIP32Root& root, const std::string& path, CKey& out_priv, CPubKey& out_pub);

#endif // ADONAI_WALLET_BIP32_H
