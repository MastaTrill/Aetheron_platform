import fs from 'node:fs';
import process from 'node:process';

const EXPECTED_CHAIN_ID = 8453;
const EXPECTED_TOKEN = '0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e'.toLowerCase();
const manifestPath = 'smart-contract/deployments/aeth-base.json';
const registryPath = 'docs/AETHERON_CONTRACT_REGISTRY.json';

function fail(message) {
  console.error(`LAUNCH GATE: FAIL — ${message}`);
  process.exitCode = 1;
}

function requiredFile(path) {
  if (!fs.existsSync(path)) {
    fail(`missing ${path}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

const manifest = requiredFile(manifestPath);
const registry = requiredFile(registryPath);

if (manifest) {
  if (Number(manifest.chainId) !== EXPECTED_CHAIN_ID) fail(`deployment manifest chainId must be ${EXPECTED_CHAIN_ID}`);
  if (String(manifest?.token?.address || '').toLowerCase() !== EXPECTED_TOKEN) fail('deployment manifest AETH address mismatch');
  if (manifest?.verification?.verified !== true) fail('AETH source verification is not recorded as successful');
}

if (registry) {
  const serialized = JSON.stringify(registry).toLowerCase();
  if (!serialized.includes(EXPECTED_TOKEN)) fail('ecosystem registry does not contain canonical AETH address');
}

const liveAction = process.env.LIVE_ACTION || 'none';
const permittedActions = new Set(['none', 'transfer-ownership', 'enable-trading', 'add-liquidity', 'start-presale']);
if (!permittedActions.has(liveAction)) fail(`unknown LIVE_ACTION ${liveAction}`);

if (liveAction !== 'none') {
  if (process.env.CONFIRM_LIVE_ACTION !== `CONFIRM_${liveAction.toUpperCase().replaceAll('-', '_')}`) {
    fail(`CONFIRM_LIVE_ACTION does not authorize ${liveAction}`);
  }
  if (process.env.REVIEWED_COMMIT !== process.env.GITHUB_SHA) fail('REVIEWED_COMMIT must equal the immutable workflow commit');
  if (process.env.SECURITY_REVIEW_APPROVED !== 'true') fail('SECURITY_REVIEW_APPROVED must be true');
  if (process.env.TWO_PERSON_REVIEW_APPROVED !== 'true') fail('TWO_PERSON_REVIEW_APPROVED must be true');
}

if (['enable-trading', 'add-liquidity', 'start-presale'].includes(liveAction)) {
  if (process.env.OWNERSHIP_REVIEW_APPROVED !== 'true') fail('ownership review must be approved');
  if (process.env.TREASURY_REVIEW_APPROVED !== 'true') fail('treasury review must be approved');
  if (process.env.INCIDENT_RESPONSE_READY !== 'true') fail('incident response readiness must be approved');
}

if (liveAction === 'add-liquidity') {
  if (!process.env.LIQUIDITY_AMOUNT_TOKEN || !process.env.LIQUIDITY_AMOUNT_ETH) fail('liquidity amounts must be explicit');
  if (process.env.SLIPPAGE_BPS === undefined) fail('SLIPPAGE_BPS must be explicit');
}

if (liveAction === 'start-presale') {
  for (const key of ['PRESALE_ADDRESS', 'SALE_START', 'SALE_END', 'HARD_CAP', 'TREASURY_ADDRESS']) {
    if (!process.env[key]) fail(`${key} must be explicit`);
  }
}

if (!process.exitCode) console.log(`LAUNCH GATE: PASS — ${liveAction}`);
