# 📦 Aetheron Mobile App Store Release Checklist

## ✅ PREPARED (Code & Metadata)

- [x] React Native app code complete
- [x] Android project structure created
- [x] Store metadata prepared (store-metadata.json)
- [x] Submission guide created (APP_STORE_SUBMISSION_GUIDE.md)
- [x] Build scripts ready
- [x] Upload automation scripts prepared

## 🔄 BUILD BINARIES (Requires Development Environment)

### Android

- [ ] Install Android Studio & JDK 17+
- [ ] Run: `cd android && ./gradlew assembleRelease` (APK)
- [ ] Run: `cd android && ./gradlew bundleRelease` (AAB for Play Store)
- [ ] Output: `android/app/build/outputs/apk/release/app-release.apk` and/or `android/app/build/outputs/bundle/release/app-release.aab`

### iOS

- [ ] Set up macOS with Xcode 15+
- [ ] Run: `cd ios && xcodebuild -workspace MobileApp.xcworkspace -scheme MobileApp -configuration Release`
- [ ] Archive and export IPA via Xcode Organizer

## 🎨 CREATE APP ASSETS

### App Icon

- [ ] Create 1024x1024 PNG icon (see assets/ICON_README.md)
- [ ] Run: `./generate-assets.ps1` (requires ImageMagick)
- [ ] Verify icons in android/app/src/main/res/ folders

### Store Assets

- [ ] Feature graphic (1024x500 PNG for Play Store)
- [ ] Screenshots: 5-8 per platform (phone/tablet)
- [ ] App description, keywords, privacy policy (ready in store-metadata.json)

## 📤 STORE SUBMISSIONS

### Google Play Store

- [ ] Create Google Play Console account ($25)
- [ ] Create new app "Aetheron"
- [ ] Upload AAB file and assets
- [ ] Complete content rating and compliance
- [ ] Submit for review (1-3 days)

### Apple App Store

- [ ] Enroll in Apple Developer Program ($99/year)
- [ ] Create app in App Store Connect
- [ ] Upload IPA and assets via Xcode/Transporter
- [ ] Complete age rating and content rights
- [ ] Submit for review (1-7 days)

## 🎉 POST-SUBMISSION

- [ ] Monitor review status
- [ ] Respond to any feedback
- [ ] Publish approved apps
- [ ] Announce mobile app launch!

---

## 📋 Quick Start Commands

```bash
# 1. Create app icon (manual step)
# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Generate assets (after creating icon-1024.png)
./generate-assets.ps1

# 4. Build Android
cd android && ./gradlew bundleRelease

# 5. Submit to stores following APP_STORE_SUBMISSION_GUIDE.md
```

**Status**: Code ready, assets needed, builds require dev environment setup.

