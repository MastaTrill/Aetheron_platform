# Invalid Base presale live read — 2026-09-19

Address: `0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C`
RPC: `https://base.drpc.org` block **51514452**

| Field | Value |
|---|---|
| owner | `0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2` |
| token() | `0xab5ae0d8f569d7c2b27574319b864a5ba6f9671e` (NOT canonical V1) |
| finalized | false |
| cancelled | **true** |
| refundsAvailable | true |
| weiRaised | 0 |
| ETH balance | 0 |
| Canonical V1 AETH sitting on this address | **50,000,000** |

This contract is already cancelled. It is linked to a different token than V1 `0xecf7…8E4e`, but the V1 token balanceOf(this address) is 50M AETH.

Recovery is a **separate owner-wallet ticket**. Do not send those tokens into V2. Do not reuse this contract. Inspect `withdrawUnsoldTokens` / rescue functions on BaseScan before signing anything.
