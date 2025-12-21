import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './useWeb3';
import { useAetheron } from './useAetheron';
import { STAKING_ABI, getCurrentNetwork } from '../config/contracts';

export const useStaking = () => {
  const { signer, account, isConnected } = useWeb3();
  const { approve, getAllowance } = useAetheron();
  const [contract, setContract] = useState(null);
  const [pools, setPools] = useState([]);
  const [userStakes, setUserStakes] = useState([]);
  const [totalStaked, setTotalStaked] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (signer && isConnected) {
      initContract();
    }
  }, [signer, isConnected]);

  useEffect(() => {
    if (contract && account) {
      loadStakingData();
    }
  }, [contract, account]);

  const initContract = async () => {
    try {
      const network = getCurrentNetwork();
      const stakingContract = new ethers.Contract(
        network.contracts.STAKING,
        STAKING_ABI,
        signer
      );
      setContract(stakingContract);
    } catch (err) {
      console.error('Error initializing staking contract:', err);
    }
  };

  const loadStakingData = async () => {
    if (!contract || !account) return;

    try {
      setLoading(true);
      
      // Load pools
      const poolCount = await contract.poolCount();
      const poolPromises = [];
      for (let i = 0; i < poolCount; i++) {
        poolPromises.push(contract.pools(i));
      }
      const poolsData = await Promise.all(poolPromises);
      
      const formattedPools = poolsData.map((pool, index) => ({
        id: index,
        lockDuration: Number(pool.lockDuration),
        rewardRate: Number(pool.rewardRate) / 100, // Convert basis points to percentage
        totalStaked: ethers.formatEther(pool.totalStaked),
        isActive: pool.isActive,
      }));
      setPools(formattedPools);

      // Load user stakes
      const stakesCount = await contract.getUserStakesCount(account);
      const stakePromises = [];
      for (let i = 0; i < stakesCount; i++) {
        stakePromises.push(contract.getUserStake(account, i));
      }
      const stakesData = await Promise.all(stakePromises);
      
      const formattedStakes = stakesData.map((stake, index) => ({
        id: index,
        amount: ethers.formatEther(stake.amount),
        startTime: Number(stake.startTime),
        lastClaimTime: Number(stake.lastClaimTime),
        poolId: Number(stake.poolId),
        pendingReward: ethers.formatEther(stake.pendingReward),
        unlockTime: Number(stake.unlockTime),
      }));
      setUserStakes(formattedStakes);

      // Load total staked
      const total = await contract.totalStaked();
      setTotalStaked(ethers.formatEther(total));
    } catch (err) {
      console.error('Error loading staking data:', err);
    } finally {
      setLoading(false);
    }
  };

  const stake = async (poolId, amount) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      setLoading(true);
      
      const network = getCurrentNetwork();
      const amountWei = ethers.parseEther(amount);
      
      // Check allowance
      const allowance = await getAllowance(network.contracts.STAKING);
      const allowanceWei = ethers.parseEther(allowance);
      
      // Approve if needed
      if (allowanceWei < amountWei) {
        await approve(network.contracts.STAKING, amount);
      }
      
      // Stake
      const tx = await contract.stake(poolId, amountWei);
      await tx.wait();
      
      await loadStakingData(); // Refresh data
      return tx;
    } catch (err) {
      console.error('Stake error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const unstake = async (stakeId) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      setLoading(true);
      const tx = await contract.unstake(stakeId);
      await tx.wait();
      await loadStakingData(); // Refresh data
      return tx;
    } catch (err) {
      console.error('Unstake error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const claimRewards = async (stakeId) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      setLoading(true);
      const tx = await contract.claimRewards(stakeId);
      await tx.wait();
      await loadStakingData(); // Refresh data
      return tx;
    } catch (err) {
      console.error('Claim rewards error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const calculateReward = async (stakeId) => {
    if (!contract || !account) return '0';

    try {
      const reward = await contract.calculateReward(account, stakeId);
      return ethers.formatEther(reward);
    } catch (err) {
      console.error('Calculate reward error:', err);
      return '0';
    }
  };

  return {
    contract,
    pools,
    userStakes,
    totalStaked,
    loading,
    stake,
    unstake,
    claimRewards,
    calculateReward,
    refresh: loadStakingData,
  };
};
