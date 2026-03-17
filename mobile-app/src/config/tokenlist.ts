// Example token list for swap dropdown (Polygon mainnet)
export const TOKEN_LIST = [
  {
    symbol: 'MATIC',
    name: 'Polygon',
    address: '0x0000000000000000000000000000000000001010', // Native MATIC (use AddressZero in contract)
    decimals: 18,
    logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
  },
  {
    symbol: 'AETH',
    name: 'Aetheron',
    address: '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e',
    decimals: 18,
    logo: require('../assets/logo.png'),
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    decimals: 6,
    logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
  },
  // Add more tokens as needed
];
