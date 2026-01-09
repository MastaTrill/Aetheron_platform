# 📱 App Icon Creation Guide

## Required Icon

Create a 1024x1024 PNG file named `icon-1024.png` and place it in:

```
mobile-app/assets/icon-1024.png
```

## Design Suggestions

- **Style**: Modern, space-themed with crypto elements
- **Colors**: Dark background with blue/cyan accents
- **Elements**: Rocket, stars, blockchain symbols, "AETH"
- **Text**: "Aetheron" or "AETH" prominently displayed

## Tools to Create Icon

- **Canva**: Free online design tool
- **Figma**: Professional design software
- **Photoshop/GIMP**: Advanced image editors
- **Online Generators**: Look for "app icon generator"

## Example Design

```
┌─────────────────────────────────┐
│                                 │
│           🌌 AETHERON           │
│                                 │
│             🚀                  │
│          AETH • DeFi            │
│                                 │
│         [Blockchain Icon]       │
│                                 │
└─────────────────────────────────┘
```

## After Creating Icon

1. Save as PNG with transparent background
2. Place in `mobile-app/assets/icon-1024.png`
3. Run `./generate-assets.ps1` to create all sizes
4. Verify icons appear in `android/app/src/main/res/` folders

**Note**: Without this icon, the app cannot be built or submitted to stores.
