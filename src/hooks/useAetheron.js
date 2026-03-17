import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './useWeb3';
import { AETH_ABI, getCurrentNetwork } from '../config/contracts';

export const useAetheron = () => {
  const { signer, account, isConnected } = useWeb3();
  const [contract, setContract] = useState(null);
  const [balance, setBalance] = useState('0');
  const [symbol, setSymbol] = useState('AETH');
  const [decimals, setDecimals] = useState(18);
  const [totalSupply, setTotalSupply] = useState('0');
  const [tradingEnabled, setTradingEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (signer && isConnected) {
      initContract();
    }
  }, [signer, isConnected]);

  useEffect(() => {
    if (contract && account) {
      loadTokenData();
    }
  }, [contract, account]);

  const initContract = async () => {
    try {
      const network = getCurrentNetwork();
      const aetheronContract = new ethers.Contract(
        network.contracts.AETH_TOKEN,
        AETH_ABI,
        signer
      );
      setContract(aetheronContract);
    } catch (err) {
      console.error('Error initializing contract:', err);
    }
  };

  const loadTokenData = async () => {
    if (!contract || !account) return;

    try {
      setLoading(true);
      
      const [bal, sym, dec, supply, trading] = await Promise.all([
        contract.balanceOf(account),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
        contract.tradingEnabled(),
      ]);

      setBalance(ethers.formatUnits(bal, dec));
      setSymbol(sym);
      setDecimals(dec);
      setTotalSupply(ethers.formatUnits(supply, dec));
      setTradingEnabled(trading);
    } catch (err) {
      console.error('Error loading token data:', err);
    } finally {
      setLoading(false);
    }
  };

  const transfer = async (to, amount) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      setLoading(true);
      const amountWei = ethers.parseUnits(amount, decimals);
      const tx = await contract.transfer(to, amountWei);
      await tx.wait();
      await loadTokenData(); // Refresh balance
      return tx;
    } catch (err) {
      console.error('Transfer error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const approve = async (spender, amount) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      setLoading(true);
      const amountWei = ethers.parseUnits(amount, decimals);
      const tx = await contract.approve(spender, amountWei);
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Approve error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAllowance = async (spender) => {
    if (!contract || !account) return '0';

    try {
      const allowance = await contract.allowance(account, spender);
      return ethers.formatUnits(allowance, decimals);
    } catch (err) {
      console.error('Allowance error:', err);
      return '0';
    }
  };

  return {
    contract,
    balance,
    symbol,
    decimals,
    totalSupply,
    tradingEnabled,
    loading,
    transfer,
    approve,
    getAllowance,
    refresh: loadTokenData,
  };
};
