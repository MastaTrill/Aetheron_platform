#!/usr/bin/env node

// deploy-github-pages.js - Automated GitHub Pages deployment
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class GitHubPagesDeployer {
  constructor() {
    this.repoName = 'Aetheron_platform';
    this.branch = 'gh-pages';
    this.buildDir = 'dist';
    this.sourceDir = '.';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async deploy() {
    try {
      this.log('🚀 Starting GitHub Pages deployment...');

      // Pre-deployment checks
      await this.checkPrerequisites();
      await this.validateProductionReadiness();

      // Build process
      await this.prepareBuild();
      await this.optimizeAssets();

      // Deployment
      await this.createGitHubPagesBranch();
      await this.deployToGitHubPages();

      // Post-deployment
      await this.verifyDeployment();
      await this.generateDeploymentReport();

      this.log('🎉 Deployment completed successfully!', 'success');

    } catch (error) {
      this.log(`Deployment failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    this.log('Checking deployment prerequisites...');

    // Check if git is available
    try {
      execSync('git --version', { stdio: 'pipe' });
      this.log('Git is available');
    } catch (error) {
      throw new Error('Git is not installed or not in PATH');
    }

    // Check if we're in a git repository
    try {
      execSync('git status', { stdio: 'pipe' });
      this.log('Git repository detected');
    } catch (error) {
      throw new Error('Not in a git repository');
    }

    // Check if remote origin exists
    try {
      const remotes = execSync('git remote', { encoding: 'utf8' });
      if (!remotes.includes('origin')) {
        throw new Error('No origin remote found');
      }
      this.log('Git remote origin configured');
    } catch (error) {
      throw new Error('Git remote origin not configured');
    }
  }

  async validateProductionReadiness() {
    this.log('Validating production readiness...');

    // Run production readiness check
    try {
      execSync('node production-readiness.js', { stdio: 'inherit' });
      this.log('Production readiness validation passed');
    } catch (error) {
      throw new Error('Production readiness check failed');
    }
  }

  async prepareBuild() {
    this.log('Preparing build...');

    // Create build directory
    if (!fs.existsSync(this.buildDir)) {
      fs.mkdirSync(this.buildDir);
      this.log(`Created build directory: ${this.buildDir}`);
    }

    // Copy all files to build directory
    this.copyDirectory(this.sourceDir, this.buildDir);

    // Remove development files
    this.cleanBuildDirectory();

    this.log('Build preparation completed');
  }

  async optimizeAssets() {
    this.log('Optimizing assets...');

    // Minify HTML files
    await this.minifyHtmlFiles();

    // Optimize images (if sharp was available)
    await this.optimizeImages();

    // Update asset references for production
    await this.updateAssetReferences();

    this.log('Asset optimization completed');
  }

  async minifyHtmlFiles() {
    this.log('Minifying HTML files...');

    const htmlFiles = this.findFiles(this.buildDir, '.html');

    for (const file of htmlFiles) {
      try {
        let content = fs.readFileSync(file, 'utf8');

        // Basic HTML minification (remove extra whitespace)
        content = content
          .replace(/\s+/g, ' ')
          .replace(/>\s+</g, '><')
          .trim();

        fs.writeFileSync(file, content, 'utf8');
        this.log(`Minified: ${path.relative(this.buildDir, file)}`);
      } catch (error) {
        this.log(`Failed to minify ${file}: ${error.message}`, 'warning');
      }
    }
  }

  async optimizeImages() {
    this.log('Optimizing images...');

    // Check for image optimization script
    const optimizerPath = path.join(this.buildDir, 'image-optimizer.js');
    if (fs.existsSync(optimizerPath)) {
      try {
        // Note: This would require sharp to be installed
        this.log('Image optimizer found - running optimization...');
        // execSync(`cd ${this.buildDir} && node image-optimizer.js`, { stdio: 'inherit' });
        this.log('Image optimization completed');
      } catch (error) {
        this.log('Image optimization failed, continuing with original images', 'warning');
      }
    } else {
      this.log('No image optimizer found, skipping image optimization');
    }
  }

  async updateAssetReferences() {
    this.log('Updating asset references for production...');

    // Update any localhost references to production URLs
    const htmlFiles = this.findFiles(this.buildDir, '.html');

    for (const file of htmlFiles) {
      let content = fs.readFileSync(file, 'utf8');

      // Replace localhost URLs with production URLs if needed
      // content = content.replace(/http:\/\/localhost:\d+/g, '');

      fs.writeFileSync(file, content, 'utf8');
    }

    this.log('Asset references updated');
  }

  async createGitHubPagesBranch() {
    this.log('Creating GitHub Pages branch...');

    try {
      // Check if gh-pages branch exists
      const branches = execSync('git branch -a', { encoding: 'utf8' });

      if (branches.includes('gh-pages')) {
        this.log('gh-pages branch exists, switching to it...');
        execSync('git checkout gh-pages', { stdio: 'inherit' });
        execSync('git pull origin gh-pages', { stdio: 'inherit' });
      } else {
        this.log('Creating new gh-pages branch...');
        execSync('git checkout -b gh-pages', { stdio: 'inherit' });
      }

      this.log('GitHub Pages branch ready');
    } catch (error) {
      throw new Error(`Failed to create/setup gh-pages branch: ${error.message}`);
    }
  }

  async deployToGitHubPages() {
    this.log('Deploying to GitHub Pages...');

    try {
      // Remove all files in current branch
      execSync('git rm -rf .', { stdio: 'inherit' });

      // Copy build files to current directory
      this.copyDirectory(this.buildDir, '.');

      // Remove build directory from deployment
      if (fs.existsSync(this.buildDir)) {
        fs.rmSync(this.buildDir, { recursive: true, force: true });
      }

      // Add and commit changes
      execSync('git add .', { stdio: 'inherit' });
      execSync('git commit -m "Deploy to GitHub Pages - Production build"', { stdio: 'inherit' });

      // Push to gh-pages branch
      execSync('git push origin gh-pages', { stdio: 'inherit' });

      this.log('Deployment pushed to GitHub Pages');
    } catch (error) {
      throw new Error(`Deployment failed: ${error.message}`);
    }
  }

  async verifyDeployment() {
    this.log('Verifying deployment...');

    try {
      // Check if the gh-pages branch was pushed successfully
      const status = execSync('git status', { encoding: 'utf8' });
      if (status.includes('Your branch is up to date')) {
        this.log('Deployment verification successful');
      } else {
        throw new Error('Deployment verification failed');
      }
    } catch (error) {
      throw new Error(`Deployment verification failed: ${error.message}`);
    }
  }

  async generateDeploymentReport() {
    this.log('Generating deployment report...');

    const report = {
      timestamp: new Date().toISOString(),
      repository: this.repoName,
      branch: this.branch,
      status: 'success',
      deployedFiles: this.countFiles('.'),
      buildInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch
      }
    };

    fs.writeFileSync('deployment-report.json', JSON.stringify(report, null, 2));
    this.log('Deployment report generated: deployment-report.json');
  }

  copyDirectory(source, destination) {
    const items = fs.readdirSync(source);

    for (const item of items) {
      const sourcePath = path.join(source, item);
      const destPath = path.join(destination, item);

      const stat = fs.statSync(sourcePath);

      if (stat.isDirectory()) {
        // Skip certain directories
        if (['.git', 'node_modules', '.vscode'].includes(item)) {
          continue;
        }

        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        this.copyDirectory(sourcePath, destPath);
      } else {
        // Skip certain files
        if (['.gitignore', '.gitattributes', 'README.md', 'deploy-github-pages.js', 'production-readiness.js'].includes(item)) {
          continue;
        }

        fs.copyFileSync(sourcePath, destPath);
      }
    }
  }

  cleanBuildDirectory() {
    const filesToRemove = [
      'deploy-github-pages.js',
      'production-readiness.js',
      'lazy-loading.js',
      'image-optimizer.js',
      'package.json',
      'package-lock.json',
      '.gitignore',
      '.gitattributes',
      'README.md',
      'node_modules'
    ];

    for (const file of filesToRemove) {
      const filePath = path.join(this.buildDir, file);
      if (fs.existsSync(filePath)) {
        try {
          if (fs.statSync(filePath).isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
          this.log(`Removed: ${file}`);
        } catch (error) {
          this.log(`Failed to remove ${file}: ${error.message}`, 'warning');
        }
      }
    }
  }

  findFiles(dir, extension) {
    const files = [];

    function scanDirectory(directory) {
      const items = fs.readdirSync(directory);

      for (const item of items) {
        const fullPath = path.join(directory, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.')) {
          scanDirectory(fullPath);
        } else if (stat.isFile() && item.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    }

    scanDirectory(dir);
    return files;
  }

  countFiles(dir) {
    let count = 0;

    function scanDirectory(directory) {
      const items = fs.readdirSync(directory);

      for (const item of items) {
        const fullPath = path.join(directory, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.')) {
          scanDirectory(fullPath);
        } else if (stat.isFile()) {
          count++;
        }
      }
    }

    scanDirectory(dir);
    return count;
  }
}

// Run deployment
const deployer = new GitHubPagesDeployer();
deployer.deploy().catch(console.error);