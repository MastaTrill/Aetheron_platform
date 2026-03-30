// deploy-token.mjs - Hardhat/ethers.js deployment utility for backend
// Usage: Called from launchpad-api.mjs to deploy ERC20 token

import { readFile } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACT_PATH = path.resolve(
  __dirname,
  '../../smart-contract/artifacts/contracts/LaunchpadToken.sol/LaunchpadToken.json',
);

function readArtifactSync() {
  if (!existsSync(ARTIFACT_PATH)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(ARTIFACT_PATH, 'utf8'));
  } catch {
    return null;
  }
}

export function getLaunchTokenDeploymentDiagnostics() {
  const artifact = readArtifactSync();
  const bytecode = artifact?.bytecode;

  return {
    artifactPath: ARTIFACT_PATH,
    artifactExists: Boolean(artifact),
    artifactReadable: Boolean(artifact),
    bytecodeConfigured:
      typeof bytecode === 'string' && bytecode.startsWith('0x') && bytecode.length > 2,
  };
}

async function loadLaunchpadArtifact() {
  const raw = await readFile(ARTIFACT_PATH, 'utf8');
  const artifact = JSON.parse(raw);

  if (!Array.isArray(artifact.abi)) {
    throw new Error(`Launchpad artifact is missing ABI: ${ARTIFACT_PATH}`);
  }

  if (
    typeof artifact.bytecode !== 'string' ||
    !artifact.bytecode.startsWith('0x') ||
    artifact.bytecode.length <= 2
  ) {
    throw new Error(`Launchpad artifact is missing bytecode: ${ARTIFACT_PATH}`);
  }

  return artifact;
}

export async function deployToken({
  name,
  symbol,
  supply,
  owner,
  initialRecipient,
  rpcUrl,
  privateKey,
}) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const artifact = await loadLaunchpadArtifact();
  const initialSupply = ethers.parseUnits(supply.toString(), 18);
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy(
    name,
    symbol,
    initialSupply,
    initialRecipient,
    owner,
  );
  await contract.waitForDeployment();
  return contract.target;
}
