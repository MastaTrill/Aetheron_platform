@MastaTrill

🌌 Aetheron Platform

> Revolutionary Blockchain & Space Exploration Ecosystem

![License: MIT](https://opensource.org/licenses/MIT)
![Build Status](https://github.com/Mastatrill/aetheron-platform)
![Version](https://github.com/Mastatrill/aetheron-platform)

## Deployed Contracts

### Polygon Mainnet (Chain ID: 137)

- AETH Token: `0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e`
  - View on PolygonScan: [Link](https://polygonscan.com/token/0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e)
- Staking Contract: `0x896D9d37A67B0bBf81dde0005975DA7850FFa638`
  - View on PolygonScan: [Link](https://polygonscan.com/address/0x896D9d37A67B0bBf81dde0005975DA7850FFa638)
- Liquidity Pair: `0xd57c5E33ebDC1b565F99d06809debbf86142705D`
  - View on PolygonScan: [Link](https://polygonscan.com/address/0xd57c5E33ebDC1b565F99d06809debbf86142705D)

### Solana (if applicable for cross-chain or future features)

- Solana Mint/Wallet/Program: `5fryQ4UPbZWKix8J3jtQhNTDXtSsoX24vyDQ8gQbFqki`
  - View on Solscan: [Link](https://solscan.io/account/5fryQ4UPbZWKix8J3jtQhNTDXtSsoX24vyDQ8gQbFqki)

---

🚀 Live Demo

- 🌐 Admin Dashboard: mastatrill.github.io/aetheron-platform
- 📱 Mobile App: Coming soon to App Store & Google Play
- 📖 Documentation: Complete guides and API reference
- 🔗 GitHub Repository: github.com/Mastatrill/aetheron-platform

---

🎯 Features

- 🎯 Mission Control — Participate in space exploration missions
- 💰 AETH Token — Native cryptocurrency with staking rewards
- 📱 Mobile App — iOS/Android cross‑platform application
- 🌐 Web Dashboard — Comprehensive admin and user interface
- ⛓️ Smart Contracts — Secure blockchain infrastructure
- 🔭 Discovery System — Real‑time space exploration tracking

---

## Staking & Unstaking Process (AETH)

### How Staking Works

- When you stake AETH tokens, the contract records the **actual amount received** by the staking contract after any transfer tax is applied by the AETH token contract.
- Your rewards are calculated based on this net staked amount.
- The staking contract supports multiple pools with different lock durations and APYs.

### How Unstaking Works

- When you unstake, you receive your net staked amount **plus any accrued rewards**.
- Both the principal and reward payouts are subject to the AETH token's transfer tax (currently 5%).
- The actual amount you receive is always **less than the gross amount sent by the contract** due to this tax.
- The contract emits events (`Unstaked` and `RewardClaimed`) that include both the gross and net received values for full transparency and dApp integration.

### Example

If you stake 1,000 AETH and the transfer tax is 5%, the contract will record 950 AETH as your stake. When you unstake (plus rewards), the contract will send you the gross amount, but you will receive 95% of that due to the tax.

### Tax Impact

- **All transfers from the staking contract to users are taxed at the current sell tax rate.**
- The net received amount is always available in the contract events for accurate dApp display.
- For more details, see the `AetheronStaking` and `Aetheron` contract source code.

---

🛠️ Technology Stack

Frontend

- React Native (Mobile)
- React.js / Next.js (Web)
- TypeScript
- CSS3 / SCSS

Backend

- Node.js / Express.js
- MongoDB / PostgreSQL
- JWT Authentication
- WebSocket (Real‑time)

Blockchain

- Solidity Smart Contracts
- Hardhat Development Framework
- Polygon / Ethereum Networks
- Web3.js Integration

DevOps

- Docker Containerization
- Kubernetes Orchestration
- GitHub Actions CI/CD
- Terraform Infrastructure

---

📁 Project Structure

`aetheron-platform/
├── admin-dashboard/     # Web admin interface
├── mobile-app/          # React Native mobile app
├── backend-api/         # Node.js API server
├── smart-contracts/     # Solidity blockchain contracts
├── web-frontend/        # React web application
├── documentation/       # Project documentation
├── assets/              # Media and design files
├── deployment/          # Infrastructure configurations
├── testing/             # Test suites
└── tools/               # Development utilities`

---

🔐 Verification

GitHub Owner: @Mastatrill  
Keeper’s Lantern Wallet: 0x127C3a5A0922A0A952aDE71412E2DC651Aa7AF82

Proof‑of‑Record Constellation

- Herald’s Seal — Tx Hash: 0xb397…c82c94
- Steward’s Seal — Tx Hash: 0x8a3a…c3452 (Dec‑16‑2025 09:27:45 AM UTC)
- Lantern Seal — Wallet: 0x127C…AF82
- Constellation Seal — Tx Hash: 0x428e…Be3E

✨ Four Seals, One Constellation — Eternal Proof.

---

🗺️ Roadmap

- ✅ Platform structure created
- ✅ Smart contracts drafted (ERC20 upgradeable)
- 🔄 Source code verification on BaseScan/Etherscan
- 🔄 Security audit (third‑party)
- 🔜 Mobile app release (App Store & Google Play)
- 🔜 Exchange listings for AETH token
- 🌌 Expansion into live mission tracking

---

🤝 Contributing
We welcome contributions!

1. Fork the repository
2. Create your feature branch (git checkout -b feature/YourFeature)
3. Commit changes (git commit -m 'Add new feature')
4. Push to branch (git push origin feature/YourFeature)
5. Open a Pull Request

---

📄 License
This project is licensed under the MIT License — see the LICENSE file for details.

---

📞 Contact

- GitHub: @Mastatrill
- Repository: github.com/Mastatrill/aetheron-platform
- Website: mastatrill.github.io/aetheron-platform
- Email: contact@aetheron.space

---

⭐ Star us on GitHub if you like this project!  
Created by Mastatrill — Building the future of space exploration 🌌🚀
`

---

✨
