
const GH = "https://github.com/dashpay";
const PKG = GH + "/platform/tree/master/packages";

document.addEventListener("dashhq-theme", () => {
  const { scrollX: left, scrollY: top } = window;
  requestAnimationFrame(() => {
    window.scrollTo({ top, left, behavior: "instant" });
  });
});

const DATA = {
  "tenderdash": {
    name: "Tenderdash", side: "server", kind: "Consensus engine · Go",
    crate: "dashpay/tenderdash + rs-tenderdash-abci",
    summary: "A Tendermint fork rebuilt around Dash's long-living masternode quorums. Validator sets are LLMQ quorums, and instead of collecting per-validator signatures, each block is finalized by recovering a single BLS threshold signature from the quorum.",
    facts: [
      "One 96-byte BLS signature attests each block — light clients verify O(proof), not O(validators), with no header chain.",
      "Vote extensions (<code>ThresholdRecoverRaw</code>) turn consensus into a threshold-signing service — used to sign L1 asset-unlock transactions.",
      "Routed ABCI transport: <code>CheckTx</code> runs concurrently over gRPC, consensus calls serialize over a socket.",
      "Validator quorums rotate; Drive ABCI picks the next one and ships it back in <code>validator_set_update</code>.",
      "<code>rs-tenderdash-abci</code> provides the Rust protobuf bindings, ABCI server, and canonical sign-bytes."
    ],
    links: [
      { label: "dashpay/tenderdash", href: GH + "/tenderdash" },
      { label: "dashpay/rs-tenderdash-abci", href: GH + "/rs-tenderdash-abci" }
    ],
    related: ["drive-abci", "proof-check", "dash-core"]
  },
  "drive-abci": {
    name: "Drive ABCI", side: "server", kind: "Execution layer · Rust crate",
    crate: "packages/rs-drive-abci",
    summary: "The application behind Tenderdash's ABCI: it validates and applies state transitions, keeps platform state (validator sets, masternode lists, epochs), and commits GroveDB's root hash into every block as the app hash.",
    facts: [
      "Block lifecycle: PrepareProposal → ProcessProposal → ExtendVote / VerifyVoteExtension → FinalizeBlock; app hash = GroveDB root hash.",
      "Failures before identity attribution are unpaid (removed as spam); failures after are paid — fee charged, nonce bumped.",
      "Runs epochs (~9.1 days), fee pools, proposer payouts, and per-epoch storage refunds.",
      "Withdrawals: queues asset-unlock transactions, gets them threshold-signed via vote extensions, broadcasts to Core.",
      "Protocol upgrades by on-chain vote: ≥67% of evonodes propose a version → activates next epoch, with state migrations.",
      "Panics on any app-hash divergence — crash-and-restart beats forking.",
      "Serves DAPI queries on its own gRPC service (:26670); ABCI Query is deliberately unused."
    ],
    links: [
      { label: "packages/rs-drive-abci", href: PKG + "/rs-drive-abci" },
      { label: "packages/rs-platform-version", href: PKG + "/rs-platform-version" }
    ],
    related: ["tenderdash", "drive", "dapi", "dpp"]
  },
  "drive": {
    name: "Drive", side: "server", kind: "State & query layer · Rust crate",
    crate: "packages/rs-drive",
    summary: "Drive gives GroveDB meaning: it defines where identities, contracts, documents, tokens, balances, and votes live in the tree, maintains secondary indexes, and translates where-clauses into provable GroveDB path queries.",
    facts: [
      "17 root subtrees on single-byte keys — identities (32), documents (64), balances (96, sum tree), votes (112)…",
      "Every query must match an index declared in the data contract — no full scans, ever.",
      "Index leaves are GroveDB references back to primary storage; unique indexes are just key-uniqueness.",
      "Sum trees make credit totals auditable — the sum invariant is re-checked every block.",
      "Fees are deterministic: byte-priced storage (with per-epoch refunds on delete) plus metered processing costs.",
      "The same crate recompiles with <code>--features verify</code> into the client-side verifier."
    ],
    links: [
      { label: "packages/rs-drive", href: PKG + "/rs-drive" }
    ],
    related: ["grovedb", "drive-verify", "dpp", "drive-abci"]
  },
  "grovedb": {
    name: "GroveDB", side: "server", kind: "Authenticated store · Rust workspace",
    crate: "dashpay/grovedb",
    summary: "A grove of Merkle AVL trees: every subtree's root hash is folded into its parent's node hash, so one root hash commits to every byte in the database — and any query result can carry a compact proof up to that root.",
    facts: [
      "15 element types: items, references (7 kinds), and tree variants — sum, big-sum, count, provable-count, and append-only trees.",
      "Parent links child via <code>combine_hash(H(element), child_root)</code> — change anything, the root changes.",
      "PathQuery: keys/ranges at a path plus recursive subqueries; multiple queries merge into one provable unit.",
      "Layered proofs with subset and absence verification; all node hashing is blake3.",
      "Every operation returns a cost (seeks, bytes, hash calls) — the basis of deterministic fees.",
      "The <code>verify</code> feature compiles proof execution with no RocksDB at all."
    ],
    links: [
      { label: "dashpay/grovedb", href: GH + "/grovedb" },
      { label: "grovedb book (docs)", href: GH + "/grovedb/tree/master/docs" }
    ],
    related: ["trees", "rocksdb", "grovedb-verify", "drive"]
  },
  "trees": {
    name: "Tree structures", side: "server", kind: "Merkle machinery · Rust crates",
    crate: "merk · mmr · bulk-append · commitment · dense",
    summary: "The concrete Merkle structures under GroveDB. Merk is the workhorse — a Merkle AVL tree where every node stores data. Around it, specialized append-only trees serve workloads where rebalancing would be waste.",
    facts: [
      "Merk: AVL-balanced, every node holds a KV; hashes are blake3 of (kv, left, right).",
      "MMR (merkle mountain range): append-only peaks, O(1) amortized appends.",
      "Bulk-append tree: fills a small dense buffer, compacts to immutable chunk blobs — CDN-cacheable history for light clients.",
      "Commitment tree: the Orchard shielded pool — a Sinsemilla frontier (~800 ZK constraints/hash vs blake3's ~25k) over a bulk-append log of encrypted notes.",
      "Chunked proofs power state sync: restore a whole tree from verified chunks."
    ],
    links: [
      { label: "grovedb/merk", href: GH + "/grovedb/tree/master/merk" },
      { label: "grovedb-merkle-mountain-range", href: GH + "/grovedb/tree/master/grovedb-merkle-mountain-range" },
      { label: "grovedb-commitment-tree", href: GH + "/grovedb/tree/master/grovedb-commitment-tree" }
    ],
    related: ["grovedb", "rocksdb"]
  },
  "rocksdb": {
    name: "RocksDB storage", side: "server", kind: "Storage backend · Rust crate",
    crate: "grovedb/storage",
    summary: "The unauthenticated bottom of the stack: a RocksDB wrapper that gives every subtree its own contiguous key range and wraps all mutation in optimistic transactions.",
    facts: [
      "Four column families: default (tree data), aux, roots, meta.",
      "Each subtree path hashes (blake3) to a 32-byte prefix; keys are <code>prefix || key</code> — cheap seeks, ordered iteration.",
      "All writes batch through storage transactions; costs accrue as pending and apply on commit.",
      "Checkpoints let queries resolve against recent historical roots."
    ],
    links: [
      { label: "grovedb/storage", href: GH + "/grovedb/tree/master/storage" }
    ],
    related: ["grovedb", "trees"]
  },
  "dapi": {
    name: "DAPI", side: "shared", kind: "Decentralized API · every evonode",
    crate: "rs-dapi · dapi-grpc · envoy gateway",
    summary: "Every evonode serves the same API behind an Envoy gateway — there is no central RPC provider. DAPI adds no query semantics of its own: it forwards queries to Drive ABCI and broadcasts to Tenderdash, so any node can serve any request and every answer can carry a proof.",
    facts: [
      "~60 versioned gRPC endpoints, every query with a <code>prove</code> flag; gRPC-Web via Envoy for browsers.",
      "Queries: per-block LRU cache, then a byte-identical forward to Drive ABCI's gRPC service.",
      "Broadcasts go to Tenderdash <code>broadcast_tx_sync</code>; <code>waitForStateTransitionResult</code> subscribes to the WebSocket before checking — race-free.",
      "Core endpoints proxy Dash Core RPC + ZMQ: blocks, transactions, chainlock/masternode streams.",
      "The Rust rewrite (<code>rs-dapi</code>) has fully replaced the Node.js DAPI in deployment.",
      "Clients pick nodes uniformly at random and punish failures with exponential bans (60s·eⁿ)."
    ],
    links: [
      { label: "packages/rs-dapi", href: PKG + "/rs-dapi" },
      { label: "packages/dapi-grpc", href: PKG + "/dapi-grpc" },
      { label: "packages/rs-dapi-client", href: PKG + "/rs-dapi-client" },
      { label: "packages/dashmate", href: PKG + "/dashmate" }
    ],
    related: ["drive-abci", "rs-sdk", "tenderdash"]
  },
  "dpp": {
    name: "DPP — Dash Platform Protocol", side: "shared", kind: "Shared protocol · Rust crate",
    crate: "packages/rs-dpp",
    summary: "The data model both sides agree on: identities, data contracts, documents, tokens, and the 21 state-transition types that are the only way to write. Compiled into Drive ABCI for validation and into every SDK for construction and signing.",
    facts: [
      "Identity = keys (purpose × security level × type) + credit balance + revision; id = sha256d of the funding outpoint.",
      "Data contracts declare document types, indexes, and token rules — schemas enforced by the network, no user code on-chain.",
      "Contested unique indexes route conflicts (e.g. DPNS names) into masternode voting instead of failing.",
      "Tokens are declarative: mint/burn/freeze rules, group-controlled actions, pre-programmed distributions.",
      "Canonical serialization: bincode, big-endian, versioned envelopes — old bytes stay decodable forever.",
      "System contracts (DPNS, DashPay, withdrawals, token history…) bootstrap platform features as ordinary contracts."
    ],
    links: [
      { label: "packages/rs-dpp", href: PKG + "/rs-dpp" },
      { label: "packages/data-contracts", href: PKG + "/data-contracts" }
    ],
    related: ["drive-abci", "rs-sdk", "drive"]
  },
  "client-app": {
    name: "Client app", side: "client", kind: "Application layer",
    crate: "SwiftExampleApp · DashPay · dash-evo-tool…",
    summary: "The top of the client column: UI, app persistence, and key custody. Everything below it is shared Rust — the app's job is to render state and hold keys in the OS keystore.",
    facts: [
      "iOS reference app: SwiftUI + SwiftData; wallet state persists through a Rust→Swift callback vtable into SwiftData (34 models).",
      "Private keys live in the Keychain; Rust calls back for a narrow retrieve→sign→zero window.",
      "Key pipelines (mnemonic → seed → derive → sign) stay in Rust — hosts never handle raw key material in bulk."
    ],
    links: [
      { label: "swift-sdk/SwiftExampleApp", href: PKG + "/swift-sdk" },
      { label: "dashpay/dash-evo-tool", href: GH + "/dash-evo-tool" }
    ],
    related: ["bindings", "platform-wallet"]
  },
  "bindings": {
    name: "SDK bindings", side: "client", kind: "Language shells · Swift / Kotlin / TS",
    crate: "swift-sdk · kotlin-sdk · js-evo-sdk · wasm-sdk",
    summary: "One Rust core, four exposure paths — and no UniFFI anywhere. Each binding is a thin hand-written shell over the same crates.",
    facts: [
      "iOS: cbindgen C headers, one static lib (<code>rs-unified-sdk-ffi</code>) → <code>DashSDKFFI.xcframework</code>; hand-written Swift 6 on top.",
      "FFI futures run on a dedicated 16 MiB-stack thread — proof-verification recursion overflows iOS's 512 KiB dispatch stacks.",
      "Android: same C ABI called as Rust behind a JNI shim; handles cross as <code>jlong</code>, panics caught at the boundary.",
      "Web: the whole SDK compiles to WASM (<code>wasm-sdk</code>); <code>js-evo-sdk</code> is the recommended TS wrapper.",
      "Proof verification runs identically on all four targets — same crates, same math."
    ],
    links: [
      { label: "packages/swift-sdk", href: PKG + "/swift-sdk" },
      { label: "packages/kotlin-sdk", href: PKG + "/kotlin-sdk" },
      { label: "packages/js-evo-sdk", href: PKG + "/js-evo-sdk" },
      { label: "packages/wasm-sdk", href: PKG + "/wasm-sdk" }
    ],
    related: ["wallet-ffi", "rs-sdk", "client-app"]
  },
  "wallet-ffi": {
    name: "Platform Wallet FFI", side: "client", kind: "C ABI · Rust crate",
    crate: "packages/rs-platform-wallet-ffi",
    summary: "The C boundary for the wallet engine: 371 extern functions generated with cbindgen, opaque integer handles instead of raw pointers, and a callback vtable that lets the host own persistence.",
    facts: [
      "Plain C ABI via cbindgen — no UniFFI; handles are monotonic <code>u64</code>s, unforgeable from the host side.",
      "~30-slot <code>PersistenceCallbacks</code> vtable with a versioned extension struct — iOS implements it against SwiftData.",
      "Covers the full wallet surface: identities, DashPay, DPNS, tokens, asset locks, addresses, shielded, SPV control.",
      "Bundled with <code>key-wallet-ffi</code> + <code>rs-sdk-ffi</code> + <code>dash-network</code> into one unified static library."
    ],
    links: [
      { label: "packages/rs-platform-wallet-ffi", href: PKG + "/rs-platform-wallet-ffi" },
      { label: "packages/rs-unified-sdk-ffi", href: PKG + "/rs-unified-sdk-ffi" },
      { label: "packages/rs-sdk-ffi", href: PKG + "/rs-sdk-ffi" }
    ],
    related: ["platform-wallet", "bindings"]
  },
  "platform-wallet": {
    name: "Platform Wallet", side: "client", kind: "Wallet engine · Rust crate",
    crate: "packages/rs-platform-wallet",
    summary: "The full wallet brain in Rust: an L1 core wallet plus everything Platform — identity lifecycle, DashPay contacts, DPNS names, tokens, asset-lock funding, credit addresses, and an Orchard shielded subsystem.",
    facts: [
      "Identity registration, top-up, transfer, withdrawal, and discovery — driven from asset locks or address funds.",
      "DashPay per DIP-15: encrypted contact requests, derived per-contact payment addresses, profiles, invitations.",
      "Supervised background workers sync SPV, identities, contacts, names, addresses, and shielded notes.",
      "Persistence is changeset-based: deltas flow to Rust SQLite or to the host through the FFI vtable.",
      "Secrets never touch the database — a dedicated secret store (encrypted vault or OS keyring) with zeroizing buffers.",
      "Shielded spend keys are never resident; re-derived per spend and dropped."
    ],
    links: [
      { label: "packages/rs-platform-wallet", href: PKG + "/rs-platform-wallet" },
      { label: "packages/rs-platform-wallet-storage", href: PKG + "/rs-platform-wallet-storage" }
    ],
    related: ["wallet-ffi", "rust-dashcore", "rs-sdk"]
  },
  "rs-sdk": {
    name: "RS SDK", side: "client", kind: "Client SDK · Rust crate",
    crate: "packages/rs-sdk (dash-sdk)",
    summary: "The canonical client library: typed fetches and broadcasts where proved responses are the default and the response body is never trusted — every answer is parsed out of its proof.",
    facts: [
      "<code>Fetch</code> / <code>FetchMany</code> traits: request → proof → verified object; proof-of-absence is a first-class result.",
      "<code>broadcast_and_wait</code> succeeds only when the proof shows <em>this exact transition executed</em>.",
      "The one trusted input is the <code>ContextProvider</code> — quorum public keys and data contracts.",
      "Identity creation rides an L1 asset lock: InstantSend or chainlock proof assembled from Core streams.",
      "Node selection via rs-dapi-client: uniform random, exponential bans, stale-node detection and retry.",
      "The same crate compiles to WASM for the browser SDK."
    ],
    links: [
      { label: "packages/rs-sdk", href: PKG + "/rs-sdk" },
      { label: "packages/rs-dapi-client", href: PKG + "/rs-dapi-client" },
      { label: "packages/rs-context-provider", href: PKG + "/rs-context-provider" }
    ],
    related: ["dapi", "proof-check", "dpp", "platform-wallet"]
  },
  "rust-dashcore": {
    name: "Rust Dash Core", side: "client", kind: "L1 client stack · Rust workspace",
    crate: "dashcore · key-wallet · dash-spv",
    summary: "Dash's L1 in Rust, on-device: transaction primitives and special transactions, a three-algebra HD wallet, and a full SPV client that maintains the masternode list and verifies chainlocks locally.",
    facts: [
      "<code>dashcore</code>: DIP-2 special transactions, BLS, and a masternode-list engine with DIP-24 rotated-quorum construction.",
      "Chainlocks and InstantSend locks verified on device — <code>verify_chain_lock</code> / <code>verify_is_lock</code> against the right quorum.",
      "<code>key-wallet</code>: BIP32 secp256k1 + BLS-BIP32 + SLIP-0010 ed25519, with the DIP-9 derivation-path registry.",
      "<code>dash-spv</code>: headers with checkpoints, BIP-157/158 compact filters, reputation-tracked peers.",
      "SPV can answer quorum-key lookups locally — the fully trustless context provider path (built, not yet the shipped default)."
    ],
    links: [
      { label: "dashpay/rust-dashcore", href: GH + "/rust-dashcore" },
      { label: "rust-dashcore/dash-spv", href: GH + "/rust-dashcore/tree/master/dash-spv" },
      { label: "rust-dashcore/key-wallet", href: GH + "/rust-dashcore/tree/master/key-wallet" }
    ],
    related: ["platform-wallet", "dash-core", "proof-check"]
  },
  "drive-verify": {
    name: "Drive Verify", side: "client", kind: "Same crate as Drive · verify feature",
    crate: "rs-drive --features verify",
    summary: "Not a reimplementation — the literal server crate compiled without storage. The client rebuilds the exact path query the server executed and re-runs the verification math, so prover and verifier can never drift apart.",
    facts: [
      "~80 <code>verify_*</code> functions: documents, identities, balances, tokens, votes, epochs, upgrade state…",
      "<code>DriveDocumentQuery::verify_proof</code> — the same struct that built the server query checks its proof.",
      "Every verifier returns <code>(root_hash, object)</code> — the root hash then goes to the BLS signature check.",
      "Wrapped by <code>rs-drive-proof-verifier</code> (46 <code>FromProof</code> impls) and <code>wasm-drive-verify</code> for browsers."
    ],
    links: [
      { label: "rs-drive/src/verify", href: GH + "/platform/tree/master/packages/rs-drive/src/verify" },
      { label: "packages/wasm-drive-verify", href: PKG + "/wasm-drive-verify" }
    ],
    related: ["drive", "grovedb-verify", "proof-check"]
  },
  "grovedb-verify": {
    name: "GroveDB Verify", side: "client", kind: "Same crate as GroveDB · verify feature",
    crate: "grovedb --features verify",
    summary: "GroveDB's proof executor with the storage engine compiled out: no RocksDB, no caches — just the stack machine that replays proof operations and reconstructs the root hash.",
    facts: [
      "Merk proofs are programs: <code>Push / Parent / Child</code> ops rebuild a partial tree and its hash.",
      "Layered proofs chain: each subtree's rebuilt root must match the hash committed in its parent's node.",
      "Subset and absence proofs let one response answer many questions verifiably.",
      "Runs anywhere Rust compiles — natively, in WASM, behind mobile FFI."
    ],
    links: [
      { label: "grovedb proof operations", href: GH + "/grovedb/tree/master/grovedb/src/operations/proof" }
    ],
    related: ["grovedb", "drive-verify", "proof-check"]
  },
  "proof-check": {
    name: "Proof verification", side: "client", kind: "The trust anchor · Rust crate",
    crate: "packages/rs-drive-proof-verifier",
    summary: "Where it all lands: Drive Verify rebuilds a root hash from the proof, that hash is checked against the block's signed StateId using a quorum public key. This confirms the answer matches stored state; it does not establish that a claim in the data is true.",
    facts: [
      "Stage 1 — pure math: rebuild <code>(root_hash, object)</code> from the GroveDB proof.",
      "Stage 2 — trust: fetch the quorum key via the ContextProvider, BLS-verify the signature over <code>StateId{app_hash = root_hash}</code>.",
      "Tampered proof ⇒ different root ⇒ signature check fails. Lying is mathematically detectable.",
      "Quorum keys come from your own Core node, the trusted quorum service, or (soon) on-device SPV.",
      "Freshness checks (height high-water mark, clock tolerance) run only after the signature verifies; stale nodes get banned and retried."
    ],
    links: [
      { label: "packages/rs-drive-proof-verifier", href: PKG + "/rs-drive-proof-verifier" },
      { label: "rs-sdk-trusted-context-provider", href: PKG + "/rs-sdk-trusted-context-provider" }
    ],
    related: ["drive-verify", "grovedb-verify", "tenderdash", "rs-sdk"]
  },
  "dash-core": {
    name: "Dash Core — Layer 1", side: "server", kind: "The payment chain",
    crate: "dashpay/dash",
    summary: "The base chain Platform leans on: the masternode registry, the LLMQ quorums that sign Platform blocks, and the settlement rails that move DASH into credits and back out.",
    facts: [
      "DIP-3 deterministic masternode lists define who validates; DIP-6 LLMQs provide the threshold-signing quorums.",
      "Chainlocks (DIP-8) and InstantSend gate when asset-lock funds become spendable as credits.",
      "Credits enter via asset-lock special transactions; they exit via quorum-signed asset-unlock transactions.",
      "Core block rewards partly fund Platform's epoch fee pools.",
      "Evonodes read it over RPC; clients sync it over P2P with dash-spv."
    ],
    links: [
      { label: "dashpay/dash", href: GH + "/dash" },
      { label: "dash improvement proposals", href: GH + "/dips" }
    ],
    related: ["tenderdash", "rust-dashcore", "drive-abci"]
  }
};

/* ---------- reveal stagger ---------- */
const revealElements = document.querySelectorAll(".card, .basebar");
revealElements.forEach((el, i) => el.style.setProperty("--i", i));

/* ---------- drawer ---------- */
const drawer = document.getElementById("drawer");
const scrim = document.getElementById("scrim");
const closeBtn = document.getElementById("drawer-close");
let lastFocus = null;
let closeTimer = null;

function openDrawer(id) {
  const d = DATA[id];
  if (!d) return;
  if (closeTimer !== null) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
  drawer.dataset.side = d.side;
  document.getElementById("drawer-kind").textContent = d.kind;
  document.getElementById("drawer-title").textContent = d.name;
  document.getElementById("drawer-crate").textContent = d.crate;
  document.getElementById("drawer-summary").textContent = d.summary;
  document.getElementById("drawer-facts").innerHTML =
    d.facts.map(f => `<li>${f}</li>`).join("");
  document.getElementById("drawer-links").innerHTML =
    d.links.map(l => `<li><a href="${l.href}">${l.label}</a></li>`).join("");
  document.getElementById("drawer-related").innerHTML =
    (d.related || []).filter(r => DATA[r])
      .map(r => `<button class="dh-btn dh-btn--sm" type="button" data-goto="${r}">${DATA[r].name}</button>`).join("");

  if (drawer.hidden) {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    scrim.hidden = false;
  }
  requestAnimationFrame(() => { drawer.classList.add("open"); scrim.classList.add("open"); });
  drawer.querySelector(".drawer-body").scrollTop = 0;
  document.querySelectorAll('body > :not(.drawer):not(.scrim):not(script)').forEach(el => { el.inert = true; });
  document.body.classList.add('details-open');
  closeBtn.focus();
}

function closeDrawer() {
  if (closeTimer !== null) clearTimeout(closeTimer);
  drawer.classList.remove("open");
  scrim.classList.remove("open");
  const done = () => {
    drawer.hidden = true;
    scrim.hidden = true;
    closeTimer = null;
  };
  matchMedia("(prefers-reduced-motion: reduce)").matches ? done() : closeTimer = setTimeout(done, 240);
  document.querySelectorAll('body > [inert]').forEach(el => { el.inert = false; });
  document.body.classList.remove('details-open');
  if (lastFocus) lastFocus.focus();
}

document.querySelectorAll("[data-id]").forEach(el =>
  el.addEventListener("click", () => openDrawer(el.dataset.id)));
document.getElementById("drawer-related").addEventListener("click", e => {
  const b = e.target.closest("[data-goto]");
  if (b) openDrawer(b.dataset.goto);
});
closeBtn.addEventListener("click", closeDrawer);
scrim.addEventListener("click", closeDrawer);
addEventListener("keydown", e => {
  if (drawer.hidden) return;
  if (e.key === "Escape") {
    closeDrawer();
    return;
  }
  if (e.key !== "Tab") return;

  const focusable = [...drawer.querySelectorAll('a[href], button:not([disabled])')];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first) return;
  if (e.shiftKey && (document.activeElement === first || !drawer.contains(document.activeElement))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

/* ---------- traces ---------- */
const TRACES = [
  { from: "drive-abci", to: "dapi", cls: "t-link" },
  { from: "dapi", to: "rs-sdk", cls: "t-link" },
  { from: "drive", to: "drive-verify", cls: "t-twin" },
  { from: "grovedb", to: "grovedb-verify", cls: "t-twin" },
  { from: "tenderdash", to: "proof-check", cls: "t-proof", route: "spine" }
];

const board = document.getElementById("board");
const svg = document.getElementById("traces");

function anchor(el, side) {
  const b = board.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const y = r.top - b.top + r.height / 2;
  const x = side === "right" ? r.right - b.left : r.left - b.left;
  return { x, y };
}

function drawTraces() {
  svg.innerHTML = "";
  if (innerWidth < 900) return;

  const b = board.getBoundingClientRect();
  svg.setAttribute("viewBox", `0 0 ${b.width} ${b.height}`);

  for (const t of TRACES) {
    const fromEl = document.querySelector(`[data-id="${t.from}"]`);
    const toEl = document.querySelector(`[data-id="${t.to}"]`);
    if (!fromEl || !toEl) continue;
    const a = anchor(fromEl, "right");
    const c = anchor(toEl, "left");
    const midX = (a.x + c.x) / 2;
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    if (t.route === "spine") {
      // dive into the center gap, run straight down it, then curve into the target
      p.setAttribute("d",
        `M ${a.x} ${a.y} C ${midX} ${a.y}, ${midX} ${a.y}, ${midX} ${a.y + 110}` +
        ` L ${midX} ${c.y - 110} C ${midX} ${c.y}, ${midX} ${c.y}, ${c.x} ${c.y}`);
    } else {
      p.setAttribute("d", `M ${a.x} ${a.y} C ${midX} ${a.y}, ${midX} ${c.y}, ${c.x} ${c.y}`);
    }
    p.setAttribute("class", t.cls);
    svg.appendChild(p);
  }
}

addEventListener("load", drawTraces);
addEventListener("resize", drawTraces);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawTraces);
revealElements[revealElements.length - 1]?.addEventListener("animationend", drawTraces, { once: true });
