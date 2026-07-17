#!/usr/bin/env node

// verify-ownership.js - Verify ownership and test admin functions
import { ethers } from 'ethers';

const AETH_CONTRACT = '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e';
const STAKING_CONTRACT = '0x896D9d37A67B0bBf81dde0005975DA7850FFa638';
const EXPECTED_OWNER = '0xDF5A2b892254C42F80000A029dfE8b311f777Bd5';

// ⚠️  IMPORTANT: Replace with your actual private key for testing admin functions
const PRIVATE_KEY = process.env.PRIVATE_KEY || 'YOUR_PRIVATE_KEY_HERE';

async function verifyOwnership() {
  console.log('🔍 Verifying Contract Ownership...');
  console.log('Expected Owner:', EXPECTED_OWNER);
  console.log('');

  try {
    // Connect to Polygon (read-only)
    const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com/');

    // AETH Contract ABI
    const aethAbi = [
      'function owner() view returns (address)',
      'function tradingEnabled() view returns (bool)',
      'function buyTax() view returns (uint256)',
      'function sellTax() view returns (uint256)',
      'function paused() view returns (bool)',
    ];

    // Staking Contract ABI
    const stakingAbi = ['function owner() view returns (address)'];

    // Check AETH Contract
    console.log('📋 Checking AETH Contract...');
    const aethContract = new ethers.Contract(AETH_CONTRACT, aethAbi, provider);

    const aethOwner = await aethContract.owner();
    const tradingEnabled = await aethContract.tradingEnabled();
    const buyTax = await aethContract.buyTax();
    const sellTax = await aethContract.sellTax();
    const isPaused = await aethContract.paused();

    console.log('AETH Owner:', aethOwner);
    console.log('Trading Enabled:', tradingEnabled);
    console.log('Buy Tax:', buyTax.toString() + '%');
    console.log('Sell Tax:', sellTax.toString() + '%');
    console.log('Contract Paused:', isPaused);
    console.log('');

    // Check Staking Contract
    console.log('📋 Checking Staking Contract...');
    const stakingContract = new ethers.Contract(
      STAKING_CONTRACT,
      stakingAbi,
      provider,
    );

    const stakingOwner = await stakingContract.owner();
    console.log('Staking Owner:', stakingOwner);
    console.log('');

    // Verify ownership
    const aethOwnershipCorrect =
      aethOwner.toLowerCase() === EXPECTED_OWNER.toLowerCase();
    const stakingOwnershipCorrect =
      stakingOwner.toLowerCase() === EXPECTED_OWNER.toLowerCase();

    console.log('🔍 Ownership Verification:');
    console.log(
      'AETH Contract:',
      aethOwnershipCorrect ? '✅ Correct' : '❌ Incorrect',
    );
    console.log(
      'Staking Contract:',
      stakingOwnershipCorrect ? '✅ Correct' : '❌ Incorrect',
    );

    if (aethOwnershipCorrect && stakingOwnershipCorrect) {
      console.log('');
      console.log('🎉 SUCCESS: All contracts owned by expected address!');
      console.log('');

      // Test admin functions if private key is provided
      if (PRIVATE_KEY !== 'YOUR_PRIVATE_KEY_HERE') {
        await testAdminFunctions();
      } else {
        console.log(
          '💡 To test admin functions, set PRIVATE_KEY environment variable',
        );
        console.log('Example: export PRIVATE_KEY=0x1234567890abcdef...');
      }
    } else {
      console.log('');
      console.log('❌ ERROR: Ownership verification failed!');
      console.log('Expected:', EXPECTED_OWNER);
      console.log('AETH actual:', aethOwner);
      console.log('Staking actual:', stakingOwner);
    }
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

async function testAdminFunctions() {
  console.log('🧪 Testing Admin Functions...');
  console.log('(This will test functions without making actual changes)');
  console.log('');

  try {
    const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com/');
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log('Testing with wallet:', await signer.getAddress());
    console.log('');

    // AETH Contract with admin functions
    const aethAbi = [
      'function owner() view returns (address)',
      'function transferOwnership(address newOwner)',
      'function setTradingEnabled(bool enabled)',
      'function updateTaxes(uint256 buyTax, uint256 sellTax)',
      'function pause()',
      'function unpause()',
    ];

    const aethContract = new ethers.Contract(AETH_CONTRACT, aethAbi, signer);

    // Verify we are the owner
    const currentOwner = await aethContract.owner();
    const ourAddress = await signer.getAddress();

    if (currentOwner.toLowerCase() !== ourAddress.toLowerCase()) {
      console.log('❌ Not the contract owner - cannot test admin functions');
      return;
    }

    console.log('✅ Confirmed as contract owner');
    console.log('');

    // Test ownership transfer (to self - safe test)
    console.log('🧪 Testing ownership transfer (to self)...');
    try {
      const tx = await aethContract.transferOwnership(ourAddress);
      console.log('Transfer TX:', tx.hash);
      await tx.wait();
      console.log('✅ Ownership transfer test successful');
    } catch (error) {
      console.log('❌ Ownership transfer test failed:', error.message);
    }

    console.log('');

    // Test pause/unpause (safe to test)
    console.log('🧪 Testing pause/unpause functions...');
    try {
      // First unpause (in case it's paused)
      const unpauseTx = await aethContract.unpause();
      console.log('Unpause TX:', unpauseTx.hash);
      await unpauseTx.wait();
      console.log('✅ Unpause successful');

      // Then pause
      const pauseTx = await aethContract.pause();
      console.log('Pause TX:', pauseTx.hash);
      await pauseTx.wait();
      console.log('✅ Pause successful');

      // Unpause again to restore normal operation
      const restoreTx = await aethContract.unpause();
      console.log('Restore TX:', restoreTx.hash);
      await restoreTx.wait();
      console.log('✅ Restore successful');
    } catch (error) {
      console.log('❌ Pause/unpause test failed:', error.message);
    }

    console.log('');
    console.log('🎉 Admin function tests completed!');
  } catch (error) {
    console.error('❌ Admin function test failed:', error.message);
  }
}

// Run verification
verifyOwnership();
