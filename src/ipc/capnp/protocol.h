// Copyright (c) 2021 The Bitcoin Core developers
// Modifications (c) 2025 The Adonai Core developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

#ifndef ADONAI_IPC_CAPNP_PROTOCOL_H
#define ADONAI_IPC_CAPNP_PROTOCOL_H

#include <memory>

namespace ipc {
class Protocol;
namespace capnp {
std::unique_ptr<Protocol> MakeCapnpProtocol();
} // namespace capnp
} // namespace ipc

#endif // ADONAI_IPC_CAPNP_PROTOCOL_H
