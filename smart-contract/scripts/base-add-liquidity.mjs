import { ethers } from 'ethers';
import dotenv from 'dotenv';
import {
  callViewWithRetry,
  providerReadWithRetry,
  readWithRetry
} from './lib/base-read-retry.mjs';

dotenv.config({ override: true });

const EXPECTED_CHAIN_ID = 8453n;
const CANONICAL_AETH = '0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e';
const BASE_WETH = '0x4200000000000000000000000000000000000006';

// Aerodrome Router on Base Mainnet
const AERODROME_ROUTER = '0xcF77a3Ba9A5CA399B7c97c7485615499dd00c0a5';

const TOKEN_ABI = [
  'function owner() view returns (address)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function isExcludedFromTax(address) view returns (bool)',
  'function tradingEnabled() view returns (bool)'
];

const ROUTER_ABI = [
  'function addLiquidityETH(address token, bool stable, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)',
  'function getReserves(address tokenA, address tokenB, bool stable) view returns (uint reserveA, uint reserveB)'
];

async function main() {
  const isDryRun = process.env.DRY_RUN === 'true' || process.argv.includes('--dry-run') || !process.argv.includes('--execute');
  const rpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

  const provider = new ethers.JsonRpcProvider(rpcUrl, Number(EXPECTED_CHAIN_ID), {
    staticNetwork: true,
    batchMaxCount: 1
  });

  const network = await readWithRetry(
    () => provider.getNetwork(),
    'Base network',
    { validate: (value) => value && value.chainId !== undefined }
  );

  if (network.chainId !== EXPECTED_CHAIN_ID) {
    throw new Error('Expected Base chain 8453, received ' + network.chainId);
  }

  const aethAmountTokens = process.env.LIQUIDITY_AMOUNT_TOKEN || '10000000'; // Default 10M AETH
  const ethAmountEth = process.env.LIQUIDITY_AMOUNT_ETH || '0.1';           // Default 0.1 ETH
  const slippageBps = Number(process.env.SLIPPAGE_BPS || '100');             // Default 1%

  const aethAmountWei = ethers.parseUnits(aethAmountTokens, 18);
  const ethAmountWei = ethers.parseEther(ethAmountEth);

  console.log('=== Base Mainnet DEX Liquidity Configuration ===');
  console.log('Network:            Base Mainnet (Chain ID 8453)');
  console.log('Canonical AETH:     ' + CANONICAL_AETH);
  console.log('Paired Asset:       WETH (' + BASE_WETH + ')');
  console.log('Target DEX:         Aerodrome Finance (Base)');
  console.log('Router Address:     ' + AERODROME_ROUTER);
  console.log('AETH for Pool:      ' + Number(aethAmountTokens).toLocaleString() + ' AETH');
  console.log('ETH for Pool:       ' + ethAmountEth + ' ETH');
  console.log('Slippage Tolerance: ' + (slippageBps / 100) + '%');

  const impliedPriceEth = Number(ethAmountEth) / Number(aethAmountTokens);
  console.log('Initial Price:      ' + impliedPriceEth.toFixed(12) + ' ETH per AETH');
  console.log('Implied Valuation:  ' + (impliedPriceEth * 1_000_000_000).toFixed(4) + ' ETH total supply');

  const token = new ethers.Contract(CANONICAL_AETH, TOKEN_ABI, provider);
  const tradingEnabled = await callViewWithRetry(token, 'tradingEnabled', [], 'AETH tradingEnabled()');
  console.log('Trading Enabled:    ' + tradingEnabled);

  if (isDryRun) {
    console.log('\n[DRY RUN] Preflight checks passed. No transactions were broadcast.');
    console.log('To execute on Base Mainnet, set:');
    console.log('  PRIVATE_KEY=<deployer_key>');
    console.log('  CONFIRM_ADD_LIQUIDITY=CONFIRM_ADD_LIQUIDITY_BASE');
    console.log('  LIVE_ACTION=true');
    console.log('  CONFIRM_LIVE_ACTION=CONFIRM_ADD_LIQUIDITY');
    console.log('  LIQUIDITY_AMOUNT_TOKEN=' + aethAmountTokens);
    console.log('  LIQUIDITY_AMOUNT_ETH=' + ethAmountEth);
    console.log('  node smart-contract/scripts/base-add-liquidity.mjs --execute');
    return;
  }

  const privateKey = process.env.BASE_DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error('PRIVATE_KEY is required for live execution');

  if (process.env.CONFIRM_ADD_LIQUIDITY !== 'CONFIRM_ADD_LIQUIDITY_BASE') {
    throw new Error('Refusing live execution: CONFIRM_ADD_LIQUIDITY must equal CONFIRM_ADD_LIQUIDITY_BASE');
  }

  const signer = new ethers.Wallet(privateKey, provider);
  const [walletEthBalance, walletAethBalance, isExcluded] = await Promise.all([
    provider.getBalance(signer.address),
    callViewWithRetry(token, 'balanceOf', [signer.address], 'Signer AETH balance'),
    callViewWithRetry(token, 'isExcludedFromTax', [signer.address], 'Signer tax exclusion')
  ]);

  console.log('\n--- Signer Wallet Checks ---');
  console.log('Signer Address:     ' + signer.address);
  console.log('Signer ETH Balance: ' + ethers.formatEther(walletEthBalance) + ' ETH');
  console.log('Signer AETH Balance:' + ethers.formatUnits(walletAethBalance, 18) + ' AETH');
  console.log('Tax Excluded:       ' + isExcluded);

  if (walletEthBalance < ethAmountWei) {
    throw new Error('Insufficient ETH balance. Have: ' + ethers.formatEther(walletEthBalance) + ' ETH, Need: ' + ethAmountEth + ' ETH');
  }
  if (walletAethBalance < aethAmountWei) {
    throw new Error('Insufficient AETH balance. Have: ' + ethers.formatUnits(walletAethBalance, 18) + ' AETH, Need: ' + aethAmountTokens + ' AETH');
  }

  const minAeth = aethAmountWei * BigInt(10000 - slippageBps) / 10000n;
  const minEth = ethAmountWei * BigInt(10000 - slippageBps) / 10000n;
  const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes

  const tokenWithSigner = token.connect(signer);
  const allowance = await callViewWithRetry(token, 'allowance', [signer.address, AERODROME_ROUTER], 'Router allowance');
  if (allowance < aethAmountWei) {
    console.log('\nApproving Aerodrome Router for ' + Number(aethAmountTokens).toLocaleString() + ' AETH...');
    const approveTx = await tokenWithSigner.approve(AERODROME_ROUTER, aethAmountWei);
    console.log('Approval Tx sent: ' + approveTx.hash);
    await approveTx.wait();
    console.log('Approval confirmed.');
  }

  console.log('\nAdding liquidity to Aerodrome...');
  const router = new ethers.Contract(AERODROME_ROUTER, ROUTER_ABI, signer);
  const addTx = await router.addLiquidityETH(
    CANONICAL_AETH,
    false, // volatile pool (standard AMM)
    aethAmountWei,
    minAeth,
    minEth,
    signer.address,
    deadline,
    { value: ethAmountWei }
  );

  console.log('Add Liquidity Tx sent: ' + addTx.hash);
  const receipt = await addTx.wait();
  console.log('Liquidity confirmed in block ' + receipt.blockNumber);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
