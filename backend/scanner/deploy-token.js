// deploy-token.js - Hardhat/ethers.js deployment utility for backend
// Usage: Called from launchpad-api.js to deploy ERC20 token

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const ARTIFACT_PATH = path.resolve(
  __dirname,
  '../../smart-contract/artifacts/contracts/LaunchpadToken.sol/LaunchpadToken.json',
);

function getLaunchTokenDeploymentDiagnostics() {
  if (!fs.existsSync(ARTIFACT_PATH)) {
    return {
      artifactPath: ARTIFACT_PATH,
      artifactExists: false,
      artifactReadable: false,
      bytecodeConfigured: false,
    };
  }

  try {
    const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, 'utf8'));
    const bytecode = artifact?.bytecode;
    return {
      artifactPath: ARTIFACT_PATH,
      artifactExists: true,
      artifactReadable: true,
      bytecodeConfigured:
        typeof bytecode === 'string' && bytecode.startsWith('0x') && bytecode.length > 2,
    };
  } catch {
    return {
      artifactPath: ARTIFACT_PATH,
      artifactExists: true,
      artifactReadable: false,
      bytecodeConfigured: false,
    };
  }
}

async function loadLaunchpadArtifact() {
  const raw = await fs.promises.readFile(ARTIFACT_PATH, 'utf8');
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

async function deployToken({
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

module.exports = { deployToken, getLaunchTokenDeploymentDiagnostics };
