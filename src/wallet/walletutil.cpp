// Copyright (c) 2017-2022 The Bitcoin Core developers
// Modifications (c) 2025 The Adonai Core developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

#include <wallet/walletutil.h>

#include <chainparams.h>
#include <common/args.h>
#include <key_io.h>
#include <logging.h>
#include <support/cleanse.h>
#include <util/time.h>
#include <sync.h>

#include <wallet/bip39.h>
#include <wallet/bip32.h>
#include <wallet/wordlist_en.h>
#include <wallet/wallet.h>
#include <wallet/scriptpubkeyman.h>
#include <wallet/context.h>
#include <util/translation.h>
#include <optional>
#include <crypto/common.h>

namespace wallet {
fs::path GetWalletDir()
{
    fs::path path;

    if (gArgs.IsArgSet("-walletdir")) {
        path = gArgs.GetPathArg("-walletdir");
        if (!fs::is_directory(path)) {
            // If the path specified doesn't exist, we return the deliberately
            // invalid empty string.
            path = "";
        }
    } else {
        path = gArgs.GetDataDirNet();
        // If a wallets directory exists, use that, otherwise default to GetDataDir
        if (fs::is_directory(path / "wallets")) {
            path /= "wallets";
        }
    }

    return path;
}

bool IsFeatureSupported(int wallet_version, int feature_version)
{
    return wallet_version >= feature_version;
}

WalletFeature GetClosestWalletFeature(int version)
{
    static constexpr std::array wallet_features{FEATURE_LATEST, FEATURE_PRE_SPLIT_KEYPOOL, FEATURE_NO_DEFAULT_KEY, FEATURE_HD_SPLIT, FEATURE_HD, FEATURE_COMPRPUBKEY, FEATURE_WALLETCRYPT, FEATURE_BASE};
    for (const WalletFeature& wf : wallet_features) {
        if (version >= wf) return wf;
    }
    return static_cast<WalletFeature>(0);
}

WalletDescriptor GenerateWalletDescriptor(const CExtPubKey& master_key, const OutputType& addr_type, bool internal)
{
    int64_t creation_time = GetTime();

    std::string xpub = EncodeExtPubKey(master_key);

    // Build descriptor string
    std::string desc_prefix;
    std::string desc_suffix = "/*)";
    switch (addr_type) {
    case OutputType::LEGACY: {
        desc_prefix = "pkh(" + xpub + "/44h";
        break;
    }
    case OutputType::P2SH_SEGWIT: {
        desc_prefix = "sh(wpkh(" + xpub + "/49h";
        desc_suffix += ")";
        break;
    }
    case OutputType::BECH32: {
        desc_prefix = "wpkh(" + xpub + "/84h";
        break;
    }
    case OutputType::BECH32M: {
        desc_prefix = "tr(" + xpub + "/86h";
        break;
    }
    case OutputType::UNKNOWN: {
        // We should never have a DescriptorScriptPubKeyMan for an UNKNOWN OutputType,
        // so if we get to this point something is wrong
        assert(false);
    }
    } // no default case, so the compiler can warn about missing cases
    assert(!desc_prefix.empty());

    // Mainnet derives at 0', testnet and regtest derive at 1'
    if (Params().IsTestChain()) {
        desc_prefix += "/1h";
    } else {
        desc_prefix += "/0h";
    }

    std::string internal_path = internal ? "/1" : "/0";
    std::string desc_str = desc_prefix + "/0h" + internal_path + desc_suffix;

    // Make the descriptor
    FlatSigningProvider keys;
    std::string error;
    std::vector<std::unique_ptr<Descriptor>> desc = Parse(desc_str, keys, error, false);
WalletDescriptor w_desc(std::move(desc.at(0)), creation_time, 0, 0, 0);
    return w_desc;
}

std::shared_ptr<CWallet> CreateWalletFromMnemonic(
    interfaces::Chain& chain,
    const std::string& name,
    const std::string& mnemonic,
    const std::string& passphrase,
    const std::string& derivation,
    bool /*blank*/,
    bool disable_private_keys,
    bool descriptors,
    WalletCreationStatus* out_status)
{
    if (out_status) *out_status = WalletCreationStatus::CREATION_FAILED;

    std::vector<std::string> wordlist(std::begin(BIP39_WORDLIST_EN), std::end(BIP39_WORDLIST_EN));
    std::string mnemonic_copy = mnemonic;
    if (!BIP39_ValidateMnemonic(mnemonic_copy, wordlist)) {
        memory_cleanse(mnemonic_copy.data(), mnemonic_copy.size());
        if (out_status) *out_status = WalletCreationStatus::MNEMONIC_INVALID;
        return nullptr;
    }

    std::vector<uint8_t> seed = BIP39_MnemonicToSeed(mnemonic_copy, passphrase);
    memory_cleanse(mnemonic_copy.data(), mnemonic_copy.size());

    BIP32Root root = BIP32_FromSeed(seed);
    memory_cleanse(seed.data(), seed.size());

    CExtKey master_ext;
    master_ext.key = root.master_key;
    std::copy(root.chain_code.begin(), root.chain_code.end(), master_ext.chaincode.begin());
    master_ext.nDepth = 0;
    master_ext.nChild = 0;
    WriteBE32(master_ext.vchFingerprint, root.fingerprint);

    WalletContext context;
    context.chain = &chain;
    context.args = &gArgs;

    DatabaseOptions options;
    options.require_format = DatabaseFormat::SQLITE;
    uint64_t flags = descriptors ? static_cast<uint64_t>(WALLET_FLAG_DESCRIPTORS) : uint64_t{0};
    if (disable_private_keys) flags |= WALLET_FLAG_DISABLE_PRIVATE_KEYS;
    flags |= WALLET_FLAG_BLANK_WALLET;
    options.create_flags = flags;

    DatabaseStatus status;
    bilingual_str error;
    std::vector<bilingual_str> warnings;
    std::shared_ptr<CWallet> wallet = CreateWallet(context, name, /*load_on_start=*/std::nullopt, options, status, error, warnings);
    if (!wallet) {
        return nullptr;
    }

    bool ok = true;
    {
        LOCK(wallet->cs_wallet);
        ok = RunWithinTxn(wallet->GetDatabase(), /*process_desc=*/"import descriptors", [&](WalletBatch& batch) EXCLUSIVE_LOCKS_REQUIRED(wallet->cs_wallet) {
            std::string key_str = disable_private_keys ? EncodeExtPubKey(master_ext.Neuter()) : EncodeExtKey(master_ext);
            std::string path = derivation.size() > 0 && derivation[0] == 'm' ? derivation.substr(1) : derivation;
            for (bool internal : {false, true}) {
                std::string desc = "wpkh(" + key_str + path + "/" + (internal ? "1" : "0") + "/*)";
                FlatSigningProvider keys;
                std::string desc_error;
                auto descs = Parse(desc, keys, desc_error, false);
                if (descs.empty()) return false;
                WalletDescriptor w_desc(std::move(descs[0]), GetTime(), 0, 0, 0);
                DescriptorScriptPubKeyMan& spk_manager = wallet->LoadDescriptorScriptPubKeyMan(w_desc.id, w_desc);
                if (!disable_private_keys) {
                    spk_manager.AddDescriptorKey(master_ext.key, master_ext.key.GetPubKey());
                }
                if (!batch.WriteDescriptor(spk_manager.GetID(), w_desc)) return false;
                wallet->AddActiveScriptPubKeyMan(w_desc.id, OutputType::BECH32, internal);
            }
            return true;
        });
    }

    if (!ok) {
        return nullptr;
    }

    wallet->UnsetWalletFlag(WALLET_FLAG_BLANK_WALLET);
    wallet->TopUpKeyPool();

    if (out_status) *out_status = WalletCreationStatus::SUCCESS;
    return wallet;
}

} // namespace wallet
