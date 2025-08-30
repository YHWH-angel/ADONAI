# Libraries

| Name                     | Description |
|--------------------------|-------------|
| *libadonai_cli*         | RPC client functionality used by *adonai-cli* executable |
| *libadonai_common*      | Home for common functionality shared by different executables and libraries. Similar to *libadonai_util*, but higher-level (see [Dependencies](#dependencies)). |
| *libadonai_consensus*   | Consensus functionality used by *libadonai_node* and *libadonai_wallet*. |
| *libadonai_crypto*      | Hardware-optimized functions for data encryption, hashing, message authentication, and key derivation. |
| *libadonaiqt*           | GUI functionality used by *adonai-qt* and *adonai-gui* executables. |
| *libadonai_ipc*         | IPC functionality used by *adonai-node*, *adonai-wallet*, *adonai-gui* executables to communicate when [`-DENABLE_IPC=ON`](multiprocess.md) is used. |
| *libadonai_node*        | P2P and RPC server functionality used by *adonaid* and *adonai-qt* executables. |
| *libadonai_util*        | Home for common functionality shared by different executables and libraries. Similar to *libadonai_common*, but lower-level (see [Dependencies](#dependencies)). |
| *libadonai_wallet*      | Wallet functionality used by *adonaid* and *adonai-wallet* executables. |
| *libadonai_wallet_tool* | Lower-level wallet functionality used by *adonai-wallet* executable. |
| *libadonai_zmq*         | [ZeroMQ](../zmq.md) functionality used by *adonaid* and *adonai-qt* executables. |

## Conventions


- Generally each library should have a corresponding source directory and namespace. Source code organization is a work in progress, so it is true that some namespaces are applied inconsistently, and if you look at [`add_library(adonai_* ...)`](../../src/CMakeLists.txt) lists you can see that many libraries pull in files from outside their source directory. But when working with libraries, it is good to follow a consistent pattern like:

  - *libadonai_node* code lives in `src/node/` in the `node::` namespace
  - *libadonai_wallet* code lives in `src/wallet/` in the `wallet::` namespace
  - *libadonai_ipc* code lives in `src/ipc/` in the `ipc::` namespace
  - *libadonai_util* code lives in `src/util/` in the `util::` namespace
  - *libadonai_consensus* code lives in `src/consensus/` in the `Consensus::` namespace

## Dependencies

- Libraries should minimize what other libraries they depend on, and only reference symbols following the arrows shown in the dependency graph below:

<table><tr><td>

```mermaid

%%{ init : { "flowchart" : { "curve" : "basis" }}}%%

graph TD;

adonai-cli[adonai-cli]-->libadonai_cli;

adonaid[adonaid]-->libadonai_node;
adonaid[adonaid]-->libadonai_wallet;

adonai-qt[adonai-qt]-->libadonai_node;
adonai-qt[adonai-qt]-->libadonaiqt;
adonai-qt[adonai-qt]-->libadonai_wallet;

adonai-wallet[adonai-wallet]-->libadonai_wallet;
adonai-wallet[adonai-wallet]-->libadonai_wallet_tool;

libadonai_cli-->libadonai_util;
libadonai_cli-->libadonai_common;

libadonai_consensus-->libadonai_crypto;

libadonai_common-->libadonai_consensus;
libadonai_common-->libadonai_crypto;
libadonai_common-->libadonai_util;

libadonai_node-->libadonai_consensus;
libadonai_node-->libadonai_crypto;
libadonai_node-->libadonai_common;
libadonai_node-->libadonai_util;

libadonaiqt-->libadonai_common;
libadonaiqt-->libadonai_util;

libadonai_util-->libadonai_crypto;

libadonai_wallet-->libadonai_common;
libadonai_wallet-->libadonai_crypto;
libadonai_wallet-->libadonai_util;

libadonai_wallet_tool-->libadonai_wallet;
libadonai_wallet_tool-->libadonai_util;

classDef bold stroke-width:2px, font-weight:bold, font-size: smaller;
class adonai-qt,adonaid,adonai-cli,adonai-wallet bold
```
</td></tr><tr><td>

**Dependency graph**. Arrows show linker symbol dependencies. *Crypto* lib depends on nothing. *Util* lib is depended on by everything. *Kernel* lib depends only on consensus, crypto, and util.

</td></tr></table>

- The graph shows what _linker symbols_ (functions and variables) from each library other libraries can call and reference directly, but it is not a call graph. For example, there is no arrow connecting *libadonai_wallet* and *libadonai_node* libraries, because these libraries are intended to be modular and not depend on each other's internal implementation details. But wallet code is still able to call node code indirectly through the `interfaces::Chain` abstract class in [`interfaces/chain.h`](../../src/interfaces/chain.h) and node code calls wallet code through the `interfaces::ChainClient` and `interfaces::Chain::Notifications` abstract classes in the same file. In general, defining abstract classes in [`src/interfaces/`](../../src/interfaces/) can be a convenient way of avoiding unwanted direct dependencies or circular dependencies between libraries.

- *libadonai_crypto* should be a standalone dependency that any library can depend on, and it should not depend on any other libraries itself.

- *libadonai_consensus* should only depend on *libadonai_crypto*, and all other libraries besides *libadonai_crypto* should be allowed to depend on it.

- *libadonai_util* should be a standalone dependency that any library can depend on, and it should not depend on other libraries except *libadonai_crypto*. It provides basic utilities that fill in gaps in the C++ standard library and provide lightweight abstractions over platform-specific features. Since the util library is distributed with the kernel and is usable by kernel applications, it shouldn't contain functions that external code shouldn't call, like higher level code targeted at the node or wallet. (*libadonai_common* is a better place for higher level code, or code that is meant to be used by internal applications only.)

- *libadonai_common* is a home for miscellaneous shared code used by different Adonai Core applications. It should not depend on anything other than *libadonai_util*, *libadonai_consensus*, and *libadonai_crypto*.
- GUI, node, and wallet code internal implementations should all be independent of each other, and the *libadonaiqt*, *libadonai_node*, *libadonai_wallet* libraries should never reference each other's symbols. They should only call each other through [`src/interfaces/`](../../src/interfaces/) abstract interfaces.

