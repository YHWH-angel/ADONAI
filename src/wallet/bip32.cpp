#include <wallet/bip32.h>

#include <crypto/common.h>
#include <support/cleanse.h>

#include <algorithm>
#include <cstring>
#include <sstream>

BIP32Root BIP32_FromSeed(const std::vector<uint8_t>& seed)
{
    CExtKey ext;
    ext.SetSeed(MakeByteSpan(seed));
    BIP32Root root;
    root.master_key = ext.key;
    std::copy(ext.chaincode.begin(), ext.chaincode.end(), root.chain_code.begin());
    CKeyID id = root.master_key.GetPubKey().GetID();
    root.fingerprint = ReadBE32(id.begin());
    memory_cleanse(&ext, sizeof(ext));
    return root;
}

bool BIP32_Derive(const BIP32Root& root, const std::string& path, CKey& out_priv, CPubKey& out_pub)
{
    if (path.empty() || path[0] != 'm') return false;
    CExtKey ext;
    ext.key = root.master_key;
    memcpy(ext.chaincode.begin(), root.chain_code.data(), root.chain_code.size());
    ext.nDepth = 0;
    ext.nChild = 0;
    memset(ext.vchFingerprint, 0, 4);
    size_t pos = 1;
    while (pos < path.size()) {
        if (path[pos] != '/') return false;
        ++pos;
        size_t next = path.find('/', pos);
        std::string elem = path.substr(pos, next - pos);
        bool hardened = false;
        if (!elem.empty() && (elem.back() == '\'' || elem.back() == 'h')) {
            hardened = true;
            elem.pop_back();
        }
        if (elem.empty()) return false;
        uint32_t index;
        try {
            index = static_cast<uint32_t>(std::stoul(elem));
        } catch (...) {
            return false;
        }
        if (index > 0x7fffffffU) return false;
        if (hardened) index |= 0x80000000U;
        CExtKey derived;
        if (!ext.Derive(derived, index)) {
            memory_cleanse(&derived, sizeof(derived));
            memory_cleanse(&ext, sizeof(ext));
            return false;
        }
        ext = derived;
        memory_cleanse(&derived, sizeof(derived));
        pos = (next == std::string::npos) ? path.size() : next;
    }
    out_priv = ext.key;
    out_pub = out_priv.GetPubKey();
    memory_cleanse(&ext, sizeof(ext));
    return true;
}
