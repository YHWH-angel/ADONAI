#!/bin/sh
# Copyright (c) 2014-2022 The Bitcoin Core developers
# Modifications (c) 2025 The Adonai Core developers
# Distributed under the MIT software license, see the accompanying
# file COPYING or https://opensource.org/license/mit/

export LC_ALL=C

if [ -n "$SOURCE_DATE_EPOCH" ]; then
  find . -exec touch -d "@$SOURCE_DATE_EPOCH" {} +
fi

find . | sort | "$1" -X@ "$2"
