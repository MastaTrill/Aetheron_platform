# 📱 Aetheron Mobile App

> React Native mobile application for the Aetheron Platform - Space Exploration & DeFi

[![React Native](https://img.shields.io/badge/React%20Native-0.73-blue.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](../LICENSE)

## ✅ STATUS: READY FOR STORE SUBMISSION

**All code is complete and ready for:**

- Android APK/AAB generation
- iOS IPA generation  
- App Store submissions
- Production deployment

### What's Ready

- ✅ Full React Native app with TypeScript
- ✅ Web3 integration (WalletConnect, MetaMask)
- ✅ Staking, swapping, wallet management
- ✅ Android project structure created
- ✅ Store metadata prepared
- ✅ Build scripts configured
- ✅ Code linted and error-free

## 🌟 Features

- 💼 **Wallet Management** - View balance, send AETH tokens
- 🎯 **Staking** - Stake tokens and earn rewards
- 🔄 **Swap Integration** - Trade on QuickSwap DEX
- 🌐 **Web3 Integration** - Connect with MetaMask and WalletConnect
- 📊 **Real-time Data** - Live balance and staking info
- 🎨 **Modern UI** - Beautiful dark theme interface
- 📱 **Cross-platform** - Works on iOS and Android

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.19.4
- React Native CLI
- Xcode (for iOS) or Android Studio (for Android)
- CocoaPods (for iOS)

### Installation

```bash
# Navigate to mobile-app directory
cd mobile-app

# Install dependencies
npm install

# iOS only - Install pods
cd ios && pod install && cd ..

# Android - No extra steps needed
```

### Configuration

1. **Set up WalletConnect Project ID:**
   - Go to [WalletConnect Cloud](https://cloud.walletconnect.com)
   - Create a new project
   - Copy your Project ID
   - Update `src/config/contracts.ts`:

     ```typescript
     export const WALLETCONNECT_PROJECT_ID = 'YOUR_PROJECT_ID_HERE';
     ```

2. **Contract Addresses** (Already configured for Polygon mainnet):
   - AETH Token: `0x44F9c15816bCe5d6691448F60DAD50355ABa40b5`
   - Staking Contract: `0x896D9d37A67B0bBf81dde0005975DA7850FFa638`

### Run the App

```bash
# Run on iOS
npm run ios

# Run on Android
npm run android

# Start Metro bundler separately (if needed)
npm start
```

## 📁 Project Structure

```
mobile-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── LoadingSpinner.tsx
│   ├── screens/             # App screens
│   │   ├── HomeScreen.tsx
│   │   ├── WalletScreen.tsx
│   │   ├── StakingScreen.tsx
│   │   └── SwapScreen.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useAetheron.ts   # Token interactions
│   │   └── useStaking.ts    # Staking interactions
│   ├── context/             # React Context providers
│   │   └── Web3Context.tsx  # Web3 provider
│   ├── config/              # Configuration files
│   │   ├── contracts.ts     # Contract addresses
│   │   ├── abis.ts          # Contract ABIs
│   │   └── theme.ts         # App theme
│   └── utils/               # Utility functions
├── android/                 # Android native code
├── ios/                     # iOS native code
├── App.tsx                  # Root component
├── package.json
└── tsconfig.json
```

## 🎯 Screens

### 1. Home Screen

- Dashboard with balance overview
- Staking statistics
- Quick action buttons
- Links to trading platforms

### 2. Wallet Screen

- View AETH balance
- Send tokens to other addresses
- Copy wallet address
- Disconnect wallet

### 3. Staking Screen

- View staked amount and rewards
- Stake AETH tokens
- Unstake tokens
- Claim rewards
- Quick percentage buttons (25%, 50%, 75%, MAX)

### 4. Swap Screen

- Links to QuickSwap DEX
- Market data (DexTools, DexScreener)
- Trading tips and information

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run tests
npm test

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

### Building for Production

#### iOS

```bash
# Build for iOS
cd ios
xcodebuild -workspace MobileApp.xcworkspace -scheme MobileApp -configuration Release
```

#### Android

```bash
# Build APK
cd android
./gradlew assembleRelease

# Build AAB (for Play Store)
./gradlew bundleRelease
```

## 📦 Dependencies

### Core

- `react-native` - Mobile framework
- `react-navigation` - Navigation library
- `ethers` - Ethereum library

### Web3

- `@walletconnect/react-native-compat` - WalletConnect integration
- `@react-native-async-storage/async-storage` - Local storage

### UI

- `react-native-gesture-handler` - Gesture system
- `react-native-reanimated` - Animations
- `react-native-vector-icons` - Icon library
- `react-native-svg` - SVG support

## 🔐 Security

- Private keys never stored in app
- WalletConnect for secure wallet connection
- All transactions require user approval
- Contract addresses hardcoded (tamper-proof)

## 🌐 Networks

- **Polygon Mainnet** (Chain ID: 137)
- RPC: `https://polygon-rpc.com`
- Explorer: `https://polygonscan.com`

## 🐛 Troubleshooting

### iOS Build Issues

```bash
# Clean build
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
```

### Android Build Issues

```bash
# Clean build
cd android
./gradlew clean
cd ..
```

### Metro Bundler Issues

```bash
# Reset cache
npx react-native start --reset-cache
```

## 📝 License

MIT License - see [LICENSE](../LICENSE) for details

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../CONTRIBUTING.MD) for guidelines.

## 📞 Support

- **Website**: [mastatrill.github.io/aetheron-platform](https://mastatrill.github.io/aetheron-platform)
- **GitHub**: [github.com/MastaTrill/Aetheron_platform](https://github.com/MastaTrill/Aetheron_platform)
- **Documentation**: See main repo README

## 🎯 Roadmap

- [ ] Push notifications for rewards
- [ ] Biometric authentication
- [ ] Multi-language support
- [ ] Price alerts
- [ ] Portfolio tracking
- [ ] Transaction history
- [ ] Dark/Light theme toggle
- [ ] In-app swap functionality

## 🙏 Acknowledgments

- React Native team
- WalletConnect team
- Polygon network
- QuickSwap DEX

---

Built with ❤️ for the Aetheron community
