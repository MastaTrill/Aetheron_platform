import React, { useState, useEffect } from 'react';

const BalanceChecker = ({ address, apiKey }) => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalance = async () => {
    if (!address || !apiKey) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.etherscan.io/v2/api?chainid=137&module=account&action=balance&address=${address}&apikey=${apiKey}`
      );
      const data = await response.json();

      if (data.status === '1') {
        // Balance is in Wei, convert to ETH
        const balanceInEth = parseFloat(data.result) / 1e18;
        setBalance(balanceInEth.toFixed(4));
      } else {
        setError(data.message || 'Failed to fetch balance');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [address, apiKey]);

  return (
    <div>
      <h3>Polygon Balance</h3>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {balance !== null && <p>Balance: {balance} MATIC</p>}
      <button onClick={fetchBalance} disabled={loading}>
        Refresh Balance
      </button>
    </div>
  );
};

export default BalanceChecker;