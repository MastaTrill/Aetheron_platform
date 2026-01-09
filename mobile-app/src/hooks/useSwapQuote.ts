import {useEffect, useState} from 'react';
import {ethers} from 'ethers';
import {useWeb3} from '../context/Web3Context';
import {CONTRACTS} from '../config/contracts';

type Token = {
  address: string;
  decimals: number;
};

const PAIR_ABI = [
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
];

/**
 * useSwapQuote - Get swap quote and min received for a token pair, with slippage tolerance.
 *
 * @param fromToken - The token being swapped from
 * @param toToken - The token being swapped to
 * @param amount - The input amount as a string
 * @param slippagePercent - Slippage tolerance (e.g. 1 for 1%)
 * @returns { minReceived, priceImpact, expectedOut, loading, error }
 */
export function useSwapQuote(
  fromToken: Token | undefined,
  toToken: Token | undefined,
  amount: string | undefined,
  slippagePercent?: string | number,
) {
  const {provider} = useWeb3();
  const [quote, setQuote] = useState({
    minReceived: '',
    priceImpact: '',
    expectedOut: '',
    loading: false,
    error: '',
  });

  useEffect(() => {
    if (!provider || !fromToken || !toToken || !amount) {
      return;
    }
    // Type guards: fromToken, toToken, and amount are defined here
    async function fetchQuote() {
      setQuote(q => ({...q, loading: true, error: ''}));
      try {
        // Defensive: check again inside async
        if (!fromToken || !toToken || !amount) {
          setQuote(q => ({...q, loading: false, error: 'Missing token or amount.'}));
          return;
        }
        // For demo: only support AETH/MATIC and USDC/MATIC pairs
        let pairAddress = '';
        if (
          (fromToken.address === CONTRACTS.WMATIC && toToken.address === CONTRACTS.AETH_TOKEN) ||
          (fromToken.address === CONTRACTS.AETH_TOKEN && toToken.address === CONTRACTS.WMATIC)
        ) {
          pairAddress = CONTRACTS.LIQUIDITY_PAIR;
        } else {
          setQuote(q => ({...q, loading: false, error: 'Pair not supported in demo.'}));
          return;
        }
        if (!provider) {
          setQuote(q => ({...q, loading: false, error: 'No provider available.'}));
          return;
        }
        // fromToken, toToken, and amount are guaranteed to be defined here
        const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider as ethers.Provider);
        const [reserve0, reserve1] = await pair.getReserves();
        const token0 = await pair.token0();
        // Calculate output using constant product formula
        let reserveIn, reserveOut;
        if (fromToken.address.toLowerCase() === token0.toLowerCase()) {
          reserveIn = reserve0;
          reserveOut = reserve1;
        } else {
          reserveIn = reserve1;
          reserveOut = reserve0;
        }
        const amountIn = ethers.parseUnits(amount, fromToken.decimals);
        const amountInWithFee = (amountIn * 997n) / 1000n;
        const numerator = amountInWithFee * reserveOut;
        const denominator = reserveIn * 1000n + amountInWithFee;
        const amountOut = numerator / denominator;
        // Price impact (simplified)
        const priceImpact = Number((amountIn * 10000n) / reserveIn) / 100;

        // Slippage calculation
        let slippage = 1; // default 1%
        if (slippagePercent !== undefined) {
          const parsed =
            typeof slippagePercent === 'string' ? parseFloat(slippagePercent) : slippagePercent;
          if (!isNaN(parsed) && parsed > 0) {
            slippage = parsed;
          }
        }
        const minReceivedBN = (amountOut * BigInt(10000 - Math.floor(slippage * 100))) / 10000n;

        setQuote({
          minReceived: toToken ? ethers.formatUnits(minReceivedBN, toToken.decimals) : '',
          priceImpact: priceImpact.toFixed(2),
          expectedOut: toToken ? ethers.formatUnits(amountOut, toToken.decimals) : '',
          loading: false,
          error: '',
        });
      } catch (e) {
        let errorMsg = 'Unknown error';
        if (e instanceof Error) {
          errorMsg = e.message;
        } else if (typeof e === 'string') {
          errorMsg = e;
        }
        setQuote(q => ({...q, loading: false, error: errorMsg}));
      }
    }
    fetchQuote();
  }, [provider, fromToken, toToken, amount, slippagePercent]);

  return quote;
}
