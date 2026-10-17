import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./scanner/payment-history-backend.mjs', import.meta.url), 'utf8');

test('payment history fails closed while user-scoped authentication is unavailable', () => {
  assert.match(source, /requireOperator/);
  assert.match(source, /status\(503\)/);
  assert.match(source, /PAYMENT_HISTORY_NOT_CONFIGURED/);
});

test('no caller-controlled user selector or local JSON history fallback', () => {
  assert.doesNotMatch(source, /req\.query\.user|payment-history\.json|readFileSync|\|\|\s*['\"]demo['\"]/);
});
