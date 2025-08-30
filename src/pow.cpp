// Copyright (c) 2009-2010 Satoshi Nakamoto
// Copyright (c) 2009-2022 The Bitcoin Core developers
// Modifications (c) 2025 The Adonai Core developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

#include <pow.h>

#include <arith_uint256.h>
#include <chain.h>
#include <consensus/params.h>
#include <primitives/block.h>
#include <uint256.h>

#include <algorithm>
#include <optional>

unsigned int GetNextWorkRequired(const CBlockIndex* pindexLast, const CBlockHeader* pblock, const Consensus::Params& params)
{
    // Per-block LWMA difficulty adjustment
    if (params.fPowNoRetargeting) {
        if (pblock) {
            const_cast<CBlockHeader*>(pblock)->nBits = pindexLast->nBits;
        }
        return pindexLast->nBits;
    }

    const int64_t N = params.DifficultyAdjustmentInterval();
    const int64_t T = params.nPowTargetSpacing;

    // Not enough blocks for LWMA
    if (pindexLast == nullptr || pindexLast->nHeight + 1 <= N) {
        const unsigned int pow_limit = UintToArith256(params.powLimit).GetCompact();
        if (pblock) {
            const_cast<CBlockHeader*>(pblock)->nBits = pow_limit;
        }
        return pow_limit;
    }

    const arith_uint256 pow_limit = UintToArith256(params.powLimit);
    const int64_t k = N * (N + 1) * T / 2;

    arith_uint256 sum_target = 0;
    int64_t weighted_times = 0;
    const CBlockIndex* block = pindexLast;

    for (int64_t i = 1; i <= N; ++i) {
        if (!block->pprev) break;
        int64_t solvetime = block->GetBlockTime() - block->pprev->GetBlockTime();
        solvetime = std::clamp<int64_t>(solvetime, -6 * T, 6 * T);
        weighted_times += solvetime * i;
        arith_uint256 target;
        target.SetCompact(block->nBits);
        sum_target += target;
        block = block->pprev;
    }

    arith_uint256 avg_target = sum_target / N;
    if (weighted_times < 1) {
        weighted_times = 1;
    }
    avg_target *= static_cast<uint32_t>(weighted_times);
    avg_target /= k;

    if (avg_target > pow_limit) {
        avg_target = pow_limit;
    }

    unsigned int nBits = avg_target.GetCompact();
    if (pblock) {
        const_cast<CBlockHeader*>(pblock)->nBits = nBits;
    }
    return nBits;
}

bool CheckProofOfWork(uint256 hash, unsigned int nBits, const Consensus::Params& params)
{
    arith_uint256 bnTarget;
    bool fNegative;
    bool fOverflow;

    bnTarget.SetCompact(nBits, &fNegative, &fOverflow);

    // Standard target verification
    if (fNegative || bnTarget == 0 || fOverflow || UintToArith256(hash) > bnTarget)
        return false;

    return true;
}

bool CheckProofOfWork(const CBlockHeader& block, const Consensus::Params& params)
{
    uint256 hash = block.GetHash();
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

