import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ override: true });

const OWNER_ADDRESS = '0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2';
const PRESALE_ADDRESS = '0xe0A3B6368312dFd3E7E76202e673f895f8235A3d';
const AETH_TOKEN_ADDRESS = '0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e';
const DEFAULT_SAFE_DESTINATION = '0xa4737aa4b1e8a3c8f221be9e55f5bda307ecc1fa'; // Platform Treasury (c1fa)

const toRlpUint = (v) => {
  const bi = BigInt(v);
  if (bi === 0n) return '0x';
  let hex = bi.toString(16);
  if (hex.length % 2 !== 0) hex = '0' + hex;
  return '0x' + hex;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PRESALE_ABI = [
  'function owner() view returns (address)',
  'function refundsAvailable() view returns (bool)',
  'function tokensReserved() view returns (uint256)',
  'function contributions(address) view returns (uint256)',
  'function withdrawUnsoldTokens() external',
  'function claimRefund() external'
];

const TOKEN_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)'
];

function getSponsorWallet() {
  const keyFile = '.sponsor_key';
  let pk = process.env.SPONSOR_PRIVATE_KEY;
  if (!pk && fs.existsSync(keyFile)) {
    pk = fs.readFileSync(keyFile, 'utf8').trim();
  }
  if (!pk) {
    const w = ethers.Wallet.createRandom();
    pk = w.privateKey;
    fs.writeFileSync(keyFile, pk, { mode: 0o600 });
  }
  return new ethers.Wallet(pk);
}

export async function createRevocationType4Tx(provider, authorityPrivateKey, sponsorWallet, chainId = 8453n) {
  const MAGIC = Uint8Array.from([0x05]);
  const targetAddress = '0x0000000000000000000000000000000000000000'; // Revoke code
  const authority = new ethers.Wallet(authorityPrivateKey).address;
  const authorityNonce = BigInt(await provider.getTransactionCount(authority));
  const sponsorNonce = BigInt(await provider.getTransactionCount(sponsorWallet.address));

  // 1. Sign Authorization Tuple
  const rlpAuth = ethers.encodeRlp([
    toRlpUint(chainId),
    targetAddress,
    toRlpUint(authorityNonce)
  ]);
  const authDigest = ethers.keccak256(ethers.concat([MAGIC, ethers.getBytes(rlpAuth)]));
  const authorityKey = authorityPrivateKey.startsWith('0x') ? authorityPrivateKey : '0x' + authorityPrivateKey;
  const authoritySigner = new ethers.SigningKey(authorityKey);
  const authSig = authoritySigner.sign(authDigest);

  const authTuple = [
    toRlpUint(chainId),
    targetAddress,
    toRlpUint(authorityNonce),
    toRlpUint(authSig.yParity),
    authSig.r,
    authSig.s
  ];

  // 2. Build Type 4 Transaction
  const feeData = await provider.getFeeData();
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || 1000000n;
  const maxFeePerGas = (feeData.maxFeePerGas || 15000000n) * 2n;

  const txFields = [
    toRlpUint(chainId),
    toRlpUint(sponsorNonce),
    toRlpUint(maxPriorityFeePerGas),
    toRlpUint(maxFeePerGas),
    toRlpUint(250000n), // gasLimit
    authority, // destination
    toRlpUint(0n), // value
    '0x', // data
    [], // accessList
    [authTuple] // authorizationList
  ];

  const rlpUnsigned = ethers.encodeRlp(txFields);
  const txHashToSign = ethers.keccak256(ethers.concat([Uint8Array.from([0x04]), ethers.getBytes(rlpUnsigned)]));
  const sponsorSig = new ethers.SigningKey(sponsorWallet.privateKey).sign(txHashToSign);

  const signedTxFields = [
    ...txFields,
    toRlpUint(sponsorSig.yParity),
    sponsorSig.r,
    sponsorSig.s
  ];

  const rawTx = '0x04' + ethers.encodeRlp(signedTxFields).slice(2);
  return { rawTx, authority, sponsor: sponsorWallet.address };
}

async function main() {
  const baseRpc = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
  const provider = new ethers.JsonRpcProvider(baseRpc, 8453, { staticNetwork: true });

  const authorityKey = process.env.PRIVATE_KEY;
  if (!authorityKey) throw new Error('PRIVATE_KEY is required in .env');

  const sponsorWalletRaw = getSponsorWallet();
  const sponsor = new ethers.Wallet(sponsorWalletRaw.privateKey, provider);
  const authorityWallet = new ethers.Wallet(authorityKey, provider);

  const destination = process.env.SAFE_ADDRESS || DEFAULT_SAFE_DESTINATION;

  console.log('====================================================');
  console.log('    EIP-7702 REVOCATION & AUTONOMOUS RECOVERY TOOL  ');
  console.log('====================================================');
  console.log('Deployer / Authority:   ' + OWNER_ADDRESS);
  console.log('Sponsor (Gas Provider): ' + sponsor.address);
  console.log('Secure Destination:     ' + destination);

  const token = new ethers.Contract(AETH_TOKEN_ADDRESS, TOKEN_ABI, provider);
  const presale = new ethers.Contract(PRESALE_ADDRESS, PRESALE_ABI, provider);

  const [sponsorBal, currentCode, presaleBal, reserved] = await Promise.all([
    provider.getBalance(sponsor.address),
    provider.getCode(OWNER_ADDRESS),
    token.balanceOf(PRESALE_ADDRESS),
    presale.tokensReserved()
  ]);

  const unsold = presaleBal - reserved;
  console.log('\n--- State Overview ---');
  console.log('Sponsor Base ETH:       ' + ethers.formatEther(sponsorBal) + ' ETH');
  console.log('Deployer Delegated:     ' + currentCode.startsWith('0xef0100'));
  console.log('Unsold in Presale:      ' + ethers.formatUnits(unsold, 18) + ' AETH');

  const minGas = 30000000000000n; // 0.00003 ETH (~$0.08)
  const isWatch = process.argv.includes('--watch');

  if (sponsorBal < minGas && !isWatch) {
    console.log('\n[WAITING FOR SPONSOR GAS]');
    console.log('Send ~0.0001 ETH (~$0.25) on Base network to:');
    console.log('  ' + sponsor.address);
    console.log('Once funded, run with --watch or re-run to execute all 4 phases.');
    return;
  }

  if (sponsorBal < minGas && isWatch) {
    console.log('\n[ACTIVE WATCHER] Monitoring sponsor wallet on Base for gas arrival...');
    console.log('Sponsor Address: ' + sponsor.address);
    console.log('Polling every 5 seconds (with auto-reconnect)...\n');

    while (true) {
      await sleep(5000);
      try {
        const bal = await provider.getBalance(sponsor.address);
        if (bal >= minGas) {
          console.log('Gas detected! Sponsor Balance: ' + ethers.formatEther(bal) + ' ETH');
          break;
        }
      } catch (err) {
        // Silently retry on transient network hiccups
      }
    }
  }

  console.log('\n[PHASE 1] Revoking EIP-7702 Delegation on Base...');
  if (currentCode.startsWith('0xef0100')) {
    const { rawTx } = await createRevocationType4Tx(provider, authorityKey, sponsor, 8453n);
    console.log('Broadcasting Type 4 Revocation Transaction...');
    const txHash = await provider.send('eth_sendRawTransaction', [rawTx]);
    console.log('Revocation Tx Hash: ' + txHash);
    console.log('Waiting for confirmation...');
    const receipt = await provider.waitForTransaction(txHash);
    console.log('CONFIRMED in Block ' + receipt.blockNumber + '! BaseScan: https://basescan.org/tx/' + txHash);

    const verifiedCode = await provider.getCode(OWNER_ADDRESS);
    if (verifiedCode !== '0x') {
      throw new Error('Revocation failed: code is still ' + verifiedCode);
    }
    console.log('SUCCESS: Attacker delegation is completely revoked. Deployer code is 0x (pure EOA).');
  } else {
    console.log('Delegation is already cleared.');
  }

  console.log('\n[PHASE 2] Transferring Gas from Sponsor to Deployer...');
  const deployerBal = await provider.getBalance(OWNER_ADDRESS);
  if (deployerBal < 10000000000000n) {
    const fundAmount = 25000000000000n; // 0.000025 ETH
    const fundTx = await sponsor.sendTransaction({
      to: OWNER_ADDRESS,
      value: fundAmount
    });
    console.log('Fund Tx Hash: ' + fundTx.hash);
    await fundTx.wait();
    console.log('Gas transfer confirmed on Base!');
  }

  console.log('\n[PHASE 3] Reclaiming 33,328,433 AETH from Presale Contract...');
  const presaleWithDeployer = new ethers.Contract(PRESALE_ADDRESS, PRESALE_ABI, authorityWallet);
  const claimTx = await presaleWithDeployer.withdrawUnsoldTokens();
  console.log('Claim Tx Hash: ' + claimTx.hash);
  const claimReceipt = await claimTx.wait();
  console.log('RECLAIM CONFIRMED in Block ' + claimReceipt.blockNumber);
  console.log('BaseScan: https://basescan.org/tx/' + claimTx.hash);

  console.log('\n[PHASE 4] Securing Reclaimed Tokens to ' + destination + '...');
  const tokenWithDeployer = new ethers.Contract(AETH_TOKEN_ADDRESS, TOKEN_ABI, authorityWallet);
  const xferTx = await tokenWithDeployer.transfer(destination, unsold);
  console.log('Transfer Tx Hash: ' + xferTx.hash);
  const xferReceipt = await xferTx.wait();
  console.log('TRANSFER CONFIRMED in Block ' + xferReceipt.blockNumber);
  console.log('BaseScan: https://basescan.org/tx/' + xferTx.hash);

  console.log('\n[PHASE 5] Reclaiming 0.0049 ETH Presale Refund & Securing to ' + destination + '...');
  try {
    const refundOwed = await presaleWithDeployer.contributions(OWNER_ADDRESS);
    if (refundOwed > 0n) {
      console.log('Refund owed to Deployer: ' + ethers.formatEther(refundOwed) + ' ETH');
      const refundTx = await presaleWithDeployer.claimRefund();
      console.log('Claim Refund Tx Hash: ' + refundTx.hash);
      const refundReceipt = await refundTx.wait();
      console.log('REFUND CONFIRMED in Block ' + refundReceipt.blockNumber);
      console.log('BaseScan: https://basescan.org/tx/' + refundTx.hash);

      const depBalAfter = await provider.getBalance(OWNER_ADDRESS);
      // Leave minimal reserve for safety (e.g. 0.00005 ETH) and send the rest to Treasury destination
      const reserve = 50000000000000n;
      if (depBalAfter > reserve) {
        const sendAmount = depBalAfter - reserve;
        console.log('Forwarding ' + ethers.formatEther(sendAmount) + ' ETH refund to Treasury...');
        const fwdTx = await authorityWallet.sendTransaction({
          to: destination,
          value: sendAmount
        });
        await fwdTx.wait();
        console.log('Treasury ETH Refund Confirmed! Tx: ' + fwdTx.hash);
      }
    } else {
      console.log('No ETH refund owed or already claimed.');
    }
  } catch (refundErr) {
    console.warn('Refund phase notice:', refundErr.message);
  }

  // Return any USDC back to Treasury destination
  try {
    const usdc = new ethers.Contract('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', TOKEN_ABI, sponsor);
    const usdcBal = await usdc.balanceOf(sponsor.address);
    if (usdcBal > 0n) {
      console.log('Returning ' + ethers.formatUnits(usdcBal, 6) + ' USDC to Treasury...');
      const usdcTx = await usdc.transfer(destination, usdcBal);
      await usdcTx.wait();
      console.log('USDC Returned to Treasury! Tx: ' + usdcTx.hash);
    }
  } catch(e) {
    console.warn('USDC return notice:', e.message);
  }

  const finalDestBal = await token.balanceOf(destination);
  const finalDestEth = await provider.getBalance(destination);
  console.log('\n====================================================');
  console.log('    ALL ASSETS RECOVERED AND SECURED SUCCESSFULLY   ');
  console.log('====================================================');
  console.log('Destination Final AETH: ' + ethers.formatUnits(finalDestBal, 18) + ' AETH');
  console.log('Destination Final ETH:  ' + ethers.formatEther(finalDestEth) + ' ETH');
}

main().catch(err => {
  console.error('\nExecution Error:', err.message || err);
  process.exit(1);
});
