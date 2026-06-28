# Aetheron Platform — Community Launch Guide (2026)

> **Purpose:** Replace every **"(planned)"** placeholder in the whitepaper and codebase with
> production-ready, verified community channels so CoinGecko, CoinMarketCap, DEX
> Screener, and exchange listing application reviewers find an active community.
>
> **Policy:** All three channels must be live and seeded with **real activity** before
> any listing submission is filed. Reviewers check them.

---

## 1. Community Identity & Naming Conventions

Stick to one canonical handle set. Reserve all three handles immediately even
before launch.

| Asset | Canonical target | Vanity domain | Status needed today |
|---|---|---|---|
| Twitter / X | `@AetheronPlatform` | x.com/AetheronPlatform | **ACTION** |
| Discord | `aetheron` (discord.gg/aetheron) | discord.gg/aetheron | **ACTION** |
| Telegram Group | `Aetheron Official` supergroup | t.me/AetheronPlatform *(drops "sg.")* | **ACTION** |
| Telegram Announcements | `AETH Announcements` channel | t.me/AETHannouncements | **ACTION** |
| GitHub | `MastaTrill/Aetheron_platform` | — | ✅ live |
| Website | mastatrill.github.io/Aetheron_platform | — | ✅ live |

**Rules:**
- Never use `@William_McCoy_` as the project account. Create a dedicated brand account.
- Never use `discord.gg/aetheronplatform` — the short `aetheron` invite is the canonical one.
- Never use `t.me/aetheron` — that handle is taken by another project. Use `t.me/AetheronPlatform`.
- All three social handles must be identical across every document, README, and listing form.

---

## 2. Discord Server Setup

### 2.1 Create the server

1. Open Discord → **+** → **Create My Own** → **For a club or community**.
2. Name: **Aetheron Platform**.
3. Upload the Aetheron logo (512×512 PNG) as the server icon immediately.
4. Set **Community** on in Server Settings → Enable Community.
5. Set **Rules Screening** on — require members to accept rules before chatting.
6. Set **Verification Level** to **Medium** (must have verified email).
7. Set **Default Notification Settings** to **Only @mentions**.
8. Set **Explicit Content Filter** to **Scan messages from all members**.

### 2.2 Vanity URL

- Server must reach **Level 1 boost** (2 boosts) to claim `discord.gg/aetheron`.
- Boost immediately with the project's own Nitro subscription (or buy 2 boosts).
- Set the vanity URL in Server Settings → Invites → Vanity URL.

### 2.3 Channel structure

```
📋 INFORMATION
├── #welcome            (read-only, onboarding card with rules + links)
├── #rules             (read-only, server rules)
├── #announcements     (read-only, project updates)
├── #links             (read-only, all official links)
└── #faq               (read-only, common questions)

💬 COMMUNITY
├── #general           (main chat)
├── #introductions     (new members introduce themselves)
├── #price-and-charts  (price talk, charts, DEX links)
├── #trading           (trading discussion, no financial advice)
├── #memes             (crypto memes, community culture)
└── #off-topic         (anything non-Aetheron)

🎓 AETHERON
├── #staking           (staking help, APY discussion)
├── #governance        (proposals, voting)
├── #feedback          (product feedback, feature requests)
└── #bug-reports       (technical issues, with template)

🎙 VOICE
├── Voice-Lounge-1
├── Voice-Lounge-2
└── Stage (for AMAs)

🔒 STAFF ONLY (admin only)
├── #admin-chat
├── #mod-log
└── #bot-config
```

### 2.4 Roles (top → bottom)

| Role | Color | Permissions |
|---|---|---|
| `@Founder` | Gold | Administrator |
| `@Core Team` | Red | Manage channels, manage roles, kick/ban |
| `@Moderator` | Blue | Manage messages, timeout, kick |
| `@Bot` | Green | Managed by bot integrations |
| `@OG` | Purple | Early supporters (first 100 members) |
| `@Staker` | Teal | Assigned by Collab.Land after wallet verification |
| `@Holder` | Orange | Assigned by Collab.Land (any AETH balance) |
| `@Member` | Default | Base role after rules acceptance |
| `@Muted` | Dark | No send-message permission |

### 2.5 Bots to install (all free tier is enough to start)

| Bot | Purpose | Setup |
|---|---|---|
| **Collab.Land** | Wallet verification → `@Holder` / `@Staker` roles | collab.land → add to server → configure Polygon chain → set AETH contract `0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e` |
| **MEE6** | Welcome messages, auto-mod, level system, custom commands | mee6.xyz → enable Welcome plugin → set `#welcome` → enable Auto-Mod (spam, caps, links) |
| **Dyno** | Logging, alt-account detection, timed moderation | dyno.gg → enable Mod Log → set `#mod-log` → enable Alt Detector |
| **Sesh** | Calendar + event reminders for AMAs | sesh.fyi → connect → create recurring AMA events |
| **Statbot** | Server analytics (member growth, activity) | statbot.net → enable |
| **Wick** | Anti-nuke / anti-raid protection | wickbot.com → enable all protections |
| **Carl-bot** | Reaction roles (language, notification prefs) | carl.gg → set up reaction-role panel in `#welcome` |

### 2.6 Welcome flow (MEE6 + Carl-bot)

1. User joins → sees **Rules Screening** → clicks Accept.
2. Assigned `@Member` role.
3. MEE6 posts in `#welcome`: "Welcome @user! Verify your wallet in #verify to get the Holder role."
4. Carl-bot posts reaction-role panel: "React 🔔 for announcement pings, 🇬🇧 for English, 🇪🇸 for Spanish."
5. User goes to `#verify` → Collab.Land DM → connects wallet → gets `@Holder` or `@Staker`.

---

## 3. Twitter / X Account Setup

### 3.1 Account creation

1. Go to x.com → **Create account**.
2. Handle: **`@AetheronPlatform`**.
3. Display name: **Aetheron Platform**.
4. Bio (160 chars max):
   ```
   Building the Future of Decentralized Finance ⚡
   AETH on @0xPolygon | Staking • Governance • Yield
   👇 Join the community
   ```
5. Website field: `https://mastatrill.github.io/Aetheron_platform`
6. Location field: `Polygon`
7. Profile picture: Aetheron logo (400×400 PNG).
8. Header image: 1500×500 branded banner with tagline + "Live on Polygon".
9. Pinned tweet: **Tweet #1** from the launch sequence below.

### 3.2 Account security (do this FIRST)

- Enable **2FA** with an authenticator app (not SMS).
- Set a unique 20+ character password in a password manager.
- Register the account email with a **dedicated project email** (not personal).
- Add a **recovery phone number** that is not publicly linked to you.
- Save recovery codes offline (printed, in a safe).
- **Never** log in on shared devices.

### 3.3 First 10 tweets (launch sequence)

**Tweet 1 — Launch (PIN THIS)**
```
🚀 Aetheron ($AETH) is LIVE on Polygon.

✅ 1B total supply
✅ Staking up to 18% APY
✅ Verified contract
✅ Liquidity on QuickSwap

Trade now 👇
https://mastatrill.github.io/Aetheron_platform

#DeFi #Polygon #AETH #Crypto
```

**Tweet 2 — Thread: What is Aetheron (1/6)**
```
🧵 Aetheron is a DeFi hub on Polygon.

1/6 It combines staking, governance, and yield aggregation into one dashboard.

Low fees. Fast txs. Real yield.

Let's break it down 👇
```

**Tweet 3 — Thread: Tokenomics (2/6)**
```
2/6 📊 AETH Tokenomics

• Supply: 1,000,000,000
• Network: Polygon
• Contract: 0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e
• No mint function
• Liquidity locked

Verified on Polygonscan ✅
```

**Tweet 4 — Thread: Staking (3/6)**
```
3/6 💰 Staking Pools

🔹 30-day lock → 8% APY
🔹 90-day lock → 12% APY
🔹 180-day lock → 18% APY

Compound automatically. Withdraw anytime after lock.

Stake: https://mastatrill.github.io/Aetheron_platform
```

**Tweet 5 — Thread: Security (4/6)**
```
4/6 🔒 Security

• Contracts verified on Polygonscan
• Liquidity locked
• No admin mint
• Open-source on GitHub
• Community-audited

Trust through transparency.

GitHub: https://github.com/MastaTrill/Aetheron_platform
```

**Tweet 6 — Thread: Community (5/6)**
```
5/6 🌐 Join the Community

💬 Discord: discord.gg/aetheron
📱 Telegram: t.me/AetheronPlatform
🐦 Twitter: @AetheronPlatform

Daily AMAs, trading comps, governance votes.

Be early.
```

**Tweet 7 — Thread: CTA (6/6)**
```
6/6 🚀 Get Started

1. Visit https://mastatrill.github.io/Aetheron_platform
2. Connect MetaMask
3. Buy AETH on QuickSwap
4. Stake and earn

Welcome to Aetheron.

Like & RT to spread the word 🔁
```

**Tweet 8 — Community spotlight**
```
The Aetheron Discord just hit 100 members. 🎉

We're just getting started.

If you're on Polygon, come build with us.

discord.gg/aetheron

#Polygon #DeFi #Web3
```

**Tweet 9 — Educational**
```
Why Polygon for DeFi?

⚡ 2-second finality
💸 $0.001 average fee
🔗 Ethereum security
🌱 Carbon neutral

Aetheron is built for the Polygon economy.

What's your favorite Polygon DEX? 👇
```

**Tweet 10 — Engagement**
```
What feature should Aetheron build next?

A) Yield aggregator
B) NFT staking
C) Cross-chain bridge
D) Mobile app

Vote below 👇

$AETH #DeFi #Polygon
```

### 3.4 Posting cadence (first 2 weeks)

- **3–5 tweets per day** (mix of original, threads, quote-RTs, replies).
- **1 thread per day** for the first week.
- **1 Twitter Space per week** (Thursday 5 PM EST recommended).
- Reply to every comment in the first 30 days — this is non-negotiable for growth.

---

## 4. Telegram Setup

### 4.1 Two separate entities

| Entity | Type | URL | Purpose |
|---|---|---|---|
| **Aetheron Official** | Supergroup | t.me/AetheronPlatform | Community chat, support, discussion |
| **AETH Announcements** | Channel | t.me/AETHannouncements | One-way project updates only |

**Why both:** Listing reviewers and users expect a channel for announcements (no noise) and a group for community. Never use only one.

### 4.2 Supergroup setup

1. Create group → name **Aetheron Official** → add logo.
2. Convert to **Supergroup** (Telegram does this automatically at creation).
3. Set **t.me/AetheronPlatform** as the public link in Group Settings → Username.
4. Set description:
   ```
   Official Aetheron ($AETH) Community
   🌐 Website: https://mastatrill.github.io/Aetheron_platform
   💬 Discord: discord.gg/aetheron
   🐦 Twitter: @AetheronPlatform
   ```
5. **Permissions for all members:**
   - ✅ Send messages
   - ✅ Send media
   - ✅ Send stickers/GIFs
   - ✅ Embed links
   - ❌ Invite users (disable — prevents spam bots)
   - ❌ Pin messages (admin only)
   - ❌ Change group info (admin only)

### 4.3 Announcement channel setup

1. Create channel → name **AETH Announcements** → add logo.
2. Set **t.me/AETHannouncements** as the public link.
3. Set description:
   ```
   Official Aetheron ($AETH) Announcements
   Website: https://mastatrill.github.io/Aetheron_platform
   ```
4. Add the Aetheron Official group as a **discussion link** (Telegram will auto-link comments).

### 4.4 Bots for Telegram

| Bot | Purpose |
|---|---|
| **@GroupHelpBot** | Anti-spam, captcha on join, ban enforcement |
| **@Combot** | Moderation, warnings, user notes |
| **@Shieldy** | Captcha challenge for new joiners (highly recommended) |
| **@RoseBot** | Welcome messages, filters, notes |
| **@AetheronPriceBot** (custom) | Price alerts — deploy a simple bot that polls DexScreener API and posts to the group on threshold moves |

### 4.5 Telegram security

- Enable **Join Requests** if the group is public and you want to filter bots.
- Set **Slow Mode** to 30 seconds during high-traffic events.
- Ban `@NotcoinBot`, `@DropBot`, and known spam bots proactively.
- Never share admin @handles publicly.

---

## 5. Content Calendar — First 2 Weeks

### Week 1: Launch

| Day | Twitter | Discord | Telegram |
|---|---|---|---|
| **Mon** | Tweet 1 (launch) + Tweet 2 (thread) | Open server, post #welcome, seed 5 discussion topics | Open group, post welcome, pin links |
| **Tue** | Tweet 3 + Tweet 4 (thread) | AMA prep, create #ama-questions | AMA announcement in channel |
| **Wed** | Tweet 5 + Tweet 6 (thread) | **Twitter Space + Discord Stage AMA** (5 PM EST) | Live-tweet the AMA |
| **Thu** | Tweet 7 + engagement tweet | Community game (trivia, 10 AETH prize) | Mirror game in Telegram |
| **Fri** | Tweet 8 + quote-RT community | Feedback Friday thread in #feedback | Poll: next feature |
| **Sat** | Memes + engagement | Meme contest in #memes | Share winners |
| **Sun** | Week 1 recap thread | Week 1 recap in #announcements | Recap in channel |

### Week 2: Growth

| Day | Twitter | Discord | Telegram |
|---|---|---|---|
| **Mon** | Staking tutorial thread | Staking help office hours | Staking FAQ post |
| **Tue** | Governance explainer | Governance discussion in #governance | Governance poll |
| **Wed** | Partnership tease | Community vote on next integration | Mirror vote |
| **Thu** | Twitter Space #2 | Discord Stage AMA #2 | Live-tweet |
| **Fri** | Community spotlight | OG role awarded to first 100 | Shoutout in channel |
| **Sat** | Trading comp results | Trading comp #2 launch | Results in channel |
| **Sun** | Week 2 recap + roadmap update | Roadmap update in #announcements | Roadmap in channel |

---

## 6. Community Growth Strategies (DeFi / Polygon Specific)

### 6.1 Polygon ecosystem integration

- **Apply to the Polygon Ecosystem page** — polygon.technology/ecosystem.
- **List on Polygon DeFi aggregators** — DeFiLlama, PolygonScan token tracker.
- **Engage with Polygon ecosystem accounts** — reply to @0xPolygon, @QuickswapDEX, @AavePolygon daily.
- **Cross-promote with other Polygon DeFi projects** — joint AMAs, shared Spaces.

### 6.2 DeFi-native growth loops

- **Referral program** — on-chain referral tracking with bonus APY for referrers.
- **Trading competitions** — weekly volume-based leaderboards with AETH prizes.
- **Staking milestones** — celebrate TVL milestones publicly (e.g., "1M AETH staked!").
- **Governance participation** — every proposal gets a Twitter thread + Discord event.
- **Airdrop campaigns** — reward early stakers and active community members.

### 6.3 Content flywheel

- **Daily:** Price check-in, community reply, 1 original tweet.
- **Weekly:** 1 thread, 1 AMA, 1 trading comp, 1 governance update.
- **Monthly:** 1 partnership announcement, 1 roadmap update, 1 retrospective.

### 6.4 Influencer & KOL strategy

- Target **Polygon-native KOLs** (smaller, more engaged than Ethereum mega-influencers).
- Offer **ambassador program** — 500 AETH/month for consistent promotion.
- Never pay for shills without disclosure — FTC and community trust require transparency.

### 6.5 Listing-specific community metrics to hit

| Platform | Minimum community signal |
|---|---|
| **CoinGecko** | Active Discord (500+ members), Twitter (1K+ followers), Telegram (500+ members) |
| **CoinMarketCap** | Same as above + visible team + active social posts in last 7 days |
| **DEX Screener** | Trending via volume + social links in token metadata |
| **CEX (Gate, MEXC, etc.)** | 5K+ combined social followers, active daily chat |

---

## 7. Security Best Practices

### 7.1 Anti-scam measures

**Discord:**
- Enable **Wick** anti-nuke bot — prevents mass role/channel deletion.
- Set **MEE6 Auto-Mod** to block:
  - Discord invite links (except official)
  - Known scam domains
  - Mass mentions (@everyone, @here)
  - Suspicious URLs (use blocklist from discord-scam-blocklists)
- **Never** allow DMs from server members by default — set Server Settings → Privacy → "Allow direct messages from server members" to **OFF**.
- Post a permanent **#scam-alerts** message: "Admins will NEVER DM you first. Anyone offering support via DM is a scammer."

**Telegram:**
- Enable **@Shieldy** captcha on join.
- Set **@GroupHelpBot** to auto-ban users who send links in first 24 hours.
- Ban known scam bot usernames proactively.
- Pin a message: "Admins will NEVER DM you. Anyone DMing you claiming to be support is a scammer."

**Twitter:**
- Never click links in DMs.
- Never share seed phrases, private keys, or wallet files — ever.
- Enable **Login Verification** + **Password Reset Protect**.
- Revoke third-party app access monthly (Settings → Security → Apps).

### 7.2 Admin impersonation prevention

- All admin accounts must have **2FA enabled** — enforce this policy.
- All admin accounts must have **unique, non-public profile pictures** (not the project logo).
- Create a **#team-verification** channel in Discord listing real admin usernames.
- On Twitter, the real account is **only** `@AetheronPlatform` — announce this everywhere.
- On Telegram, admin usernames are listed in the group description — no exceptions.

### 7.3 Verified checkmarks

- **Twitter Blue / X Premium** — subscribe for the brand account to get the blue checkmark. This is now a trust signal for listing reviewers.
- **Discord Verified** — apply via Discord's partner/verified program once the server hits 5K members.
- **Telegram** — no verification program, but the group must have a linked channel and discussion group.

### 7.4 Incident response plan

1. **Compromised admin account:** Immediately revoke all sessions, change password, post warning on all channels.
2. **Scam DM wave:** Post warning in all channels, enable stricter moderation, ban offending accounts.
3. **Fake Telegram group:** Report to Telegram, post warning on real channels, file abuse report.
4. **Discord server raid:** Enable raid mode (slow mode 10m, verification level high), ban wave, post incident report.

---

## 8. Links to Update in the Codebase

Once all channels are live, update these files:

### 8.1 Whitepaper (`WHITEPAPER.md`)

**Line 869-871** — replace:
```
- **Twitter**: @AetheronPlatform (planned)
- **Discord**: discord.gg/aetheron (planned)
- **Telegram**: t.me/aetheron (planned)
```
With:
```
- **Twitter**: https://x.com/AetheronPlatform
- **Discord**: https://discord.gg/aetheron
- **Telegram**: https://t.me/AetheronPlatform
- **Telegram Announcements**: https://t.me/AETHannouncements
```

### 8.2 Website / Dashboard

Update the footer and/or community page with:
- Discord: `https://discord.gg/aetheron`
- Twitter: `https://x.com/AetheronPlatform`
- Telegram: `https://t.me/AetheronPlatform`
- GitHub: `https://github.com/MastaTrill/Aetheron_platform`

### 8.3 GitHub repository

- Add social links to the repository **About** section (right sidebar on GitHub).
- Add social links to `README.md` header.
- Add social links to `index.md` if it serves as the website landing page.

### 8.4 Token metadata

- Update **CoinGecko** and **CMC** listing forms with all social links.
- Update **DEX Screener** token info with social links.
- Update **Polygonscan** token page social links (via their verification form).

### 8.5 Existing marketing docs to update

| File | Change |
|---|---|
| `social-media-launch-campaign.md` | Update Discord link from `discord.gg/aetheronplatform` to `discord.gg/aetheron` |
| `TWITTER_LAUNCH_STRATEGY.md` | Update account from `@William_McCoy_` to `@AetheronPlatform` |
| `COMMUNITY_GROWTH_LAUNCH_GUIDE.md` | Add cross-reference to this guide |
| `MARKETING_PLAN.md` | Update social links |
| `MEDIA_KIT.md` | Update social links |
| `BRAND_GUIDELINES.md` | Add canonical handle list |

---

## 9. Pre-Launch Checklist

Complete in order. Do not submit listing applications until all are checked.

- [ ] **Twitter account** `@AetheronPlatform` created, secured with 2FA, profile complete
- [ ] **Discord server** created, community enabled, vanity URL `discord.gg/aetheron` claimed
- [ ] **Discord bots** installed: Collab.Land, MEE6, Dyno, Wick, Carl-bot, Sesh
- [ ] **Discord channels** created per section 2.3
- [ ] **Discord roles** created per section 2.4
- [ ] **Telegram supergroup** `t.me/AetheronPlatform` created, permissions set
- [ ] **Telegram channel** `t.me/AETHannouncements` created, linked to group
- [ ] **Telegram bots** installed: Shieldy, GroupHelpBot, RoseBot
- [ ] **First 10 tweets** drafted and scheduled
- [ ] **Content calendar** for week 1 populated
- [ ] **Collab.Land** configured with AETH contract on Polygon
- [ ] **Anti-scam measures** active on all platforms
- [ ] **Admin team** has 2FA on all accounts
- [ ] **Whitepaper** updated with live links
- [ ] **Website** updated with live links
- [ ] **GitHub** repo About section updated
- [ ] **All existing marketing docs** updated with canonical handles
- [ ] **50+ real members** in Discord (seed with team, friends, early supporters)
- [ ] **50+ real members** in Telegram
- [ ] **100+ followers** on Twitter (seed with team, friends, early supporters)
- [ ] **At least 7 days** of active posting on all channels before listing submission

---

## 10. Manual vs. Automated — Summary

### Must be done MANUALLY (requires human accounts, phone numbers, emails)

| Task | Platform | Why manual |
|---|---|---|
| Create Twitter account | Twitter/X | Requires email + phone verification |
| Create Discord server | Discord | Requires verified Discord account |
| Claim Discord vanity URL | Discord | Requires Level 1 boost (2 boosts) |
| Create Telegram group + channel | Telegram | Requires phone number |
| Set Telegram usernames | Telegram | Requires admin access |
| Subscribe to X Premium | Twitter | Requires payment |
| Apply for Discord verification | Discord | Requires 5K+ members + manual review |
| Write and post tweets | Twitter | Requires human judgment |
| Seed initial members | All | Requires real people |
| Configure Collab.Land | Discord | Requires wallet connection |
| Configure MEE6 / Dyno / Wick | Discord | Requires admin access |
| Update whitepaper | GitHub | Requires commit |
| Update website | GitHub Pages | Requires commit |
| Update GitHub repo About | GitHub | Requires repo admin |
| Submit listing applications | CG/CMC | Requires manual form fill |

### Can be AUTOMATED (bots, scripts, CI/CD)

| Task | Tool |
|---|---|
| Welcome messages on Discord join | MEE6 |
| Wallet verification → role assignment | Collab.Land |
| Anti-spam / auto-moderation | MEE6, Dyno, Wick |
| Captcha on Telegram join | Shieldy |
| Event reminders (AMAs) | Sesh |
| Server analytics | Statbot |
| Price alerts in Telegram | Custom bot (DexScreener API) |
| Content calendar reminders | Sesh + manual scheduling |
| Link updates across docs | Script (sed/Edit tool) — one-time |
| Tweet scheduling | X Premium built-in scheduler or Typefully |

---

## 11. Quick Reference — All Official Links

```
Website:              https://mastatrill.github.io/Aetheron_platform
GitHub:               https://github.com/MastaTrill/Aetheron_platform
Twitter / X:          https://x.com/AetheronPlatform
Discord:              https://discord.gg/aetheron
Telegram Group:       https://t.me/AetheronPlatform
Telegram Channel:     https://t.me/AETHannouncements

AETH Contract:        0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e
Staking Contract:     0x896D9d37A67B0bBf81dde0005975DA7850FFa638
Liquidity Pair:       0xd57c5E33ebDC1b565F99d06809debbf86142705D
Network:              Polygon (Chain ID 137)
```

---

**Document Version:** 1.0
**Last Updated:** 2026-06-28
**Status:** Ready for execution
