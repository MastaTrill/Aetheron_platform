#!/usr/bin/env node

/**
 * Aetheron Platform - Transaction Monitor
 * Real-time monitoring of blockchain activity and user engagement
 */

import { ethers } from 'ethers';
import fs from 'fs';

// Polygon RPC endpoints
const POLYGON_RPC = 'https://polygon-rpc.com/';
const POLYGONSCAN_API = 'https://api.polygonscan.com/api';

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
    this.provider = new ethers.JsonRpcProvider(POLYGON_RPC);
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

  async initialize() {
    console.log('🚀 Starting Aetheron Transaction Monitor...\n');

    // Initialize contracts
    this.aethContract = new ethers.Contract(AETH_TOKEN, ERC20_ABI, this.provider);
    this.stakingContract = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, this.provider);

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
      this.metrics.volume.aeth += Number(ethers.formatEther(value));

      console.log(`💸 Transfer: ${Number(ethers.formatEther(value)).toFixed(2)} AETH`);
    });

    // Monitor staking events only (less frequent)
    this.stakingContract.on('Staked', (user, amount, poolId) => {
      this.metrics.transactions.total++;
      this.metrics.transactions.stakes++;
      this.metrics.users.add(user.toLowerCase());
      console.log(`🔒 Stake: ${Number(ethers.formatEther(amount)).toFixed(2)} AETH (Pool ${poolId})`);
    });

    this.stakingContract.on('Unstaked', (user, amount, poolId) => {
      this.metrics.transactions.total++;
      this.metrics.transactions.unstakes++;
      console.log(`🔓 Unstake: ${Number(ethers.formatEther(amount)).toFixed(2)} AETH (Pool ${poolId})`);
    });

    this.stakingContract.on('RewardsClaimed', (user, amount) => {
      this.metrics.transactions.total++;
      this.metrics.transactions.claims++;
      console.log(`🎁 Claim: ${Number(ethers.formatEther(amount)).toFixed(2)} AETH rewards`);
    });
  }

  async collectCurrentData() {
    try {
      console.log('📊 Collecting current data...\n');

      // Get total supply
      const totalSupply = await this.aethContract.totalSupply();
      console.log(`💰 Total AETH Supply: ${ethers.formatEther(totalSupply)}`);

      // Get staking TVL
      const totalStaked = await this.stakingContract.getTotalStaked();
      this.metrics.tvl = Number(ethers.formatEther(totalStaked));
      console.log(`🏦 Staking TVL: ${this.metrics.tvl} AETH`);

      // Get current AETH price (simplified)
      this.aethPrice = 0.0000005512; // From previous data
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
    console.log(`⏱️  Uptime: ${uptime} minutes`);
    console.log(`👥 Unique Users: ${this.metrics.users.size}`);
    console.log(`💸 Total Transactions: ${this.metrics.transactions.total}`);
    console.log(`🔄 Transfers: ${this.metrics.transactions.transfers}`);
    console.log(`🔒 Stakes: ${this.metrics.transactions.stakes}`);
    console.log(`🔓 Unstakes: ${this.metrics.transactions.unstakes}`);
    console.log(`🎁 Claims: ${this.metrics.transactions.claims}`);
    console.log(`💰 Volume (AETH): ${this.metrics.volume.aeth.toFixed(2)}`);
    console.log(`💵 Volume (USD): $${this.metrics.volume.usd.toFixed(2)}`);
    console.log(`🏦 TVL: ${this.metrics.tvl.toFixed(2)} AETH ($${this.metrics.tvl * this.aethPrice.toFixed(2)})`);

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