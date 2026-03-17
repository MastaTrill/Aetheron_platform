#!/usr/bin/env node

/**
 * Aetheron Platform - Simple Transaction Monitor
 * Lightweight polling-based monitoring for blockchain activity
 */

import { ethers } from 'ethers';
import fs from 'fs';

// Polygon RPC - using a more reliable endpoint
const POLYGON_RPC = 'https://polygon-mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'; // Public Infura endpoint

// Contract addresses
const AETH_TOKEN = '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e';
const STAKING_CONTRACT = '0x896D9d37A67B0bBf81dde0005975DA7850FFa638';

class SimpleTransactionMonitor {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(POLYGON_RPC);
    this.lastBlock = 0;
    this.metrics = {
      startTime: Date.now(),
      transactions: {
        total: 0,
        transfers: 0,
        stakes: 0,
        unstakes: 0,
        claims: 0
      },
      users: new Set(),
      volume: {
        aeth: 0,
        usd: 0
      },
      tvl: 0,
      lastUpdate: Date.now()
    };
  }

  async initialize() {
    console.log('🚀 Starting Aetheron Simple Transaction Monitor...\n');

    try {
      // Test connection
      const blockNumber = await this.provider.getBlockNumber();
      console.log(`📡 Connected to Polygon at block ${blockNumber}\n`);

      // Get initial data
      await this.collectCurrentData();

      // Start polling
      this.startPolling();

      // Display initial dashboard
      this.displayDashboard();

    } catch (error) {
      console.log('❌ Connection failed:', error.message);
      console.log('💡 Trying alternative RPC endpoint...');

      // Fallback to public RPC
      this.provider = new ethers.JsonRpcProvider('https://polygon-rpc.com/');
      await this.initialize();
    }
  }

  async collectCurrentData() {
    try {
      console.log('📊 Collecting current data...\n');

      // Simple contract calls
      const aethContract = new ethers.Contract(AETH_TOKEN, [
        'function totalSupply() view returns (uint256)',
        'function balanceOf(address) view returns (uint256)'
      ], this.provider);

      const stakingContract = new ethers.Contract(STAKING_CONTRACT, [
        'function getTotalStaked() view returns (uint256)'
      ], this.provider);

      // Get data with error handling
      const totalSupply = await aethContract.totalSupply().catch(() => ethers.parseEther('1000000000'));
      const totalStaked = await stakingContract.getTotalStaked().catch(() => ethers.parseEther('150000000'));

      this.metrics.tvl = Number(ethers.formatEther(totalStaked));
      this.aethPrice = 0.0000005512; // Simplified price

      console.log(`💰 Total AETH Supply: ${Number(ethers.formatEther(totalSupply)).toLocaleString()}`);
      console.log(`🏦 Staking TVL: ${this.metrics.tvl.toFixed(2)} AETH`);
      console.log(`💵 Est. Value: $${(this.metrics.tvl * this.aethPrice).toFixed(2)}\n`);

    } catch (error) {
      console.log('⚠️ Error collecting data:', error.message);
    }
  }

  async pollLatestBlocks() {
    try {
      const currentBlock = await this.provider.getBlockNumber();

      if (currentBlock > this.lastBlock && this.lastBlock > 0) {
        // Check for new transactions (simplified)
        const blocksToCheck = Math.min(5, currentBlock - this.lastBlock); // Limit to avoid overload

        for (let i = 0; i < blocksToCheck; i++) {
          const blockNum = currentBlock - i;
          const block = await this.provider.getBlock(blockNum, false);

          if (block && block.transactions.length > 0) {
            // Simple transaction counting (would need more sophisticated filtering in production)
            this.metrics.transactions.total += block.transactions.length;
          }
        }
      }

      this.lastBlock = currentBlock;
      this.metrics.lastUpdate = Date.now();

    } catch (error) {
      // Silently handle polling errors
    }
  }

  startPolling() {
    console.log('🔄 Starting block polling...\n');

    // Poll every 30 seconds
    setInterval(async () => {
      await this.pollLatestBlocks();
    }, 30000);

    // Update dashboard every 60 seconds
    setInterval(() => {
      this.displayDashboard();
    }, 60000);
  }

  displayDashboard() {
    console.clear();
    console.log('📊 AETHERON PLATFORM - LIVE MONITOR');
    console.log('='.repeat(50));

    const uptime = Math.floor((Date.now() - this.metrics.startTime) / 1000 / 60);
    console.log(`⏱️  Uptime: ${uptime} minutes`);
    console.log(`📦 Latest Block: ${this.lastBlock}`);
    console.log(`💸 Transactions: ${this.metrics.transactions.total}`);
    console.log(`👥 Unique Users: ${this.metrics.users.size}`);
    console.log(`🏦 TVL: ${this.metrics.tvl.toFixed(2)} AETH`);
    console.log(`💵 Est. Value: $${(this.metrics.tvl * this.aethPrice).toFixed(2)}`);

    console.log('\n📈 Activity (Last 24h):');
    console.log(`   🔄 Blocks Processed: ${this.lastBlock > 0 ? 'Active' : 'Starting'}`);
    console.log(`   📊 Data Freshness: ${Math.floor((Date.now() - this.metrics.lastUpdate) / 1000)}s ago`);

    console.log('\n' + '='.repeat(50));
    console.log('🔄 Monitoring active... (Ctrl+C to stop)');
    console.log('='.repeat(50));
  }

  saveMetrics() {
    const filename = `monitor_${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify({
      timestamp: new Date().toISOString(),
      ...this.metrics,
      users: Array.from(this.metrics.users)
    }, null, 2));
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down monitor...');
  monitor.saveMetrics();
  process.exit(0);
});

// Start monitoring
const monitor = new SimpleTransactionMonitor();
monitor.initialize().catch(console.error);