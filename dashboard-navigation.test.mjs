import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const home = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const dashboard = readFileSync(new URL('./dashboard-enhanced.html', import.meta.url), 'utf8');
const oldDashboard = readFileSync(new URL('./dashboard.html', import.meta.url), 'utf8');

assert.doesNotMatch(home, /href=["']dashboard\.html["']/i,
  'Do not link to dashboard.html, which contains only the Sentinel widget fragment');
assert.match(home,
  /href="dashboard-enhanced\.html" class="footer-social" aria-label="Open dashboard"/,
  'The homepage dashboard footer icon must navigate to the full dashboard');
assert.match(dashboard, /<!doctype html>/i, 'Dashboard target must be a complete document');
assert.match(dashboard, /<html\b/i, 'Dashboard target must include a root HTML element');
assert.match(dashboard, /<title[^>]*>[^<]+<\/title>/i, 'Dashboard target must have a title');
assert.doesNotMatch(oldDashboard, /<!doctype html>/i,
  'If the legacy fragment becomes a real dashboard, review this guard explicitly');
console.log('Dashboard navigation targets a complete page, not the Sentinel widget fragment');
