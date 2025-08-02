#include <primitives/block.h>

#include <serialize.h>
#include <streams.h>
#include <span.h> // necesario para std::span en versiones sin <span>
#include <blake3/blake3.h>
#include <hash.h>
#include <tinyformat.h>

uint256 CBlockHeader::GetHash() const
{
    std::vector<unsigned char> vec;
    VectorWriter w(vec, 0);
    w << *this;

    uint8_t out[BLAKE3_OUT_LEN];
    blake3_hasher hasher;
    blake3_hasher_init(&hasher);
    blake3_hasher_update(&hasher, vec.data(), vec.size());
    blake3_hasher_finalize(&hasher, out, BLAKE3_OUT_LEN);

    return uint256(std::span<const unsigned char>(out, 32));
}

std::string CBlock::ToString() const
{
    std::stringstream s;
    s << strprintf("CBlock(hash=%s, ver=0x%08x, hashPrevBlock=%s, hashMerkleRoot=%s, nTime=%u, nBits=%08x, nNonce=%u, vtx=%u)\n",
        GetHash().ToString(),
        nVersion,
        hashPrevBlock.ToString(),
        hashMerkleRoot.ToString(),
        nTime, nBits, nNonce,
        vtx.size());
    for (const auto& tx : vtx) {
        s << "  " << tx->ToString() << "\n";
    }
    return s.str();
}
