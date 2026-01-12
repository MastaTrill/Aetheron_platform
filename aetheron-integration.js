/**
 * Aetheron Integration Module
 * Combines DeFi, Portfolio Management, and Advanced Trading Features
 */

class AetheronIntegration {
    constructor() {
        this.initialized = false;
        this.contracts = {
            aeth: null,
            staking: null
        };
        this.portfolio = {
            totalValue: 0,
            tokens: [],
            performance: {}
        };
    }

    async initialize(aethAddress, stakingAddress) {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask not installed');
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // Initialize AETH Token Contract
            const aethABI = [
                "function balanceOf(address) view returns (uint256)",
                "function transfer(address to, uint256 amount) returns (bool)",
                "function approve(address spender, uint256 amount) returns (bool)",
                "function decimals() view returns (uint8)",
                "function totalSupply() view returns (uint256)"
            ];

            // Initialize Staking Contract
            const stakingABI = [
                "function stake(uint256 poolId, uint256 amount)",
                "function unstake(uint256 poolId, uint256 amount)",
                "function getStakeInfo(address user, uint256 poolId) view returns (uint256, uint256, uint256)",
                "function claimRewards(uint256 poolId)",
                "function pools(uint256) view returns (uint256, uint256, uint256, bool)"
            ];

            this.contracts.aeth = new ethers.Contract(aethAddress, aethABI, signer);
            this.contracts.staking = new ethers.Contract(stakingAddress, stakingABI, signer);

            this.initialized = true;
            console.log('✅ Aetheron Integration Initialized');
            return true;
        } catch (error) {
            console.error('❌ Initialization Error:', error);
            return false;
        }
    }

    // Portfolio Management
    async getPortfolioValue(userAddress) {
        try {
            const aethBalance = await this.contracts.aeth.balanceOf(userAddress);
            const decimals = await this.contracts.aeth.decimals();
            const balance = ethers.formatUnits(aethBalance, decimals);

            // Get staked amounts across all pools
            let totalStaked = 0;
            for (let i = 0; i < 3; i++) {
                try {
                    const stakeInfo = await this.contracts.staking.getStakeInfo(userAddress, i);
                    totalStaked += parseFloat(ethers.formatUnits(stakeInfo[0], decimals));
                } catch (e) {
                    // Pool might not exist
                }
            }

            this.portfolio.totalValue = parseFloat(balance) + totalStaked;
            this.portfolio.tokens = [
                { symbol: 'AETH', balance: parseFloat(balance), staked: totalStaked }
            ];

            return this.portfolio;
        } catch (error) {
            console.error('Portfolio Error:', error);
            return null;
        }
    }

    // Advanced Staking with APY Calculation
    async getStakingPools() {
        const pools = [];
        const poolData = [
            { duration: '30 Days', apy: 5, lockDays: 30, minStake: 100 },
            { duration: '90 Days', apy: 12, lockDays: 90, minStake: 500 },
            { duration: '180 Days', apy: 25, lockDays: 180, minStake: 1000 }
        ];

        for (let i = 0; i < 3; i++) {
            try {
                const pool = await this.contracts.staking.pools(i);
                pools.push({
                    id: i,
                    ...poolData[i],
                    totalStaked: ethers.formatUnits(pool[2], 18),
                    isActive: pool[3]
                });
            } catch (e) {
                pools.push({
                    id: i,
                    ...poolData[i],
                    totalStaked: '0',
                    isActive: false
                });
            }
        }

        return pools;
    }

    // Calculate potential rewards
    calculateRewards(amount, poolId, days) {
        const apyRates = [5, 12, 25]; // APY for each pool
        const apy = apyRates[poolId] || 0;
        const dailyRate = apy / 365 / 100;
        const rewards = amount * dailyRate * days;
        return {
            rewards: rewards.toFixed(2),
            total: (amount + rewards).toFixed(2),
            apy: apy
        };
    }

    // DeFi Integration - Get token price from QuickSwap
    async getTokenPrice() {
        try {
            // QuickSwap pair address for AETH/POL
            const pairAddress = '0xd57c5E33ebDC1b565F99d06809debbf86142705D';
            const pairABI = [
                "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
                "function token0() view returns (address)",
                "function token1() view returns (address)"
            ];

            const provider = new ethers.BrowserProvider(window.ethereum);
            const pair = new ethers.Contract(pairAddress, pairABI, provider);

            const reserves = await pair.getReserves();
            const token0 = await pair.token0();

            // Calculate price based on reserves
            const price = parseFloat(ethers.formatUnits(reserves[1], 18)) /
                parseFloat(ethers.formatUnits(reserves[0], 18));

            return price;
        } catch (error) {
            console.error('Price fetch error:', error);
            return 0;
        }
    }

    // Transaction History
    async getTransactionHistory(userAddress, limit = 10) {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const currentBlock = await provider.getBlockNumber();
            const fromBlock = Math.max(0, currentBlock - 10000); // Last ~10k blocks

            // Get Transfer events
            const filter = this.contracts.aeth.filters.Transfer(null, userAddress);
            const events = await this.contracts.aeth.queryFilter(filter, fromBlock, currentBlock);

            const transactions = await Promise.all(
                events.slice(-limit).map(async (event) => {
                    const block = await provider.getBlock(event.blockNumber);
                    return {
                        hash: event.transactionHash,
                        from: event.args[0],
                        to: event.args[1],
                        amount: ethers.formatUnits(event.args[2], 18),
                        timestamp: new Date(block.timestamp * 1000),
                        type: event.args[1].toLowerCase() === userAddress.toLowerCase() ? 'receive' : 'send'
                    };
                })
            );

            return transactions.reverse();
        } catch (error) {
            console.error('Transaction history error:', error);
            return [];
        }
    }

    // Risk Management - Portfolio Diversification Check
    analyzeRisk(portfolio) {
        const analysis = {
            diversification: 'Low', // Single token
            volatilityRisk: 'Medium',
            liquidityRisk: 'Low', // Listed on QuickSwap
            recommendations: []
        };

        if (portfolio.totalValue < 1000) {
            analysis.recommendations.push('Consider staking for passive income');
        }

        const stakedPercentage = (portfolio.tokens[0].staked / portfolio.totalValue) * 100;
        if (stakedPercentage < 50) {
            analysis.recommendations.push('Increase staking allocation for better returns');
        }

        if (portfolio.totalValue > 10000) {
            analysis.recommendations.push('Consider diversifying into other DeFi protocols');
        }

        return analysis;
    }

    // Market Analytics
    async getMarketStats() {
        try {
            const totalSupply = await this.contracts.aeth.totalSupply();
            const price = await this.getTokenPrice();

            return {
                totalSupply: ethers.formatUnits(totalSupply, 18),
                marketCap: parseFloat(ethers.formatUnits(totalSupply, 18)) * price,
                price: price,
                holders: 'Loading...', // Would need to query blockchain or API
                volume24h: 'Loading...' // Would need DEX API
            };
        } catch (error) {
            console.error('Market stats error:', error);
            return null;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AetheronIntegration;
}

// Global instance
window.AetheronIntegration = AetheronIntegration;
