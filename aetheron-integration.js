/**
 * Aetheron Integration Module
 * Combines portfolio, staking, and market helpers for the advanced dashboard.
 */

const DEFAULT_RPC_URL = 'https://polygon-rpc.com';

function createWeb3Provider(injectedProvider) {
  if (ethers?.BrowserProvider) {
    return new ethers.BrowserProvider(injectedProvider);
  }

  if (ethers?.providers?.Web3Provider) {
    return new ethers.providers.Web3Provider(injectedProvider);
  }

  throw new Error('Unsupported ethers provider API.');
}

function createJsonRpcProvider(rpcUrl = DEFAULT_RPC_URL) {
  if (ethers?.JsonRpcProvider) {
    return new ethers.JsonRpcProvider(rpcUrl);
  }

  if (ethers?.providers?.JsonRpcProvider) {
    return new ethers.providers.JsonRpcProvider(rpcUrl);
  }

  throw new Error('Unsupported ethers JSON-RPC provider API.');
}

async function getSignerFromProvider(provider) {
  const signerOrPromise = provider.getSigner();
  return typeof signerOrPromise?.then === 'function'
    ? signerOrPromise
    : signerOrPromise;
}

async function getNetworkChainId(provider) {
  const network = await provider.getNetwork();
  return Number(network?.chainId);
}

function formatUnits(value, decimals = 18) {
  if (ethers?.utils?.formatUnits) {
    return ethers.utils.formatUnits(value, decimals);
  }

  return ethers.formatUnits(value, decimals);
}

function formatEther(value) {
  if (ethers?.utils?.formatEther) {
    return ethers.utils.formatEther(value);
  }

  return ethers.formatEther(value);
}

class AetheronIntegration {
  constructor() {
    this.initialized = false;
    this.provider = null;
    this.signer = null;
    this.readProvider = createJsonRpcProvider();
    this.contracts = {
      aeth: null,
      staking: null,
      pair: null,
    };
    this.portfolio = {
      totalValue: 0,
      tokens: [],
      performance: {},
    };
  }

  async initialize(aethAddress, stakingAddress) {
    try {
      if (!window.ethereum) {
        throw new Error(
          'No Ethereum wallet detected. Please install MetaMask or Coinbase Wallet.',
        );
      }

      this.provider = createWeb3Provider(window.ethereum);
      this.signer = await getSignerFromProvider(this.provider);

      const aethAbi = [
        'function balanceOf(address) view returns (uint256)',
        'function transfer(address to, uint256 amount) returns (bool)',
        'function approve(address spender, uint256 amount) returns (bool)',
        'function decimals() view returns (uint8)',
        'function totalSupply() view returns (uint256)',
      ];

      const stakingAbi = [
        'function stake(uint256 poolId, uint256 amount)',
        'function unstake(uint256 poolId, uint256 amount)',
        'function getStakeInfo(address user, uint256 poolId) view returns (uint256, uint256, uint256)',
        'function claimRewards(uint256 poolId)',
        'function pools(uint256) view returns (uint256, uint256, uint256, bool)',
      ];

      const pairAbi = [
        'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
        'function token0() view returns (address)',
        'function token1() view returns (address)',
      ];

      this.contracts.aeth = new ethers.Contract(aethAddress, aethAbi, this.signer);
      this.contracts.staking = new ethers.Contract(
        stakingAddress,
        stakingAbi,
        this.signer,
      );
      this.contracts.pair = new ethers.Contract(
        '0xd57c5E33ebDC1b565F99d06809debbf86142705D',
        pairAbi,
        this.readProvider,
      );

      this.initialized = true;
      console.log('Aetheron integration initialized');
      return true;
    } catch (error) {
      console.error('Aetheron integration error:', error);
      this.initialized = false;
      return false;
    }
  }

  async getPortfolioValue(userAddress) {
    try {
      const aethBalance = await this.contracts.aeth.balanceOf(userAddress);
      const decimals = await this.contracts.aeth.decimals();
      const liquidBalance = parseFloat(formatUnits(aethBalance, decimals));

      let totalStaked = 0;
      for (let poolId = 0; poolId < 3; poolId += 1) {
        try {
          const stakeInfo = await this.contracts.staking.getStakeInfo(userAddress, poolId);
          totalStaked += parseFloat(formatUnits(stakeInfo[0], decimals));
        } catch {}
      }

      const price = await this.getTokenPrice();
      const totalValue = liquidBalance + totalStaked;

      this.portfolio.totalValue = totalValue;
      this.portfolio.tokens = [
        {
          symbol: 'AETH',
          balance: liquidBalance,
          staked: totalStaked,
        },
      ];
      this.portfolio.performance = {
        price,
        totalValueUsd: totalValue * price,
      };

      return this.portfolio;
    } catch (error) {
      console.error('Portfolio error:', error);
      return null;
    }
  }

  async getStakingPools() {
    const poolDefaults = [
      { duration: '30 Days', apy: 5, lockDays: 30, minStake: 100 },
      { duration: '90 Days', apy: 12, lockDays: 90, minStake: 500 },
      { duration: '180 Days', apy: 25, lockDays: 180, minStake: 1000 },
    ];

    const pools = [];
    for (let poolId = 0; poolId < poolDefaults.length; poolId += 1) {
      try {
        const pool = await this.contracts.staking.pools(poolId);
        pools.push({
          id: poolId,
          ...poolDefaults[poolId],
          totalStaked: formatUnits(pool[2], 18),
          isActive: pool[3],
        });
      } catch {
        pools.push({
          id: poolId,
          ...poolDefaults[poolId],
          totalStaked: '0',
          isActive: false,
        });
      }
    }

    return pools;
  }

  calculateRewards(amount, poolId, days) {
    const apyRates = [5, 12, 25];
    const apy = apyRates[poolId] || 0;
    const dailyRate = apy / 365 / 100;
    const rewards = amount * dailyRate * days;

    return {
      rewards: rewards.toFixed(2),
      total: (amount + rewards).toFixed(2),
      apy,
    };
  }

  async getTokenPrice() {
    try {
      const reserves = await this.contracts.pair.getReserves();
      const reserve0 = parseFloat(formatEther(reserves[0]));
      const reserve1 = parseFloat(formatEther(reserves[1]));

      if (!reserve0 || !reserve1) {
        return 0;
      }

      return reserve1 / reserve0;
    } catch (error) {
      console.error('Price fetch error:', error);
      return 0;
    }
  }

  async getTransactionHistory(userAddress, limit = 10) {
    try {
      const provider = this.readProvider;
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000);
      const filter = this.contracts.aeth.filters.Transfer(null, userAddress);
      const events = await this.contracts.aeth.queryFilter(filter, fromBlock, currentBlock);

      const transactions = await Promise.all(
        events.slice(-limit).map(async (event) => {
          const block = await provider.getBlock(event.blockNumber);
          return {
            hash: event.transactionHash,
            from: event.args[0],
            to: event.args[1],
            amount: formatUnits(event.args[2], 18),
            timestamp: new Date(block.timestamp * 1000),
            type:
              event.args[1].toLowerCase() === userAddress.toLowerCase()
                ? 'receive'
                : 'send',
          };
        }),
      );

      return transactions.reverse();
    } catch (error) {
      console.error('Transaction history error:', error);
      return [];
    }
  }

  analyzeRisk(portfolio) {
    const totalValue = portfolio?.totalValue || 0;
    const staked = portfolio?.tokens?.[0]?.staked || 0;
    const stakedPercentage = totalValue > 0 ? (staked / totalValue) * 100 : 0;
    const diversification =
      totalValue >= 1000 && stakedPercentage >= 40 ? 'Medium' : 'Low';
    const volatilityRisk = totalValue >= 5000 ? 'Medium' : 'High';

    const analysis = {
      diversification,
      volatilityRisk,
      liquidityRisk: stakedPercentage > 80 ? 'Medium' : 'Low',
      recommendations: [],
    };

    if (totalValue < 1000) {
      analysis.recommendations.push('Consider growing your AETH position before splitting across pools.');
    }

    if (stakedPercentage < 50) {
      analysis.recommendations.push('Increase staking allocation to improve passive returns.');
    }

    if (stakedPercentage > 85) {
      analysis.recommendations.push('Keep more AETH liquid for market moves and gas needs.');
    }

    if (analysis.recommendations.length === 0) {
      analysis.recommendations.push('Your allocation looks balanced for the current strategy.');
    }

    return analysis;
  }

  async getMarketStats() {
    try {
      const totalSupply = await this.contracts.aeth.totalSupply();
      const price = await this.getTokenPrice();
      const formattedSupply = parseFloat(formatUnits(totalSupply, 18));

      return {
        totalSupply: formattedSupply,
        marketCap: formattedSupply * price,
        price,
        holders: 'Live',
        volume24h: 'Live',
      };
    } catch (error) {
      console.error('Market stats error:', error);
      return null;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AetheronIntegration;
}

window.AetheronIntegration = AetheronIntegration;
