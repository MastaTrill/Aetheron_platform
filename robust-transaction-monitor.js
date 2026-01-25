import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  POLYGON_RPC_ENDPOINTS: [
    'https://polygon-rpc.com/',
    'https://rpc-mainnet.matic.network',
    'https://matic-mainnet.chainstacklabs.com',
    'https://rpc-mainnet.maticvigil.com',
    'https://polygon-bor.public.blastapi.io'
  ],
  CONTRACT_ADDRESS: '0x1234567890123456789012345678901234567890', // Replace with actual contract
  POLLING_INTERVAL: 30000, // 30 seconds
  MAX_RETRIES: 3,
  BACKOFF_MULTIPLIER: 2,
  CACHE_DURATION: 60000, // 1 minute
  DASHBOARD_UPDATE_INTERVAL: 60000 // 1 minute
};

// Contract ABI (simplified for monitoring)
const CONTRACT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Staked(address indexed user, uint256 amount)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)"
];

class RobustTransactionMonitor {
  constructor() {
    this.providers = CONFIG.POLYGON_RPC_ENDPOINTS.map(url => new ethers.JsonRpcProvider(url));
    this.currentProviderIndex = 0;
    this.contract = null;
    this.metrics = {
      uptime: 0,
      latestBlock: 0,
      transactions: 0,
      uniqueUsers: new Set(),
      tvl: 150000000, // Starting TVL
      price: 0.0005512, // AETH price
      lastUpdate: Date.now()
    };
    this.cache = new Map();
    this.retryCount = 0;
    this.isRunning = false;
  }

  getCurrentProvider() {
    return this.providers[this.currentProviderIndex];
  }

  switchProvider() {
    this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
    console.log(`🔄 Switching to RPC endpoint: ${CONFIG.POLYGON_RPC_ENDPOINTS[this.currentProviderIndex]}`);
  }

  async makeRequestWithRetry(requestFn, maxRetries = CONFIG.MAX_RETRIES) {
    let attempt = 0;
    let delay = 1000;

    while (attempt < maxRetries) {
      try {
        const result = await requestFn();
        this.retryCount = 0; // Reset on success
        return result;
      } catch (error) {
        attempt++;
        console.log(`⚠️  Request failed (attempt ${attempt}/${maxRetries}): ${error.message}`);

        if (attempt >= maxRetries) {
          throw error;
        }

        // Switch provider on failure
        this.switchProvider();

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= CONFIG.BACKOFF_MULTIPLIER;
      }
    }
  }

  async getLatestBlock() {
    const cacheKey = 'latestBlock';
    const cached = this.cache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < CONFIG.CACHE_DURATION) {
      return cached.data;
    }

    const blockNumber = await this.makeRequestWithRetry(async () => {
      return await this.getCurrentProvider().getBlockNumber();
    });

    this.cache.set(cacheKey, { data: blockNumber, timestamp: Date.now() });
    return blockNumber;
  }

  async getBlockTransactions(blockNumber) {
    const cacheKey = `block_${blockNumber}`;
    const cached = this.cache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < CONFIG.CACHE_DURATION) {
      return cached.data;
    }

    const block = await this.makeRequestWithRetry(async () => {
      return await this.getCurrentProvider().getBlock(blockNumber, true);
    });

    this.cache.set(cacheKey, { data: block, timestamp: Date.now() });
    return block;
  }

  async getContractData() {
    if (!this.contract) {
      this.contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, CONTRACT_ABI, this.getCurrentProvider());
    }

    try {
      const totalSupply = await this.makeRequestWithRetry(async () => {
        return await this.contract.totalSupply();
      });

      return {
        totalSupply: ethers.formatEther(totalSupply),
        tvl: this.metrics.tvl
      };
    } catch (error) {
      console.log(`⚠️  Contract data fetch failed: ${error.message}`);
      return null;
    }
  }

  async processBlock(blockNumber) {
    try {
      const block = await this.getBlockTransactions(blockNumber);

      if (!block || !block.transactions) return 0;

      let blockTxCount = 0;

      for (const tx of block.transactions) {
        // Check if transaction involves our contract
        if (tx.to && tx.to.toLowerCase() === CONFIG.CONTRACT_ADDRESS.toLowerCase()) {
          blockTxCount++;
          this.metrics.transactions++;

          // Track unique users
          if (tx.from) {
            this.metrics.uniqueUsers.add(tx.from.toLowerCase());
          }
        }
      }

      return blockTxCount;
    } catch (error) {
      console.log(`⚠️  Block processing failed for ${blockNumber}: ${error.message}`);
      return 0;
    }
  }

  updateDashboard() {
    const uptime = Math.floor((Date.now() - this.metrics.lastUpdate) / 60000); // minutes
    const estValue = (this.metrics.tvl * this.metrics.price).toFixed(2);

    console.clear();
    console.log('📊 AETHERON PLATFORM - ROBUST MONITOR');
    console.log('==================================================');
    console.log(`⏱️  Uptime: ${uptime} minutes`);
    console.log(`📦 Latest Block: ${this.metrics.latestBlock}`);
    console.log(`💸 Transactions: ${this.metrics.transactions}`);
    console.log(`👥 Unique Users: ${this.metrics.uniqueUsers.size}`);
    console.log(`🏦 TVL: ${this.metrics.tvl.toLocaleString()} AETH`);
    console.log(`💵 Est. Value: $${estValue}`);
    console.log('');
    console.log('📈 Activity (Last 24h):');
    console.log(`   🔄 Blocks Processed: Active`);
    console.log(`   📊 Data Freshness: ${Math.floor((Date.now() - this.metrics.lastUpdate) / 1000)}s ago`);
    console.log('');
    console.log('==================================================');
    console.log('🔄 Monitoring active... (Ctrl+C to stop)');
    console.log('==================================================');
  }

  async saveMetrics() {
    const metricsFile = path.join(__dirname, 'monitoring-data.json');
    const data = {
      timestamp: new Date().toISOString(),
      metrics: {
        ...this.metrics,
        uniqueUsers: Array.from(this.metrics.uniqueUsers)
      }
    };

    try {
      fs.writeFileSync(metricsFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.log(`⚠️  Failed to save metrics: ${error.message}`);
    }
  }

  async start() {
    console.log('🚀 Starting Aetheron Robust Transaction Monitor...');
    this.isRunning = true;
    this.metrics.lastUpdate = Date.now();

    // Initial dashboard
    this.updateDashboard();

    // Main monitoring loop
    const monitorLoop = async () => {
      if (!this.isRunning) return;

      try {
        // Get latest block
        const latestBlock = await this.getLatestBlock();
        this.metrics.latestBlock = latestBlock;

        // Process recent blocks (last 10)
        for (let i = 0; i < 10; i++) {
          const blockNum = latestBlock - i;
          if (blockNum > 0) {
            await this.processBlock(blockNum);
          }
        }

        // Update contract data occasionally
        if (Math.random() < 0.1) { // 10% chance each cycle
          const contractData = await this.getContractData();
          if (contractData) {
            this.metrics.tvl = parseFloat(contractData.totalSupply);
          }
        }

        // Update dashboard
        this.updateDashboard();

        // Save metrics
        await this.saveMetrics();

      } catch (error) {
        console.log(`❌ Monitoring cycle failed: ${error.message}`);
      }

      // Schedule next cycle
      setTimeout(monitorLoop, CONFIG.POLLING_INTERVAL);
    };

    // Dashboard update loop
    const dashboardLoop = () => {
      if (!this.isRunning) return;
      this.updateDashboard();
      setTimeout(dashboardLoop, CONFIG.DASHBOARD_UPDATE_INTERVAL);
    };

    // Start loops
    setTimeout(monitorLoop, 1000);
    setTimeout(dashboardLoop, CONFIG.DASHBOARD_UPDATE_INTERVAL);
  }

  stop() {
    console.log('🛑 Shutting down monitor...');
    this.isRunning = false;
    this.saveMetrics();
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  if (global.monitor) {
    global.monitor.stop();
  }
  process.exit(0);
});

// Start monitoring
const monitor = new RobustTransactionMonitor();
global.monitor = monitor;
monitor.start().catch(console.error);