#!/usr/bin/env node

// image-optimizer.js - Advanced image optimization for Aetheron Platform
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

class ImageOptimizer {
  constructor() {
    this.sourceDir = '.';
    this.outputDir = './optimized';
    this.quality = 85;
    this.webpQuality = 80;
  }

  async init() {
    // Create optimized directory if it doesn't exist
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    console.log('🖼️  Image optimization initialized');
    await this.optimizeImages();
    this.generateResponsiveImages();
  }

  async optimizeImages() {
    const imageFiles = this.findImageFiles();

    console.log(`📁 Found ${imageFiles.length} images to optimize`);

    for (const file of imageFiles) {
      await this.optimizeImage(file);
    }
  }

  findImageFiles() {
    const extensions = ['.png', '.jpg', '.jpeg', '.svg'];
    const files = [];

    function scanDirectory(dir) {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    }

    scanDirectory(this.sourceDir);
    return files;
  }

  async optimizeImage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath, ext);
    const dirname = path.dirname(filePath);
    const outputPath = path.join(this.outputDir, path.relative(this.sourceDir, dirname));

    // Create output directory
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    try {
      if (ext === '.svg') {
        // For SVG, just copy and potentially minify
        const outputFile = path.join(outputPath, `${basename}.svg`);
        fs.copyFileSync(filePath, outputFile);
        console.log(`✅ Copied SVG: ${filePath}`);
      } else {
        // Convert to WebP
        const webpOutput = path.join(outputPath, `${basename}.webp`);
        await sharp(filePath)
          .webp({ quality: this.webpQuality })
          .toFile(webpOutput);

        // Also keep optimized original format
        const optimizedOutput = path.join(outputPath, `${basename}${ext}`);
        await sharp(filePath)
          .jpeg({ quality: this.quality })
          .toFile(optimizedOutput);

        console.log(`✅ Optimized: ${filePath} → WebP + Optimized`);
      }
    } catch (error) {
      console.error(`❌ Failed to optimize ${filePath}:`, error.message);
    }
  }

  generateResponsiveImages() {
    // Generate responsive image markup for key images
    const responsiveImages = {
      'aetheron-logo.svg': {
        sizes: [32, 64, 128, 256],
        alt: 'Aetheron Platform Logo'
      }
    };

    let htmlOutput = '';

    for (const [image, config] of Object.entries(responsiveImages)) {
      const basename = path.basename(image, path.extname(image));
      htmlOutput += `<!-- Responsive ${config.alt} -->
<picture>
  <source srcset="${config.sizes.map(size => `optimized/${basename}-${size}.webp ${size}w`).join(', ')}" type="image/webp">
  <source srcset="${config.sizes.map(size => `optimized/${basename}-${size}.png ${size}w`).join(', ')}" type="image/png">
  <img src="optimized/${basename}-128.png" alt="${config.alt}" loading="lazy" width="128" height="128">
</picture>\n\n`;
    }

    fs.writeFileSync('responsive-images.html', htmlOutput);
    console.log('📄 Generated responsive-images.html');
  }

  // Utility method to add lazy loading to existing HTML
  addLazyLoadingToHTML(htmlContent) {
    // Add loading="lazy" to img tags that don't already have it
    return htmlContent.replace(
      /<img([^>]*?)src="([^"]*)"([^>]*?)>/g,
      (match, before, src, after) => {
        if (after.includes('loading=')) {
          return match; // Already has loading attribute
        }
        return `<img${before}src="${src}"${after} loading="lazy">`;
      }
    );
  }
}

// Run optimization if called directly
if (require.main === module) {
  const optimizer = new ImageOptimizer();
  optimizer.init().then(() => {
    console.log('🎉 Image optimization complete!');
  }).catch(console.error);
}

module.exports = ImageOptimizer;