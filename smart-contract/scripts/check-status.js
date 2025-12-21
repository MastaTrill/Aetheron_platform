require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("📊 AETHERON - POOL STATUS & ANALYTICS");
  console.log("=".repeat(60) + "\n");

  const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC || 'https://polygon-rpc.com');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const AETH_TOKEN = "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
  const STAKING_CONTRACT = "0x896D9d37A67B0bBf81dde0005975DA7850FFa638";
  const QUICKSWAP_FACTORY = "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32";
  const WMATIC = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";

  // Load artifacts
  const AetheronArtifact = JSON.parse(
    fs.readFileSync('./artifacts/contracts/Aetheron.sol/Aetheron.json', 'utf8')
  );

  const aethToken = new ethers.Contract(AETH_TOKEN, AetheronArtifact.abi, wallet);

  // Wallet Balances
  console.log("💰 WALLET BALANCES");
  console.log("━".repeat(60));
  
  const polBalance = await provider.getBalance(wallet.address);
  const aetheronBalance = await aethToken.balanceOf(wallet.address);
  
  console.log("Deployer Wallet:", wallet.address);
  console.log("  POL:", ethers.formatEther(polBalance), "POL");
  console.log("  AETH:", ethers.formatEther(aetheronBalance), "AETH\n");

  // Staking Balance
  const stakingBalance = await aethToken.balanceOf(STAKING_CONTRACT);
  console.log("Staking Contract:", STAKING_CONTRACT);
  console.log("  AETH:", ethers.formatEther(stakingBalance), "AETH\n");

  // Token Stats
  console.log("📈 TOKEN STATISTICS");
  console.log("━".repeat(60));
  
  const totalSupply = await aethToken.totalSupply();
  const tradingEnabled = await aethToken.tradingEnabled();
  
  console.log("Total Supply:", ethers.formatEther(totalSupply), "AETH");
  console.log("Trading Status:", tradingEnabled ? "✅ ENABLED" : "❌ DISABLED");
  console.log("Circulating Supply:", ethers.formatEther(aetheronBalance), "AETH (in deployer wallet)");
  console.log("Locked in Staking:", ethers.formatEther(stakingBalance), "AETH\n");

  // Get pair address
  const FACTORY_ABI = [
    "function getPair(address tokenA, address tokenB) view returns (address)"
  ];
  const factory = new ethers.Contract(QUICKSWAP_FACTORY, FACTORY_ABI, provider);
  
  let pairAddress;
  try {
    pairAddress = await factory.getPair(AETH_TOKEN, WMATIC);
    
    if (pairAddress !== ethers.ZeroAddress) {
      console.log("💧 LIQUIDITY POOL");
      console.log("━".repeat(60));
      console.log("Pair Address:", pairAddress);
      
      // Get pair reserves
      const PAIR_ABI = [
        "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
        "function token0() view returns (address)",
        "function token1() view returns (address)",
        "function totalSupply() view returns (uint256)"
      ];
      const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
      
      const token0 = await pair.token0();
      const token1 = await pair.token1();
      const reserves = await pair.getReserves();
      const lpSupply = await pair.totalSupply();
      
      const isAethToken0 = token0.toLowerCase() === AETH_TOKEN.toLowerCase();
      const aetheronReserve = isAethToken0 ? reserves[0] : reserves[1];
      const wmaticReserve = isAethToken0 ? reserves[1] : reserves[0];
      
      console.log("AETH Reserve:", ethers.formatEther(aetheronReserve), "AETH");
      console.log("POL Reserve:", ethers.formatEther(wmaticReserve), "POL");
      console.log("LP Tokens:", ethers.formatEther(lpSupply));
      
      const price = Number(ethers.formatEther(wmaticReserve)) / Number(ethers.formatEther(aetheronReserve));
      const marketCap = price * 1000000000;
      
      console.log("\nPrice: 1 AETH =", price.toFixed(10), "POL");
      console.log("Market Cap:", marketCap.toFixed(2), "POL (~$" + (marketCap * 0.5).toFixed(2) + " USD)\n");
    }
  } catch (error) {
    console.log("⚠️  Pair not found or not yet indexed\n");
  }

  // Links
  console.log("🔗 QUICK LINKS");
  console.log("━".repeat(60));
  console.log("\n📊 Analytics:");
  console.log("  PolygonScan:", "https://polygonscan.com/token/" + AETH_TOKEN);
  console.log("  QuickSwap Info:", "https://info.quickswap.exchange/token/" + AETH_TOKEN);
  if (pairAddress && pairAddress !== ethers.ZeroAddress) {
    console.log("  Pair Info:", "https://info.quickswap.exchange/pair/" + pairAddress);
  }
  console.log("  DexTools:", "https://www.dextools.io/app/polygon/pair-explorer/" + (pairAddress || "pending"));
  console.log("  DexScreener:", "https://dexscreener.com/polygon/" + AETH_TOKEN);
  
  console.log("\n💱 Trading:");
  console.log("  QuickSwap:", "https://quickswap.exchange/#/swap?outputCurrency=" + AETH_TOKEN);
  
  console.log("\n💧 Liquidity:");
  console.log("  Manage Pool:", "https://quickswap.exchange/#/pool");
  console.log("  Add More:", "https://quickswap.exchange/#/add/ETH/" + AETH_TOKEN);
  
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error);
    process.exit(1);
  });
