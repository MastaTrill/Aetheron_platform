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
  ".localappdata",
  "Aetheron",
  "backend",
  "cache",
  "dashboard-test-isolated",
  "dist",
  "mobile-app",
  "node_modules",
  "openJdk-25",
  "react-app",
  "Scripts",
  "smart-contract",
]);

const excludedTopLevelFiles = new Set([
  ".env.example",
  ".gitignore",
  ".gitignore_backup",
  "build-cloudflare-dist.cjs",
  "jest.config.cjs",
  "jest.setup.cjs",
  "package-lock.json",
  "package.json",
  "server.log",
  "vercel.json",
  "wrangler.toml",
]);

const excludedExtensions = new Set([
  ".bat",
  ".ipynb",
  ".ps1",
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
