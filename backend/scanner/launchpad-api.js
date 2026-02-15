// Token Launchpad API
// Receives token details, deploys contract, returns status

const express = require('express');
const router = express.Router();

const { deployToken } = require('./deploy-token');
const TEAM_WALLET = process.env.TEAM_WALLET || '0xYourTeamWalletHere';
const RPC_URL = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || '';

// POST /api/launch-token
router.post('/launch-token', async (req, res) => {
  const {
    name,
    symbol,
    supply,
    teamWallet,
    allocationPercent,
    logoUrl,
    website,
    description,
  } = req.body;
  if (!name || !symbol || !supply)
    return res.status(400).json({ error: 'Missing token details' });
  if (!DEPLOYER_KEY || DEPLOYER_KEY.length < 64)
    return res
      .status(500)
      .json({ error: 'Deployer private key not set in backend.' });
  try {
    // Use provided teamWallet or fallback to env
    const teamWalletFinal =
      teamWallet && teamWallet.length > 0 ? teamWallet : TEAM_WALLET;
    // Deploy contract
    const contractAddress = await deployToken({
      name,
      symbol,
      supply,
      owner: teamWalletFinal,
      rpcUrl: RPC_URL,
      privateKey: DEPLOYER_KEY,
    });

    // Allocation logic: transfer allocationPercent (default 1%) to team wallet
    const allocation = allocationPercent ? Number(allocationPercent) : 1;
    // Use ethers.js to transfer allocation% to teamWalletFinal if needed
    // (Assume deployer gets all tokens, then transfer allocation% to team)
    // If allocation < 100, transfer allocation% to team wallet
    let allocationTxHash = null;
    if (allocation > 0 && allocation < 100) {
      const { ethers } = require('ethers');
      const provider = new ethers.JsonRpcProvider(RPC_URL);
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
      const amount = totalSupply * (allocation / 100);
      const tx = await contract.transfer(teamWalletFinal, amount.toString());
      await tx.wait();
      allocationTxHash = tx.hash;
    }

    res.json({
      name,
      symbol,
      supply,
      contractAddress,
      status: 'deployed',
      allocationPercent: allocation,
      teamWallet: teamWalletFinal,
      allocationTxHash,
      logoUrl,
      website,
      description,
      message: 'Token deployed to Polygon. Allocation logic executed.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Deployment failed.' });
  }
});

module.exports = router;
