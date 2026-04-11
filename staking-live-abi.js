const AETHERON_TOKEN_ADDRESS = "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
const AETHERON_STAKING_ADDRESS = "0x896D9d37A67B0bBf81dde0005975DA7850FFa638";

const POLYGON_MAINNET = {
  chainIdHex: "0x89",
  chainIdDec: 137,
  chainName: "Polygon Mainnet",
  nativeCurrency: {
    name: "POL",
    symbol: "POL",
    decimals: 18
  },
  rpcUrls: ["https://polygon-rpc.com"],
  blockExplorerUrls: ["https://polygonscan.com"]
};

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)"
];

const STAKING_ABI = [
  "function stake(uint256 amount) external",
  "function withdraw(uint256 amount) external",
  "function claimRewards() external",
  "function earned(address account) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
];
