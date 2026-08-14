import { ethers } from "ethers";

const BASE_RPC = 'https://mainnet.base.org';
const POLYGON_RPC = 'https://polygon-bor-rpc.publicnode.com';

const baseProvider = new ethers.JsonRpcProvider(BASE_RPC);
const polyProvider = new ethers.JsonRpcProvider(POLYGON_RPC);

const WALLETS = [
  { name: 'Base Deployer / Owner', addr: '0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2' },
  { name: 'Polygon On-Chain Owner', addr: '0x8A3ad49656Bd07981C9CFc7aD826a808847c3452' },
  { name: 'Platform Treasury (c1fa)', addr: '0xa4737aa4b1e8a3c8f221be9e55f5bda307ecc1fa' },
  { name: 'Team Wallet (6784)', addr: '0x76A83f91dC64FC4F29CEf6635f9a36477ECA6784' },
];

async function checkAll() {
  console.log('\n=== MULTICHAIN GAS BALANCE INSPECTION ===\n');
  for (const w of WALLETS) {
    const [ethBal, polBal] = await Promise.all([
      baseProvider.getBalance(w.addr).catch(() => 0n),
      polyProvider.getBalance(w.addr).catch(() => 0n),
    ]);
    console.log(`${w.name} (${w.addr}):`);
    console.log(`  Base ETH:    ${ethers.formatEther(ethBal)} ETH`);
    console.log(`  Polygon POL: ${ethers.formatEther(polBal)} POL\n`);
  }
}

checkAll();
