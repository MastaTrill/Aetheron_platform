// Contract addresses - Update after deployment
export const CONTRACTS = {
  // Local/Development
  local: {
    AETH_TOKEN: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    STAKING: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  },
  // Mumbai Testnet
  mumbai: {
    AETH_TOKEN: '',
    STAKING: '',
  },
  // Polygon Mainnet - DEPLOYED Dec 20, 2025
  polygon: {
    AETH_TOKEN: '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e',
    STAKING: '0x896D9d37A67B0bBf81dde0005975DA7850FFa638',
    // Previous deployments (deprecated)
    LEGACY_TOKEN_1: '0x76A83f91dC64FC4F29CEf6635f9a36477ECA6784',
    LEGACY_TOKEN_2: '0x072091F554df794852E0A9d1c809F2B2bBda171E',
    LEGACY_TOKEN_3: '0xb687083F85c59f3dE192ab001d2D52c8D87181d5',
    LEGACY_TOKEN_4: '0x25ed26BD8A6Cd2551AA3CCA8D4022A7efc276D54',
  },
};

// Network configurations
export const NETWORKS = {
  hardhat: {
    chainId: 1337,
    name: 'Hardhat',
    rpcUrl: 'http://127.0.0.1:8545',
  },
  mumbai: {
    chainId: 80001,
    name: 'Mumbai Testnet',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    blockExplorer: 'https://mumbai.polygonscan.com',
  },
  polygon: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
  },
};

// Get current network config
export const getCurrentNetwork = () => {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || '137';
  
  switch (chainId) {
    case '1337':
      return { ...NETWORKS.hardhat, contracts: CONTRACTS.local };
    case '80001':
      return { ...NETWORKS.mumbai, contracts: CONTRACTS.mumbai };
    case '137':
    default:
      return { ...NETWORKS.polygon, contracts: CONTRACTS.polygon };
  }
};

// Contract ABIs (abbreviated - full ABIs generated after compilation)
export const AETH_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function tradingEnabled() view returns (bool)',
  'function buyTaxRate() view returns (uint256)',
  'function sellTaxRate() view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

export const STAKING_ABI = [
  'function stake(uint256 poolId, uint256 amount)',
  'function unstake(uint256 stakeId)',
  'function claimRewards(uint256 stakeId)',
  'function calculateReward(address user, uint256 stakeId) view returns (uint256)',
  'function pools(uint256) view returns (uint256 lockDuration, uint256 rewardRate, uint256 totalStaked, bool isActive)',
  'function getUserStakesCount(address user) view returns (uint256)',
  'function getUserStake(address user, uint256 stakeId) view returns (uint256 amount, uint256 startTime, uint256 lastClaimTime, uint256 poolId, uint256 pendingReward, uint256 unlockTime)',
  'function totalStaked() view returns (uint256)',
  'function rewardBalance() view returns (uint256)',
  'function poolCount() view returns (uint256)',
  'event Staked(address indexed user, uint256 indexed poolId, uint256 amount)',
  'event Unstaked(address indexed user, uint256 indexed stakeId, uint256 amount)',
  'event RewardClaimed(address indexed user, uint256 indexed stakeId, uint256 reward)',
];
