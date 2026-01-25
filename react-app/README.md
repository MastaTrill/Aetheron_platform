# Aetheron Platform - React Frontend

A modern React application for interacting with the Aetheron DeFi platform on Polygon Mumbai testnet.

## Features

- 🌐 **MetaMask Integration**: Connect your wallet and interact with the blockchain
- 🏦 **Staking Interface**: Stake AETH tokens in various pools with different APYs
- 📊 **Balance Display**: View your AETH balance and staked amounts
- 🔄 **Real-time Updates**: Refresh balances and pool information
- 🎨 **Modern UI**: Beautiful space-themed design with responsive layout

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MetaMask browser extension
- Some MATIC tokens on Mumbai testnet for gas fees

### Installation

1. Navigate to the react-app directory:

   ```bash
   cd react-app
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Connecting to Mumbai Testnet

1. Open MetaMask
2. Add Mumbai Testnet network:
   - Network Name: Mumbai Testnet
   - RPC URL: <https://rpc-mumbai.matic.network>
   - Chain ID: 80001
   - Currency Symbol: MATIC
   - Block Explorer: <https://mumbai.polygonscan.com/>

3. Get some test MATIC from the [Mumbai Faucet](https://faucet.polygon.technology/)

## Usage

### Connecting Your Wallet

1. Click "Connect MetaMask" button
2. Approve the connection in MetaMask
3. The app will automatically switch to Mumbai testnet

### Viewing Balances

- Your AETH token balance is displayed in the header
- Total staked amount is shown below your address

### Staking Tokens

1. Browse available staking pools
2. Enter the amount of AETH tokens to stake
3. Click "Stake" button
4. Approve the token spending in MetaMask
5. Confirm the staking transaction

### Claiming Rewards

1. Click "Claim Rewards" button
2. Confirm the transaction in MetaMask
3. Your rewards will be transferred to your wallet

## Contract Addresses

- **Aetheron Token**: `0x44F9c15816bCe5d6691448F60DAD50355ABa40b5`
- **Staking Contract**: `0x896D9d37A67B0bBf81dde0005975DA7850FFa638`

## Technologies Used

- **React 18**: Frontend framework
- **Ethers.js v6**: Web3 interaction library
- **MetaMask**: Wallet integration
- **Polygon Mumbai**: Testnet blockchain
- **Tailwind CSS**: Utility-first CSS framework

## Development

### Available Scripts

- `npm start`: Runs the app in development mode
- `npm run build`: Builds the app for production
- `npm test`: Launches the test runner
- `npm run eject`: Ejects from Create React App

### Project Structure

```
src/
├── App.jsx          # Main application component
├── App.css          # Application styles
├── index.js         # React entry point
└── index.css        # Global styles
```

## Troubleshooting

### Common Issues

1. **"Please install MetaMask!"**: Install the MetaMask browser extension
2. **Network not found**: Add Mumbai testnet manually to MetaMask
3. **Insufficient funds**: Get test MATIC from the faucet
4. **Transaction failed**: Check gas fees and try again

### Support

For issues related to:

- Smart contracts: Check the main README.md
- Frontend: Open an issue on GitHub
- Blockchain: Visit Polygon documentation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
