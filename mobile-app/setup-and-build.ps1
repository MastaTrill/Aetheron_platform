# 🚀 Aetheron App Store Submission - Automated Setup Script

# This script will help you set up the development environment and build the app
# Run this after installing Android Studio and JDK

Write-Host "=== Aetheron App Store Submission Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Java
try {
  $javaVersion = java -version 2>&1 | Select-String "version"
  Write-Host "✓ Java found: $javaVersion" -ForegroundColor Green
}
catch {
  Write-Host "✗ Java not found. Please install JDK 17+ from https://adoptium.net/" -ForegroundColor Red
  exit 1
}

# Check Android Studio
$androidStudioPath = "$env:ProgramFiles\Android\Android Studio\bin\studio.exe"
if (Test-Path $androidStudioPath) {
  Write-Host "✓ Android Studio found" -ForegroundColor Green
}
else {
  Write-Host "✗ Android Studio not found. Please install from https://developer.android.com/studio" -ForegroundColor Red
  exit 1
}

# Check ImageMagick
try {
  magick -version | Out-Null
  Write-Host "✓ ImageMagick found" -ForegroundColor Green
}
catch {
  Write-Host "✗ ImageMagick not found. Install with: choco install imagemagick" -ForegroundColor Red
  exit 1
}

# Check if app icon exists
$appIcon = "assets/icon-1024.png"
if (Test-Path $appIcon) {
  Write-Host "✓ App icon found: $appIcon" -ForegroundColor Green
}
else {
  Write-Host "✗ App icon not found. Please create assets/icon-1024.png (1024x1024 PNG)" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "=== Generating App Assets ===" -ForegroundColor Cyan

# Generate Android icons
Write-Host "Generating Android icons..." -ForegroundColor Yellow
$androidIcons = @{
  "mipmap-mdpi"    = 48
  "mipmap-hdpi"    = 72
  "mipmap-xhdpi"   = 96
  "mipmap-xxhdpi"  = 144
  "mipmap-xxxhdpi" = 192
}

foreach ($folder in $androidIcons.Keys) {
  $size = $androidIcons[$folder]
  $outDir = "android/app/src/main/res/$folder"
  if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
  }
  magick convert $appIcon -resize "${size}x${size}" "$outDir/ic_launcher.png"
  Write-Host "  ✓ Generated $outDir/ic_launcher.png (${size}x${size})" -ForegroundColor Green
}

# Generate iOS icons (if iOS project exists)
if (Test-Path "ios") {
  Write-Host "Generating iOS icons..." -ForegroundColor Yellow
  $iosIcons = @(180, 120, 167, 152, 76, 40, 60, 29, 58, 87, 114, 57)
  $iosDir = "ios/Aetheron/Images.xcassets/AppIcon.appiconset"
  if (!(Test-Path $iosDir)) {
    New-Item -ItemType Directory -Path $iosDir -Force | Out-Null
  }
  foreach ($size in $iosIcons) {
    magick convert $appIcon -resize "${size}x${size}" "$iosDir/icon-${size}.png"
    Write-Host "  ✓ Generated $iosDir/icon-${size}.png (${size}x${size})" -ForegroundColor Green
  }
}

Write-Host ""
Write-Host "=== Building Android Release ===" -ForegroundColor Cyan

# Navigate to android directory
Set-Location android

# Check if keystore exists, create if not
$keystorePath = "app/aetheron.keystore"
if (!(Test-Path $keystorePath)) {
  Write-Host "Creating signing keystore..." -ForegroundColor Yellow
  keytool -genkey -v -keystore $keystorePath -alias aetheron -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android -dname "CN=Aetheron, OU=Development, O=Aetheron, L=Unknown, ST=Unknown, C=US"
  Write-Host "✓ Keystore created: $keystorePath" -ForegroundColor Green
}

# Build AAB
Write-Host "Building Android App Bundle (AAB)..." -ForegroundColor Yellow
./gradlew bundleRelease

if ($LASTEXITCODE -eq 0) {
  Write-Host "✓ Android AAB build successful!" -ForegroundColor Green
  Write-Host "  Output: android/app/build/outputs/bundle/release/app-release.aab" -ForegroundColor Cyan

  Write-Host ""
  Write-Host "=== Next Steps ===" -ForegroundColor Cyan
  Write-Host "1. Create Google Play Console account: https://play.google.com/console/" -ForegroundColor White
  Write-Host "2. Create Apple Developer account: https://developer.apple.com/" -ForegroundColor White
  Write-Host "3. Submit AAB to Google Play Store" -ForegroundColor White
  Write-Host "4. For iOS: Set up macOS + Xcode and build IPA" -ForegroundColor White
  Write-Host ""
  Write-Host "See APP_STORE_SUBMISSION_GUIDE.md for detailed instructions" -ForegroundColor Yellow
}
else {
  Write-Host "✗ Android build failed. Check the error messages above." -ForegroundColor Red
}

Set-Location ..