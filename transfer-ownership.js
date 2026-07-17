#!/usr/bin/env node

// transfer-ownership.js - Transfer contract ownership to new wallet
import { ethers } from 'ethers';

const AETH_CONTRACT = '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e';
const STAKING_CONTRACT = '0x896D9d37A67B0bBf81dde0005975DA7850FFa638';
const NEW_OWNER = '0xDF5A2b892254C42F80000A029dfE8b311f777Bd5';

// ⚠️  IMPORTANT: Replace with your actual private key
const PRIVATE_KEY = process.env.PRIVATE_KEY || 'YOUR_PRIVATE_KEY_HERE';

async function transferOwnership() {
  console.log('🚀 Starting Contract Ownership Transfer...');
  console.log('New Owner:', NEW_OWNER);
  console.log('');

  if (PRIVATE_KEY === 'YOUR_PRIVATE_KEY_HERE') {
    console.error(
      '❌ ERROR: Please set your PRIVATE_KEY environment variable!',
    );
    console.log('Example: export PRIVATE_KEY=0x1234567890abcdef...');
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
      'function owner() view returns (address)',
      'function transferOwnership(address newOwner)',
      'function renounceOwnership()',
    ];

    // Staking Contract ABI (minimal)
    const stakingAbi = [
      'function owner() view returns (address)',
      'function transferOwnership(address newOwner)',
    ];

    // Transfer AETH Contract Ownership
    console.log('🔄 Transferring AETH Contract Ownership...');
    const aethContract = new ethers.Contract(AETH_CONTRACT, aethAbi, signer);

    console.log('Current AETH owner:', await aethContract.owner());

    const aethTx = await aethContract.transferOwnership(NEW_OWNER);
    console.log('AETH Transfer TX:', aethTx.hash);
    await aethTx.wait();
    console.log('✅ AETH ownership transferred successfully!');
    console.log('');

    // Transfer Staking Contract Ownership
    console.log('🔄 Transferring Staking Contract Ownership...');
    const stakingContract = new ethers.Contract(
      STAKING_CONTRACT,
      stakingAbi,
      signer,
    );

    console.log('Current Staking owner:', await stakingContract.owner());

    const stakingTx = await stakingContract.transferOwnership(NEW_OWNER);
    console.log('Staking Transfer TX:', stakingTx.hash);
    await stakingTx.wait();
    console.log('✅ Staking ownership transferred successfully!');
    console.log('');

    // Verify ownership
    console.log('🔍 Verifying new ownership...');
    const newAethOwner = await aethContract.owner();
    const newStakingOwner = await stakingContract.owner();

    console.log('New AETH owner:', newAethOwner);
    console.log('New Staking owner:', newStakingOwner);

    if (
      newAethOwner.toLowerCase() === NEW_OWNER.toLowerCase() &&
      newStakingOwner.toLowerCase() === NEW_OWNER.toLowerCase()
    ) {
      console.log('');
      console.log('🎉 SUCCESS: All contracts now owned by', NEW_OWNER);
      console.log('✅ Ownership transfer complete!');
    } else {
      console.log('');
      console.log('❌ ERROR: Ownership verification failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Transfer failed:', error.message);
    process.exit(1);
  }
}

// Run the transfer
transferOwnership();
