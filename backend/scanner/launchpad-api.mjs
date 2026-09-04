// Token Launchpad API
// Receives token details, deploys contract, returns status

import express from 'express';
import {
  assertExpectedChain,
  deployToken,
  getLaunchTokenDeploymentDiagnostics,
} from './deploy-token.mjs';
import { requireOperator, requireSignerEnabled } from '../security.mjs';
const router = express.Router();

const BASE_CHAIN_ID = 8453;
const TEAM_WALLET = process.env.TEAM_WALLET || '0xYourTeamWalletHere';
const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || '';

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isLikelyPrivateKey(value) {
  return typeof value === 'string' && /^(0x)?[0-9a-fA-F]{64}$/.test(value.trim());
}

function isLikelyAddress(value) {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value.trim());
}

function buildDiagnostics({ teamWallet }) {
  const artifactDiagnostics = getLaunchTokenDeploymentDiagnostics();

  return {
    network: 'base',
    chainId: BASE_CHAIN_ID,
    rpcUrlConfigured: isNonEmptyString(RPC_URL),
    deployerKeyConfigured: isLikelyPrivateKey(DEPLOYER_KEY),
    teamWalletConfigured: isLikelyAddress(
      isNonEmptyString(teamWallet) ? teamWallet : TEAM_WALLET,
    ),
    bytecodeConfigured: artifactDiagnostics.bytecodeConfigured,
    artifactExists: artifactDiagnostics.artifactExists,
    artifactReadable: artifactDiagnostics.artifactReadable,
    artifactPath: artifactDiagnostics.artifactPath,
  };
}

function parseAllocationPercent(value) {
  if (value === undefined || value === null || value === '') {
    return 1;
  }

  return Number(value);
}

// POST /api/launch-token
router.post('/launch-token', requireOperator, requireSignerEnabled, async (req, res) => {
  const {
    name,
    symbol,
    supply,
    teamWallet,
    allocationPercent,
    logoUrl,
    website,
    description,
  } = req.body || {};

  if (!isNonEmptyString(name) || !isNonEmptyString(symbol) || !supply) {
    return res.status(400).json({
      error: 'Missing token details',
      code: 'MISSING_TOKEN_DETAILS',
      required: ['name', 'symbol', 'supply'],
    });
  }

  const teamWalletFinal =
    isNonEmptyString(teamWallet) ? teamWallet.trim() : TEAM_WALLET;
  const allocation = parseAllocationPercent(allocationPercent);
  const diagnostics = buildDiagnostics({ teamWallet: teamWalletFinal });

  if (!diagnostics.deployerKeyConfigured) {
    return res.status(500).json({
      error: 'Token deployment is not configured.',
      code: 'DEPLOYER_KEY_MISSING',
      details: 'Set DEPLOYER_PRIVATE_KEY in the backend environment.',
      diagnostics,
    });
  }

  if (!diagnostics.bytecodeConfigured) {
    return res.status(500).json({
      error: 'Token deployment artifact is not configured.',
      code: 'ARTIFACT_NOT_READY',
      details:
        'Compile the smart-contract project so LaunchpadToken.json is available to the backend.',
      diagnostics,
    });
  }

  if (!diagnostics.teamWalletConfigured) {
    return res.status(400).json({
      error: 'Team wallet is invalid.',
      code: 'INVALID_TEAM_WALLET',
      details: 'Provide a valid 0x-prefixed wallet address.',
      diagnostics,
    });
  }

  if (!Number.isFinite(Number(supply)) || Number(supply) <= 0) {
    return res.status(400).json({
      error: 'Supply must be a positive number.',
      code: 'INVALID_SUPPLY',
      diagnostics,
    });
  }

  if (!Number.isFinite(allocation) || allocation < 0 || allocation > 100) {
    return res.status(400).json({
      error: 'Allocation percent must be between 0 and 100.',
      code: 'INVALID_ALLOCATION_PERCENT',
      diagnostics,
    });
  }

  try {
    const { ethers } = await import('ethers');
    const mintRecipient =
      allocation === 100 ? teamWalletFinal : new ethers.Wallet(DEPLOYER_KEY).address;

    const contractAddress = await deployToken({
      name,
      symbol,
      supply,
      owner: teamWalletFinal,
      initialRecipient: mintRecipient,
      rpcUrl: RPC_URL,
      privateKey: DEPLOYER_KEY,
      expectedChainId: BASE_CHAIN_ID,
    });

    let allocationTxHash = null;
    if (allocation > 0 && allocation < 100) {
      const ethers = await import('ethers');
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      await assertExpectedChain(provider, BASE_CHAIN_ID);
      const wallet = new ethers.Wallet(DEPLOYER_KEY, provider);
      const contract = new ethers.Contract(
        contractAddress,
        [
          'function transfer(address to, uint amount) returns (bool)',
          'function totalSupply() view returns (uint256)',
        ],
        wallet,
      );
      const totalSupply = await contract.totalSupply();
      const allocationBasisPoints = BigInt(Math.round(allocation * 100));
      const amount = (totalSupply * allocationBasisPoints) / 10000n;
      const tx = await contract.transfer(teamWalletFinal, amount);
      await tx.wait();
      allocationTxHash = tx.hash;
    }

    res.json({
      name,
      symbol,
      supply,
      contractAddress,
      chainId: BASE_CHAIN_ID,
      network: 'base',
      status: 'deployed',
      allocationPercent: allocation,
      teamWallet: teamWalletFinal,
      allocationTxHash,
      logoUrl,
      website,
      description,
      message: 'Token deployed to Base. Allocation logic executed.',
    });
  } catch (err) {
    const message = err?.message || 'Deployment failed.';
    const lowerMessage = message.toLowerCase();

    let code = err?.code || 'DEPLOYMENT_FAILED';
    let details = 'The token deployment request reached the backend but failed during execution.';

    if (code === 'WRONG_DEPLOYMENT_NETWORK') {
      details = 'The configured RPC endpoint is not Base Mainnet (chain ID 8453). Deployment was refused before signing.';
    } else if (lowerMessage.includes('artifact')) {
      code = 'ARTIFACT_NOT_READY';
      details =
        'The LaunchpadToken artifact is missing or unreadable. Recompile the smart-contract project.';
    } else if (lowerMessage.includes('invalid private key')) {
      code = 'INVALID_DEPLOYER_KEY';
      details = 'DEPLOYER_PRIVATE_KEY is present but invalid.';
    } else if (lowerMessage.includes('network') || lowerMessage.includes('rpc')) {
      code = 'RPC_CONNECTION_FAILED';
      details = 'The backend could not connect to the configured Base RPC endpoint.';
    }

    res.status(500).json({
      error: message,
      code,
      details,
      diagnostics,
    });
  }
});

export default router;
