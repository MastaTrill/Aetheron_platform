console.error("This script is disabled because it funded a hard-coded presale without verifying that presale.token() matched the newly deployed AETH token.");
console.error("Use scripts/deploy-base-presale-safe.mjs, which deploys and verifies the token linkage atomically.");
process.exit(1);
