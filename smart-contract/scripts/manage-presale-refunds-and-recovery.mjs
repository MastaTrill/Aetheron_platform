import { ethers } from 'ethers';
import dotenv from 'dotenv';
import {
  callViewWithRetry,
  readWithRetry
} from './lib/base-read-retry.mjs';

dotenv.config({ override: true });

const EXPECTED_CHAIN_ID = 8453n;
const PRESALE_ADDRESS = '0xe0A3B6368312dFd3E7E76202e673f895f8235A3d';
const AETH_TOKEN_ADDRESS = '0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e';

const PRESALE_ABI = [
  'function owner() view returns (address)',
  'function token() view returns (address)',
  'function treasury() view returns (address)',
  'function refundsAvailable() view returns (bool)',
  'function weiRaised() view returns (uint256)',
  'function tokensReserved() view returns (uint256)',
  'function contributions(address) view returns (uint256)',
  'function refunded(address) view returns (bool)',
  'function tokensOwed(address) view returns (uint256)',
  'function claimRefund() external',
  'function withdrawUnsoldTokens() external'
];

const TOKEN_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

async function main() {
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

  const presale = new ethers.Contract(PRESALE_ADDRESS, PRESALE_ABI, provider);
  const token = new ethers.Contract(AETH_TOKEN_ADDRESS, TOKEN_ABI, provider);

  const [owner, tokenInPresale, refundsAvailable, weiRaised, tokensReserved, presaleTokenBalance] = await Promise.all([
    callViewWithRetry(presale, 'owner', [], 'Presale owner()'),
    callViewWithRetry(presale, 'token', [], 'Presale token()'),
    callViewWithRetry(presale, 'refundsAvailable', [], 'Presale refundsAvailable()'),
    callViewWithRetry(presale, 'weiRaised', [], 'Presale weiRaised()'),
    callViewWithRetry(presale, 'tokensReserved', [], 'Presale tokensReserved()'),
    callViewWithRetry(token, 'balanceOf', [PRESALE_ADDRESS], 'Presale token balance')
  ]);

  const unsold = presaleTokenBalance > tokensReserved ? presaleTokenBalance - tokensReserved : 0n;

  console.log('=== Base Presale Recovery & Refund Status ===');
  console.log('Presale Address:        ' + PRESALE_ADDRESS);
  console.log('Presale Owner:          ' + owner);
  console.log('Linked Token:           ' + tokenInPresale + ' (' + (tokenInPresale.toLowerCase() === AETH_TOKEN_ADDRESS.toLowerCase() ? 'MATCHES AETH' : 'MISMATCH') + ')');
  console.log('Refunds Available:      ' + refundsAvailable);
  console.log('Wei Raised:             ' + ethers.formatEther(weiRaised) + ' ETH');
  console.log('Tokens Reserved:        ' + ethers.formatUnits(tokensReserved, 18) + ' AETH');
  console.log('Total Token Balance:    ' + ethers.formatUnits(presaleTokenBalance, 18) + ' AETH');
  console.log('Withdrawable Unsold:    ' + ethers.formatUnits(unsold, 18) + ' AETH');

  const contributorArg = process.argv.find((arg) => arg.startsWith('--check-address='));
  const contributorAddress = contributorArg ? contributorArg.split('=')[1] : null;
  if (contributorAddress && ethers.isAddress(contributorAddress)) {
    const [contributed, isRefunded, owed] = await Promise.all([
      callViewWithRetry(presale, 'contributions', [contributorAddress], 'Contributor contributions'),
      callViewWithRetry(presale, 'refunded', [contributorAddress], 'Contributor refunded'),
      callViewWithRetry(presale, 'tokensOwed', [contributorAddress], 'Contributor tokensOwed')
    ]);
    console.log('');
    console.log('--- Contributor Check: ' + contributorAddress + ' ---');
    console.log('Contributed: ' + ethers.formatEther(contributed) + ' ETH');
    console.log('Tokens Owed: ' + ethers.formatUnits(owed, 18) + ' AETH');
    console.log('Refunded:    ' + isRefunded);
  }

  if (process.argv.includes('--withdraw-unsold')) {
    if (process.env.CONFIRM_WITHDRAW_UNSOLD !== 'CONFIRM_WITHDRAW_UNSOLD') {
      throw new Error('Withdrawal cancelled. Set CONFIRM_WITHDRAW_UNSOLD=CONFIRM_WITHDRAW_UNSOLD to authorize.');
    }
    const privateKey = process.env.BASE_DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
    if (!privateKey) throw new Error('PRIVATE_KEY is required to execute withdrawUnsoldTokens');

    const signer = new ethers.Wallet(privateKey, provider);
    if (signer.address.toLowerCase() !== owner.toLowerCase()) {
      throw new Error('Signer ' + signer.address + ' is not the presale owner ' + owner);
    }

    if (unsold === 0n) {
      console.log('No unsold tokens to withdraw.');
      return;
    }

    console.log('');
    console.log('Executing withdrawUnsoldTokens() for ' + ethers.formatUnits(unsold, 18) + ' AETH...');
    const presaleWithSigner = presale.connect(signer);
    const tx = await presaleWithSigner.withdrawUnsoldTokens();
    console.log('Transaction sent: ' + tx.hash);
    const receipt = await tx.wait();
    console.log('Transaction confirmed in block ' + receipt.blockNumber);
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
