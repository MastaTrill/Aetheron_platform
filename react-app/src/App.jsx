import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

// Contract addresses (from README)
const AETHERON_ADDRESS = '0x44F9c15816bCe5d6691448F60DAD50355ABa40b5';
const STAKING_ADDRESS = '0x896D9d37A67B0bBf81dde0005975DA7850FFa638';

// Mumbai RPC
const MUMBAI_RPC = 'https://rpc-mumbai.matic.network';

function App() {
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [stakingBalance, setStakingBalance] = useState('0');
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  // Connect to MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);

        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const web3Signer = await web3Provider.getSigner();
        setProvider(web3Provider);
        setSigner(web3Signer);

        // Switch to Mumbai network
        await switchToMumbai();

        loadBalances(web3Provider, accounts[0]);
        loadPools(web3Provider);
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  const switchToMumbai = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x13881' }], // Mumbai testnet
      });
    } catch (switchError) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x13881',
              chainName: 'Mumbai Testnet',
              nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
              rpcUrls: [MUMBAI_RPC],
              blockExplorerUrls: ['https://mumbai.polygonscan.com/']
            }]
          });
        } catch (addError) {
          console.error('Error adding Mumbai network:', addError);
        }
      }
    }
  };

  const loadBalances = async (web3Provider, userAddress) => {
    try {
      const aetheronContract = new ethers.Contract(
        AETHERON_ADDRESS,
        ['function balanceOf(address) view returns (uint256)'],
        web3Provider
      );

      const balance = await aetheronContract.balanceOf(userAddress);
      setBalance(ethers.formatEther(balance));

      const stakingContract = new ethers.Contract(
        STAKING_ADDRESS,
        ['function getUserStakes(address) view returns (tuple(uint256,uint256,uint256,uint256)[])'],
        web3Provider
      );

      const stakes = await stakingContract.getUserStakes(userAddress);
      let totalStaked = 0n;
      stakes.forEach(stake => {
        totalStaked += stake.amount;
      });
      setStakingBalance(ethers.formatEther(totalStaked));
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  const loadPools = async (web3Provider) => {
    try {
      const stakingContract = new ethers.Contract(
        STAKING_ADDRESS,
        [
          'function poolCount() view returns (uint256)',
          'function pools(uint256) view returns (uint256,uint256,uint256,bool)'
        ],
        web3Provider
      );

      const count = await stakingContract.poolCount();
      const poolData = [];

      for (let i = 0; i < count; i++) {
        const pool = await stakingContract.pools(i);
        poolData.push({
          id: i,
          lockDuration: pool[0],
          rewardRate: pool[1],
          totalStaked: pool[2],
          isActive: pool[3]
        });
      }

      setPools(poolData);
    } catch (error) {
      console.error('Error loading pools:', error);
    }
  };

  const stakeTokens = async (poolId, amount) => {
    if (!signer) return;

    setLoading(true);
    try {
      const aetheronContract = new ethers.Contract(
        AETHERON_ADDRESS,
        ['function approve(address,uint256) returns (bool)'],
        signer
      );

      const stakingContract = new ethers.Contract(
        STAKING_ADDRESS,
        ['function stake(uint256,uint256)'],
        signer
      );

      // Approve tokens
      const approveTx = await aetheronContract.approve(STAKING_ADDRESS, ethers.parseEther(amount));
      await approveTx.wait();

      // Stake tokens
      const stakeTx = await stakingContract.stake(poolId, ethers.parseEther(amount));
      await stakeTx.wait();

      alert('Staking successful!');
      loadBalances(provider, account);
    } catch (error) {
      console.error('Error staking:', error);
      alert('Staking failed: ' + error.message);
    }
    setLoading(false);
  };

  const claimRewards = async (stakeId) => {
    if (!signer) return;

    setLoading(true);
    try {
      const stakingContract = new ethers.Contract(
        STAKING_ADDRESS,
        ['function claimRewards(uint256)'],
        signer
      );

      const tx = await stakingContract.claimRewards(stakeId);
      await tx.wait();

      alert('Rewards claimed!');
      loadBalances(provider, account);
    } catch (error) {
      console.error('Error claiming rewards:', error);
      alert('Claim failed: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🌌 Aetheron Platform</h1>
        <p>Revolutionary Blockchain & Space Exploration Ecosystem</p>

        {!account ? (
          <button onClick={connectWallet} className="connect-btn">
            Connect MetaMask
          </button>
        ) : (
          <div className="wallet-info">
            <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
            <p>AETH Balance: {balance}</p>
            <p>Staked: {stakingBalance}</p>
          </div>
        )}
      </header>

      {account && (
        <main>
          <section className="pools-section">
            <h2>Staking Pools</h2>
            <div className="pools-grid">
              {pools.map(pool => (
                <div key={pool.id} className="pool-card">
                  <h3>Pool {pool.id}</h3>
                  <p>Lock Duration: {pool.lockDuration / (24 * 60 * 60)} days</p>
                  <p>APY: {pool.rewardRate / 100}%</p>
                  <p>Total Staked: {ethers.formatEther(pool.totalStaked)}</p>
                  <p>Status: {pool.isActive ? 'Active' : 'Inactive'}</p>

                  {pool.isActive && (
                    <div className="stake-form">
                      <input
                        type="number"
                        placeholder="Amount to stake"
                        id={`stake-${pool.id}`}
                      />
                      <button
                        onClick={() => {
                          const amount = document.getElementById(`stake-${pool.id}`).value;
                          if (amount > 0) stakeTokens(pool.id, amount);
                        }}
                        disabled={loading}
                      >
                        {loading ? 'Staking...' : 'Stake'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="actions-section">
            <h2>Actions</h2>
            <div className="actions-grid">
              <button onClick={() => claimRewards(0)} disabled={loading}>
                Claim Rewards (Stake 0)
              </button>
              <button onClick={() => loadBalances(provider, account)}>
                Refresh Balances
              </button>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

export default App;