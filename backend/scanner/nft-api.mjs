import express from 'express';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { assertExpectedChain } from './deploy-token.mjs';
import { requireOperator, requireSignerEnabled } from '../security.mjs';

const router = express.Router();
const BASE_CHAIN_ID = 8453;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..', '..');
const NFT_ARTIFACT_PATH = path.join(rootDir, 'smart-contract', 'artifacts', 'contracts', 'AetheronNFT.sol', 'AetheronNFT.json');
const MARKETPLACE_ARTIFACT_PATH = path.join(rootDir, 'smart-contract', 'artifacts', 'contracts', 'NFTMarketplace.sol', 'NFTMarketplace.json');
const NFT_METADATA_DIR = process.env.NFT_METADATA_DIR
  ? path.resolve(process.env.NFT_METADATA_DIR)
  : '';
const NFT_METADATA_PUBLIC_BASE_URL = (process.env.NFT_METADATA_PUBLIC_BASE_URL || '').replace(/\/+$/, '');

function getContractConfig() {
  return {
    nftAddress: process.env.NFT_CONTRACT_ADDRESS || '',
    marketplaceAddress: process.env.NFT_MARKETPLACE_ADDRESS || '',
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    deployerKey: process.env.DEPLOYER_PRIVATE_KEY || '',
  };
}

function loadArtifact(artifactPath) {
  try {
    const content = fs.readFileSync(artifactPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function createProvider() {
  const { rpcUrl } = getContractConfig();
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  await assertExpectedChain(provider, BASE_CHAIN_ID);
  return provider;
}

async function createWallet() {
  const { deployerKey } = getContractConfig();
  if (!deployerKey) {
    throw new Error('DEPLOYER_PRIVATE_KEY not configured');
  }
  const provider = await createProvider();
  return new ethers.Wallet(deployerKey, provider);
}

// GET /api/nft/config - Returns NFT contract configuration
router.get('/config', (req, res) => {
  const config = getContractConfig();
  res.json({
    network: 'base',
    chainId: BASE_CHAIN_ID,
    nftAddress: config.nftAddress,
    marketplaceAddress: config.marketplaceAddress,
    configured: Boolean(config.nftAddress && config.marketplaceAddress),
    metadataStorageConfigured: Boolean(NFT_METADATA_DIR && NFT_METADATA_PUBLIC_BASE_URL),
  });
});

// GET /api/nft/status - Check if contracts are deployed and accessible
router.get('/status', async (req, res) => {
  try {
    const config = getContractConfig();
    const provider = await createProvider();

    const status = {
      network: 'base',
      chainId: BASE_CHAIN_ID,
      configured: Boolean(config.nftAddress && config.marketplaceAddress),
      nftContract: null,
      marketplaceContract: null,
    };

    if (config.nftAddress) {
      try {
        const nftContract = new ethers.Contract(
          config.nftAddress,
          ['function name() view returns (string)', 'function symbol() view returns (string)', 'function totalSupply() view returns (uint256)'],
          provider,
        );
        const name = await nftContract.name();
        const symbol = await nftContract.symbol();
        const totalSupply = await nftContract.totalSupply();
        status.nftContract = { address: config.nftAddress, name, symbol, totalSupply: totalSupply.toString() };
      } catch (error) {
        status.nftContract = { address: config.nftAddress, error: error.message };
      }
    }

    if (config.marketplaceAddress) {
      try {
        const marketplaceContract = new ethers.Contract(
          config.marketplaceAddress,
          ['function getActiveListings() view returns (tuple(uint256 listingId, uint256 tokenId, address nftContract, address seller, uint256 price, bool active)[])'],
          provider,
        );
        const listings = await marketplaceContract.getActiveListings();
        status.marketplaceContract = { address: config.marketplaceAddress, activeListings: listings.length };
      } catch (error) {
        status.marketplaceContract = { address: config.marketplaceAddress, error: error.message };
      }
    }

    res.json(status);
  } catch (error) {
    res.status(error?.code === 'WRONG_DEPLOYMENT_NETWORK' ? 503 : 500).json({
      error: error.message,
      code: error?.code || 'NFT_STATUS_FAILED',
    });
  }
});

// GET /api/nft/minted - Get all minted NFTs (from events)
router.get('/minted', async (req, res) => {
  try {
    const config = getContractConfig();
    if (!config.nftAddress) {
      return res.json([]);
    }

    const provider = await createProvider();
    const nftArtifact = loadArtifact(NFT_ARTIFACT_PATH);
    if (!nftArtifact) {
      return res.json([]);
    }

    const nftContract = new ethers.Contract(config.nftAddress, nftArtifact.abi, provider);
    const filter = nftContract.filters.NFTMinted();
    const events = await nftContract.queryFilter(filter, -1000);

    const nfts = events.map((event) => {
      const { to, tokenId, tokenURI } = event.args;
      return {
        id: tokenId.toString(),
        owner: to,
        tokenURI,
        contractAddress: config.nftAddress,
      };
    });

    res.json(nfts);
  } catch (error) {
    res.status(error?.code === 'WRONG_DEPLOYMENT_NETWORK' ? 503 : 500).json({
      error: error.message,
      code: error?.code || 'NFT_MINTED_QUERY_FAILED',
    });
  }
});

// GET /api/nft/listings - Get active marketplace listings
router.get('/listings', async (req, res) => {
  try {
    const config = getContractConfig();
    if (!config.marketplaceAddress) {
      return res.json([]);
    }

    const provider = await createProvider();
    const marketplaceArtifact = loadArtifact(MARKETPLACE_ARTIFACT_PATH);
    if (!marketplaceArtifact) {
      return res.json([]);
    }

    const marketplaceContract = new ethers.Contract(config.marketplaceAddress, marketplaceArtifact.abi, provider);
    const listings = await marketplaceContract.getActiveListings();

    const formattedListings = listings.map((listing) => ({
      listingId: listing.listingId.toString(),
      tokenId: listing.tokenId.toString(),
      nftContract: listing.nftContract,
      seller: listing.seller,
      price: ethers.formatEther(listing.price),
      active: listing.active,
    }));

    res.json(formattedListings);
  } catch (error) {
    res.status(error?.code === 'WRONG_DEPLOYMENT_NETWORK' ? 503 : 500).json({
      error: error.message,
      code: error?.code || 'NFT_LISTINGS_QUERY_FAILED',
    });
  }
});

// POST /api/nft/mint - Mint a new NFT
router.post('/mint', requireOperator, requireSignerEnabled, async (req, res) => {
  try {
    const { tokenURI, quantity = 1 } = req.body;
    if (!tokenURI) {
      return res.status(400).json({ error: 'tokenURI is required' });
    }
    if (Number(quantity) !== 1) {
      return res.status(400).json({
        error: 'Only single-NFT minting is supported by this endpoint.',
        code: 'UNSUPPORTED_MINT_QUANTITY',
      });
    }

    const config = getContractConfig();
    if (!config.nftAddress) {
      return res.status(503).json({ error: 'NFT contract not configured' });
    }

    const wallet = await createWallet();
    const nftArtifact = loadArtifact(NFT_ARTIFACT_PATH);
    if (!nftArtifact) {
      return res.status(503).json({ error: 'NFT contract artifact not found' });
    }

    const nftContract = new ethers.Contract(config.nftAddress, nftArtifact.abi, wallet);
    const mintPrice = ethers.parseEther('0.05');
    const tx = await nftContract.mint(tokenURI, { value: mintPrice });
    const receipt = await tx.wait();

    res.json({
      success: true,
      chainId: BASE_CHAIN_ID,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      message: 'Successfully minted 1 NFT on Base',
    });
  } catch (error) {
    res.status(error?.code === 'WRONG_DEPLOYMENT_NETWORK' ? 503 : 500).json({
      error: error.message,
      code: error?.code || 'NFT_MINT_FAILED',
    });
  }
});

// POST /api/nft/list - List an NFT for sale
router.post('/list', requireOperator, requireSignerEnabled, async (req, res) => {
  try {
    const { tokenId, price } = req.body;
    if (!tokenId || !price) {
      return res.status(400).json({ error: 'tokenId and price are required' });
    }

    const config = getContractConfig();
    if (!config.nftAddress || !config.marketplaceAddress) {
      return res.status(503).json({ error: 'Contracts not configured' });
    }

    const wallet = await createWallet();
    const nftArtifact = loadArtifact(NFT_ARTIFACT_PATH);
    const marketplaceArtifact = loadArtifact(MARKETPLACE_ARTIFACT_PATH);

    if (!nftArtifact || !marketplaceArtifact) {
      return res.status(503).json({ error: 'Contract artifacts not found' });
    }

    const nftContract = new ethers.Contract(config.nftAddress, nftArtifact.abi, wallet);
    const marketplaceContract = new ethers.Contract(config.marketplaceAddress, marketplaceArtifact.abi, wallet);

    const approveTx = await nftContract.approve(config.marketplaceAddress, tokenId);
    await approveTx.wait();

    const priceWei = ethers.parseEther(price.toString());
    const listTx = await marketplaceContract.listNFT(config.nftAddress, tokenId, priceWei);
    const receipt = await listTx.wait();

    res.json({
      success: true,
      chainId: BASE_CHAIN_ID,
      txHash: receipt.hash,
      listingId: receipt.logs[0]?.args?.listingId?.toString(),
      message: 'NFT listed for sale on Base',
    });
  } catch (error) {
    res.status(error?.code === 'WRONG_DEPLOYMENT_NETWORK' ? 503 : 500).json({
      error: error.message,
      code: error?.code || 'NFT_LIST_FAILED',
    });
  }
});

// POST /api/nft/buy - Buy an NFT from marketplace
router.post('/buy', requireOperator, requireSignerEnabled, async (req, res) => {
  try {
    const { listingId } = req.body;
    if (!listingId) {
      return res.status(400).json({ error: 'listingId is required' });
    }

    const config = getContractConfig();
    if (!config.marketplaceAddress) {
      return res.status(503).json({ error: 'Marketplace not configured' });
    }

    const wallet = await createWallet();
    const marketplaceArtifact = loadArtifact(MARKETPLACE_ARTIFACT_PATH);

    if (!marketplaceArtifact) {
      return res.status(503).json({ error: 'Marketplace artifact not found' });
    }

    const marketplaceContract = new ethers.Contract(config.marketplaceAddress, marketplaceArtifact.abi, wallet);
    const listing = await marketplaceContract.getListing(listingId);
    const price = listing.price;

    const buyTx = await marketplaceContract.buyNFT(listingId, { value: price });
    const receipt = await buyTx.wait();

    res.json({
      success: true,
      chainId: BASE_CHAIN_ID,
      txHash: receipt.hash,
      message: 'NFT purchased successfully on Base',
    });
  } catch (error) {
    res.status(error?.code === 'WRONG_DEPLOYMENT_NETWORK' ? 503 : 500).json({
      error: error.message,
      code: error?.code || 'NFT_BUY_FAILED',
    });
  }
});

// POST /api/nft/upload-metadata - Store NFT metadata and return tokenURI
router.post('/upload-metadata', requireOperator, express.json({ limit: '10mb' }), (req, res) => {
  try {
    const { name, description, image, attributes } = req.body || {};
    if (!name || !image) {
      return res.status(400).json({ error: 'name and image are required' });
    }

    if (!NFT_METADATA_DIR || !NFT_METADATA_PUBLIC_BASE_URL) {
      return res.status(503).json({
        error: 'NFT metadata storage is not configured.',
        code: 'NFT_METADATA_STORAGE_NOT_CONFIGURED',
        details: 'Set NFT_METADATA_DIR and NFT_METADATA_PUBLIC_BASE_URL to persistent storage before uploading metadata.',
      });
    }

    const metadata = {
      name,
      description: description || '',
      image,
      attributes: Array.isArray(attributes) ? attributes : [],
    };

    const tokenId = `nft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    fs.mkdirSync(NFT_METADATA_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(NFT_METADATA_DIR, `${tokenId}.json`),
      JSON.stringify(metadata, null, 2),
      'utf8',
    );

    const tokenURI = `${NFT_METADATA_PUBLIC_BASE_URL}/${tokenId}.json`;
    return res.status(201).json({ tokenURI, tokenId });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to store NFT metadata.',
      code: 'NFT_METADATA_STORAGE_FAILED',
      details: error.message,
    });
  }
});

export default router;
