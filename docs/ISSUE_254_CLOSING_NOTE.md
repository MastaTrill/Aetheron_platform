# Closing note for issue #254 (draft, not posted)

Paste as the closing comment on #254, and reference Linear AET-11.

> Recovery complete. On 2026-10-26 at block 53115030 (7:56 AM CDT) the owner called `withdrawUnsoldTokens()` (calldata `0xc8bdbfb6`) on the closed replacement presale `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d`. Tx [`0x95b85d8863adcde0ee5909390ef4bd13e7436946b03635e0de909549e670d66f`](https://basescan.org/tx/0x95b85d8863adcde0ee5909390ef4bd13e7436946b03635e0de909549e670d66f) moved exactly 4,900 AETH to the owner wallet. The sale contract's AETH balance is now 0. Evidence: `docs/AETH_V1_MIGRATION_SNAPSHOT_2026-10-26.md` (verified by `npm run verify:aeth-v1-replacement-recovery`). Closes #254 and the owner-recovery part of Linear AET-11.
>
> Unchanged: no `finalize()`/`withdrawFunds()`, no V2, no liquidity, no trading changes. The separate 50M V1 AETH on the invalid presale `0xA7aa…b07C` stays tracked in #255.
