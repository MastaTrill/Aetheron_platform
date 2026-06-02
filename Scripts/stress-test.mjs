import { performance } from 'node:perf_hooks';
import fs from 'node:fs/promises';

/*
  Aetheron Stress Test Harness

  Usage:
    STRESS_TARGET_URL=http://localhost:3000 \
    STRESS_REQUESTS=100 \
    STRESS_CONCURRENCY=20 \
    STRESS_INCLUDE_API=true \
    STRESS_ADMIN_USER=admin \
    STRESS_ADMIN_PASS=secret \
    npm run stress:test

  Environment variables:
    STRESS_TARGET_URL   - target base URL (default http://localhost:3000)
    STRESS_PATHS        - JSON array or comma-separated list of request paths
    STRESS_INCLUDE_API  - enable API endpoint scenarios (default false)
    STRESS_REQUESTS     - total number of requests (default 200)
    STRESS_CONCURRENCY  - concurrent workers (default 20)
    STRESS_TIMEOUT_MS   - per-request timeout in ms (default 30000)
    STRESS_OUTPUT_FILE  - output JSON filename (default stress-results.json)
    STRESS_ADMIN_USER   - admin username for protected admin paths
    STRESS_ADMIN_PASS   - admin password for protected admin paths
*/

const env = process.env;
const targetUrl = env.STRESS_TARGET_URL || 'http://localhost:3000';
const concurrency = parsePositiveInt(env.STRESS_CONCURRENCY, 20);
const totalRequests = parsePositiveInt(env.STRESS_REQUESTS, 200);
const timeoutMs = parsePositiveInt(env.STRESS_TIMEOUT_MS, 30000);
const adminUser = env.STRESS_ADMIN_USER || 'admin';
const adminPass = env.STRESS_ADMIN_PASS || env.STRESS_PASSWORD;
const authHeader = adminPass
  ? `Basic ${Buffer.from(`${adminUser}:${adminPass}`, 'utf8').toString('base64')}`
  : undefined;

const DEFAULT_PAGE_SCENARIOS = [
  { name: 'Homepage', method: 'GET', path: '/' },
  { name: 'Dashboard', method: 'GET', path: '/dashboard-enhanced.html' },
  { name: 'Analytics dashboard', method: 'GET', path: '/analytics/index.html' },
];

const DEFAULT_API_SCENARIOS = [
  { name: 'Public API status', method: 'GET', path: '/api' },
  { name: 'Token registry', method: 'GET', path: '/api/tokens' },
  {
    name: 'Client log ingest',
    method: 'POST',
    path: '/api/logs',
    body: () => ({ event: 'stress-test', timestamp: new Date().toISOString() }),
  },
];

const ADMIN_SCENARIOS = [
  { name: 'Admin stats', method: 'GET', path: '/stats', auth: true },
  { name: 'Transaction list', method: 'GET', path: '/transactions', auth: true },
  {
    name: 'Send mock transaction',
    method: 'POST',
    path: '/transactions/send',
    auth: true,
    body: () => ({
      from: '0x1234...5678',
      to: '0xabcd...efgh',
      amount: 1,
      symbol: 'AETH',
    }),
  },
];

const includeApi = parseBoolean(env.STRESS_INCLUDE_API, false);
const customPaths = parsePaths(env.STRESS_PATHS);
let scenarios = customPaths
  ? customPaths.map((path) => ({ name: `Custom request ${path}`, method: 'GET', path }))
  : [...DEFAULT_PAGE_SCENARIOS];

if (includeApi) {
  scenarios.push(...DEFAULT_API_SCENARIOS);
  if (authHeader) {
    scenarios.push(...ADMIN_SCENARIOS);
  }
}

if (authHeader && !includeApi) {
  console.warn('STRESS_ADMIN_USER/STRESS_ADMIN_PASS is configured, but STRESS_INCLUDE_API is not enabled. Admin endpoints are skipped.');
}

if (scenarios.length === 0) {
  console.error('No stress-test targets defined. Set STRESS_PATHS or verify default scenarios.');
  process.exit(1);
}

console.log('Aetheron stress test configuration:');
console.log(`  target: ${targetUrl}`);
console.log(`  concurrency: ${concurrency}`);
console.log(`  totalRequests: ${totalRequests}`);
console.log(`  timeoutMs: ${timeoutMs}`);
console.log(`  includeApi: ${includeApi}`);
console.log(`  request targets: ${scenarios.map((sc) => sc.path).join(', ')}`);
console.log(`  admin auth configured: ${authHeader ? 'yes' : 'no'}`);
console.log('');

const results = [];
let nextIndex = 0;

async function doRequest(scenario, requestId) {
  const url = new URL(scenario.path, targetUrl).toString();
  const headers = {
    Accept: 'application/json, text/html, */*',
    ...(authHeader && scenario.auth ? { Authorization: authHeader } : {}),
  };

  const init = {
    method: scenario.method,
    headers,
  };

  if (scenario.method === 'POST') {
    const body = typeof scenario.body === 'function' ? scenario.body() : scenario.body || {};
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  init.signal = controller.signal;

  const startedAt = performance.now();

  try {
    const response = await fetch(url, init);
    const durationMs = performance.now() - startedAt;
    const ok = response.status >= 200 && response.status < 300;
    const contentType = response.headers.get('content-type') || '';

    let bodySize = 0;
    if (ok) {
      const text = await response.text();
      bodySize = text.length;
    }

    return {
      requestId,
      scenario: scenario.name,
      path: scenario.path,
      status: response.status,
      ok,
      durationMs,
      contentType,
      bodySize,
      error: ok ? null : `HTTP ${response.status}`,
    };
  } catch (error) {
    const durationMs = performance.now() - startedAt;
    return {
      requestId,
      scenario: scenario.name,
      path: scenario.path,
      status: null,
      ok: false,
      durationMs,
      contentType: '',
      bodySize: 0,
      error: error.name === 'AbortError' ? `Timeout after ${timeoutMs}ms` : error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function worker() {
  while (true) {
    const current = nextIndex;
    if (current >= totalRequests) {
      return;
    }
    nextIndex += 1;
    const scenario = scenarios[current % scenarios.length];
    const result = await doRequest(scenario, current + 1);
    results.push(result);
    if (!result.ok) {
      console.warn(`Request ${result.requestId} failed: ${result.scenario} ${result.error}`);
    }
  }
}

function summarize(results, elapsedSeconds) {
  const success = results.filter(r => r.ok);
  const failures = results.filter(r => !r.ok);
  const durations = success.map(r => r.durationMs).sort((a, b) => a - b);
  const effectiveSeconds = Math.max(elapsedSeconds, 1);

  return {
    totalRequests: results.length,
    successes: success.length,
    failures: failures.length,
    successRate: ((success.length / results.length) * 100).toFixed(2) + '%',
    throughputRps: (results.length / effectiveSeconds).toFixed(2),
    minMs: durations[0] ?? 0,
    avgMs: (durations.reduce((sum, value) => sum + value, 0) / (durations.length || 1)).toFixed(2),
    medianMs: quantile(durations, 0.5).toFixed(2),
    p90Ms: quantile(durations, 0.9).toFixed(2),
    p95Ms: quantile(durations, 0.95).toFixed(2),
    p99Ms: quantile(durations, 0.99).toFixed(2),
    statusCodes: countBy(results, r => (r.status !== null ? r.status : 'ERROR')),
    errorSummary: countBy(failures, r => r.error || 'UNKNOWN'),
    slowest: [...results].sort((a, b) => b.durationMs - a.durationMs).slice(0, 5),
  };
}

function quantile(sortedValues, q) {
  if (sortedValues.length === 0) {
    return 0;
  }
  const pos = (sortedValues.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (base + 1 < sortedValues.length) {
    return sortedValues[base] + rest * (sortedValues[base + 1] - sortedValues[base]);
  }
  return sortedValues[base];
}

function countBy(items, fn) {
  return items.reduce((acc, item) => {
    const key = fn(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function parsePositiveInt(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : fallback;
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === null) {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }
  return fallback;
}

function parsePaths(value) {
  if (!value) {
    return null;
  }
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map(item => String(item).trim()).filter(Boolean);
    }
    return [String(parsed).trim()].filter(Boolean);
  } catch {
    return String(value)
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }
}

async function run() {
  const start = performance.now();
  const workers = Array.from({ length: Math.min(concurrency, totalRequests) }, () => worker());
  await Promise.all(workers);
  const elapsedSeconds = (performance.now() - start) / 1000;

  const summary = summarize(results, elapsedSeconds);

  console.log('\nStress test complete');
  console.log(`  elapsed: ${elapsedSeconds.toFixed(2)}s`);
  console.log(`  requests: ${summary.totalRequests}`);
  console.log(`  successes: ${summary.successes}`);
  console.log(`  failures: ${summary.failures}`);
  console.log(`  success rate: ${summary.successRate}`);
  console.log(`  throughput: ${summary.throughputRps} req/s`);
  console.log(`  min: ${summary.minMs} ms`);
  console.log(`  avg: ${summary.avgMs} ms`);
  console.log(`  median: ${summary.medianMs} ms`);
  console.log(`  p90: ${summary.p90Ms} ms`);
  console.log(`  p95: ${summary.p95Ms} ms`);
  console.log(`  p99: ${summary.p99Ms} ms`);
  console.log('  status codes:', summary.statusCodes);

  if (summary.failures > 0) {
    console.log('  error summary:', summary.errorSummary);
    console.log('  slowest requests:');
    summary.slowest.forEach(entry => {
      console.log(
        `    #${entry.requestId} ${entry.scenario} ${entry.path} ${entry.status || 'ERR'} ${entry.durationMs.toFixed(2)}ms ${entry.error || ''}`
      );
    });
  }

  const outputFile = env.STRESS_OUTPUT_FILE || 'stress-results.json';
  await fs.writeFile(
    outputFile,
    JSON.stringify(
      {
        config: {
          targetUrl,
          concurrency,
          totalRequests,
          timeoutMs,
          scenarios: scenarios.map(sc => sc.path),
        },
        summary,
        results,
      },
      null,
      2
    ),
    'utf8'
  );
  console.log(`\nResults written to ${outputFile}`);
}

run().catch(error => {
  console.error('Stress test failed:', error);
  process.exit(1);
});
