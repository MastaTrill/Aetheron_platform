# 📋 Aetheron Platform - Contract Addresses

## Polygon Mainnet Deployed Contracts

### Primary Contracts

#### AETH Token

- **Address:** `0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e`
- **Type:** ERC-20 Token
- **Symbol:** AETH
- **Name:** Aetheron
- **Total Supply:** 1,000,000,000 AETH
- **View on PolygonScan:** [Link](https://polygonscan.com/token/0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e)

#### Staking Contract

- **Address:** `0x896D9d37A67B0bBf81dde0005975DA7850FFa638`
- **Type:** Staking Contract
- **Manages:** AETH token staking rewards
- **Pools:** 3 (30/90/180 days)
- **View on PolygonScan:** [Link](https://polygonscan.com/address/0x896D9d37A67B0bBf81dde0005975DA7850FFa638)

---

### Additional Contracts

---

## Wallet Addresses

### Contract Owner (On-chain)

- **Address:** `0xDF5A2b892254C42F80000A029dfE8b311f777Bd5`
- **Role:** Owner of AETH token + Staking contracts; holds marketing allocation + liquidity
- **Holds:** 81.4M AETH marketing / liquidity, 0 POL

### Team Wallet

- **Address:** `0x76A83f91dC64FC4F29CEf6635f9a36477ECA6784`
- **Role:** Team allocation holder
- **Holds:** 254.7M AETH (20%), 0 POL

### Treasury Wallet (c1fa)

- **Address:** `0xa4737aa4b1e8a3c8f221be9e55f5bda307ecc1fa`
- **Role:** Platform treasury
- **Holds:** 29.7 POL, 0 AETH

### Staking Contract

- **Address:** `0x896D9d37A67B0bBf81dde0005975DA7850FFa638`
- **Holds:** 150M AETH staking rewards

### Historical / Obsolete

- `0x127C3a5A0922A0A952aDE71412E2DC651Aa7AF82` — old Coinbase deployer reference, ignore
- `0xF941B28F3B4188c473a4C8C78845ebab58654BA6` — temporary deployer from `.env` prior to audit, not equal to on-chain owner

---

## Cross-Chain Addresses

### Solana

- **Address:** `5fryQ4UPbZWKix8J3jtQhNTDXtSsoX24vyDQ8gQbFqki`
- **Type:** Solana Account/Mint
- **View on Solscan:** [Link](https://solscan.io/account/5fryQ4UPbZWKix8J3jtQhNTDXtSsoX24vyDQ8gQbFqki)

---

## Network Information

### Polygon Mainnet

- **Chain ID:** 137
- **RPC URL:** https://polygon-rpc.com
- **Currency:** POL (Polygon)
- **Explorer:** https://polygonscan.com

---

## Quick Links

- **Add AETH to MetaMask:** See [ADD_TOKEN_TO_METAMASK.md](ADD_TOKEN_TO_METAMASK.md)
- **Dashboard:** http://localhost:8080/dashboard.html
- **Admin Dashboard:** http://localhost:8080/admin-dashboard.html
- **Deployment Guide:** See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

## Contract Interactions

All contracts can be interacted with via:

- MetaMask + Dashboard UI
- Hardhat scripts in `smart-contract/scripts/`
- Direct blockchain explorer (PolygonScan)
- Web3.js or Ethers.js libraries

---

**Last Updated:** 2026-07-02
