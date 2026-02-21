// enable-trading.js - Enable trading on the AETH token
import { ethers } from 'ethers';

const AETH_CONTRACT = '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e';

// ⚠️  IMPORTANT: Replace with your actual private key
const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  '48935deec3b96fc16d5d0a25de885d4ad9b4dfbf38bd78ef018f50dee8818485';

async function enableTrading() {
  console.log('🚀 Enabling Trading on AETH Token...');
  console.log('');

  if (
    PRIVATE_KEY ===
    '48935deec3b96fc16d5d0a25de885d4ad9b4dfbf38bd78ef018f50dee8818485'
  ) {
    console.error(
      '❌ ERROR: Please set your PRIVATE_KEY environment variable!',
    );
    console.log('Example: $env:PRIVATE_KEY = "0x1234567890abcdef..."');
    process.exit(1);
  }

  try {
    // Connect to Polygon
    const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com/');
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log(
      '✅ Connected to Polygon with wallet:',
      await signer.getAddress(),
    );
    console.log('');

    // AETH Contract ABI (minimal)
    const aethAbi = [
      'function tradingEnabled() view returns (bool)',
      'function enableTrading()',
      'function owner() view returns (address)',
    ];

    const aethContract = new ethers.Contract(AETH_CONTRACT, aethAbi, signer);

    // Check current trading status
    const currentStatus = await aethContract.tradingEnabled();
    console.log(
      'Current trading status:',
      currentStatus ? '✅ Enabled' : '❌ Disabled',
    );

    if (currentStatus) {
      console.log('');
      console.log('ℹ️  Trading is already enabled!');
      return;
    }

    // Check ownership
    const owner = await aethContract.owner();
    const signerAddress = await signer.getAddress();

    if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
      console.error('❌ ERROR: You are not the contract owner!');
      console.log('Contract owner:', owner);
      console.log('Your address:', signerAddress);
      process.exit(1);
    }

    console.log('');
    console.log('🔄 Enabling trading...');

    // Enable trading
    const tx = await aethContract.enableTrading();
    console.log('Transaction hash:', tx.hash);

    console.log('⏳ Waiting for confirmation...');
    await tx.wait();

    console.log('');
    console.log('✅ Trading enabled successfully!');
    console.log('🎉 AETH token is now tradable on DEXs!');
  } catch (error) {
    console.error('❌ Failed to enable trading:', error.message);
    process.exit(1);
  }
}

// Run the function
enableTrading();
