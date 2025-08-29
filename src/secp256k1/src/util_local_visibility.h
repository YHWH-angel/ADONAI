/* Copyright (c) 2014-2022 The Bitcoin Core developers
 * Modifications (c) 2025 The Adonai Core developers
 * Distributed under the MIT software license, see the accompanying
 * file COPYING or http://www.opensource.org/licenses/mit-license.php.
 */

#ifndef SECP256K1_LOCAL_VISIBILITY_H
#define SECP256K1_LOCAL_VISIBILITY_H

/* Global variable visibility */
/* See: https://github.com/bitcoin-core/secp256k1/issues/1181 */
#if !defined(_WIN32) && defined(__GNUC__) && (__GNUC__ >= 4)
# define SECP256K1_LOCAL_VAR extern __attribute__ ((visibility ("hidden")))
#else
# define SECP256K1_LOCAL_VAR extern
#endif

#endif /* SECP256K1_LOCAL_VISIBILITY_H */
