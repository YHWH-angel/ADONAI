#include <wallet/bip39.h>
#include <wallet/bip32.h>
#include <wallet/walletutil.h>
#include <wallet/test/wallet_test_fixture.h>

#include <key_io.h>
#include <script/descriptor.h>
#include <util/strencodings.h>

#include <boost/test/unit_test.hpp>

using namespace wallet;

BOOST_AUTO_TEST_SUITE(mnemonic_tests)

BOOST_AUTO_TEST_CASE(bip39_vectors)
{
    const std::string mnemonic12 = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    auto seed12 = BIP39_MnemonicToSeed(mnemonic12, "TREZOR");
    BOOST_CHECK_EQUAL(HexStr(seed12), "c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e53495531f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04");

    const std::string mnemonic24 = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art";
    auto seed24 = BIP39_MnemonicToSeed(mnemonic24, "TREZOR");
    BOOST_CHECK_EQUAL(HexStr(seed24), "bda85446c68413707090a52022edd26a1c9462295029f2e60cd7c4f2bbd3097170af7a4d73245cafa9c3cca8d561a7c3de6f5d4a10be8ed2a5e608d68f92fcc8");
}

BOOST_AUTO_TEST_CASE(bip32_vectors)
{
    const std::string mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    auto seed = BIP39_MnemonicToSeed(mnemonic, "TREZOR");
    BIP32Root root = BIP32_FromSeed(seed);

    CExtKey ext;
    ext.key = root.master_key;
    std::copy(root.chain_code.begin(), root.chain_code.end(), ext.chaincode.begin());
    ext.nDepth = 0;
    ext.nChild = 0;
    WriteBE32(ext.vchFingerprint, root.fingerprint);

    BOOST_CHECK_EQUAL(EncodeExtKey(ext), "xprv9s21ZrQH143K3h3fDYiay8mocZ3afhfULfb5GX8kCBdno77K4HiA15Tg23wpbeF1pLfs1c5SPmYHrEpTuuRhxMwvKDwqdKiGJS9XFKzUsAF");
    BOOST_CHECK_EQUAL(EncodeExtPubKey(ext.Neuter()), "xpub661MyMwAqRbcGB88KaFbLGiYAat55APKhtWg4uYMkXAmfuSTbq2QYsn9sKJCj1YqZPafsboef4h4YbXXhNhPwMbkHTpkf3zLhx7HvFw1NDy");
    BOOST_CHECK_EQUAL(root.fingerprint, 0xb4e3f5edu);
}

BOOST_AUTO_TEST_CASE(descriptor_checksums)
{
    const std::string mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    auto seed = BIP39_MnemonicToSeed(mnemonic, "TREZOR");
    BIP32Root root = BIP32_FromSeed(seed);

    CExtKey master;
    master.key = root.master_key;
    std::copy(root.chain_code.begin(), root.chain_code.end(), master.chaincode.begin());
    master.nDepth = 0;
    master.nChild = 0;
    WriteBE32(master.vchFingerprint, root.fingerprint);
    std::string key_str = EncodeExtKey(master);

    std::string ext_desc = "wpkh(" + key_str + "/84h/5353h/0h/0/*)";
    std::string int_desc = "wpkh(" + key_str + "/84h/5353h/0h/1/*)";
    BOOST_CHECK_EQUAL(GetDescriptorChecksum(ext_desc), "ap4hn2df");
    BOOST_CHECK_EQUAL(GetDescriptorChecksum(int_desc), "v4skwla3");
}

BOOST_FIXTURE_TEST_CASE(mnemonic_roundtrip, WalletTestingSetup)
{
    const std::string mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    auto w1 = CreateWalletFromMnemonic(*m_node.chain, "w1", mnemonic, "", "m/84'/5353'/0'", /*blank=*/false, /*disable_private_keys=*/false, /*descriptors=*/true);
    BOOST_CHECK(w1);
    auto addr_ext = w1->GetNewDestination(OutputType::BECH32, "");
    BOOST_CHECK(addr_ext); 
    std::string ext1 = EncodeDestination(*addr_ext);
    auto addr_int = w1->GetNewChangeDestination(OutputType::BECH32);
    BOOST_CHECK(addr_int);
    std::string int1 = EncodeDestination(*addr_int);

    auto w2 = CreateWalletFromMnemonic(*m_node.chain, "w2", mnemonic, "", "m/84'/5353'/0'", /*blank=*/false, /*disable_private_keys=*/false, /*descriptors=*/true);
    BOOST_CHECK(w2);
    auto addr_ext2 = w2->GetNewDestination(OutputType::BECH32, "");
    BOOST_CHECK(addr_ext2);
    auto addr_int2 = w2->GetNewChangeDestination(OutputType::BECH32);
    BOOST_CHECK(addr_int2);

    BOOST_CHECK_EQUAL(ext1, EncodeDestination(*addr_ext2));
    BOOST_CHECK_EQUAL(int1, EncodeDestination(*addr_int2));
}

BOOST_AUTO_TEST_SUITE_END()
