import dotenv from 'dotenv';
dotenv.config();
import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);
import fs from 'fs';

async function main() {
  console.log('\n📝 POLYGONSCAN CONTRACT VERIFICATION');
  console.log('='.repeat(60) + '\n');

  if (!POLYGONSCAN_API_KEY) {
    console.log('⚠️  POLYGONSCAN_API_KEY not found in .env');
    console.log('   Get your API key from: https://polygonscan.com/myapikey');
    console.log(
      '   Add to .env: POLYGONSCAN_API_KEY=y469f844cb8b345beac474891b236b9a7\n',
    );
  }

  // Try to read addresses from deployment-info.json
  let AETH_TOKEN, SECOND_TOKEN, ST;
  const TEAM_WALLET = '0x127C3a5A0922A0A952aDE71412E2DC651Aa7AF82';
  const MARKETING_WALLET = '0x8D3442424F8F6BEEd97496C7E54e056166f96746';
  const STAKING_POOL = '0x127C3a5A0922A0A952aDE71412E2DC651Aa7AF82';

  try {
    if (fs.existsSync('deployment-info.json')) {
      const deploymentData = JSON.parse(
        fs.readFileSync('deployment-info.json', 'utf8'),
      );
      AETH_TOKEN = deploymentData.contracts.Aetheron.address;
      SECOND_TOKEN = deploymentData.contracts.AetxToken.address;
      STAKING = deploymentData.contracts.AetheronStaking.address;
      console.log('📋 Using addresses from deployment-info.json:');
    } else {
      // Fallback to hardcoded addresses
      AETH_TOKEN = '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e';
      SECOND_TOKEN = '0x072091F554df794852E0A9d1c809F2B2bBda171E';
      STAKING = '0xA39D2334567f3142312F7Abfc63aa3E8Eabd56e7';
      console.log('📋 Using fallback addresses (may be outdated):');
    }
  } catch (error) {
    console.log(
      '⚠️  Could not read deployment-info.json, using fallback addresses',
    );
    AETH_TOKEN = '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e';
    SECOND_TOKEN = '0x072091F554df794852E0A9d1c809F2B2bBda171E';
    STAKING = '0xA39D2334567f3142312F7Abfc63aa3E8Eabd56e7';
  }

  console.log('📋 Contracts to Verify:\n');
  console.log('1. AETH Token:', AETH_TOKEN);
  console.log(
    '   Constructor Args:',
    TEAM_WALLET,
    MARKETING_WALLET,
    STAKING_POOL,
  );
  console.log('2. Second Token:', SECOND_TOKEN);
  console.log('   Constructor Args:', TEAM_WALLET);
  console.log('3. Staking Contract:', STAKING);
  console.log('   Constructor Args:', AETH_TOKEN);
  console.log('\n' + '='.repeat(60));
  console.log(
    '💡 If verification fails with "bytecode mismatch" or "Expected valid bigint":',
  );
  console.log('   The contracts were deployed with different source code.');
  console.log('   Run: node scripts/redeploy.mjs');
  console.log('   Then run this verification script again.');
  console.log('='.repeat(60));

  if (!POLYGONSCAN_API_KEY) {
    console.log('\n💡 Manual Verification Steps:\n');
    console.log('1. Go to PolygonScan:');
    console.log('   https://polygonscan.com/address/' + AETH_TOKEN + '#code\n');
    console.log("2. Click 'Verify and Publish'\n");
    console.log('3. Enter these details:');
    console.log('   - Compiler: v0.8.20');
    console.log('   - Optimization: Yes (200 runs)');
    console.log('   - License: MIT\n');
    console.log('4. Upload Aetheron.sol and constructor arguments\n');
    console.log('5. Repeat for Staking Contract:');
    console.log('   https://polygonscan.com/address/' + STAKING + '#code\n');
    return;
  }

  console.log('\n🚀 Starting Automated Verification...\n');

  try {
    // Verify AETH Token
    console.log('1️⃣  Verifying AETH Token...');
    const aetheronCmd = `npx hardhat verify --network polygon ${AETH_TOKEN} "${TEAM_WALLET}" "${MARKETING_WALLET}" "${STAKING_POOL}"`;
    console.log('   Command:', aetheronCmd);
    try {
      const { stdout, stderr } = await execPromise(aetheronCmd);
      console.log(stdout);
      if (stderr) console.log(stderr);
      console.log('   ✅ AETH Token verified!\n');
    } catch (error) {
      if (error.message.includes('Already Verified')) {
        console.log('   ℹ️  Already verified\n');
      } else {
        console.log('   ❌ Verification failed:', error.message);
        console.log('   💡 Manual Verification Steps:');
        console.log(
          '      1. Go to: https://polygonscan.com/address/' +
            AETH_TOKEN +
            '#code',
        );
        console.log('      2. Click "Verify and Publish"');
        console.log('      3. Compiler: v0.8.20, Optimization: Yes (200 runs)');
        console.log('      4. License: MIT');
        console.log(
          '      5. Upload Aetheron.sol and constructor args: ' +
            TEAM_WALLET +
            ', ' +
            MARKETING_WALLET +
            ', ' +
            STAKING_POOL +
            '\n',
        );
      }
    }

    // Verify Second Token
    console.log('2️⃣  Verifying Second Token...');
    const secondTokenCmd = `npx hardhat verify --network polygon ${SECOND_TOKEN} "${TEAM_WALLET}"`;
    console.log('   Command:', secondTokenCmd);
    try {
      const { stdout, stderr } = await execPromise(secondTokenCmd);
      console.log(stdout);
      if (stderr) console.log(stderr);
      console.log('   ✅ Second Token verified!\n');
    } catch (error) {
      if (error.message.includes('Already Verified')) {
        console.log('   ℹ️  Already verified\n');
      } else {
        console.log('   ❌ Verification failed:', error.message);
        console.log('   💡 Manual Verification Steps:');
        console.log(
          '      1. Go to: https://polygonscan.com/address/' +
            SECOND_TOKEN +
            '#code',
        );
        console.log('      2. Click "Verify and Publish"');
        console.log('      3. Compiler: v0.8.20, Optimization: Yes (200 runs)');
        console.log('      4. License: MIT');
        console.log(
          '      5. Upload AetxToken.sol and constructor arg: ' +
            TEAM_WALLET +
            '\n',
        );
      }
    }

    // Verify Staking Contract
    console.log('3️⃣  Verifying Staking Contract...');
    const stakingCmd = `npx hardhat verify --network polygon ${STAKING} "${AETH_TOKEN}"`;
    console.log('   Command:', stakingCmd);
    try {
      const { stdout, stderr } = await execPromise(stakingCmd);
      console.log(stdout);
      if (stderr) console.log(stderr);
      console.log('   ✅ Staking Contract verified!\n');
    } catch (error) {
      if (error.message.includes('Already Verified')) {
        console.log('   ℹ️  Already verified\n');
      } else {
        console.log('   ❌ Verification failed:', error.message);
        console.log('   💡 Manual Verification Steps:');
        console.log(
          '      1. Go to: https://polygonscan.com/address/' +
            STAKING +
            '#code',
        );
        console.log('      2. Click "Verify and Publish"');
        console.log('      3. Compiler: v0.8.20, Optimization: Yes (200 runs)');
        console.log('      4. License: MIT');
        console.log(
          '      5. Upload AetheronStaking.sol and constructor arg: ' +
            AETH_TOKEN +
            '\n',
        );
      }
    }

    console.log('='.repeat(60));
    console.log('✅ VERIFICATION COMPLETE!\n');
    console.log('View verified contracts:');
    console.log(
      '  AETH Token: https://polygonscan.com/address/' + AETH_TOKEN + '#code',
    );
    console.log(
      '  Second Token: https://polygonscan.com/address/' +
        SECOND_TOKEN +
        '#code',
    );
    console.log(
      '  Staking: https://polygonscan.com/address/' + STAKING + '#code\n',
    );
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
