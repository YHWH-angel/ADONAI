# Copyright (c) 2014-2022 The Bitcoin Core developers
# Modifications (c) 2025 The Adonai Core developers
# Distributed under the MIT software license, see the accompanying
# file COPYING or https://opensource.org/license/mit/

include_guard(GLOBAL)

function(setup_split_debug_script)
  if(CMAKE_HOST_SYSTEM_NAME STREQUAL "Linux")
    set(OBJCOPY ${CMAKE_OBJCOPY})
    set(STRIP ${CMAKE_STRIP})
    configure_file(
      contrib/devtools/split-debug.sh.in split-debug.sh
      FILE_PERMISSIONS OWNER_READ OWNER_EXECUTE
                       GROUP_READ GROUP_EXECUTE
                       WORLD_READ
      @ONLY
    )
  endif()
endfunction()

function(add_maintenance_targets)
  if(NOT TARGET Python3::Interpreter)
    return()
  endif()

  foreach(target IN ITEMS adonai adonaid adonai-cli adonai-tx adonai-util adonai-wallet test_adonai bench_adonai)
    if(TARGET ${target})
      list(APPEND executables $<TARGET_FILE:${target}>)
    endif()
  endforeach()

  add_custom_target(check-symbols
    COMMAND ${CMAKE_COMMAND} -E echo "Running symbol and dynamic library checks..."
    COMMAND Python3::Interpreter ${PROJECT_SOURCE_DIR}/contrib/guix/symbol-check.py ${executables}
    VERBATIM
  )

  add_custom_target(check-security
    COMMAND ${CMAKE_COMMAND} -E echo "Checking binary security..."
    COMMAND Python3::Interpreter ${PROJECT_SOURCE_DIR}/contrib/guix/security-check.py ${executables}
    VERBATIM
  )
endfunction()

function(add_windows_deploy_target)
  if(MINGW AND TARGET adonai AND TARGET adonaid AND TARGET adonai-cli AND TARGET adonai-tx AND TARGET adonai-wallet AND TARGET adonai-util AND TARGET test_adonai)
    find_program(MAKENSIS_EXECUTABLE makensis)
    if(NOT MAKENSIS_EXECUTABLE)
      add_custom_target(deploy
        COMMAND ${CMAKE_COMMAND} -E echo "Error: NSIS not found"
      )
      return()
    endif()

    include(GenerateSetupNsi)
    generate_setup_nsi()
    add_custom_command(
      OUTPUT ${PROJECT_BINARY_DIR}/adonai-win64-setup.exe
      COMMAND ${CMAKE_COMMAND} -E make_directory ${PROJECT_BINARY_DIR}/release
      COMMAND ${CMAKE_STRIP} $<TARGET_FILE:adonai> -o ${PROJECT_BINARY_DIR}/release/$<TARGET_FILE_NAME:adonai>
      COMMAND ${CMAKE_STRIP} $<TARGET_FILE:adonaid> -o ${PROJECT_BINARY_DIR}/release/$<TARGET_FILE_NAME:adonaid>
      COMMAND ${CMAKE_STRIP} $<TARGET_FILE:adonai-cli> -o ${PROJECT_BINARY_DIR}/release/$<TARGET_FILE_NAME:adonai-cli>
      COMMAND ${CMAKE_STRIP} $<TARGET_FILE:adonai-tx> -o ${PROJECT_BINARY_DIR}/release/$<TARGET_FILE_NAME:adonai-tx>
      COMMAND ${CMAKE_STRIP} $<TARGET_FILE:adonai-wallet> -o ${PROJECT_BINARY_DIR}/release/$<TARGET_FILE_NAME:adonai-wallet>
      COMMAND ${CMAKE_STRIP} $<TARGET_FILE:adonai-util> -o ${PROJECT_BINARY_DIR}/release/$<TARGET_FILE_NAME:adonai-util>
      COMMAND ${CMAKE_STRIP} $<TARGET_FILE:test_adonai> -o ${PROJECT_BINARY_DIR}/release/$<TARGET_FILE_NAME:test_adonai>
      COMMAND ${MAKENSIS_EXECUTABLE} -V2 ${PROJECT_BINARY_DIR}/adonai-win64-setup.nsi
      VERBATIM
    )
    add_custom_target(deploy DEPENDS ${PROJECT_BINARY_DIR}/adonai-win64-setup.exe)
  endif()
endfunction()

function(add_macos_deploy_target)
  # macOS deploy target removed (Qt GUI removed; use web app instead)
endfunction()
