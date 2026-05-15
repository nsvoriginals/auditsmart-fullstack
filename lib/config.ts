// lib/config.ts
import {
  IS_PRODUCTION_PRICING,
  PLAN_DETAILS,
  PLAN_FEATURES,
  PLAN_LIMITS,
  type PublicPlan,
} from "@/lib/plans";

export const config = {
  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  RAZORPAY_TEST_MODE: process.env.NODE_ENV !== 'production',

  // API Keys for AI Agents
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',

  CLAUDE_HAIKU_MODEL: process.env.CLAUDE_HAIKU_MODEL || 'claude-haiku-4-5-20251001',
  CLAUDE_SONNET_MODEL: process.env.CLAUDE_SONNET_MODEL || 'claude-sonnet-4-6',
  CLAUDE_OPUS_MODEL: process.env.CLAUDE_OPUS_MODEL || 'claude-opus-4-7',

  // Gemini models — read from env, fall back to stable non-experimental model
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  GEMINI_FLASH_MODEL: 'gemini-1.5-flash',

  GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  GROQ_FALLBACK_MODEL: "llama-3.1-70b-versatile",

  // ✅ FIXED: Reduced timeouts for better UX
  AGENT_TIMEOUT_SECONDS: 30,
  CLAUDE_TIMEOUT_SECONDS: 60,

  // Token Limits
  GROQ_MAX_TOKENS: 2000,
  GEMINI_MAX_TOKENS: 4000,

  // PDF Generation
  PDF_ENABLED: process.env.PDF_ENABLED !== 'false',

  MAX_CONTRACT_SIZE: 50000,
  FREE_PLAN_AUDIT_LIMIT: 3,

  RISK_THRESHOLDS: {
    critical: 70,
    high: 40,
    medium: 20,
    low: 5,
  },
};

export const PLAN_PRICES_PAISE = {
  free: PLAN_DETAILS.free.amountInPaise,
  pro: PLAN_DETAILS.pro.amountInPaise,
  enterprise: PLAN_DETAILS.enterprise.amountInPaise,
  deep_audit: PLAN_DETAILS.deep_audit.amountInPaise,
};

export { PLAN_FEATURES };
export const PLAN_AUDIT_LIMITS = PLAN_LIMITS;

export const AGENT_CONFIGS = [
  {
    name: "reentrancy_agent",
    focus: `REENTRANCY VULNERABILITIES — check ALL of the following:
  • Does any function make an external call (.call{value:}, .transfer, .send, IERC20.transfer, IERC20.transferFrom, NFT.safeTransferFrom) BEFORE updating state variables (balances, flags, counters)?
  • Classic Reentrancy: attacker contract's fallback/receive re-enters withdraw() before balance is set to 0.
  • Cross-function Reentrancy: attacker re-enters a DIFFERENT function (not the one being called) that reads the not-yet-updated state.
  • Read-only Reentrancy: a view function is called mid-execution and returns stale state that another protocol uses for pricing.
  • Missing ReentrancyGuard on any function that (a) transfers ETH or ERC20 AND (b) reads/writes state.
  • Look specifically at: withdraw(), redeem(), claim(), harvest(), exit(), flashLoan(), swap(), repay() functions.
  SEVERITY GUIDE: Any fund-draining reentrancy = CRITICAL. State corruption without fund drain = HIGH.`,
  },
  {
    name: "overflow_agent",
    focus: `INTEGER ARITHMETIC VULNERABILITIES — check ALL of the following:
  • Solidity version: if <0.8.0, is SafeMath used for EVERY arithmetic operation on user-controlled values?
  • Underflow: balances[user] -= amount without prior require(balances[user] >= amount) check = CRITICAL if Solidity <0.8.
  • Overflow: any multiplication of user-supplied values that could exceed type(uint256).max?
  • Solidity ≥0.8.0 with unchecked{} blocks: is each unchecked block provably safe? Unchecked subtraction on a value that CAN go below 0 = CRITICAL.
  • Precision loss: is division performed before multiplication? (a/b*c loses precision; correct is a*c/b)
  • Off-by-one: loop bounds using < vs <=, array index starting at 0 vs 1.
  • Type casting: uint256 → uint128 → uint64 truncation of user values?
  • Share/ratio calculations: can first depositor manipulate share price by depositing 1 wei?
  SEVERITY GUIDE: arithmetic that lets user steal or lock funds = CRITICAL/HIGH.`,
  },
  {
    name: "access_control_agent",
    focus: `ACCESS CONTROL VULNERABILITIES — check ALL of the following:
  • Missing onlyOwner/onlyRole on: mint(), burn(), setOwner(), transferOwnership(), pause(), unpause(), setFee(), setTreasury(), withdraw(), emergencyWithdraw(), upgradeTo(), initialize(), setOracle(), addMinter().
  • Re-initialization attack: can initialize() or __init() be called a second time after deployment?
  • Ownership to address(0): can transferOwnership(address(0)) succeed, permanently locking admin functions?
  • Two-step ownership: for high-value contracts, is ownership transfer a two-step process (propose + accept)?
  • Role escalation: can a lower-privilege role grant itself a higher role?
  • tx.origin authentication: is tx.origin used instead of msg.sender? Phishing attack possible.
  • Modifier correctness: does the modifier actually revert on failure, or does it silently pass?
  • Missing input validation on privileged setters: fee set to 100%, address set to address(0), etc.
  SEVERITY GUIDE: anyone can mint/steal/destroy = CRITICAL. Admin can rug-pull = HIGH.`,
  },
  {
    name: "logic_agent",
    focus: `BUSINESS LOGIC & STATE MACHINE VULNERABILITIES — check ALL of the following:
  • Can a user withdraw more than they deposited? (incorrect balance tracking)
  • Can functions be called in the wrong order? (e.g. claim() before stake(), finalize() before deadline)
  • Missing zero-address checks: if an address parameter is 0x0, does it break fund routing?
  • Missing balance checks before transfers: transfer(to, amount) without require(balance >= amount).
  • Rounding error exploitation: repeated small deposits/withdrawals to accumulate rounding dust?
  • Incorrect state after failed external calls: does a failed call leave the contract in a broken state?
  • Event emission mismatch: events emitted with wrong values, enabling off-chain monitoring to be deceived.
  • Immutable values set in constructor: can critical params be set to zero or wrong value with no recovery?
  • Fee bypass: can fee calculation be gamed to pay zero fees?
  • Emergency functions: can emergencyWithdraw/pause be called by anyone? Can attacker force-pause?
  SEVERITY GUIDE: direct fund extraction = CRITICAL. Permanent lock = HIGH. Logic bypass = MEDIUM.`,
  },
  {
    name: "gas_dos_agent",
    focus: `DENIAL OF SERVICE & GAS VULNERABILITIES — check ALL of the following:
  • Unbounded loops: for(uint i = 0; i < users.length; i++) where users is a dynamic array that grows = DoS risk.
  • Push-payment pattern: sending ETH to each recipient in a loop — one failing recipient blocks all others.
  • External calls in loops: any .call(), token.transfer(), or interface call inside a for/while loop?
  • Block gas limit: if an array grows to 1000+ elements, can the loop exceed 30M gas?
  • Griefing: can attacker add their malicious contract to an array to permanently revert loop execution?
  • Self-destruct griefing: can an attacker force-send ETH to break a require(address(this).balance == 0) check?
  • Frontrunning + DoS: can attacker frontrun to make a transaction revert (e.g. token allowance to 0)?
  • Storage DoS: can an attacker fill unbounded mappings/arrays to inflate gas costs for others?
  SEVERITY GUIDE: permanent function lock = HIGH. Temporary griefing = MEDIUM.`,
  },
  {
    name: "defi_agent",
    focus: `DeFi PROTOCOL VULNERABILITIES — check ALL of the following:
  • Spot price oracle: does the contract read price from UniswapV2/V3 reserves in a single transaction? Flash-loan manipulable = CRITICAL.
  • Chainlink oracle: is there a staleness check? require(block.timestamp - updatedAt <= heartbeat). Missing = HIGH.
  • First-depositor inflation attack: in vault/ERC4626, can first depositor deposit 1 wei to skew share price?
  • Flash loan attack vectors: can an attacker borrow a large amount, manipulate contract state, profit, repay?
  • Liquidity removal in same tx: can liquidity be added and removed atomically to extract fees?
  • Sandwich attack exposure: are swap deadlines and slippage limits enforced?
  • Incorrect reward calculation: do accumulated rewards use block.number or block.timestamp in a manipulable way?
  • Token decimals: does the contract assume 18 decimals? USDC=6, WBTC=8, etc. can break math.
  • Fee-on-transfer token handling: does the contract account for tokens that charge a transfer tax?
  • Price impact: can a single large trade in a low-liquidity pool cause extreme slippage that benefits attacker?
  SEVERITY GUIDE: flash-loan enabled theft = CRITICAL. Oracle manipulation = CRITICAL/HIGH.`,
  },
  {
    name: "backdoor_agent",
    focus: `BACKDOOR & DANGEROUS OPERATION VULNERABILITIES — check ALL of the following:
  • selfdestruct(address): who can call it? Is it gated by onlyOwner? Can it be called by anyone? CRITICAL.
  • delegatecall to user-controlled address: does any function delegatecall to an address from user input or a settable variable? CRITICAL — attacker can execute arbitrary code in contract's storage context.
  • Upgradeable proxy: is the upgradeTo() / upgradeToAndCall() function properly access-controlled?
  • Arbitrary .call(): does any function execute .call(data) where data is user-supplied? CRITICAL.
  • Hidden mint functions: are there any functions that can create tokens without going through the standard mint path?
  • Storage collision: in proxy patterns, do implementation and proxy storage slots collide?
  • Block.timestamp manipulation: is block.timestamp used for random number generation or critical time locks?
  • Blockhash randomness: is blockhash(block.number-1) used as randomness? Miners can manipulate.
  • Hardcoded addresses: are there hardcoded addresses that could be contracts with malicious behavior?
  • Callback hooks: does the contract call user-supplied callback hooks that execute arbitrary code?
  SEVERITY GUIDE: arbitrary code execution = CRITICAL. Unprotected selfdestruct = CRITICAL.`,
  },
  {
    name: "signature_agent",
    focus: `SIGNATURE & CRYPTOGRAPHIC VULNERABILITIES — check ALL of the following:
  • ecrecover returns address(0) for invalid/malformed signatures: is require(signer != address(0)) present?
  • Signature replay attack: is there a nonce per signer that is incremented after use?
  • Cross-chain replay: is chainId included in the signed message hash?
  • Cross-contract replay: is the contract address included in the signed hash?
  • EIP-712 compliance: is the domain separator correctly constructed (name, version, chainId, verifyingContract)?
  • Signature malleability: Ethereum signatures have two valid forms (s-value). Is this handled?
  • Permit() function: is ERC20 permit() deadline validated? Is v,r,s validated against address(0)?
  • Signed message substitution: can a valid signature for message A be used as signature for message B?
  • Meta-transaction relay: can a relayer change function parameters while keeping a valid signature?
  • Signature length checks: is the signature length validated to be exactly 65 bytes?
  SEVERITY GUIDE: forged signature enabling fund theft = CRITICAL. Replay without loss = HIGH.`,
  },
  {
    name: "erc20_agent",
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
    name: "erc721_agent",
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
    name: "erc1155_agent",
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
    name: "erc4626_agent",
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
    name: "erc1967_agent",
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
    name: "erc1271_agent",
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
];

export const ORCHESTRATOR_CONFIG = {
  free: {
    name: "Gemini",
    model: config.GEMINI_MODEL,
    description: "Free plan uses Gemini for orchestration",
  },
  pro: {
    name: "Claude Haiku",
    model: config.CLAUDE_HAIKU_MODEL,
    description: "Fast and cost-effective orchestration",
  },
  enterprise: {
    name: "Claude Sonnet",
    model: config.CLAUDE_SONNET_MODEL,
    description: "Deep analysis with exploit scenarios",
  },
  deep_audit: {
    name: "Claude Opus",
    model: config.CLAUDE_OPUS_MODEL,
    description: "Maximum intelligence with extended thinking",
  },
};

export const SEVERITY_SCORES = { critical: 25, high: 12, medium: 5, low: 2, info: 0 };

export function getFormattedPrice(plan: keyof typeof PLAN_PRICES_PAISE): string {
  const paise = PLAN_PRICES_PAISE[plan];
  if (paise === 0) return "Free";
  const rupees = paise / 100;
  if (!IS_PRODUCTION_PRICING) return `₹${rupees}`;
  return `₹${rupees.toLocaleString('en-IN')}`;
}

export function isTestMode(): boolean {
  return !IS_PRODUCTION_PRICING;
}

export function getTestCardDetails() {
  if (IS_PRODUCTION_PRICING) return null;
  return {
    cards: [
      { number: "4111 1111 1111 1111", name: "Visa (Success)" },
      { number: "4242 4242 4242 4242", name: "Visa (Success)" },
      { number: "5555 5555 5555 4444", name: "Mastercard (Success)" },
    ],
    message: "🔧 TEST MODE: Use any test card.",
    cvv: "Any 3 digits",
    expiry: "Any future date",
  };
}

export function getPlanPrice(plan: PublicPlan): number {
  return PLAN_PRICES_PAISE[plan] || 0;
}

export function getPlanFeatures(plan: keyof typeof PLAN_FEATURES): string[] {
  return PLAN_FEATURES[plan] || PLAN_FEATURES.free;
}

export function isPaidPlan(plan: string): boolean {
  return plan !== "free" && PLAN_PRICES_PAISE[plan as keyof typeof PLAN_PRICES_PAISE] > 0;
}

export function getOrchestratorConfig(plan: string) {
  return ORCHESTRATOR_CONFIG[plan as keyof typeof ORCHESTRATOR_CONFIG] || ORCHESTRATOR_CONFIG.free;
}

export function getAuditLimit(plan: string): number {
  return PLAN_AUDIT_LIMITS[plan.toUpperCase() as keyof typeof PLAN_AUDIT_LIMITS] ?? 10;
}