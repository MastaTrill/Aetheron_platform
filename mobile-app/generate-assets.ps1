# PowerShell script to automate app store asset generation (icons, screenshots)
# Usage: ./generate-assets.ps1

$ErrorActionPreference = 'Stop'

# Generate app icons (requires ImageMagick)
if (!(Get-Command magick -ErrorAction SilentlyContinue)) {
    Write-Host "ImageMagick (magick) not found. Please install ImageMagick to use this script."
    exit 1
}

# Source icon (should be 1024x1024 PNG)
$srcIcon = "assets/icon-1024.png"
if (!(Test-Path $srcIcon)) {
    Write-Host "Source icon $srcIcon not found. Please provide a 1024x1024 PNG."
    exit 1
}

# Android icon sizes
$androidIcons = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}
foreach ($folder in $androidIcons.Keys) {
    $size = $androidIcons[$folder]
    $outDir = "android/app/src/main/res/$folder"
    if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
    magick convert $srcIcon -resize ${size}x${size} "$outDir/ic_launcher.png"
    Write-Host "Generated Android icon: $outDir/ic_launcher.png ($size x $size)"
}

# iOS icon sizes
$iosIcons = @(180, 120, 167, 152, 76, 40, 60, 29, 58, 87, 114, 57)
$iosDir = "ios/Aetheron/Images.xcassets/AppIcon.appiconset"
if (!(Test-Path $iosDir)) { New-Item -ItemType Directory -Path $iosDir | Out-Null }
foreach ($size in $iosIcons) {
    magick convert $srcIcon -resize ${size}x${size} "$iosDir/icon-${size}.png"
    Write-Host "Generated iOS icon: $iosDir/icon-${size}.png ($size x $size)"
}

Write-Host "App icon generation complete. For screenshots, use device emulators and save images to the assets/screenshots folder."