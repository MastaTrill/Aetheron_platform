import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';

const BASE_RPC = 'https://mainnet.base.org';
const POLYGON_RPC = 'https://polygon-bor-rpc.publicnode.com';

const baseProvider = new ethers.JsonRpcProvider(BASE_RPC);
const polyProvider = new ethers.JsonRpcProvider(POLYGON_RPC);

const envFiles = [
  'C:\\Users\\willi\\.env',
  'C:\\Users\\willi\\Aetheron\\.env',
  'C:\\Users\\willi\\Aetheron-Sentinel-L3\\.env',
  'C:\\Users\\willi\\Aetheron-Sentinel-L3\\.env.mainnet',
  'C:\\Users\\willi\\Aetheron_platform\\smart-contract\\.env',
  'C:\\Users\\willi\\Aetheron_platform-1\\smart-contract\\.env',
  'C:\\Users\\willi\\cosmic-echo\\.env',
  'C:\\Users\\willi\\cosmic-echo-identity\\smart-contract\\.env',
];

const foundKeys = new Map();

for (const f of envFiles) {
  if (!fs.existsSync(f)) continue;
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...valParts] = trimmed.split('=');
    const val = valParts.join('=').trim().replace(/^['"]|['"]$/g, '');
    if (
      (key.toUpperCase().includes('PRIVATE_KEY') || key.toUpperCase().includes('SECRET') || key.toUpperCase().includes('DEPLOYER_KEY')) &&
      val.length >= 64
    ) {
      const cleanKey = val.startsWith('0x') ? val : '0x' + val;
      try {
        const wallet = new ethers.Wallet(cleanKey);
        if (!foundKeys.has(wallet.address.toLowerCase())) {
          foundKeys.set(wallet.address.toLowerCase(), {
            address: wallet.address,
            privateKey: cleanKey,
            source: f,
          });
        }
      } catch (e) {}
    }
  }
}

console.log(`\n=== FOUND ${foundKeys.size} WALLETS IN LOCAL ENV FILES ===\n`);

for (const [addrLower, info] of foundKeys.entries()) {
  const [ethBal, polBal] = await Promise.all([
    baseProvider.getBalance(info.address).catch(() => 0n),
    polyProvider.getBalance(info.address).catch(() => 0n),
  ]);

  console.log(`Wallet: ${info.address}`);
  console.log(`  Source:      ${info.source}`);
  console.log(`  Base ETH:    ${ethers.formatEther(ethBal)} ETH`);
  console.log(`  Polygon POL: ${ethers.formatEther(polBal)} POL\n`);
}
