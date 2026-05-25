// lib/standards.ts
// Registry of every contract standard the platform can audit, keyed by id.
// Each entry includes the chain it lives on, the audit focus the LLM agent
// should use, and metadata for the UI multi-select.
//
// Adding a new standard requires:
//   1) Append a STANDARD entry here.
//   2) Add the id to the relevant chain's `standards` array in lib/chains.ts.

import type { ChainId } from "./chains";
import type { ContractLanguage } from "./contract-language";

export interface StandardConfig {
  id: string;
  label: string;
  desc: string;
  chains: ChainId[];
  language: ContractLanguage;
  /** Agent name used both in the pipeline filter and the AgentReport.agentType column. */
  agentName: string;
  /** Security focus prompt sent to the LLM specialist agent. */
  focus: string;
}

export const STANDARDS: StandardConfig[] = [
  // ─── EVM / ERC ─────────────────────────────────────────────────────────
  // Also reachable on TRON (TVM) via TRC-20 / TRC-721 — those have their own
  // entries below to surface the TVM-specific gotchas, but for plain ERC
  // semantics on TRON these still apply.
  {
    id: "erc20",
    label: "ERC-20",
    desc: "Fungible Token",
    chains: ["ethereum", "bsc", "polygon", "avalanche", "arbitrum", "optimism", "base"],
    language: "solidity",
    agentName: "erc20_agent",
    focus: `ERC20 TOKEN VULNERABILITIES — only report if this contract implements or interacts with ERC20. Return [] if it does not.
  • approve() race condition: can an attacker front-run an approval change from N→M to spend both N and M? Missing increaseAllowance/decreaseAllowance = MEDIUM.
  • Missing return value: does the contract call external ERC20 transfer()/transferFrom() without checking the bool return? Tokens like USDT return no value — use SafeERC20.
  • Fee-on-transfer tokens: does the contract assume the received amount equals the sent amount? Actual received = sent - fee, breaking balance accounting = HIGH.
  • Rebasing tokens: does the contract snapshot balances that can change externally (e.g. stETH, AMPL)?
  • Infinite approval: does the contract request type(uint256).max approval from users unnecessarily? Phishing risk.
  • permit() (EIP-2612): is the deadline checked? Is the recovered signer validated against address(0)?
  • Deflationary token: can total supply change in ways that break invariants (fee burns, minting by owner)?
  • ERC20 transfer to address(0): does transfer/transferFrom allow burning to the zero address unintentionally?
  • Double-entry token: tokens with two storage slots for the same balance (e.g. cETH) — is balance read from the right slot?
  • Flash-mintable tokens: can total supply be inflated in one tx to exploit a share calculation?
  SEVERITY GUIDE: fund loss via missing return value or fee-on-transfer math = HIGH. Approval race = MEDIUM.`,
  },
  {
    id: "erc721",
    label: "ERC-721",
    desc: "NFT",
    chains: ["ethereum", "bsc", "polygon", "avalanche", "arbitrum", "optimism", "base"],
    language: "solidity",
    agentName: "erc721_agent",
    focus: `ERC721 NFT VULNERABILITIES — only report if this contract implements or interacts with ERC721. Return [] if it does not.
  • safeTransferFrom reentrancy: the receiver's onERC721Received() callback executes before state is finalized — can attacker re-enter to mint/transfer again? = CRITICAL.
  • setApprovalForAll phishing: is there protection against users being tricked into approving a malicious operator?
  • tokenId collision: can two tokens be minted with the same tokenId (missing _exists check or non-sequential IDs)?
  • Unrestricted mint: can anyone call mint() without payment or role check?
  • Integer overflow in tokenId counter: if using a uint256 counter, can it wrap? (pre-0.8 only)
  • Centralized tokenURI: is the base URI an off-chain server that the owner can change? Rug risk.
  • Missing ERC165 supportsInterface: does the contract correctly implement interface detection?
  • Royalty bypass: does the contract implement EIP-2981 royaltyInfo() — can marketplaces bypass it?
  • Batch mint gas griefing: can a whale mint thousands of tokens in one tx to block others?
  • Transfer to contract: safeTransferFrom to a contract that does not implement onERC721Received will revert — can this be used to lock tokens?
  SEVERITY GUIDE: reentrancy via callback enabling double-mint/drain = CRITICAL. Unrestricted mint = HIGH.`,
  },
  {
    id: "erc1155",
    label: "ERC-1155",
    desc: "Multi-Token",
    chains: ["ethereum", "bsc", "polygon", "avalanche", "arbitrum", "optimism", "base"],
    language: "solidity",
    agentName: "erc1155_agent",
    focus: `ERC1155 MULTI-TOKEN VULNERABILITIES — only report if this contract implements or interacts with ERC1155. Return [] if it does not.
  • Batch transfer reentrancy: onERC1155Received/onERC1155BatchReceived callbacks execute mid-transfer — can attacker re-enter safeBatchTransferFrom to double-spend balances? = CRITICAL.
  • Integer overflow in batch mint: does minting multiple token IDs in a loop overflow supply counters?
  • Missing balance check before burn: can a user burn tokens they don't own due to missing balanceOf check?
  • URI substitution: is the URI per-token-id validated? Can an attacker influence the URI to point to malicious metadata?
  • Approval scope: setApprovalForAll grants full control — is there a per-token-id approval missing that allows fine-grained control?
  • Fungible vs non-fungible confusion: if a token ID is used both as fungible (amount>1) and non-fungible (amount=1), can state be corrupted?
  • Missing supportsInterface for ERC1155Receiver: contracts receiving ERC1155 must implement the receiver interface or transfers revert.
  • Supply cap bypass: in games/NFT projects, can the per-ID supply cap be exceeded via batch operations?
  SEVERITY GUIDE: reentrancy enabling double-spend = CRITICAL. Supply overflow = HIGH.`,
  },
  {
    id: "erc4626",
    label: "ERC-4626",
    desc: "Tokenized Vault",
    chains: ["ethereum", "bsc", "polygon", "avalanche", "arbitrum", "optimism", "base"],
    language: "solidity",
    agentName: "erc4626_agent",
    focus: `ERC4626 TOKENIZED VAULT VULNERABILITIES — only report if this contract implements or interacts with ERC4626. Return [] if it does not.
  • First-depositor share inflation attack: if totalSupply is 0, can an attacker deposit 1 wei then donate assets to inflate the share price, causing later depositors to receive 0 shares? = CRITICAL.
  • Rounding direction: does convertToShares() round DOWN (correct for deposit) and convertToAssets() round DOWN (correct for withdrawal/mint)? Wrong rounding direction lets users extract dust repeatedly.
  • Missing slippage protection on deposit/withdraw/mint/redeem: no minShares/maxAssets parameter — front-running griefing = MEDIUM.
  • maxDeposit/maxWithdraw not enforced: if these return a limit, is it actually checked before processing?
  • Fee manipulation: if the vault charges a management/performance fee, can the fee rate be changed between deposit and withdrawal to extract user funds?
  • Asset/share decimal mismatch: if asset has 6 decimals (USDC) and shares have 18, does share math overflow or lose precision?
  • Reentrancy via ERC777 asset: if the underlying asset is an ERC777 token, hooks fire before state update — reentrancy risk.
  • Locked shares: can a user end up with shares they cannot redeem (e.g. if underlying asset is paused or blacklisted)?
  • totalAssets() manipulation: if totalAssets() reads from an external oracle or token balance, can it be manipulated in one tx?
  SEVERITY GUIDE: share inflation stealing depositor funds = CRITICAL. Rounding extraction = HIGH.`,
  },
  {
    id: "erc1967",
    label: "ERC-1967/UUPS",
    desc: "Upgradeable Proxy",
    chains: ["ethereum", "bsc", "polygon", "avalanche", "arbitrum", "optimism", "base"],
    language: "solidity",
    agentName: "erc1967_agent",
    focus: `ERC1967 PROXY / UUPS UPGRADE VULNERABILITIES — only report if this contract uses a proxy pattern (ERC1967, UUPS, TransparentUpgradeableProxy, OpenZeppelin upgradeable). Return [] if it does not.
  • Uninitialized implementation: if the implementation contract's initialize() is not called, can an attacker call it themselves and become owner, then selfdestruct the implementation to brick the proxy? = CRITICAL.
  • Missing _authorizeUpgrade override: in UUPS, if upgradeTo() is not overridden with an access check, anyone can upgrade to a malicious implementation = CRITICAL.
  • Storage collision: do the proxy and implementation use the same storage slot for different variables? ERC1967 uses specific slots — are they respected?
  • Constructor vs initializer: does the implementation use a constructor (runs only on implementation, not proxy) instead of initializer? State in constructor is invisible to proxy.
  • Re-initialization attack: can initialize() be called a second time after deployment? Missing initializer modifier check = HIGH.
  • Selfdestruct in implementation: does the implementation contain selfdestruct? Destroying the implementation bricks all proxies pointing to it = HIGH.
  • upgradeTo() input validation: is the new implementation address validated (not address(0), is a contract)?
  • Admin slot confusion (TransparentProxy): can a non-admin call implementation functions that collide with admin functions?
  • Gap variables: are storage gap arrays (__gap) present in base contracts to prevent storage collisions on upgrade?
  SEVERITY GUIDE: uninitialized implementation takeover = CRITICAL. Unguarded upgradeTo = CRITICAL.`,
  },
  {
    id: "erc1271",
    label: "ERC-1271",
    desc: "Contract Signatures",
    chains: ["ethereum", "bsc", "polygon", "avalanche", "arbitrum", "optimism", "base"],
    language: "solidity",
    agentName: "erc1271_agent",
    focus: `ERC1271 SMART CONTRACT SIGNATURE VULNERABILITIES — only report if this contract implements isValidSignature() or verifies signatures from smart contract wallets (ERC1271). Return [] if it does not.
  • Wrong magic value: does isValidSignature() return exactly bytes4(0x1626ba7e) on success? Returning true or 1 instead causes signature verification to fail silently.
  • Missing access control: can any external caller invoke isValidSignature() in a way that changes state or leaks info?
  • Signature replay across contracts: is the contract address included in the signed message hash? A signature valid for contract A must not be valid for contract B.
  • Missing nonce/expiry: can a valid signature be replayed indefinitely? Is there a nonce or expiry timestamp in the signed message?
  • EIP-712 domain separator: is the domain separator constructed with the correct chainId AND verifyingContract address? Missing either allows cross-chain or cross-contract replay.
  • Delegated signing: if isValidSignature() delegates to an owner that can change, can an attacker time the owner change to validate a signature the new owner never approved?
  • Signature over mutable data: if the signed message includes a value that can change (e.g. token price, nonce from another contract), can the meaning of the signature be altered after signing?
  • Gnosis Safe compatibility: if integrating with multisig wallets, does the contract handle the case where isValidSignature() reverts (should be treated as invalid, not bubble up)?
  SEVERITY GUIDE: signature forgery enabling fund theft = CRITICAL. Replay enabling unauthorized action = HIGH.`,
  },

  // ─── TON ───────────────────────────────────────────────────────────────
  {
    id: "tep74",
    label: "TEP-74",
    desc: "Jetton (Fungible Token)",
    chains: ["ton"],
    language: "func",
    agentName: "tep74_agent",
    focus: `TON SMART-CONTRACT VULNERABILITIES (Jetton/TEP-74 focus). Audit the contract for ALL TON security issues. If the contract IS a Jetton master/wallet, emphasize the Jetton-specific items below. If not, still report any general TON safety bugs you find (sender auth, bounce handling, op-code uniqueness, storage rent).
  • Sender authentication: does recv_internal() validate sender via in_msg_full cell parsing, or trust the message body blindly? Anyone can craft a message with arbitrary "from" addresses if not validated.
  • Jetton wallet address derivation: is the destination wallet address computed deterministically from owner_address + jetton_master? Mismatched derivation lets attackers transfer to addresses they control.
  • Forward TON amount: when a transfer carries a "forward_ton_amount", does the contract correctly forward this to the destination, or can it be drained?
  • Mint authorization: in the Jetton master, is op::mint gated on equal_slices(sender, admin_address)? Missing check = anyone can mint.
  • Balance underflow: in jetton_wallet, balance -= amount without checking balance >= amount = CRITICAL (TVM ints are 257-bit signed, can go negative).
  • Bounce handling: are bounced messages (op::excesses, op::internal_transfer) handled to restore balance on failed forward? Missing = funds permanently lost.
  • op-code collisions: are op-codes for internal_transfer (0x178d4519), excesses (0xd53276db), burn_notification (0x7bdd97de) used per TEP-74, or custom ints that may collide with future standards?
  • Workchain ID validation: does the contract reject foreign workchain addresses where unsafe (most Jettons are workchain-0 only)?
  • Gas / storage fees: is reserve_value enough to cover storage rent? Insufficient reserve = wallet may be deleted by the chain.
  • External message handling: does recv_external() (if present) require signature + nonce? Missing nonce = replay.
  SEVERITY GUIDE: anyone-can-mint = CRITICAL. Balance underflow = CRITICAL. Missing bounce handling losing funds = HIGH.`,
  },
  {
    id: "tep62",
    label: "TEP-62",
    desc: "NFT Item & Collection",
    chains: ["ton"],
    language: "func",
    agentName: "tep62_agent",
    focus: `TON SMART-CONTRACT VULNERABILITIES (NFT/TEP-62 focus). Audit the contract for ALL TON security issues. If the contract IS an NFT Collection or Item, emphasize the NFT-specific items below. If not, still report any general TON safety bugs you find.
  • Owner verification on transfer: does op::transfer (0x5fcc3d14) check equal_slices(sender, owner_address) BEFORE updating owner_address? Missing check = anyone can transfer any NFT.
  • Collection mint authorization: only the collection owner should be able to deploy new NFT items. Is this enforced via sender check + correct StateInit deployment?
  • Royalty parameters: when handling op::get_royalty_params (0x693d3950), does the contract return the correct factor/base, and are these fields immutable (or guarded if mutable)?
  • Editable content: does the contract support content edit by anyone? Should be owner-only or collection-owner-only.
  • Index uniqueness: in collection, can the same index be minted twice? Off-by-one in mint sequence?
  • Forwarding payload: when transferring, is forward_payload correctly relayed to the new owner, and is forward_ton_amount validated to not exceed msg_value - storage?
  • State migration on transfer: after transfer, is content cell preserved, or can the new owner unexpectedly lose metadata?
  • Bounce-back: when an op::transfer to an invalid destination bounces back, is the previous owner restored? Missing bounce handler = NFT permanently stuck.
  • Get-methods correctness: do get_nft_data() and get_collection_data() return tuples in the exact TEP-62 order? Marketplace breakage if wrong.
  SEVERITY GUIDE: anyone-can-transfer = CRITICAL. Mint without authorization = HIGH. NFT stuck on bounce = HIGH.`,
  },

  // ─── Solana ────────────────────────────────────────────────────────────
  {
    id: "spl",
    label: "SPL Token",
    desc: "Solana Fungible Token",
    chains: ["solana"],
    language: "rust",
    agentName: "spl_agent",
    focus: `SOLANA PROGRAM VULNERABILITIES (SPL Token focus). Audit the ENTIRE program for ALL Solana security issues — missing signer checks, missing owner checks, account confusion, CPI safety, PDA seed collisions, rent exemption, close-account safety, integer overflow (u64), authority/freeze abuse. The SPL-token-specific items below apply if the program actually creates/transfers SPL tokens; otherwise still report the general Solana program safety issues you find.
  • Missing signer check: does every privileged instruction require Signer<'info> on the authority account? Missing #[account(signer)] or has_one = authority = CRITICAL (anyone can call).
  • Missing owner check: does the program check ctx.accounts.token_account.owner == &spl_token::id()? Without it, attacker passes a fake account.
  • Account confusion: does the program rely on account address only, never deserializing/checking discriminator? Anchor handles this via #[account] discriminators — bare AccountInfo bypasses it.
  • CPI to user-controlled program: any invoke()/invoke_signed() where the target program_id comes from accounts list without whitelist check? Arbitrary code execution.
  • PDA seed collision: are seeds for find_program_address unique per account type? Reusing seeds across different account categories = takeover risk.
  • Missing rent-exempt check: when creating accounts, is rent.is_exempt(lamports, data_len) verified? Non-exempt accounts get garbage-collected → fund loss.
  • Close-account safety: does close_account() send rent lamports to a user-controlled address before zeroing data? If yes, attacker can re-init the freed account with attacker-controlled state.
  • Integer overflow: SPL Token amounts are u64. Are checked_add/checked_sub used, or raw + and -? Solana doesn't auto-revert on overflow.
  • Mint authority renounce: if the mint_authority is set to None (renounced), is the program logic safe with no future mints? Or does it silently assume mints can happen?
  • Freeze authority abuse: if freeze_authority is set, can it be used to freeze attacker-victim accounts arbitrarily?
  • Transfer to self / zero amount: does the program reject self-transfers or zero-amount transfers that could be used for griefing or to confuse downstream logic?
  SEVERITY GUIDE: missing signer/owner check on fund-moving instruction = CRITICAL. Arbitrary CPI = CRITICAL. PDA collision = HIGH.`,
  },
  {
    id: "metaplex",
    label: "Metaplex NFT",
    desc: "Solana NFT Standard",
    chains: ["solana"],
    language: "rust",
    agentName: "metaplex_agent",
    focus: `SOLANA PROGRAM VULNERABILITIES (Metaplex NFT focus). Audit the ENTIRE program for ALL Solana security issues. The Metaplex-specific items below apply only if the program touches mpl-token-metadata / candy-machine / auction-house; otherwise still report the general Solana program safety issues you find.
  • Update authority validation: does the program verify the update_authority signer before mutating Metadata account? Missing = anyone can rewrite name, symbol, URI, royalties.
  • is_mutable flag bypass: once is_mutable is set to false, is the contract guaranteed never to call update_metadata_accounts*? Any path that ignores this flag = HIGH.
  • Creator share split: does sum of share % across creators array == 100? Off-by-one or wrong sum = royalties paid incorrectly.
  • verified flag: when adding a creator, is sign_metadata called with the creator's signature, or is verified=true set by the program itself (creator-impersonation)?
  • Candy Machine collection_mint: is the collection_mint set + verified after mint, otherwise the NFT is not part of the collection (marketplace breakage)?
  • Burn-and-mint: in burn_and_mint flows, does the program verify the burned NFT belongs to the user (token account + amount == 1)?
  • Master Edition supply: for Limited/Numbered editions, is the max_supply enforced atomically, or can two parallel mints exceed it?
  • Auction House escrow drain: in execute_sale, are token transfer + sol transfer + fee transfer all atomic? A failure between them leaves escrow imbalanced.
  • Auction House withdraw: does withdraw require the seller signer, or does any account holder unlock the escrow?
  • Reentrancy via CPI to fake program: does the program use invoke_signed with a hardcoded mpl_token_metadata::id() check, or accept the program_id from accounts list?
  SEVERITY GUIDE: rewriting metadata/URI without authority = CRITICAL. Royalty bypass = HIGH. Creator impersonation = HIGH.`,
  },

  // ─── Bitcoin ───────────────────────────────────────────────────────────
  {
    id: "brc20",
    label: "BRC-20",
    desc: "Bitcoin Fungible Inscription",
    chains: ["bitcoin"],
    language: "json-inscription",
    agentName: "brc20_agent",
    focus: `BITCOIN INSCRIPTION VULNERABILITIES (BRC-20 focus). Audit the inscription payload for ALL safety issues. If it IS a BRC-20 deploy/mint/transfer, emphasize the BRC-20-specific items below. If it's a different inscription format (Runes, Ordinals, custom), still report any general validity/safety issues you find (malformed JSON, unsafe content, suspicious patterns).
  • Operation validity: is "op" one of {"deploy","mint","transfer"}? Unknown ops are silently ignored by indexers — confusion attack.
  • Tick length: BRC-20 tick must be exactly 4 bytes after UTF-8 encoding. Longer/shorter = inscription is invalid but may be confused with valid tickers (homograph attack).
  • Case sensitivity: tick is case-insensitive in indexers. "USDT" and "usdt" collide — using mixed case to look unique is a deception pattern.
  • Numeric overflow: max ("max") and limit ("lim") fields must be ≤ 2^64 - 1 (uint64). Values beyond this overflow most indexers silently.
  • Supply math: in mint, does (current_supply + amount) > max? Excess mints are invalid but get inscribed anyway — wasted sats, user confusion.
  • Per-mint limit: does "amt" in a mint exceed the "lim" set at deploy? Indexer rejects but the inscription cost is lost.
  • Decimals: BRC-20 default dec=18. Non-standard dec values cause integer vs decimal confusion in downstream wallets.
  • Self-transfer pattern: transferring 0 amount, or transferring to the inscription owner's own address, is valid but a known griefing/spam pattern.
  • UTXO finalization: BRC-20 transfer requires a 2-step inscribe-then-send. Inscribing without sending leaves a stuck balance reservation — describe but don't auto-flag unless amount is large.
  • Frontrunning deploy: anyone can deploy any tick first — describe risk of impersonation/squatting if user is deploying a brand-name tick.
  SEVERITY GUIDE: invalid JSON / unrecognized op leading to lost sats = HIGH. Mint exceeding max/lim = HIGH (will be ignored by indexers). Squatting risk = MEDIUM advisory.`,
  },
  {
    id: "runes",
    label: "Runes",
    desc: "Bitcoin Rune Etching/Mint",
    chains: ["bitcoin"],
    language: "json-inscription",
    agentName: "runes_agent",
    focus: `BITCOIN INSCRIPTION VULNERABILITIES (Runes focus). Audit the payload for ALL safety issues. If it IS a Runes etching/mint/transfer (Runestone), emphasize the Runes-specific items below. If it's a different format, still report any general validity/safety issues you find.
  • Rune name validity: rune name must be A-Z only, length 1-26, no spaces/numbers. Invalid name = etching ignored, sats lost.
  • Symbol must be a single Unicode code point. Multi-char symbols are silently truncated/invalidated.
  • Divisibility (decimals) range: 0-38. Values outside = invalid etching.
  • Premine + terms.amount + terms.cap math: (premine + cap * amount) MUST fit in uint128. Overflow = etching invalid.
  • Spacers: spacer positions are encoded in a bitmask — verify that spacer indices < name length.
  • Open mint window: terms.height = [start, end). If start >= end or end <= current_block, mint is permanently closed — describe if user expects mintable.
  • Mint amount: each mint produces exactly terms.amount. If terms.amount = 0, mints succeed but produce 0 runes — pure griefing.
  • OP_RETURN size: Runestone protocol uses OP_RETURN with limited size. Large arrays of edicts (>~78 bytes encoded) get rejected by standard relay policy.
  • Edict targeting: edicts reference outputs by index. If output index doesn't exist, edicts default to runic output 0 — accidental allocation.
  • Cenotaph (malformed runestone): any field not parsing exactly per protocol turns the entire tx into a cenotaph (runes burned). High-stakes etching with malformed fields = loss.
  SEVERITY GUIDE: cenotaph causing burn of runes = CRITICAL. Invalid etching wasting fees = HIGH. Permanently-closed mint window with user expecting open = HIGH.`,
  },
  {
    id: "ordinals",
    label: "Ordinals",
    desc: "Bitcoin Ordinal Inscription",
    chains: ["bitcoin"],
    language: "json-inscription",
    agentName: "ordinals_agent",
    focus: `BITCOIN ORDINALS INSCRIPTION VULNERABILITIES. Audit the inscription payload for ALL safety issues. The Ordinals-specific items below apply most directly to inscription content + content-type analysis; if the input is BRC-20 or Runes specifically, still surface any payload-level risks you find (malicious JS, off-chain refs, plaintext secrets, etc.).
  • Content-type: is the MIME type valid and what the inscription actually contains? Mismatch (e.g. content-type image/png but body is HTML/JS) is used to bypass marketplace previews.
  • Malicious HTML/JS payload: inscriptions of text/html or application/javascript can execute in marketplace viewers — XSS-like risk. Flag any <script>, onerror=, eval(, fetch(.
  • External resource references: does the inscription link to off-chain URLs (img src=https://..., fetch())? These can be modified later — undermines "immutable on-chain" claim.
  • Postage / dust: is the inscription on a sat with adequate postage (typically 546-10k sats)? Below dust = unspendable. Above 10k = wasted.
  • Cursed inscription detection: was this inscription created via a path that makes it "cursed" (negative inscription number) — multiple inputs, opcode in middle, etc.? Marketplace behavior differs.
  • Reinscription on the same sat: re-inscribing a sat that already has an inscription produces a child inscription — confirm intent, since most marketplaces only display the parent.
  • Metaprotocol field: if "p" / metaprotocol is set, does the protocol exist (sns, brc-20, brc-420)? Unknown metaprotocol is ignored = inscription is "just data".
  • Provenance / parent: parent inscription IDs must exist and be owned by the same UTXO at inscription time. Missing/invalid parent = unparented.
  • Delegate field: if delegate references another inscription, that inscription's content must be valid and accessible. Broken delegate = empty/blank rendering.
  • Inscribing private key material: detect strings matching xprv/private keys/seed phrases in plaintext content — accidental on-chain leak.
  SEVERITY GUIDE: executable content (HTML/JS) that exfiltrates wallet via marketplace viewer = CRITICAL. Off-chain image src claiming on-chain immutability = HIGH. Plaintext keys/seeds in content = CRITICAL.`,
  },

  // ─── TRON ──────────────────────────────────────────────────────────────
  {
    id: "trc20",
    label: "TRC-20",
    desc: "TRON Fungible Token",
    chains: ["tron"],
    language: "solidity",
    agentName: "trc20_agent",
    focus: `TRC-20 (TRON) TOKEN VULNERABILITIES — only report if this contract implements or interacts with TRC-20 (TRON's TVM, Solidity-flavored). Return [] if it is not.
  • TVM vs EVM gas semantics: TRON uses Energy + Bandwidth, not gas. Loops sized for EVM gas limit may exhaust Energy on TRON differently. Flag any function with unbounded loops.
  • SUN vs Wei: TRX has 6 decimals (1 TRX = 1,000,000 SUN). Code copy-pasted from EVM that uses 10^18 (Wei) will be off by 12 orders of magnitude — CRITICAL fund-misrouting bug.
  • address.send / address.transfer: on TRON these forward 0 energy (not 2300 gas). Contracts that rely on "transfer always succeeds for EOAs" may fail unexpectedly.
  • TRC-10 vs TRC-20 confusion: TRC-10 tokens are native (created via createToken), TRC-20 are contracts. Functions calling tokenBalance(tokenId) instead of IERC20(addr).balanceOf() will fail silently.
  • approve() race condition: same EVM approval-race vulnerability applies. Missing increaseAllowance/decreaseAllowance = MEDIUM.
  • Missing return value: TRC-20 transfer/transferFrom may not return bool on some tokens (USDT-TRON is non-standard). Use TRC-20-safe wrappers.
  • Frozen-balance interaction: TRX can be frozen for bandwidth/energy. Contracts that read user balance without accounting for frozen amounts may compute wrong totals.
  • Owner / Active permissions: TRON accounts have multi-permission. A contract that checks msg.sender == owner ignores delegate-permissioned callers.
  • Block.timestamp resolution: TRON blocks are ~3s. Time-locked logic using block.timestamp behaves the same but DoS via late block production differs.
  • selfdestruct: behaves the same on TVM. Unprotected = CRITICAL.
  SEVERITY GUIDE: decimal/unit mismatch causing fund misrouting = CRITICAL. Permission bypass = HIGH.`,
  },
  {
    id: "trc721",
    label: "TRC-721",
    desc: "TRON NFT Standard",
    chains: ["tron"],
    language: "solidity",
    agentName: "trc721_agent",
    focus: `TRC-721 (TRON) NFT VULNERABILITIES — only report if this contract implements TRC-721. Return [] if it does not.
  • All ERC-721 issues apply: safeTransferFrom reentrancy via onERC721Received, setApprovalForAll phishing, missing _exists check, unrestricted mint, centralized tokenURI rug, integer overflow in tokenId counter (pre-0.8 only).
  • TVM-specific: TRON's onERC721Received handler runs with Energy cap, not gas — a malicious receiver burning Energy can DoS minting flows differently than EVM.
  • Multi-permission ownership: NFT contract owner that uses msg.sender == owner ignores TRON multi-sig active permission — admin actions may be unexpectedly callable by delegates.
  • tokenURI gateway: if tokenURI returns an HTTPS URL hosted on a centralized server, the project owner can rug or front-run reveal. Same as EVM but TRON projects often use TronGrid which is fully centralized.
  • Royalty: TRON has no native royalty enforcement. EIP-2981 royaltyInfo() implemented here is advisory only — marketplaces ignore it freely.
  • Fee-on-transfer assumptions: TRC-20 fee-on-transfer tokens used as payment for minting will under-pay. Always re-check received amount.
  • TRX deposit during mint: contracts that accept TRX via payable need require(msg.value == price) — under TRON's energy model, msg.value can still be 0 if user calls without sending TRX.
  • Batch mint: same gas/energy griefing risks as EVM — bound any loop.
  SEVERITY GUIDE: reentrancy via callback enabling double-mint/drain = CRITICAL. Unrestricted mint = HIGH. Permission bypass on admin = HIGH.`,
  },

  // ─── Cosmos ────────────────────────────────────────────────────────────
  {
    id: "ibc",
    label: "IBC",
    desc: "Inter-Blockchain Communication",
    chains: ["cosmos"],
    language: "cosmwasm",
    agentName: "ibc_agent",
    focus: `COSMWASM CONTRACT VULNERABILITIES (IBC focus). Audit the contract for ALL CosmWasm security issues — entry-point authorization (instantiate/execute/migrate/sudo), reply-handler reentrancy, missing admin checks, integer overflow (Uint128/Uint256 checked arithmetic), denom/coin handling. The IBC-specific items below apply only if the contract uses ibc_packet_receive / ibc_channel_open / ibc_packet_ack / ibc_packet_timeout; otherwise still report any general CosmWasm safety bugs you find.
  • Channel ordering: does the contract correctly handle Ordered vs Unordered channels? Mis-handling ordered channels can deadlock the channel.
  • Packet replay: does the contract trust packet content without checking the source channel/port? Cross-chain replay across channels is possible if the destination doesn't bind to a specific source channel.
  • Acknowledgement handling: in ibc_packet_ack, does the contract handle both success and error acknowledgements? Treating error-ack as success = state corruption.
  • Timeout cleanup: in ibc_packet_timeout, are funds refunded to the original sender? Missing refund = permanent loss across chain.
  • Counterparty version check: in ibc_channel_open / ibc_channel_connect, is the counterparty version string validated? Skipping = channel opens to incompatible protocols.
  • Trusted clients only: does the contract pin the source chain via client_id + connection_id, or accept any incoming packet on the port?
  • Memo field deserialization: if the packet memo is parsed (e.g. ICS-20 forward), is JSON parsing bounded? Malformed memo = panic = packet stuck.
  • Fee on relay: ICS-29 fee escrow — if implemented, does the contract handle relayer fee paid out only on actual delivery, not on registration?
  • Bridging arithmetic: tokens crossing chains have different decimals + supply caps. Are mint/burn amounts checked against per-channel rate limits?
  • Light-client trust: relying on a frozen / expired client = HIGH. Frozen client allows submission of arbitrary state proofs.
  SEVERITY GUIDE: cross-chain replay enabling double-spend = CRITICAL. Missing refund on timeout = CRITICAL. Frozen light client trust = HIGH.`,
  },
  {
    id: "ics",
    label: "ICS Standards",
    desc: "Interchain Standards (ICS-20, ICS-27, ICS-721)",
    chains: ["cosmos"],
    language: "cosmwasm",
    agentName: "ics_agent",
    focus: `COSMWASM CONTRACT VULNERABILITIES (ICS-20/27/721 focus). Audit the contract for ALL CosmWasm security issues. The ICS-specific items below apply only if the contract implements ICS-20 (fungible token transfer), ICS-27 (interchain accounts), or ICS-721 (NFT transfer); otherwise still report general CosmWasm safety bugs.
  • ICS-20 denom trace: does the contract correctly prefix/strip the source port and channel from the denom on receive/send? Mis-prefixing creates duplicate denoms = inflation.
  • ICS-20 forward (PFM): if memo contains "forward", is the next-hop port/channel validated? Forward loops between chains can drain fees.
  • ICS-20 escrow accounting: each (channel, denom) maintains an escrow balance. Burn/mint must be exactly offset by escrow lock/release. Drift = unbacked tokens.
  • ICS-27 host authentication: does the host contract validate that incoming interchain account messages originate from the correct controller chain + connection?
  • ICS-27 message whitelist: does the host restrict which Cosmos SDK messages can be executed via the interchain account? Unrestricted = remote chain can govern the host.
  • ICS-721 class data preservation: does the receiver preserve the original NFT's class data and token URIs when minting the IBC voucher?
  • ICS-721 reflexive transfers: when returning an NFT to its home chain, is the voucher burned and the original unlocked atomically?
  • Channel close on error: do error paths properly close channels via ibc_channel_close, releasing escrowed funds?
  • Memo size / parsing DoS: large memo fields can panic the contract — bound deserialization.
  • Denom hash collisions: ibc/<hash>(denom_trace) — same hash for different traces would be a SHA-256 collision (not feasible) but DO check that denom_trace strings are normalized before hashing.
  SEVERITY GUIDE: escrow drift creating unbacked tokens = CRITICAL. ICS-27 unrestricted message execution = CRITICAL. ICS-20 forward loop draining fees = HIGH.`,
  },

  // ─── Polkadot ──────────────────────────────────────────────────────────
  {
    id: "xcm",
    label: "XCM",
    desc: "Cross-Consensus Messaging",
    chains: ["polkadot"],
    language: "ink",
    agentName: "xcm_agent",
    focus: `POLKADOT/SUBSTRATE CONTRACT VULNERABILITIES (XCM focus). Audit the contract for ALL ink!/Substrate security issues — storage layout migration safety on set_code_hash, integer arithmetic (checked_*), event indexing, cross-contract call result handling. The XCM-specific items below apply only if this pallet/contract constructs/executes/barriers XCM messages; otherwise still report any general ink! safety bugs you find.
  • Origin conversion: when converting a MultiLocation origin into a local AccountId, is the conversion deterministic and collision-free across sibling parachains? AliasOrigin abuse can spoof.
  • BuyExecution weight: does the contract / pallet require BuyExecution before any compute-heavy instruction? Missing = relay can be DoS'd by free-execution messages.
  • DepositAsset target: does DepositAsset use a Beneficiary that the originating origin actually controls? Untrusted beneficiaries = fund theft.
  • Reserve trust: WithdrawAsset + InitiateReserveWithdraw — are the reserves trusted parachains, or any incoming claim accepted? Untrusted reserve = unbacked mint.
  • Asset filter wildcards: All / Wild filters in DepositAsset/InitiateTeleport — do they correctly capture only intended assets, or can they drain unrelated holdings?
  • XCM v2 → v3 → v4 migration: NetworkId variants and MultiLocation parents/interior changed across versions. Hardcoded versions can mis-route after a runtime upgrade.
  • Barrier configuration: AllowTopLevelPaidExecutionFrom, TakeWeightCredit — do barriers correctly reject unpaid messages from untrusted origins?
  • Transact call: encoded call_index + args — is decoding safe on the destination runtime, or can a malicious encoded call cause panic?
  • Asset trap recovery: trapped assets can be claimed by anyone via ClaimAsset using the original hash. If the original sender isn't required, attackers can steal trapped value.
  • Reentrancy via XCM callback: parachains processing async XCM responses (QueryResponse) — is state updated before the response, or can a malicious response re-enter?
  SEVERITY GUIDE: origin spoofing enabling unauthorized transact = CRITICAL. Untrusted reserve creating unbacked mints = CRITICAL. Asset trap theft = HIGH.`,
  },
  {
    id: "psp",
    label: "PSP-22 / PSP-34",
    desc: "Polkadot Standards (Token / NFT)",
    chains: ["polkadot"],
    language: "ink",
    agentName: "psp_agent",
    focus: `POLKADOT/SUBSTRATE CONTRACT VULNERABILITIES (PSP-22/PSP-34 focus). Audit the contract for ALL ink! security issues. The PSP-22/34-specific items below apply only if this ink! contract implements PSP-22 (token) or PSP-34 (NFT); otherwise still report any general ink! safety bugs you find.
  • Approval race condition (PSP-22): same as ERC-20 — approve(N) then approve(M) lets spender extract N+M. PSP-22 spec includes increase_allowance/decrease_allowance — flag if missing or unused by callers.
  • Reentrancy via PSP-22 callback: PSP-22 spec allows a transfer_acceptor hook on receiving contracts. Does the token's transfer update balances BEFORE calling the hook? Otherwise reentrancy can double-spend.
  • Owner of NFT (PSP-34): is the owner check done atomically with the transfer, or can a TOCTOU window let stale ownership pass?
  • Mint authorization: in PSP-22 mint or PSP-34 mint, is access control via ink::contract role / ownable extension correctly applied? Default ink! does not enforce anything.
  • Trait imports: PSP standards rely on openbrush crate or local trait copies. If the trait is partially implemented (missing transfer_from while transfer exists), token is fundamentally broken — flag.
  • Storage layout collision on upgrade: ink! contracts upgraded via set_code_hash must preserve storage layout. New fields without packed/lazy migration = data corruption.
  • Integer overflow: ink! uses Rust — overflow panics in debug, wraps in release. Use checked_add/checked_sub explicitly. Raw +/- on Balance = potential silent overflow in release builds.
  • Event indexing: PSP-22 Transfer event has indexed from/to/value. If indexed wrong (or events not emitted at all), off-chain indexers see broken state.
  • Cross-contract calling: invoking another contract's PSP-22 transfer without checking the returned Result = silent failure, contract believes the transfer succeeded.
  • Balance vs allowance: in transfer_from, does the contract decrement allowance AFTER calling _transfer? If _transfer reverts, allowance decrements anyway in some implementations — fix order.
  SEVERITY GUIDE: reentrancy via transfer_acceptor draining funds = CRITICAL. Missing access control on mint = CRITICAL. Silent failure of cross-contract transfer = HIGH.`,
  },
];

const STANDARDS_BY_ID = new Map(STANDARDS.map(s => [s.id, s]));

export function getStandard(id: string | null | undefined): StandardConfig | undefined {
  if (!id) return undefined;
  return STANDARDS_BY_ID.get(id.toLowerCase());
}

/** All standards available on a given chain, in registry order. */
export function standardsForChain(chainId: string): StandardConfig[] {
  return STANDARDS.filter(s => s.chains.includes(chainId.toLowerCase() as ChainId));
}
