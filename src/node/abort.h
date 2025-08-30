// Copyright (c) 2023 The Bitcoin Core developers
// Modifications (c) 2025 The Adonai Core developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

#ifndef ADONAI_NODE_ABORT_H
#define ADONAI_NODE_ABORT_H

#include <atomic>
#include <functional>

struct bilingual_str;

namespace node {
class Warnings;
void AbortNode(const std::function<bool()>& shutdown_request, std::atomic<int>& exit_status, const bilingual_str& message, node::Warnings* warnings);
} // namespace node

#endif // ADONAI_NODE_ABORT_H
