# AETH V1 -> V2 Migration Plan — 2026-09-05

## Status

**Prepared for review; not approved for execution.**

This plan is accounting and safety evidence only. It does not authorize a V2 deployment, V1 recovery transaction, V2 token transfer, liquidity creation, public launch, or canonical cutover.

## Basis

The dated V1 snapshot in `docs/LIVE_BASE_STATE_AUDIT_2026-09-03.md` reconciles the fixed 1,000,000,000 AETH supply as follows:

| Source role | V1 address | AETH |
| --- | --- | ---: |
| Owner | `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2` | 416,666,667 |
| Team | `0x76A83f91dC64FC4F29CEf6635f9a36477ECA6784` | 200,000,000 |
| Marketing + staking | `0x8A3ad49656Bd07981C9CFc7aD826a808847c3452` | 300,000,000 |
| Invalid presale | `0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C` | 50,000,000 |
| Replacement presale | `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d` | 33,333,333 |
| **Total** | | **1,000,000,000** |

The July recovery evidence classifies the 50,000,000 AETH held by the invalid presale as inaccessible by that deployed contract's interface. Therefore the observed V1 economic supply is 950,000,000 accessible AETH plus 50,000,000 inaccessible AETH.

## Migration principle

V2 keeps the same 1,000,000,000 nominal supply, but this prepared plan does **not** make the stranded V1 50,000,000 AETH newly accessible. Instead:

- 950,000,000 V2 AETH remains economically accessible.
- 50,000,000 V2 AETH must be transferred to a separately deployed, source/runtime-verified `AetheronPermanentSupplyLock` before canonical cutover.
- The lock transfer is irreversible and therefore requires a separate explicit approval after the lock address and V2 address are both independently verified.

This preserves nominal supply and the currently observed accessible-supply economics unless a later independent tokenomics review explicitly approves a different treatment.

## Exact prepared ledger

| V1 source | Source AETH | Prepared V2 disposition | Target AETH |
| --- | ---: | --- | ---: |
| Owner | 416,666,667 | Owner migration reserve | 416,666,667 |
| Team | 200,000,000 | Same holder | 200,000,000 |
| Marketing + staking | 300,000,000 | Same holder, represented as 150M marketing + 150M staking constructor allocations | 300,000,000 |
| Invalid presale | 50,000,000 | Permanent no-recovery V2 supply lock | 50,000,000 |
| Replacement presale | 33,333,333 | Owner migration reserve only after V1 recovery/reconciliation | 33,333,333 |
| **Total** | **1,000,000,000** | | **1,000,000,000** |

After the V1 replacement-presale recovery dependency is resolved, the prepared V2 accessible distribution is:

- Owner migration/launch reserve: **450,000,000 AETH**
- Team: **200,000,000 AETH**
- Marketing + staking holder: **300,000,000 AETH**
- Permanent parity lock: **50,000,000 AETH**

Accessible total: **950,000,000 AETH**. Nominal total: **1,000,000,000 AETH**.

## Replacement-presale dependency

At the dated production snapshot, the replacement presale held 33,333,333 AETH with 4,900 AETH reserved and 33,328,433 AETH unsold/recoverable. The observed contributions were owner-only and refunds were available.

Before any V1 recovery transaction, re-read and record:

- V1 token balance of the replacement presale
- `tokensReserved`
- `tokensOwed` / contribution ownership for every contributor implicated by transfer history
- `refundsAvailable`, `finalized`, and `cancelled`
- owner address
- `withdrawUnsoldTokens` eligibility

No V2 tokens may be sent to the legacy replacement presale because its immutable token reference points to V1.

## Permanent supply lock

`smart-contract/contracts/AetheronPermanentSupplyLock.sol` intentionally exposes no callable recovery surface, administrator, upgrade path, rescue hook, or self-destruct path.

Required evidence before funding it:

1. Deploy the lock on Base Mainnet.
2. Source-verify it.
3. Compare deployed runtime bytecode to the compiled artifact.
4. Record its canonical address in `aeth-v2-migration.json`.
5. Independently review the irreversible 50,000,000 AETH transfer.
6. Only after explicit approval, transfer exactly 50,000,000 V2 AETH to the verified lock.
7. Read back the lock's V2 balance and verify exactly 950,000,000 V2 AETH remains outside the lock.

## Required fresh snapshot

The September 3 holder snapshot is the accounting basis for this plan, not an execution snapshot. Immediately before migration execution, capture a fresh Base read-only snapshot and either:

- prove every source balance still matches this ledger, or
- update and independently review the ledger before any V2 distribution/cutover action.

Any unexplained balance difference is a hard stop.

## Cutover gates that remain false

- `migrationAuthorized`
- `liquidityAuthorized`
- `publicLaunchAuthorized`
- `cutover.authorized`
- `cutover.evidence.currentBalanceSnapshotVerified`
- `cutover.evidence.v1RecoveryVerified`
- `cutover.evidence.permanentSupplyLockVerified`
- `cutover.evidence.balanceMigrationPlanApproved`
- `cutover.evidence.releaseAuthorized`

V1 remains canonical until all required evidence is complete and a separate explicit cutover approval is recorded.
