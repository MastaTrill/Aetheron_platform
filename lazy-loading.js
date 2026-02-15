#!/usr/bin/env node

// lazy-loading.js - Add lazy loading to images in HTML files
import fs from 'fs';
import path from 'path';

class LazyLoadingAdder {
  constructor() {
    this.sourceDir = '.';
  }

  init() {
    console.log('🖼️  Adding lazy loading to images...');
    this.processHtmlFiles();
  }

  processHtmlFiles() {
    const htmlFiles = this.findHtmlFiles();

    for (const file of htmlFiles) {
      this.addLazyLoadingToFile(file);
    }
  }

  findHtmlFiles() {
    const files = [];

    function scanDirectory(dir) {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(fullPath);
        } else if (stat.isFile() && item.endsWith('.html')) {
          files.push(fullPath);
        }
      }
    }

    scanDirectory(this.sourceDir);
    return files;
  }

  addLazyLoadingToFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      // Add loading="lazy" to img tags that don't already have it
      // Skip images that are likely above the fold (logos, hero images)
      content = content.replace(
        /<img([^>]*?)src="([^"]*)"([^>]*?)>/g,
        (match, before, src, after) => {
          // Skip if already has loading attribute
          if (after.includes('loading=')) {
            return match;
          }

          // Skip hero images, logos, and above-the-fold content
          // But allow protocol icons from cryptologos.cc
          if ((src.includes('logo') && !src.includes('cryptologos.cc')) ||
              src.includes('hero') || before.includes('hero-') ||
              src.includes('header') || before.includes('header-')) {
            return match;
          }

          modified = true;
          return `<img${before}src="${src}"${after} loading="lazy">`;
        }
      );

      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Added lazy loading to: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to process ${filePath}:`, error.message);
    }
  }
}

// Run if called directly
const adder = new LazyLoadingAdder();
adder.init();
console.log('🎉 Lazy loading addition complete!');

export default LazyLoadingAdder;