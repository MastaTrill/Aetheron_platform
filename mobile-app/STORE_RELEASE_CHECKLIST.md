# 📦 Aetheron Mobile App Store Release Checklist

## 1. Build Production Binaries

### Android
- [ ] Run: `cd android && ./gradlew assembleRelease` (APK)
- [ ] Run: `cd android && ./gradlew bundleRelease` (AAB for Play Store)
- [ ] Output: `android/app/build/outputs/apk/release/app-release.apk` and/or `android/app/build/outputs/bundle/release/app-release.aab`

### iOS
- [ ] Run: `cd ios && xcodebuild -workspace MobileApp.xcworkspace -scheme MobileApp -configuration Release`
- [ ] Archive and export IPA via Xcode Organizer

## 2. Prepare Store Assets
- [ ] App icon (512x512, 1024x1024)
- [ ] Feature graphic (Play Store)
- [ ] Screenshots (phone/tablet, all required sizes)
- [ ] App description, keywords, privacy policy
- [ ] Support/contact email

## 3. Google Play Store Submission
- [ ] Create/Log in to Google Play Console
- [ ] Create new app, fill in details
- [ ] Upload AAB (preferred) or APK
- [ ] Complete content rating, privacy, and compliance forms
- [ ] Add screenshots and assets
- [ ] Submit for review

## 4. Apple App Store Submission
- [ ] Enroll in Apple Developer Program
- [ ] Open Xcode, archive and upload build
- [ ] Fill in App Store Connect details
- [ ] Add screenshots and assets
- [ ] Complete privacy, compliance, and age rating
- [ ] Submit for review

## 5. Post-Submission
- [ ] Monitor review status and respond to feedback
- [ ] Publish and announce release

---

For detailed steps, see official docs:
- [Google Play Console](https://play.google.com/console/about/)
- [Apple App Store Connect](https://appstoreconnect.apple.com/)
