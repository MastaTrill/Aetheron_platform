import {useState, useEffect} from 'react';
import {ethers} from 'ethers';
import {useWeb3} from '@context/Web3Context';
import {CONTRACTS} from '@config/contracts';
import {STAKING_ABI} from '@config/abis';

export interface StakingInfo {
  stakedAmount: string;
  stakedAmountFormatted: string;
  pendingRewards: string;
  pendingRewardsFormatted: string;
  totalStaked: string;
  rewardRate: string;
}

export const useStaking = () => {
  const {provider, address, isConnected} = useWeb3();
  const [stakingInfo, setStakingInfo] = useState<StakingInfo>({
    stakedAmount: '0',
    stakedAmountFormatted: '0.00',
    pendingRewards: '0',
    pendingRewardsFormatted: '0.00',
    totalStaked: '0',
    rewardRate: '0',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    if (provider && isConnected) {
      const stakingContract = new ethers.Contract(CONTRACTS.STAKING, STAKING_ABI, provider);
      setContract(stakingContract);
    }
  }, [provider, isConnected]);

  useEffect(() => {
    if (contract && address) {
      fetchStakingInfo();
    }
  }, [contract, address]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStakingInfo = async () => {
    if (!contract || !address) {
      return;
    }

    try {
      setIsLoading(true);

      const [staked, rewards, total, rate] = await Promise.all([
        contract.getStakedAmount(address),
        contract.getPendingRewards(address),
        contract.totalStaked(),
        contract.rewardRate(),
      ]);

      setStakingInfo({
        stakedAmount: staked.toString(),
        stakedAmountFormatted: parseFloat(ethers.formatEther(staked)).toFixed(2),
        pendingRewards: rewards.toString(),
        pendingRewardsFormatted: parseFloat(ethers.formatEther(rewards)).toFixed(6),
        totalStaked: ethers.formatEther(total),
        rewardRate: ethers.formatEther(rate),
      });
    } catch (error) {
      console.error('Failed to fetch staking info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stake = async (amount: string) => {
    if (!contract || !provider) {
      throw new Error('Not connected');
    }

    try {
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      const amountWei = ethers.parseEther(amount);

      // @ts-ignore
      const tx = await contractWithSigner.stake(amountWei);
      await tx.wait();

      await fetchStakingInfo();
      return tx;
    } catch (error) {
      console.error('Stake failed:', error);
      throw error;
    }
  };

  const unstake = async (amount: string) => {
    if (!contract || !provider) {
      throw new Error('Not connected');
    }

    try {
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      const amountWei = ethers.parseEther(amount);

      // @ts-ignore
      const tx = await contractWithSigner.unstake(amountWei);
      await tx.wait();

      await fetchStakingInfo();
      return tx;
    } catch (error) {
      console.error('Unstake failed:', error);
      throw error;
    }
  };

  const claimRewards = async () => {
    if (!contract || !provider) {
      throw new Error('Not connected');
    }

    try {
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      // @ts-ignore
      const tx = await contractWithSigner.claimRewards();
      await tx.wait();

      await fetchStakingInfo();
      return tx;
    } catch (error) {
      console.error('Claim rewards failed:', error);
      throw error;
    }
  };

  return {
    stakingInfo,
    isLoading,
    contract,
    fetchStakingInfo,
    stake,
    unstake,
    claimRewards,
  };
};
