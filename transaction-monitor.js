#!/usr/bin/env node

/**
 * Aetheron Platform - Transaction Monitor
 * Real-time monitoring of blockchain activity and user engagement
 */

import pkg from 'ethers';
const { ethers } = pkg;
import fs from 'fs';
import https from 'https';

// Polygon RPC fallback endpoints
const POLYGON_RPC_URLS = [
  'https://polygon-rpc.com/',
  'https://rpc-mainnet.matic.network/',
  'https://polygon.llamarpc.com/',
  'https://rpc.ankr.com/polygon'
];

// Contract addresses
const AETH_TOKEN = '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e';
const STAKING_CONTRACT = '0x896D9d37A67B0bBf81dde0005975DA7850FFa638';
const LIQUIDITY_PAIR = '0xd57c5E33ebDC1b565F99d06809debbf86142705D';

// ABI fragments for monitoring
const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)'
];

const STAKING_ABI = [
  'event Staked(address indexed user, uint256 amount, uint256 poolId)',
  'event Unstaked(address indexed user, uint256 amount, uint256 poolId)',
  'event RewardsClaimed(address indexed user, uint256 amount)',
  'function getTotalStaked() view returns (uint256)',
  'function getUserStake(address) view returns (uint256)'
];

class TransactionMonitor {
  constructor() {
    this.provider = null;
    this.aethPrice = 0;
    this.metrics = {
      startTime: Date.now(),
      transactions: {
        total: 0,
        transfers: 0,
        approvals: 0,
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

  async initProvider() {
    for (const rpcUrl of POLYGON_RPC_URLS) {
      try {
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        await provider.getNetwork();
        console.log(`✅ Connected to RPC: ${rpcUrl}`);
        return provider;
      } catch (error) {
        console.log(`⚠️ Failed RPC ${rpcUrl}: ${error.message}`);
      }
    }
    throw new Error('❌ All RPC endpoints failed');
  }

  async fetchPrice() {
    return new Promise((resolve) => {
      https.get(`https://api.dexscreener.com/latest/dex/tokens/${AETH_TOKEN}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.pairs && json.pairs[0] && json.pairs[0].priceUsd) {
              resolve(parseFloat(json.pairs[0].priceUsd));
            } else {
              resolve(0.0000005512); // Fallback
            }
          } catch {
            resolve(0.0000005512); // Fallback
          }
        });
      }).on('error', () => resolve(0.0000005512));
    });
  }

  async initialize() {
    console.log('🚀 Starting Aetheron Transaction Monitor...\n');

    // Initialize provider with fallbacks
    this.provider = await this.initProvider();

    // Initialize contracts
    this.aethContract = new ethers.Contract(AETH_TOKEN, ERC20_ABI, this.provider);
    this.stakingContract = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, this.provider);

    // Fetch current price
    this.aethPrice = await this.fetchPrice();
    console.log(`💰 Current AETH Price: $${this.aethPrice}\n`);

    // Start monitoring from current block only (not historical)
    await this.startMonitoring();

    // Get current data only
    await this.collectCurrentData();

    // Display dashboard
    this.displayDashboard();
  }

  async startMonitoring() {
    console.log('📡 Setting up event listeners...\n');

    // Monitor AETH transfers (limit to reduce load)
    this.aethContract.on('Transfer', (from, to, value) => {
      this.metrics.transactions.total++;
      this.metrics.transactions.transfers++;
      this.metrics.users.add(from.toLowerCase());
      this.metrics.users.add(to.toLowerCase());
      this.metrics.volume.aeth += Number(ethers.utils.formatEther(value));

      console.log(`💸 Transfer: ${Number(ethers.utils.formatEther(value)).toFixed(2)} AETH`);
    });

    // Monitor staking events only (less frequent)
    this.stakingContract.on('Staked', (user, amount, poolId) => {
      this.metrics.transactions.total++;
      this.metrics.transactions.stakes++;
      this.metrics.users.add(user.toLowerCase());
      console.log(`🔒 Stake: ${Number(ethers.utils.formatEther(amount)).toFixed(2)} AETH (Pool ${poolId})`);
    });

    this.stakingContract.on('Unstaked', (user, amount, poolId) => {
      this.metrics.transactions.total++;
      this.metrics.transactions.unstakes++;
      console.log(`🔓 Unstake: ${Number(ethers.utils.formatEther(amount)).toFixed(2)} AETH (Pool ${poolId})`);
    });

    this.stakingContract.on('RewardsClaimed', (user, amount) => {
      this.metrics.transactions.total++;
      this.metrics.transactions.claims++;
      console.log(`🎁 Claim: ${Number(ethers.utils.formatEther(amount)).toFixed(2)} AETH rewards`);
    });
  }

  async collectCurrentData() {
    try {
      console.log('📊 Collecting current data...\n');

      // Get total supply
      const totalSupply = await this.aethContract.totalSupply();
      console.log(`💰 Total AETH Supply: ${ethers.utils.formatEther(totalSupply)}`);

      // Get staking TVL
      const totalStaked = await this.stakingContract.getTotalStaked();
      this.metrics.tvl = Number(ethers.utils.formatEther(totalStaked));
      console.log(`🏦 Staking TVL: ${this.metrics.tvl.toFixed(2)} AETH`);

      // Update USD volumes
      this.metrics.volume.usd = this.metrics.volume.aeth * this.aethPrice;

    } catch (error) {
      console.log('⚠️ Error collecting current data:', error.message);
    }
  }

  displayDashboard() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 AETHERON PLATFORM - LIVE DASHBOARD');
    console.log('='.repeat(60));

    const uptime = Math.floor((Date.now() - this.metrics.startTime) / 1000 / 60);
    const tvlUsd = (this.metrics.tvl * this.aethPrice).toFixed(2);
    
    console.log(`⏱️  Uptime: ${uptime} minutes`);
    console.log(`👥 Unique Users: ${this.metrics.users.size}`);
    console.log(`💸 Total Transactions: ${this.metrics.transactions.total}`);
    console.log(`🔄 Transfers: ${this.metrics.transactions.transfers}`);
    console.log(`🔒 Stakes: ${this.metrics.transactions.stakes}`);
    console.log(`🔓 Unstakes: ${this.metrics.transactions.unstakes}`);
    console.log(`🎁 Claims: ${this.metrics.transactions.claims}`);
    console.log(`💰 Volume (AETH): ${this.metrics.volume.aeth.toFixed(2)}`);
    console.log(`💵 Volume (USD): $${this.metrics.volume.usd.toFixed(2)}`);
    console.log(`🏦 TVL: ${this.metrics.tvl.toFixed(2)} AETH ($${tvlUsd})`);
    console.log(`📈 AETH Price: $${this.aethPrice}`);

    console.log('='.repeat(60));
    console.log('🔄 Monitoring active... (Ctrl+C to stop)');
    console.log('='.repeat(60));
  }

  saveMetrics() {
    const filename = `metrics_${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify({
      timestamp: new Date().toISOString(),
      ...this.metrics,
      users: Array.from(this.metrics.users)
    }, null, 2));
    console.log(`💾 Metrics saved to ${filename}`);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down monitor...');
  monitor.saveMetrics();
  process.exit(0);
});

// Start monitoring
const monitor = new TransactionMonitor();
monitor.initialize().catch(console.error);

// Update dashboard every 30 seconds
setInterval(() => {
  monitor.displayDashboard();
}, 30000);

// Save metrics every 5 minutes
setInterval(() => {
  monitor.saveMetrics();
}, 300000);