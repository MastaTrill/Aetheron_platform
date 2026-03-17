# 🚀 Smart Contract Deployment Guide

## Governance Contract Deployment

### Prerequisites

- Node.js v18+ installed
- Hardhat development environment
- Private key with MATIC for gas fees on Polygon Mainnet
- OpenZeppelin contracts installed

### Step 1: Install Dependencies

```bash
cd smart-contract
npm init -y
npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers
npm install @openzeppelin/contracts
```

### Step 2: Setup Hardhat Config

Create `hardhat.config.js`:

```javascript
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    polygon: {
      url: "https://polygon-rpc.com/",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 137
    },
    # ...existing code...
      accounts: [process.env.PRIVATE_KEY],
      chainId: 80001
    }
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY
  }
};
```

### Step 3: Create .env File

```
PRIVATE_KEY=your_private_key_here
POLYGONSCAN_API_KEY=your_polygonscan_api_key
AETH_TOKEN_ADDRESS=0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e
```

### Step 4: Create Deployment Script

Create `scripts/deploy-governance.js`:

```javascript
const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with account:', deployer.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());

  // Get AETH token address
  const aethToken = process.env.AETH_TOKEN_ADDRESS;
  console.log('AETH Token:', aethToken);

  // Deploy AetheronGovernance
  const AetheronGovernance =
    await ethers.getContractFactory('AetheronGovernance');
  const governance = await AetheronGovernance.deploy(aethToken);

  await governance.deployed();

  console.log('✅ AetheronGovernance deployed to:', governance.address);

  console.log('\n📋 Next Steps:');
  console.log('1. Update governance.html: Replace GOVERNANCE_CONTRACT address');
  console.log('2. Verify contract on PolygonScan');
  console.log('3. Test proposal creation');
  console.log('4. Update frontend documentation');

  // Save deployment info
  const fs = require('fs');
  const deployInfo = {
    network: 'polygon',
    governanceContract: governance.address,
    aethToken: aethToken,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };

  fs.writeFileSync('deployment-info.json', JSON.stringify(deployInfo, null, 2));

  console.log('\n💾 Deployment info saved to deployment-info.json');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Step 5: Deploy to Polygon Mainnet

```bash
 # ...existing code...
```

### Step 6: Deploy to Polygon Mainnet

```bash
npx hardhat run scripts/deploy-governance.js --network polygon
```

### Step 7: Verify Contract on PolygonScan

```bash
npx hardhat verify --network polygon <GOVERNANCE_CONTRACT_ADDRESS> <AETH_TOKEN_ADDRESS>
```

### Step 8: Update Frontend

In `governance.html`, update line 1163:

```javascript
const GOVERNANCE_CONTRACT = '0xYOUR_DEPLOYED_CONTRACT_ADDRESS';
```

### Step 9: Test the System

1. **Create Test Proposal**
   - Connect wallet with 10,000+ AETH
   - Click "Create Proposal" button
   - Fill form and submit
   - Verify transaction on PolygonScan

2. **Test Voting**
   - Vote on the proposal
   - Check vote was recorded on-chain

3. **Test Delegation**
   - Open delegation modal
   - Delegate to another address
   - Verify delegation on PolygonScan

### Contract Features

✅ **Proposal Creation**

- 10,000 AETH deposit required
- Deposit refunded if 20% quorum reached
- 7-day voting period (default)
- 2-day execution delay

✅ **Voting System**

- Vote For/Against/Abstain
- Voting power = AETH balance
- One vote per address per proposal
- Weighted by token holdings

✅ **Delegation**

- Delegate voting power to trusted addresses
- Revoke delegation any time
- Track delegated power received

✅ **Execution**

- Automatic execution for passed proposals
- Configurable execution data
- Time-lock before execution

### Security Considerations

⚠️ **Important Security Notes:**

1. **Use Hardware Wallet**: Deploy with Ledger/Trezor
2. Always test on mainnet
3. **Audit Contract**: Consider professional audit for mainnet
4. **Multi-sig Ownership**: Use Gnosis Safe for owner operations
5. **Emergency Pause**: Consider adding pause functionality
6. **Rate Limiting**: Monitor for spam proposals

### Gas Estimates

| Operation        | Estimated Gas | Estimated Cost (30 Gwei) |
| ---------------- | ------------- | ------------------------ |
| Deploy Contract  | ~3,500,000    | ~0.105 MATIC (~$0.08)    |
| Create Proposal  | ~150,000      | ~0.0045 MATIC (~$0.003)  |
| Cast Vote        | ~80,000       | ~0.0024 MATIC (~$0.002)  |
| Delegate         | ~60,000       | ~0.0018 MATIC (~$0.001)  |
| Execute Proposal | ~100,000      | ~0.003 MATIC (~$0.002)   |

### Monitoring

After deployment, monitor:

- Proposal creation rate
- Voter participation
- Delegation patterns
- Execution success rate
- Gas costs

### Upgrade Path

This contract is **not upgradeable** by design for security. For upgrades:

1. Deploy new contract version
2. Community vote on migration
3. Transfer treasury to new contract
4. Update frontend to point to new address

### Support

For deployment issues:

- Review Hardhat docs: https://hardhat.org/
- Check Polygon docs: https://polygon.technology/
- Community Discord: [Add your Discord]
- GitHub Issues: [Add your repo]

---

**Last Updated**: 2026-02-08
**Contract Version**: 1.0.0
**Author**: Aetheron Core Team
