#ifndef ADONAI_WALLET_BIP39_H
#define ADONAI_WALLET_BIP39_H

#include <string>
#include <vector>
#include <cstdint>

bool BIP39_ValidateMnemonic(const std::string& mnemonic, const std::vector<std::string>& wordlist);
std::vector<uint8_t> BIP39_MnemonicToSeed(const std::string& mnemonic, const std::string& passphrase);

#endif // ADONAI_WALLET_BIP39_H
