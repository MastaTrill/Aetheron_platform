# 🚀 Aetheron App Store Submission Guide

## 📋 Prerequisites Checklist

### Development Environment Setup

- [ ] **Android**: Install Android Studio with SDK 34+
- [ ] **iOS**: macOS with Xcode 15+ (for iOS builds)
- [ ] **Java**: JDK 17+ for Android builds
- [ ] **ImageMagick**: For icon generation (`choco install imagemagick` on Windows)

### Developer Accounts

- [ ] **Google Play Console**: $25 one-time fee, create account
- [ ] **Apple Developer Program**: $99/year, enroll at developer.apple.com

### App Assets Needed

- [ ] **App Icon**: 1024x1024 PNG (place in `mobile-app/assets/icon-1024.png`)
- [ ] **Screenshots**: Phone (1080x1920) and tablet (1200x1800) - 5-8 per platform
- [ ] **Feature Graphic**: 1024x500 PNG for Play Store

## 🛠️ Automated Setup Script

**Easiest option**: Run this PowerShell script to set up everything automatically:

```powershell
# Run from mobile-app directory after creating icon-1024.png
./setup-and-build.ps1
```

This script will:

- Check all prerequisites
- Generate app icons for all sizes
- Create signing keystore
- Build Android AAB file
- Provide next steps

## 🏗️ Step 2: Build Release Binaries (Manual Alternative)

### Android Build

```bash
cd mobile-app
npm install --legacy-peer-deps

# Generate signing key (first time only)
keytool -genkey -v -keystore android/app/aetheron.keystore -alias aetheron -keyalg RSA -keysize 2048 -validity 10000

# Build APK
cd android
./gradlew assembleRelease

# Build AAB (preferred for Play Store)
./gradlew bundleRelease
```

### iOS Build (requires macOS)

```bash
cd mobile-app
npm install --legacy-peer-deps

# Install iOS dependencies
cd ios && pod install && cd ..

# Open in Xcode
npx react-native run-ios --configuration Release

# Archive in Xcode:
# 1. Product > Archive
# 2. Distribute App > App Store Connect
# 3. Upload
```

## 📤 Step 3: Submit to Stores

### Google Play Store Submission

1. Go to [Google Play Console](https://play.google.com/console/)
2. Create new app "Aetheron"
3. Fill app details:
   - **Title**: Aetheron
   - **Short Description**: Space Exploration & DeFi in your pocket
   - **Full Description**: [Use from store-metadata.json]
   - **Category**: Finance
   - **Contact Email**: <support@aetheron.com>
4. Upload AAB file
5. Add screenshots and feature graphic
6. Set pricing (Free)
7. Complete content rating questionnaire
8. Submit for review

### Apple App Store Submission

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Create new app "Aetheron"
3. Fill app details:
   - **Name**: Aetheron
   - **Subtitle**: Space Exploration & DeFi
   - **Description**: [Use from store-metadata.json]
   - **Keywords**: DeFi, crypto, wallet, staking, Polygon, AETH, Web3, space
   - **Category**: Finance
   - **Support URL**: <https://mastatrill.github.io/aetheron-platform>
   - **Marketing URL**: <https://mastatrill.github.io/aetheron-platform>
4. Upload IPA via Xcode or Transporter
5. Add screenshots (6.5", 5.5", iPad)
6. Set pricing (Free)
7. Complete age rating and content rights
8. Submit for review

## ⏱️ Timeline Expectations

- **Google Play**: 1-3 days review
- **Apple App Store**: 1-7 days review
- **Total Time**: 1-2 weeks from submission to approval

## 🔧 Troubleshooting

### Common Android Issues

- **Build fails**: Ensure JDK 17+ and Android SDK 34+
- **Signing issues**: Check keystore path in `android/app/build.gradle`
- **Dependencies**: Run `npm install --legacy-peer-deps`

### Common iOS Issues

- **Pod install fails**: `cd ios && pod install --repo-update`
- **Archive fails**: Clean build folder, restart Xcode
- **Upload fails**: Use Transporter app instead of Xcode

## 📞 Support Resources

- [React Native Docs](https://reactnative.dev/docs/next/publishing-to-app-store)
- [Google Play Help](https://support.google.com/googleplay/android-developer)
- [Apple Developer Docs](https://developer.apple.com/support/app-store-connect/)

---

**Ready to submit? Start with generating your app icon and building the Android APK!**
