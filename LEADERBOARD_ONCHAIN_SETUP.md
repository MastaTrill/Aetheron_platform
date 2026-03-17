# On-Chain Leaderboard Setup

The referral leaderboard now queries **live on-chain data** from your AETH token contract to display top holders.

## How It Works

1. **Primary Source**: Queries `balanceOf()` for tracked addresses via Polygon RPC
2. **Sorting**: Ranks holders by token balance (descending)
3. **Badges**: Auto-assigned based on holdings:
   - 🏆 **Elite**: 1M+ AETH
   - ⭐ **Pro**: 500K+ AETH  
   - 💎 **Rising**: 100K+ AETH
   - ⚡ **Growth**: 50K+ AETH
   - 🌱 **Starter**: 10K+ AETH
4. **Fallback**: Uses `referral-leaderboard.json` if RPC fails

## Configuration

Edit `leaderboard-config.json` to customize:

```json
{
  "trackedAddresses": [
    "0xYourCommunityMember1",
    "0xYourCommunityMember2"
  ],
  "badgeTiers": {
    "Elite": 1000000
  },
  "topCount": 10
}
```

Or edit directly in [token-info.html](token-info.html) (lines 609-624).

## Adding Real Addresses

Replace the placeholder addresses in `TRACKED_ADDRESSES` array:

```javascript
const TRACKED_ADDRESSES = [
    '0x1234567890abcdef1234567890abcdef12345678', // Real address
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'  // Real address
];
```

## Testing

1. Open [token-info.html](https://mastatrill.github.io/Aetheron_platform/token-info.html)
2. Check browser console for:
   - ✅ "On-chain leaderboard loaded" (success)
   - ⚠️ "On-chain leaderboard failed, using fallback" (RPC issue)
3. Verify balances match [PolygonScan](https://polygonscan.com/token/0x072091F554df794852E0A9d1c809F2B2bBda171E)

## Alternative: Use Real Referral Contract

If you build a dedicated referral tracker contract with functions like:
- `getTopReferrers(uint256 limit)`  
- `getReferralStats(address user)`

I can replace this holder-based system with true referral tracking. Let me know!

## Fallback Chain

1. **Try**: On-chain balance query via ethers.js
2. **Fallback 1**: referral-leaderboard.json (if RPC down)
3. **Fallback 2**: Hardcoded leaderboardFallback array (if JSON missing)

---

**Contract**: `0x072091F554df794852E0A9d1c809F2B2bBda171E` (Polygon)  
**RPC**: polygon-rpc.com (free public endpoint)
