// Contract addresses by network
export const CONTRACTS = {
  local: {
    AETH_TOKEN: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    STAKING: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    PRESALE: '',
  },
  base: {
    AETH_TOKEN: '0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e',
    PRESALE: '0xe0A3B6368312dFd3E7E76202e673f895f8235A3d',
    // Public staking is not active until a verified Base staking address is published.
    STAKING: '',
  },
};

export const NETWORKS = {
  hardhat: {
    chainId: 1337,
    name: 'Hardhat',
    rpcUrl: 'http://127.0.0.1:8545',
  },
  base: {
    chainId: 8453,
    name: 'Base Mainnet',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
  },
};

export const getCurrentNetwork = () => {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || '8453';
  if (chainId === '1337') return { ...NETWORKS.hardhat, contracts: CONTRACTS.local };
  return { ...NETWORKS.base, contracts: CONTRACTS.base };
};

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

// Retained for future use. Do not enable staking UI until a verified Base address is configured.
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
