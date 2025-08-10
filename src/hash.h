// Copyright (c) 2009-2010 Satoshi Nakamoto
// Copyright (c) 2009-present The Bitcoin Core developers
// Modifications (c) 2025 The Adonai Core developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

#ifndef BITCOIN_HASH_H
#define BITCOIN_HASH_H

#ifndef SHA256UINT256_DEFINED
#define SHA256UINT256_DEFINED

#include "blake3/blake3.h"
#include <attributes.h>
#include <crypto/common.h>
#include <crypto/ripemd160.h>
#include <crypto/sha256.h>
#include <prevector.h>
#include <serialize.h>
#include <span.h>
#include <uint256.h>
#include "chain.h" // si no está incluido ya

#include <string>
#include <vector>

typedef uint256 ChainCode;

class CHash256 {
private:
    std::vector<unsigned char> buffer;

public:
    static const size_t OUTPUT_SIZE = 32;

    CHash256& Write(const unsigned char* data, size_t size) {
        buffer.insert(buffer.end(), data, data + size);
        return *this;
    }

    CHash256& Write(std::span<const unsigned char> input) {
        return Write(input.data(), input.size());
    }

    CHash256& Write(const std::vector<unsigned char>& data) {
        return Write(data.data(), data.size());
    }

    CHash256& Reset() {
        buffer.clear();
        return *this;
    }

    void Finalize(std::vector<unsigned char>& out) {
        out.resize(OUTPUT_SIZE);
        blake3_hasher hasher;
        blake3_hasher_init(&hasher);
        blake3_hasher_update(&hasher, buffer.data(), buffer.size());
        blake3_hasher_finalize(&hasher, out.data(), OUTPUT_SIZE);
        Reset();
    }

    void Finalize(uint256& out) {
        unsigned char hash[OUTPUT_SIZE];
        blake3_hasher hasher;
        blake3_hasher_init(&hasher);
        blake3_hasher_update(&hasher, buffer.data(), buffer.size());
        blake3_hasher_finalize(&hasher, hash, OUTPUT_SIZE);
        out = uint256(std::vector<unsigned char>(hash, hash + OUTPUT_SIZE));
        Reset();
    }

    void Finalize(unsigned char* out) {
        blake3_hasher hasher;
        blake3_hasher_init(&hasher);
        blake3_hasher_update(&hasher, buffer.data(), buffer.size());
        blake3_hasher_finalize(&hasher, out, OUTPUT_SIZE);
        Reset();
    }
};

class CHash160 {
private:
    CSHA256 sha;

public:
    static const size_t OUTPUT_SIZE = CRIPEMD160::OUTPUT_SIZE;

    void Finalize(std::span<unsigned char> output) {
        assert(output.size() == OUTPUT_SIZE);
        unsigned char buf[CSHA256::OUTPUT_SIZE];
        sha.Finalize(buf);
        CRIPEMD160().Write(buf, CSHA256::OUTPUT_SIZE).Finalize(output.data());
    }

    CHash160& Write(std::span<const unsigned char> input) {
        sha.Write(input.data(), input.size());
        return *this;
    }

    CHash160& Reset() {
        sha.Reset();
        return *this;
    }
};

template<typename T>
inline uint256 Hash(const T& in1) {
    uint256 result;
    CHash256().Write(MakeUCharSpan(in1).data(), MakeUCharSpan(in1).size()).Finalize(result.begin());
    return result;
}

template<typename T1, typename T2>
inline uint256 Hash(const T1& in1, const T2& in2) {
    uint256 result;
    CHash256()
        .Write(MakeUCharSpan(in1).data(), MakeUCharSpan(in1).size())
        .Write(MakeUCharSpan(in2).data(), MakeUCharSpan(in2).size())
        .Finalize(result.begin());
    return result;
}

template<typename T1>
inline uint160 Hash160(const T1& in1) {
    uint160 result;
    CHash160().Write(MakeUCharSpan(in1)).Finalize(result);
    return result;
}

class HashWriter {
private:
    CSHA256 ctx;

public:
    void write(std::span<const std::byte> src) {
        ctx.Write(UCharCast(src.data()), src.size());
    }

    uint256 GetHash() {
        uint256 result;
        ctx.Finalize(result.begin());
        ctx.Reset().Write(result.begin(), CSHA256::OUTPUT_SIZE).Finalize(result.begin());
        return result;
    }

    uint256 GetSHA256() {
        uint256 result;
        ctx.Finalize(result.begin());
        return result;
    }

    inline uint64_t GetCheapHash() {
        uint256 result = GetHash();
        return ReadLE64(result.begin());
    }

    template <typename T>
    HashWriter& operator<<(const T& obj) {
        ::Serialize(*this, obj);
        return *this;
    }
};

template <typename Source>
class HashVerifier : public HashWriter {
private:
    Source& m_source;

public:
    explicit HashVerifier(Source& source LIFETIMEBOUND) : m_source{source} {}

    void read(std::span<std::byte> dst) {
        m_source.read(dst);
        this->write(dst);
    }

    void ignore(size_t num_bytes) {
        std::byte data[1024];
        while (num_bytes > 0) {
            size_t now = std::min<size_t>(num_bytes, 1024);
            read({data, now});
            num_bytes -= now;
        }
    }

    template <typename T>
    HashVerifier<Source>& operator>>(T&& obj) {
        ::Unserialize(*this, obj);
        return *this;
    }
};

template <typename Source>
class HashedSourceWriter : public HashWriter {
private:
    Source& m_source;

public:
    explicit HashedSourceWriter(Source& source LIFETIMEBOUND) : HashWriter{}, m_source{source} {}

    void write(std::span<const std::byte> src) {
        m_source.write(src);
        HashWriter::write(src);
    }

    template <typename T>
    HashedSourceWriter& operator<<(const T& obj) {
        ::Serialize(*this, obj);
        return *this;
    }
};

unsigned int MurmurHash3(unsigned int nHashSeed, std::span<const unsigned char> vDataToHash);
HashWriter TaggedHash(const std::string& tag);

inline uint160 RIPEMD160(std::span<const unsigned char> data) {
    uint160 result;
    CRIPEMD160().Write(data.data(), data.size()).Finalize(result.begin());
    return result;
}

void BIP32Hash(const ChainCode& chainCode, unsigned int child, unsigned char header, const unsigned char* data, unsigned char* output);

uint256 SHA256Uint256(const uint256& input);
#endif // SHA256UINT256_DEFINED
#endif // BITCOIN_HASH_H
