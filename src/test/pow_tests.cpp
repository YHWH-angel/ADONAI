// Copyright (c) 2025 The Adonai Core developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

#include <chain.h>
#include <chainparams.h>
#include <pow.h>
#include <test/util/setup_common.h>
#include <util/chaintype.h>

#include <boost/test/unit_test.hpp>

BOOST_FIXTURE_TEST_SUITE(pow_tests, BasicTestingSetup)

// Simulate faster blocks (higher hash rate) and ensure difficulty increases
// and stabilizes once block intervals match the target again.
BOOST_AUTO_TEST_CASE(difficulty_converges_up)
{
    const auto chainParams = CreateChainParams(*m_node.args, ChainType::MAIN);
    const Consensus::Params& params = chainParams->GetConsensus();

    const int interval = params.DifficultyAdjustmentInterval();
    std::vector<CBlockIndex> chain(interval * 2 + 1);
    chain[0].nHeight = 0;
    chain[0].nTime = 0;
    chain[0].nBits = chainParams->GenesisBlock().nBits;

    // First interval: blocks arrive twice as fast as the target spacing.
    const int64_t fast_spacing = params.nPowTargetSpacing / 2;
    for (int i = 1; i <= interval; ++i) {
        CBlockHeader header;
        header.nTime = chain[i - 1].GetBlockTime() + fast_spacing;
        chain[i].pprev = &chain[i - 1];
        chain[i].nHeight = i;
        chain[i].nTime = header.nTime;
        chain[i].nBits = GetNextWorkRequired(&chain[i - 1], &header, params);
    }

    unsigned int first_adjust = chain[interval].nBits;
    BOOST_CHECK_LT(first_adjust, chain[0].nBits); // harder difficulty

    // Second interval: assume block production now matches the target spacing.
    for (int i = interval + 1; i < static_cast<int>(chain.size()); ++i) {
        CBlockHeader header;
        header.nTime = chain[i - 1].GetBlockTime() + params.nPowTargetSpacing;
        chain[i].pprev = &chain[i - 1];
        chain[i].nHeight = i;
        chain[i].nTime = header.nTime;
        chain[i].nBits = GetNextWorkRequired(&chain[i - 1], &header, params);
    }

    unsigned int second_adjust = chain.back().nBits;
    BOOST_CHECK_EQUAL(second_adjust, first_adjust); // converged
}

// Simulate slower blocks (lower hash rate) and ensure difficulty decreases
// and stabilizes when the interval normalizes.
BOOST_AUTO_TEST_CASE(difficulty_converges_down)
{
    const auto chainParams = CreateChainParams(*m_node.args, ChainType::MAIN);
    const Consensus::Params& params = chainParams->GetConsensus();

    const int interval = params.DifficultyAdjustmentInterval();
    std::vector<CBlockIndex> chain(interval * 2 + 1);
    chain[0].nHeight = 0;
    chain[0].nTime = 0;
    chain[0].nBits = chainParams->GenesisBlock().nBits;

    // First interval: blocks arrive at half the target rate.
    const int64_t slow_spacing = params.nPowTargetSpacing * 2;
    for (int i = 1; i <= interval; ++i) {
        CBlockHeader header;
        header.nTime = chain[i - 1].GetBlockTime() + slow_spacing;
        chain[i].pprev = &chain[i - 1];
        chain[i].nHeight = i;
        chain[i].nTime = header.nTime;
        chain[i].nBits = GetNextWorkRequired(&chain[i - 1], &header, params);
    }

    unsigned int first_adjust = chain[interval].nBits;
    BOOST_CHECK_GT(first_adjust, chain[0].nBits); // easier difficulty

    // Second interval with normal spacing.
    for (int i = interval + 1; i < static_cast<int>(chain.size()); ++i) {
        CBlockHeader header;
        header.nTime = chain[i - 1].GetBlockTime() + params.nPowTargetSpacing;
        chain[i].pprev = &chain[i - 1];
        chain[i].nHeight = i;
        chain[i].nTime = header.nTime;
        chain[i].nBits = GetNextWorkRequired(&chain[i - 1], &header, params);
    }

    unsigned int second_adjust = chain.back().nBits;
    BOOST_CHECK_EQUAL(second_adjust, first_adjust);
}

BOOST_AUTO_TEST_SUITE_END()

