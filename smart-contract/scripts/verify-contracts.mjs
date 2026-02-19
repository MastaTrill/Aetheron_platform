// ESM-compatible dotenv import
import('dotenv').then((dotenv) => {
  dotenv.config();
});

import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);
import fs from 'fs';
import https from 'https';

// Helper: Print and exit with error
function fail(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

// --- Multi-network support ---
// Usage: node verify-contracts.mjs [network1,network2,...] [contractType1,contractType2,...]
// Example: node verify-contracts.mjs polygon mumbai Aetheron AetxToken AetheronStaking
// If no args, fallback to process.env.NETWORK or 'polygon' and all contract types
const cliArgs = process.argv.slice(2);
const allNetworks = ['polygon', 'mumbai', 'goerli', 'mainnet'];
const allContractTypes = ['Aetheron', 'AetxToken', 'AetheronStaking'];
let networks = [];
let contractTypes = [];
for (const arg of cliArgs) {
  if (allNetworks.includes(arg.toLowerCase())) networks.push(arg.toLowerCase());
  else if (allContractTypes.includes(arg)) contractTypes.push(arg);
}
if (!networks.length) networks = [process.env.NETWORK || 'polygon'];
if (!contractTypes.length) contractTypes = allContractTypes;

const TEAM_WALLET = '0x127C3a5A0922A0A952aDE71412E2DC651Aa7AF82';
const MARKETING_WALLET = '0x8D3442424F8F6BEEd97496C7E54e056166f96746';
const STAKING_POOL = '0x127C3a5A0922A0A952aDE71412E2DC651Aa7AF82';

// Helper to fetch gas price from Infura
function fetchGasPrice() {
  const url = 'https://gas.api.infura.io/v3/469f844cb8b345beac474891b236b9a7';
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            // EIP-1559: json.rapid, json.fast, json.standard, json.slow (all in wei)
            resolve(json);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

async function main() {
  // Collect results for visualization
  const results = [];
  let gasInfo = null;
  try {
    gasInfo = await fetchGasPrice();
  } catch (e) {
    console.warn('⚠️  Could not fetch gas price from Infura:', e.message);
  }
  if (gasInfo) {
    // Show gas price summary
    console.log('⛽ Current Gas Prices (Infura):');
    for (const key of ['rapid', 'fast', 'standard', 'slow']) {
      if (gasInfo[key]) {
        // Convert wei to gwei
        const gwei = (parseInt(gasInfo[key]) / 1e9).toFixed(2);
        console.log(`   ${key.padEnd(8)}: ${gwei} gwei`);
      }
    }
    console.log('='.repeat(60));
  }
  for (const NETWORK of networks) {
    const envNetworkKey = `POLYGONSCAN_API_KEY_${NETWORK.toUpperCase()}`;
    const POLYGONSCAN_API_KEY =
      process.env[envNetworkKey] || process.env.POLYGONSCAN_API_KEY;

    console.log(`\n📝 CONTRACT VERIFICATION for network: ${NETWORK}`);
    if (process.env[envNetworkKey]) {
      console.log(`🔑 Using per-network API key: ${envNetworkKey}`);
    } else {
      console.log('🔑 Using POLYGONSCAN_API_KEY from .env');
    }
    console.log('='.repeat(60) + '\n');

    if (!POLYGONSCAN_API_KEY) {
      fail(
        '⚠️  POLYGONSCAN_API_KEY not found in .env.\n   Get your API key from: https://polygonscan.com/myapikey\n   Add to .env: POLYGONSCAN_API_KEY=YOUR_KEY',
        2,
      );
    }

    // Try to read addresses from deployment-info.json
    let contractAddresses = {};
    try {
      if (fs.existsSync('deployment-info.json')) {
        const deploymentData = JSON.parse(
          fs.readFileSync('deployment-info.json', 'utf8'),
        );
        let netData = deploymentData;
        if (deploymentData.networks && deploymentData.networks[NETWORK]) {
          netData = deploymentData.networks[NETWORK];
          console.log(
            `📋 Using addresses for network '${NETWORK}' from deployment-info.json:`,
          );
        } else if (deploymentData.contracts) {
          console.log('📋 Using legacy deployment-info.json structure.');
        } else {
          fail(
            `❌ deployment-info.json does not contain addresses for network '${NETWORK}'.`,
            3,
          );
        }
        if (
          !netData.contracts?.Aetheron?.address ||
          !netData.contracts?.AetxToken?.address ||
          !netData.contracts?.AetheronStaking?.address
        ) {
          fail(
            '❌ deployment-info.json is missing required contract addresses.',
            3,
          );
        }
        contractAddresses = netData.contracts;
      } else {
        // Fallback to hardcoded addresses
        contractAddresses = {
          Aetheron: { address: '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e' },
          AetxToken: { address: '0x072091F554df794852E0A9d1c809F2B2bBda171E' },
          AetheronStaking: {
            address: '0x127C3a5A0922A0A952aDE71412E2DC651Aa7AF82',
          },
        };
      }
    } catch (err) {
      fail('❌ Error reading deployment-info.json: ' + err.message, 3);
    }

    for (const type of contractTypes) {
      const addr = contractAddresses[type]?.address;
      if (!addr) {
        console.error(`❌ Address for ${type} not found. Skipping.`);
        results.push({
          network: NETWORK,
          contract: type,
          address: null,
          status: 'address not found',
          message: 'Skipped',
          gas: gasInfo,
        });
        continue;
      }
      let cmd = '';
      if (type === 'Aetheron') {
        cmd = `npx hardhat verify --network ${NETWORK} ${addr} "${TEAM_WALLET}" "${MARKETING_WALLET}" "${STAKING_POOL}"`;
      } else if (type === 'AetxToken') {
        cmd = `npx hardhat verify --network ${NETWORK} ${addr} "${TEAM_WALLET}"`;
      } else if (type === 'AetheronStaking') {
        cmd = `npx hardhat verify --network ${NETWORK} ${addr} "${contractAddresses['Aetheron'].address}"`;
      }
      console.log(`🔎 Verifying ${type}...`);
      console.log('   Command:', cmd);
      try {
        const { stdout, stderr } = await execPromise(cmd);
        if (stdout) process.stdout.write(stdout);
        if (stderr) process.stderr.write(stderr);
        console.log(`   ✅ ${type} verified!\n`);
        results.push({
          network: NETWORK,
          contract: type,
          address: addr,
          status: 'verified',
          message: 'Success',
          gas: gasInfo,
        });
      } catch (error) {
        if (error.message && error.message.includes('Already Verified')) {
          console.log('   ℹ️  Already verified\n');
          results.push({
            network: NETWORK,
            contract: type,
            address: addr,
            status: 'already verified',
            message: 'Already Verified',
            gas: gasInfo,
          });
        } else {
          console.error(
            `   ❌ Verification failed for ${type}:`,
            error.message,
          );
          results.push({
            network: NETWORK,
            contract: type,
            address: addr,
            status: 'failed',
            message: error.message,
            gas: gasInfo,
          });
          fail(
            `   💡 Manual Verification Steps for ${type}:\n` +
              `      1. Go to: https://polygonscan.com/address/${addr}#code\n` +
              '      2. Click "Verify and Publish"\n' +
              '      3. Compiler: v0.8.20, Optimization: Yes (200 runs)\n' +
              '      4. License: MIT\n' +
              (type === 'Aetheron'
                ? `      5. Upload Aetheron.sol and constructor args: ${TEAM_WALLET}, ${MARKETING_WALLET}, ${STAKING_POOL}\n`
                : type === 'AetxToken'
                ? `      5. Upload AetxToken.sol and constructor arg: ${TEAM_WALLET}\n`
                : `      5. Upload AetheronStaking.sol and constructor arg: ${contractAddresses['Aetheron'].address}\n`),
            5,
          );
        }
      }
    }
  }
  // Print summary table
  console.log('\n===== VERIFICATION SUMMARY =====');
  console.log(
    'Network        Contract         Address                                    Status             Message           Gas (gwei)',
  );
  console.log(
    '--------------------------------------------------------------------------------------------------------------------------',
  );
  for (const r of results) {
    let gasStr = '-';
    if (r.gas && r.gas.standard) {
      gasStr = (parseInt(r.gas.standard) / 1e9).toFixed(2);
    }
    console.log(
      `${(r.network || '').padEnd(14)} ${(r.contract || '').padEnd(16)} ${(
        r.address || '-'
      ).padEnd(40)} ${(r.status || '').padEnd(18)} ${(r.message || '').padEnd(
        16,
      )} ${gasStr}`,
    );
  }
  console.log(
    '==========================================================================================================================\n',
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
