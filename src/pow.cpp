// Copyright (c) 2009-2010 Satoshi Nakamoto
// Copyright (c) 2009-2022 The Bitcoin Core developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

#include <pow.h>
#include <serialize.h>
#include <streams.h>
#include <arith_uint256.h>
#include <chain.h>
#include <consensus/params.h>
#include <blake3/blake3.h>  // Asegúrate de tener esta cabecera
#include <primitives/block.h>
#include <uint256.h>
#include <protocol.h>
#include <optional>

static uint256 Blake3Hash(const CBlockHeader& block)
{
    std::vector<unsigned char> data;
    VectorWriter stream(data, 0);
    stream << block;

    uint8_t hash[32];
    blake3_hasher hasher;
    blake3_hasher_init(&hasher);
    blake3_hasher_update(&hasher, data.data(), data.size());
    blake3_hasher_finalize(&hasher, hash, 32);

    return uint256(std::span<const unsigned char>(hash, 32));
}

unsigned int GetNextWorkRequired(const CBlockIndex* pindexLast, const CBlockHeader* pblock, const Consensus::Params& params)
{
    if (params.fPowNoRetargeting)
        return pindexLast->nBits;

    // Elige aquí el algoritmo de ajuste de dificultad que uses (Bitcoin usa uno cada 2016 bloques)
    return CalculateNextWorkRequired(pindexLast, pblock->GetBlockTime(), params);
}

unsigned int CalculateNextWorkRequired(const CBlockIndex* pindexLast, int64_t nFirstBlockTime, const Consensus::Params& params)
{
    // Regla de dificultad fija para testnet y BLAKE3
    // 0x207fffff corresponde a la dificultad más baja (es decir, target más alto posible)
    return 0x207fffff;
}

bool CheckProofOfWork(uint256 hash, unsigned int nBits, const Consensus::Params& params)
{
    arith_uint256 bnTarget;
    bool fNegative;
    bool fOverflow;

    bnTarget.SetCompact(nBits, &fNegative, &fOverflow);

    // Verificación estándar del target
    if (fNegative || bnTarget == 0 || fOverflow || UintToArith256(hash) > bnTarget)
        return false;

    return true;
}

bool CheckProofOfWork(const CBlockHeader& block, const Consensus::Params& params)
{
    // Usa BLAKE3 como PoW
    uint256 hash = Blake3Hash(block);

    return CheckProofOfWork(hash, block.nBits, params);
}

std::optional<arith_uint256> DeriveTarget(unsigned int nBits, const uint256 pow_limit)
{
    bool fNegative;
    bool fOverflow;
    arith_uint256 target;

    target.SetCompact(nBits, &fNegative, &fOverflow);

    if (fNegative || target == 0 || fOverflow || target > UintToArith256(pow_limit)) {
        return std::nullopt;
    }

    return target;
}

// Permite como máximo un cambio de dificultad de 4x hacia arriba o hacia abajo
bool PermittedDifficultyTransition(const Consensus::Params& params, long height, unsigned int oldBits, unsigned int newBits)
{
    // Si estás en los primeros bloques (ej. génesis), permite todo
    if (height < 1) return true;

    arith_uint256 old_target;
    arith_uint256 new_target;

    bool overflow1 = false;
    bool overflow2 = false;

    old_target.SetCompact(oldBits, &overflow1);
    new_target.SetCompact(newBits, &overflow2);

    if (overflow1 || overflow2 || old_target == 0 || new_target == 0) {
        return false;
    }

    // Permitir una transición máxima de x4 o /4
    if (new_target > old_target * 4) return false;
    if (old_target > new_target * 4) return false;

    return true;
}

