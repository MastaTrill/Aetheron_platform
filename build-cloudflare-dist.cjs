const fs = require("fs");
const path = require("path");

const rootDir = __dirname;
const distDir = path.join(rootDir, "dist");

const excludedTopLevelNames = new Set([
  ".git",
  ".github",
  ".circleci",
  ".vscode",
  ".appdata",
  ".browser-profile",
  ".browser-profile-debug",
  ".browser-profile-debug2",
  ".browser-profile-lite",
  ".browser-profile-lite2",
  ".browser-profile-live",
  ".browser-profile-local",
  ".browser-profile-local2",
  ".browser-profile-local3",
  ".chrome-profile-debug",
  ".chrome-profile-debug2",
  ".kilo",
  ".localappdata",
  ".presale-launch",
  "Aetheron",
  "backend",
  "cache",
  "dashboard-test-isolated",
  "dist",
  "docs",
  "mobile-app",
  "node_modules",
  "openJdk-25",
  "react-app",
  "Scripts",
  "scripts",
  "smart-contract",
]);

const excludedTopLevelFiles = new Set([
  ".env.example",
  ".gitignore",
  ".gitignore_backup",
  "add-liquidity.html",
  "add-liquidity.js",
  "admin-dashboard.html",
  "aetheron-advanced.html",
  "aetheron-advanced-init.js",
  "aetheron-dashboard-live.html",
  "aetheron-integration.js",
  "aetheron-wallet.html",
  "aetheron-wallet.js",
  "aetheron-wallet-dom-overrides.js",
  "build-cloudflare-dist.cjs",
  "community-launch-toolkit.js",
  "contract-verification.js",
  "dashboard-features.js",
  "dashboard-main.js",
  "dashboard-metamask-connect.js",
  "defi-integration.js",
  "deploy-production.js",
  "deployment-report.json",
  "dex-listing-docs.json",
  "dex-listing-package.json",
  "dex-listing-toolkit.js",
  "dex-submission-payload.json",
  "dex-submission-templates.json",
  "discord-bot-config.json",
  "enable-trading.js",
  "execution-engine.js",
  "final-verification.js",
  "homepage-conversion.html",
  "homepage-legit.html",
  "how-to-buy.html",
  "onboarding-flow.js",
  "onboarding.html",
  "investor-dashboard.js",
  "jest.config.cjs",
  "jest.setup.cjs",
  "logo-converter.html",
  "logo-generator.html",
  "mainnet-deployment.json",
  "marketing-campaign-toolkit.js",
  "marketing-launch.html",
  "package-lock.json",
  "package.json",
  "performance-monitor.js",
  "production-dashboard.js",
  "production-readiness.js",
  "production-stats.js",
  "robust-transaction-monitor.js",
  "server.log",
  "simple-transaction-monitor.js",
  "smart-routing-engine.js",
  "smart-routing-ui.html",
  "staking-live.html",
  "staking-live-abi.js",
  "staking-live.js",
  "tracked-addresses.json",
  "trading-competition.js",
  "trading-terminal-pro.js",
  "transaction-monitor.js",
  "transfer-ownership.js",
  "vercel.json",
  "verify-ownership.js",
  "voting-history.html",
  "wrangler.toml",
]);

const excludedExtensions = new Set([
  ".bat",
  ".cjs",
  ".ipynb",
  ".md",
  ".mjs",
  ".ps1",
  ".sol",
  ".txt",
]);

const allowedTopLevelFiles = new Set([
  "robots.txt",
]);

let copiedFiles = 0;

function resetDist() {
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });
}

function shouldExclude(relativePath, isDirectory) {
  const normalized = relativePath.split(path.sep).join("/");
  if (!normalized) return false;

  const [topLevelName] = normalized.split("/");
  if (excludedTopLevelNames.has(topLevelName)) {
    return true;
  }

  if (!isDirectory) {
    if (!normalized.includes("/") && allowedTopLevelFiles.has(topLevelName)) {
      return false;
    }

    const extension = path.extname(normalized);
    if (excludedExtensions.has(extension)) {
      return true;
    }

    if (!normalized.includes("/") && excludedTopLevelFiles.has(topLevelName)) {
      return true;
    }
  }

  return false;
}

function copyRecursive(sourceDir, targetDir, baseRelative = "") {
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const relativePath = baseRelative
      ? path.join(baseRelative, entry.name)
      : entry.name;

    if (shouldExclude(relativePath, entry.isDirectory())) {
      continue;
    }

    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(targetPath, { recursive: true });
      copyRecursive(sourcePath, targetPath, relativePath);
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
    copiedFiles += 1;
  }
}

resetDist();
copyRecursive(rootDir, distDir);

console.log(`Built Cloudflare dist at ${distDir} with ${copiedFiles} files.`);
