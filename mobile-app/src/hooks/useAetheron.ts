import {useState, useEffect} from 'react';
import {ethers} from 'ethers';
import {useWeb3} from '@context/Web3Context';
import {CONTRACTS} from '@config/contracts';
import {AETH_TOKEN_ABI} from '@config/abis';

export interface TokenBalance {
  balance: string;
  balanceFormatted: string;
  symbol: string;
  decimals: number;
}

export const useAetheron = () => {
  const {provider, address, isConnected} = useWeb3();
  const [balance, setBalance] = useState<TokenBalance>({
    balance: '0',
    balanceFormatted: '0.00',
    symbol: 'AETH',
    decimals: 18,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    if (provider && isConnected) {
      const tokenContract = new ethers.Contract(
        CONTRACTS.AETH_TOKEN,
        AETH_TOKEN_ABI,
        provider
      );
      setContract(tokenContract);
    }
  }, [provider, isConnected]);

  useEffect(() => {
    if (contract && address) {
      fetchBalance();
    }
  }, [contract, address]);

  const fetchBalance = async () => {
    if (!contract || !address) return;
    
    try {
      setIsLoading(true);
      const bal = await contract.balanceOf(address);
      const formatted = ethers.utils.formatEther(bal);
      
      setBalance({
        balance: bal.toString(),
        balanceFormatted: parseFloat(formatted).toFixed(2),
        symbol: 'AETH',
        decimals: 18,
      });
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const transfer = async (to: string, amount: string) => {
    if (!contract || !provider) throw new Error('Not connected');
    
    try {
      const signer = provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      const amountWei = ethers.utils.parseEther(amount);
      
      const tx = await contractWithSigner.transfer(to, amountWei);
      await tx.wait();
      
      await fetchBalance();
      return tx;
    } catch (error) {
      console.error('Transfer failed:', error);
      throw error;
    }
  };

  const approve = async (spender: string, amount: string) => {
    if (!contract || !provider) throw new Error('Not connected');
    
    try {
      const signer = provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      const amountWei = ethers.utils.parseEther(amount);
      
      const tx = await contractWithSigner.approve(spender, amountWei);
      await tx.wait();
      
      return tx;
    } catch (error) {
      console.error('Approval failed:', error);
      throw error;
    }
  };

  const getAllowance = async (spender: string): Promise<string> => {
    if (!contract || !address) return '0';
    
    try {
      const allowance = await contract.allowance(address, spender);
      return ethers.utils.formatEther(allowance);
    } catch (error) {
      console.error('Failed to get allowance:', error);
      return '0';
    }
  };

  return {
    balance,
    isLoading,
    contract,
    fetchBalance,
    transfer,
    approve,
    getAllowance,
  };
};
