# PowerShell script to automate building Android and iOS release binaries for store submission
# Usage: ./build-release.ps1

$ErrorActionPreference = 'Stop'

# Android APK and AAB build
Write-Host "Building Android APK..."
cd android
./gradlew assembleRelease
Write-Host "Android APK build complete."

Write-Host "Building Android AAB..."
./gradlew bundleRelease
Write-Host "Android AAB build complete."
cd ..

# iOS build (requires macOS and Xcode)
if (Test-Path "ios") {
    Write-Host "Building iOS Release (requires macOS/Xcode)..."
    cd ios
    xcodebuild -workspace MobileApp.xcworkspace -scheme MobileApp -configuration Release
    Write-Host "iOS build complete. Archive and export IPA via Xcode Organizer."
    cd ..
} else {
    Write-Host "iOS folder not found. Skipping iOS build."
}

Write-Host "All build steps complete. Check android/app/build/outputs for APK/AAB and use Xcode Organizer for IPA export."