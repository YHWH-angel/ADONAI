# Copyright (c) 2014-2022 The Bitcoin Core developers
# Modifications (c) 2025 The Adonai Core developers
# Distributed under the MIT software license, see the accompanying
# file COPYING or http://www.opensource.org/licenses/mit-license.php.

add_library(test_fuzz STATIC EXCLUDE_FROM_ALL
  check_globals.cpp
  descriptor.cpp
  mempool.cpp
  net.cpp
  ../fuzz.cpp
  ../util.cpp
)

target_link_libraries(test_fuzz
  PRIVATE
    core_interface
    test_util
    adonai_node
    Boost::headers
)

if(NOT FUZZ_BINARY_LINKS_WITHOUT_MAIN_FUNCTION)
  target_compile_definitions(test_fuzz PRIVATE PROVIDE_FUZZ_MAIN_FUNCTION)
endif()
