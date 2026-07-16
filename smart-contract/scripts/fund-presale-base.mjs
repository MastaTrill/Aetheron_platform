console.error("This script is disabled because it funds a hard-coded presale without checking presale.token().");
console.error("Use scripts/deploy-base-presale-safe.mjs, which verifies immutable token linkage before funding.");
process.exit(1);
