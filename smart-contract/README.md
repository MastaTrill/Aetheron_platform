# Aetheron Smart Contracts

Smart contracts for the Aetheron Platform - Revolutionary Blockchain & Space Exploration Ecosystem.

## Contracts

### Aetheron (AETH) Token
ERC20 token with:
- **Total Supply**: 1,000,000,000 AETH
- **Tax System**: Configurable buy/sell taxes
- **Distribution**: 
  - 50% Liquidity Pool
  - 20% Team Allocation
  - 15% Marketing
  - 15% Staking Rewards
- **Features**:
  - Trading control (enable/disable)
  - Tax exclusion list
  - Blacklist functionality
  - Emergency token rescue

### AetheronStaking
Staking contract with:
- **Multiple Pools**: Different lock periods and APY rates
- **Default Pools**:
  - 30 days @ 5% APY
  - 90 days @ 12% APY
  - 180 days @ 25% APY
- **Features**:
  - Flexible staking periods
  - Automatic reward calculation
  - Claim rewards independently
  - Multiple stakes per user

## Setup

### Install Dependencies
```bash
npm install
```

### Configure Environment
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Required variables:
- `PRIVATE_KEY`: Your wallet private key for deployment
- `POLYGON_RPC_URL`: Polygon RPC endpoint
- `POLYGONSCAN_API_KEY`: For contract verification
- `TEAM_WALLET`: Team wallet address
- `MARKETING_WALLET`: Marketing wallet address

## Development

### Compile Contracts
```bash
npm run compile
```

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### Run Local Node
```bash
npm run node
```

## Deployment

### Deploy to Local Network
```bash
npm run deploy:local
```

### Deploy to Mumbai Testnet
```bash
npm run deploy:mumbai
```

### Deploy to Polygon Mainnet
```bash
npm run deploy:polygon
```

### Verify Contracts
After deployment, verify on block explorer:
```bash
npm run verify:polygon -- <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Contract Addresses

### Mainnet (Polygon)
- **AETH Token**: `0x76A83f91dC64FC4F29CEf6635f9a36477ECA6784`
- **Staking Contract**: `0x8a3ad49656bd07981c9cfc7ad826a808847c3452`

### Testnet (Mumbai)
- TBD

## Post-Deployment Steps

1. **Enable Trading**
   ```javascript
   await aetheronToken.enableTrading();
   ```

2. **Add Liquidity to DEX**
   - Create pair on Uniswap/SushiSwap
   - Add initial liquidity

3. **Deposit Staking Rewards**
   ```javascript
   await aetheronToken.approve(stakingAddress, rewardAmount);
   await stakingContract.depositRewards(rewardAmount);
   ```

4. **Configure Tax Exclusions**
   ```javascript
   await aetheronToken.setExcludedFromTax(dexRouter, true);
   await aetheronToken.setExcludedFromTax(stakingAddress, true);
   ```

5. **Update Frontend**
   - Update contract addresses in frontend config
   - Update ABIs

## Security

- Contracts use OpenZeppelin's audited libraries
- ReentrancyGuard on sensitive functions
- Access control with Ownable
- SafeERC20 for token transfers

## Testing

Tests cover:
- Token deployment and distribution
- Trading controls
- Tax system
- Staking mechanics
- Reward calculations
- Edge cases and security

## Gas Optimization

- Optimizer enabled with 200 runs
- Efficient storage packing
- Batch operations where possible

## Support

For issues and questions:
- GitHub Issues: https://github.com/MastaTrill/Aetheron_platform/issues
- Documentation: Full guides in main README

## License

MIT License - see LICENSE file for details
