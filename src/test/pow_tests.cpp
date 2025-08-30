// Copyright (c) 2025 The Adonai Core developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

#include <chain.h>
#include <chainparams.h>
#include <pow.h>
#include <test/util/setup_common.h>
#include <util/chaintype.h>
#include <arith_uint256.h>

#include <boost/test/unit_test.hpp>

BOOST_FIXTURE_TEST_SUITE(pow_tests, BasicTestingSetup)

// Simulate faster blocks (higher hash rate) and ensure difficulty increases
// and stabilizes once block times match the target again.
BOOST_AUTO_TEST_CASE(difficulty_converges_up)
{
    const auto chainParams = CreateChainParams(*m_node.args, ChainType::MAIN);
    const Consensus::Params& params = chainParams->GetConsensus();

    const int window = params.DifficultyAdjustmentInterval();
    std::vector<CBlockIndex> chain(window * 2 + 1);
    chain[0].nHeight = 0;
    chain[0].nTime = 0;
    chain[0].nBits = chainParams->GenesisBlock().nBits;

    // First window: blocks arrive twice as fast as the target spacing.
    for (int i = 1; i <= window; ++i) {
        CBlockHeader header;
        int64_t fast_spacing = params.GetTargetSpacing(i) / 2;
        header.nTime = chain[i - 1].GetBlockTime() + fast_spacing;
        chain[i].pprev = &chain[i - 1];
        chain[i].nHeight = i;
        chain[i].nTime = header.nTime;
        chain[i].nBits = GetNextWorkRequired(&chain[i - 1], &header, params);
    }

    unsigned int first_adjust = chain[window].nBits;
    BOOST_CHECK_LT(first_adjust, chain[0].nBits); // harder difficulty

    // Subsequent blocks: assume production now matches the target spacing.
    for (int i = window + 1; i < static_cast<int>(chain.size()); ++i) {
        CBlockHeader header;
        header.nTime = chain[i - 1].GetBlockTime() + params.GetTargetSpacing(i);
        chain[i].pprev = &chain[i - 1];
        chain[i].nHeight = i;
        chain[i].nTime = header.nTime;
        chain[i].nBits = GetNextWorkRequired(&chain[i - 1], &header, params);
    }

    unsigned int second_adjust = chain.back().nBits;
    BOOST_CHECK_EQUAL(second_adjust, first_adjust); // converged
}

// Simulate slower blocks (lower hash rate) and ensure difficulty decreases
// and stabilizes when the spacing normalizes.
BOOST_AUTO_TEST_CASE(difficulty_converges_down)
{
    const auto chainParams = CreateChainParams(*m_node.args, ChainType::MAIN);
    const Consensus::Params& params = chainParams->GetConsensus();

    const int window = params.DifficultyAdjustmentInterval();
    std::vector<CBlockIndex> chain(window * 2 + 1);
    chain[0].nHeight = 0;
    chain[0].nTime = 0;
    chain[0].nBits = chainParams->GenesisBlock().nBits;

    // Initial phase: blocks arrive at half the target rate.
    for (int i = 1; i <= window; ++i) {
        CBlockHeader header;
        int64_t slow_spacing = params.GetTargetSpacing(i) * 2;
        header.nTime = chain[i - 1].GetBlockTime() + slow_spacing;
        chain[i].pprev = &chain[i - 1];
        chain[i].nHeight = i;
        chain[i].nTime = header.nTime;
        chain[i].nBits = GetNextWorkRequired(&chain[i - 1], &header, params);
    }

    unsigned int first_adjust = chain[window].nBits;
    BOOST_CHECK_GT(first_adjust, chain[0].nBits); // easier difficulty

    // Subsequent blocks with normal spacing.
    for (int i = window + 1; i < static_cast<int>(chain.size()); ++i) {
        CBlockHeader header;
        header.nTime = chain[i - 1].GetBlockTime() + params.GetTargetSpacing(i);
        chain[i].pprev = &chain[i - 1];
        chain[i].nHeight = i;
        chain[i].nTime = header.nTime;
        chain[i].nBits = GetNextWorkRequired(&chain[i - 1], &header, params);
    }

    unsigned int second_adjust = chain.back().nBits;
    BOOST_CHECK_EQUAL(second_adjust, first_adjust);
}

// Ensure that with exactly N blocks, difficulty calculation uses pow_limit and
// does not attempt to dereference a null pprev (genesis).
BOOST_AUTO_TEST_CASE(no_dereference_with_exact_window)
{
    const auto chainParams = CreateChainParams(*m_node.args, ChainType::MAIN);
    const Consensus::Params& params = chainParams->GetConsensus();

    const int window = params.DifficultyAdjustmentInterval();
    std::vector<CBlockIndex> chain(window);
    chain[0].nHeight = 0;
    chain[0].nTime = 0;
    chain[0].nBits = chainParams->GenesisBlock().nBits;

    for (int i = 1; i < window; ++i) {
        chain[i].pprev = &chain[i - 1];
        chain[i].nHeight = i;
        chain[i].nTime = chain[i - 1].GetBlockTime() + params.GetTargetSpacing(i);
        chain[i].nBits = chainParams->GenesisBlock().nBits;
    }

    const unsigned int pow_limit = UintToArith256(params.powLimit).GetCompact();
    CBlockHeader header;
    unsigned int nBits = GetNextWorkRequired(&chain.back(), &header, params);
    BOOST_CHECK_EQUAL(nBits, pow_limit);
    BOOST_CHECK_EQUAL(header.nBits, pow_limit);
}

BOOST_AUTO_TEST_SUITE_END()

