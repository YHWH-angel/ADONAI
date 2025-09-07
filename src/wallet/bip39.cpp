#include <wallet/bip39.h>

#include <crypto/common.h>
#include <crypto/hmac_sha512.h>
#include <crypto/sha256.h>
#include <support/cleanse.h>

#include <array>
#include <cstring>
#include <sstream>
#include <vector>
#include <algorithm>

namespace {

void PBKDF2_HMAC_SHA512(const unsigned char* pass, size_t passlen,
                        const unsigned char* salt, size_t saltlen,
                        uint32_t iterations, unsigned char* out, size_t outlen)
{
    uint32_t block = 1;
    unsigned char U[64];
    unsigned char T[64];
    std::vector<unsigned char> salt_block(saltlen + 4);
    while (outlen > 0) {
        memcpy(salt_block.data(), salt, saltlen);
        WriteBE32(salt_block.data() + saltlen, block);
        CHMAC_SHA512(pass, passlen).Write(salt_block.data(), salt_block.size()).Finalize(U);
        memcpy(T, U, 64);
        for (uint32_t i = 1; i < iterations; ++i) {
            CHMAC_SHA512(pass, passlen).Write(U, 64).Finalize(U);
            for (int j = 0; j < 64; ++j) {
                T[j] ^= U[j];
            }
        }
        size_t tocopy = std::min<size_t>(64, outlen);
        memcpy(out, T, tocopy);
        out += tocopy;
        outlen -= tocopy;
        ++block;
    }
    memory_cleanse(U, sizeof(U));
    memory_cleanse(T, sizeof(T));
    memory_cleanse(salt_block.data(), salt_block.size());
}

} // namespace

bool BIP39_ValidateMnemonic(const std::string& mnemonic, const std::vector<std::string>& wordlist)
{
    std::istringstream ss(mnemonic);
    std::vector<std::string> words;
    for (std::string word; ss >> word;) {
        words.push_back(word);
    }
    const size_t words_len = words.size();
    if (words_len % 3 != 0 || words_len < 12 || words_len > 24) {
        for (auto& w : words) memory_cleanse(w.data(), w.size());
        return false;
    }
    std::vector<int> indices;
    indices.reserve(words_len);
    for (const auto& w : words) {
        auto it = std::find(wordlist.begin(), wordlist.end(), w);
        if (it == wordlist.end()) {
            for (auto& ww : words) memory_cleanse(ww.data(), ww.size());
            memory_cleanse(indices.data(), indices.size() * sizeof(int));
            return false;
        }
        indices.push_back(it - wordlist.begin());
    }
    std::vector<uint8_t> bits(words_len * 11);
    for (size_t i = 0; i < indices.size(); ++i) {
        for (int j = 0; j < 11; ++j) {
            bits[i * 11 + (10 - j)] = (indices[i] >> j) & 1;
        }
    }
    const size_t checksum_bits = words_len / 3;
    const size_t entropy_bits = words_len * 11 - checksum_bits;
    std::vector<uint8_t> entropy(entropy_bits / 8);
    for (size_t i = 0; i < entropy_bits; ++i) {
        entropy[i / 8] = (entropy[i / 8] << 1) | bits[i];
    }
    unsigned char hash[CSHA256::OUTPUT_SIZE];
    CSHA256().Write(entropy.data(), entropy.size()).Finalize(hash);
    for (size_t i = 0; i < checksum_bits; ++i) {
        uint8_t bit = (hash[i / 8] >> (7 - (i % 8))) & 1;
        if (bits[entropy_bits + i] != bit) {
            memory_cleanse(entropy.data(), entropy.size());
            memory_cleanse(hash, sizeof(hash));
            for (auto& ww : words) memory_cleanse(ww.data(), ww.size());
            memory_cleanse(indices.data(), indices.size() * sizeof(int));
            memory_cleanse(bits.data(), bits.size());
            return false;
        }
    }
    memory_cleanse(entropy.data(), entropy.size());
    memory_cleanse(hash, sizeof(hash));
    for (auto& ww : words) memory_cleanse(ww.data(), ww.size());
    memory_cleanse(indices.data(), indices.size() * sizeof(int));
    memory_cleanse(bits.data(), bits.size());
    return true;
}

std::vector<uint8_t> BIP39_MnemonicToSeed(const std::string& mnemonic, const std::string& passphrase)
{
    std::string salt = std::string("mnemonic") + passphrase;
    std::vector<uint8_t> salt_bytes(salt.begin(), salt.end());
    std::vector<uint8_t> mnemonic_bytes(mnemonic.begin(), mnemonic.end());
    std::vector<uint8_t> seed(64);
    PBKDF2_HMAC_SHA512(mnemonic_bytes.data(), mnemonic_bytes.size(),
                       salt_bytes.data(), salt_bytes.size(), 2048,
                       seed.data(), seed.size());
    memory_cleanse(salt.data(), salt.size());
    memory_cleanse(salt_bytes.data(), salt_bytes.size());
    memory_cleanse(mnemonic_bytes.data(), mnemonic_bytes.size());
    return seed;
}
