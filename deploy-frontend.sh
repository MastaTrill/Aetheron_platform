#!/bin/bash

# Aetheron Platform - Frontend Deployment Script
# Deploys the React app to GitHub Pages

echo "🚀 Deploying Aetheron Platform Frontend to GitHub Pages..."

# Build the React app
echo "📦 Building React application..."
cd react-app
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to GitHub Pages using gh-pages
echo "🌐 Deploying to GitHub Pages..."
npx gh-pages -d build

if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
    echo "🌍 Your app is now live at: https://aetheron-platform.github.io"
else
    echo "❌ Deployment failed! Please check your GitHub setup."
    echo "Make sure you have:"
    echo "1. GitHub repository created"
    echo "2. gh-pages package installed: npm install -g gh-pages"
    echo "3. Repository URL configured in package.json homepage field"
fi