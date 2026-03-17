// deploy-token.mjs - Hardhat/ethers.js deployment utility for backend
// Usage: Called from launchpad-api.mjs to deploy ERC20 token

import { ethers } from 'ethers';
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint)',
  'function transfer(address to, uint amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint amount)',
];

const ERC20_BYTECODE = '0x...'; // TODO: Replace with compiled ERC20 bytecode

export async function deployToken({
  name,
  symbol,
  supply,
  owner,
  rpcUrl,
  privateKey,
}) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  // Minimal ERC20 constructor: name, symbol, initialSupply
  const factory = new ethers.ContractFactory(ERC20_ABI, ERC20_BYTECODE, wallet);
  const contract = await factory.deploy(
    name,
    symbol,
    ethers.parseUnits(supply.toString(), 18),
  );
  await contract.waitForDeployment();
  return contract.target;
}
