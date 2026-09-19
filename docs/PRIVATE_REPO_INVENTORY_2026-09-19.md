# Private repo inventory — 2026-09-19

Account `MastaTrill`: 21 GitHub repos visible to the connector (12 public + 9 private).
Canonical live products: `Aetheron_platform` (public), `Aetheron-Sentinel-L3` (public), `Emvori` (private).

On-chain truth this inventory is measured against:
- Base V1 `0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e`
- Current presale `0xe0A3B6368312dFd3E7E76202e673f895f8235A3d`: soft cap missed, weiRaised 0.0049 ETH, ETH balance 0, refundsAvailable, 4900 AETH still in contract
- Invalid cancelled sale `0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C` holds 50M V1; `token()` is not V1
- No $4.25M raise. No live public purchase.

## Private repos opened

| Repo | What is actually in it | Mismatch vs truth | Action 2026-09-19 |
|---|---|---|---|
| `Emvori` | Full AI workspace: `src/`, `backend/`, `mobile/`, AppDeploy, Play v20 docs | None on the sale. Play production still gated. PR #111 frozen on purpose. | Leave frozen |
| `Aether.ion` | Large private lab: bots, dashboards, `FINAL-DEPLOYMENT-STATUS.md` claiming Polygon live, $50k marketing spent, 5M AETH airdropped, $22M market cap | **Fiction.** Token cited is Polygon `0xb687…d5`, not Base V1. Numbers are not on-chain. | Disclaimer files added; repo stays private lab |
| `ASL3` | June 2026 AI Studio / PWA Sentinel app + Play submission manual pointing at a Cloud Run URL | Not the canonical Sentinel L3 repo. Claims institutional staking product. | `NOT_CANONICAL.md` |
| `AetheronSentinelL3App` | AI Studio boilerplate README + `src/` / `contracts/` | Duplicate Sentinel experiment, last push 2026-06-17 | `NOT_CANONICAL.md` |
| `Sentinel` | Single AI Studio README, no app code | Empty name-collision | `NOT_CANONICAL.md` |
| `Aetheron_platform-1` | Only `.circleci/` | Empty fork/stub of the platform name | `README.md` warning |
| `aetheron-launch-storyboard` | Lore / UX storyboard, not contracts | Mythic “live deployment coming soon” only | `NOT_CANONICAL.md` |
| `as3grok` | Grok App Builder sandbox (`AGENTS.md`, Vite, Vercel) | Unrelated builder workspace | `NOT_CANONICAL.md` |
| `cosmic-echo-identity` | Brand / identity assets + `smart-contract/` folder | Identity pack, not the Base token | `NOT_CANONICAL.md` |

## Public siblings that are also not canonical

`Aetheron-X`, `Aetheron`, `bridge-contracts`, `JarvisAI`, `jarvis-echo-dashboard`, `Titan-OMNI-AI`, `AileadBooking`, `emvori-status`, `lottie-docs`, `solidity-merkle-trees` — already classified earlier. Do not sell AETH from them.

## Not fixed here (needs owner wallet or Play Console)

- `withdrawUnsoldTokens()` on current sale (`0xc8bdbfb6`)
- 50M V1 recovery on invalid sale
- Platform GitHub Pages Actions still can serve a LIVE banner until that workflow publishes `main`
- Emvori Play production apply / PR #111
