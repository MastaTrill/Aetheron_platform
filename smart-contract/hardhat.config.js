import { task } from 'hardhat/config';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import '@openzeppelin/hardhat-upgrades';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY;
const POLYGON_RPC_URL =
  process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';

module.exports = {
  solidity: '0.8.20',
  networks: {
    polygon: {
      url: POLYGON_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
    mumbai: {
      url: 'https://rpc-mumbai.maticvigil.com',
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      polygon: POLYGONSCAN_API_KEY,
      mumbai: POLYGONSCAN_API_KEY,
    },
  },
};
