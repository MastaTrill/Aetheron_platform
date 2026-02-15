import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
export default {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./smart-contract/contracts",
    tests: "./smart-contract/test",
    cache: "./smart-contract/cache",
    artifacts: "./smart-contract/artifacts"
  },
  networks: {
    polygon: {
      url: process.env.POLYGON_RPC_URL || "https://polygon-mainnet.infura.io/v3/YOUR_INFURA_KEY",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 137
    },
    // ...existing code...
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80001
    },
    hardhat: {
      chainId: 1337
    }
  },
  etherscan: {
    apiKey: {
      polygon: "YOUR_POLYGONSCAN_API_KEY",
      // ...existing code...
    }
  }
};