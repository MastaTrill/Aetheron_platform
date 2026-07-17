import express from 'express';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..', '..');
const NFT_ARTIFACT_PATH = path.join(rootDir, 'artifacts', 'contracts', 'AetheronNFT.sol', 'AetheronNFT.json');
const MARKETPLACE_ARTIFACT_PATH = path.join(rootDir, 'artifacts', 'contracts', 'NFTMarketplace.sol', 'NFTMarketplace.json');

function getContractConfig() {
  return {
    nftAddress: process.env.NFT_CONTRACT_ADDRESS || '',
    marketplaceAddress: process.env.NFT_MARKETPLACE_ADDRESS || '',
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    deployerKey: process.env.DEPLOYER_PRIVATE_KEY || '',
  };
}

function loadArtifact(artifactPath) {
  try {
    const content = fs.readFileSync(artifactPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

function createProvider() {
  const { rpcUrl } = getContractConfig();
  return new ethers.JsonRpcProvider(rpcUrl);
}

function createWallet() {
  const { deployerKey, rpcUrl } = getContractConfig();
  if (!deployerKey) {
    throw new Error('DEPLOYER_PRIVATE_KEY not configured');
  }
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return new ethers.Wallet(deployerKey, provider);
}

// GET /api/nft/config - Returns NFT contract configuration
router.get('/config', (req, res) => {
  const config = getContractConfig();
  res.json({
    nftAddress: config.nftAddress,
    marketplaceAddress: config.marketplaceAddress,
    configured: Boolean(config.nftAddress && config.marketplaceAddress),
  });
});

// GET /api/nft/status - Check if contracts are deployed and accessible
router.get('/status', async (req, res) => {
  try {
    const config = getContractConfig();
    const provider = createProvider();

    const status = {
      configured: Boolean(config.nftAddress && config.marketplaceAddress),
      nftContract: null,
      marketplaceContract: null,
    };

    if (config.nftAddress) {
      try {
        const nftContract = new ethers.Contract(
          config.nftAddress,
          ['function name() view returns (string)', 'function symbol() view returns (string)', 'function totalSupply() view returns (uint256)'],
          provider
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
          provider
        );
        const listings = await marketplaceContract.getActiveListings();
        status.marketplaceContract = { address: config.marketplaceAddress, activeListings: listings.length };
      } catch (error) {
        status.marketplaceContract = { address: config.marketplaceAddress, error: error.message };
      }
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/nft/minted - Get all minted NFTs (from events)
router.get('/minted', async (req, res) => {
  try {
    const config = getContractConfig();
    if (!config.nftAddress) {
      return res.json([]);
    }

    const provider = createProvider();
    const nftArtifact = loadArtifact(NFT_ARTIFACT_PATH);
    if (!nftArtifact) {
      return res.json([]);
    }

    const nftContract = new ethers.Contract(config.nftAddress, nftArtifact.abi, provider);

    // Get NFTMinted events
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
    res.status(500).json({ error: error.message });
  }
});

// GET /api/nft/listings - Get active marketplace listings
router.get('/listings', async (req, res) => {
  try {
    const config = getContractConfig();
    if (!config.marketplaceAddress) {
      return res.json([]);
    }

    const provider = createProvider();
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
    res.status(500).json({ error: error.message });
  }
});

// POST /api/nft/mint - Mint a new NFT
router.post('/mint', async (req, res) => {
  try {
    const { tokenURI, quantity = 1 } = req.body;
    if (!tokenURI) {
      return res.status(400).json({ error: 'tokenURI is required' });
    }

    const config = getContractConfig();
    if (!config.nftAddress) {
      return res.status(503).json({ error: 'NFT contract not configured' });
    }

    const wallet = createWallet();
    const nftArtifact = loadArtifact(NFT_ARTIFACT_PATH);
    if (!nftArtifact) {
      return res.status(503).json({ error: 'NFT contract artifact not found' });
    }

    const nftContract = new ethers.Contract(config.nftAddress, nftArtifact.abi, wallet);
    const mintPrice = ethers.parseEther('0.05');

    const totalPrice = mintPrice * BigInt(quantity);
    const tx = await nftContract.mint(tokenURI, { value: totalPrice });
    const receipt = await tx.wait();

    res.json({
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      message: `Successfully minted ${quantity} NFT(s)`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/nft/list - List an NFT for sale
router.post('/list', async (req, res) => {
  try {
    const { tokenId, price } = req.body;
    if (!tokenId || !price) {
      return res.status(400).json({ error: 'tokenId and price are required' });
    }

    const config = getContractConfig();
    if (!config.nftAddress || !config.marketplaceAddress) {
      return res.status(503).json({ error: 'Contracts not configured' });
    }

    const wallet = createWallet();
    const nftArtifact = loadArtifact(NFT_ARTIFACT_PATH);
    const marketplaceArtifact = loadArtifact(MARKETPLACE_ARTIFACT_PATH);

    if (!nftArtifact || !marketplaceArtifact) {
      return res.status(503).json({ error: 'Contract artifacts not found' });
    }

    const nftContract = new ethers.Contract(config.nftAddress, nftArtifact.abi, wallet);
    const marketplaceContract = new ethers.Contract(config.marketplaceAddress, marketplaceArtifact.abi, wallet);

    // Approve marketplace to transfer NFT
    const approveTx = await nftContract.approve(config.marketplaceAddress, tokenId);
    await approveTx.wait();

    // List NFT
    const priceWei = ethers.parseEther(price.toString());
    const listTx = await marketplaceContract.listNFT(config.nftAddress, tokenId, priceWei);
    const receipt = await listTx.wait();

    res.json({
      success: true,
      txHash: receipt.hash,
      listingId: receipt.logs[0]?.args?.listingId?.toString(),
      message: 'NFT listed for sale',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/nft/buy - Buy an NFT from marketplace
router.post('/buy', async (req, res) => {
  try {
    const { listingId } = req.body;
    if (!listingId) {
      return res.status(400).json({ error: 'listingId is required' });
    }

    const config = getContractConfig();
    if (!config.marketplaceAddress) {
      return res.status(503).json({ error: 'Marketplace not configured' });
    }

    const wallet = createWallet();
    const marketplaceArtifact = loadArtifact(MARKETPLACE_ARTIFACT_PATH);

    if (!marketplaceArtifact) {
      return res.status(503).json({ error: 'Marketplace artifact not found' });
    }

    const marketplaceContract = new ethers.Contract(config.marketplaceAddress, marketplaceArtifact.abi, wallet);

    // Get listing to determine price
    const listing = await marketplaceContract.getListing(listingId);
    const price = listing.price;

    const buyTx = await marketplaceContract.buyNFT(listingId, { value: price });
    const receipt = await buyTx.wait();

    res.json({
      success: true,
      txHash: receipt.hash,
      message: 'NFT purchased successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/nft/upload-metadata - Store NFT metadata and return tokenURI
router.post('/upload-metadata', express.json({ limit: '10mb' }), (req, res) => {
  try {
    const { name, description, image, attributes } = req.body;
    if (!name || !image) {
      return res.status(400).json({ error: 'name and image are required' });
    }

    const metadata = {
      name,
      description: description || '',
      image,
      attributes: attributes || [],
    };

    const tokenId = `nft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const tokenURI = `https://aetrs.com/nft/metadata/${tokenId}.json`;

    try {
      if (!fs.existsSync(NFT_METADATA_DIR)) {
        fs.mkdirSync(NFT_METADATA_DIR, { recursive: true });
      }
      fs.writeFileSync(
        path.join(NFT_METADATA_DIR, `${tokenId}.json`),
        JSON.stringify(metadata, null, 2),
      );
    } catch (storageError) {
      console.warn('Metadata file storage failed, returning URI anyway:', storageError.message);
    }

    res.json({ tokenURI, tokenId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
