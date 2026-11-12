import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');

test('launch copy does not imply staking or canonical DEX trading is live', () => {
  assert.match(html, /AETH Tools & Previews/);
  assert.match(html, /Public staking, canonical DEX trading, guaranteed rewards and live NFT trading are not available or verified/);
  assert.match(html, /No canonical Base liquidity pool exists/);
  assert.match(html, /Do not send funds/);
  assert.match(html, /Can I unstake early\?[\s\S]{0,600}Public AETH staking is not active/);
  assert.doesNotMatch(html, /After Lock Period: Free unstaking|Before Lock Period: Use "Emergency Withdraw"/);
});

test('featured previews disclose missing live functionality', () => {
  assert.match(html, /No live copy-trading or competitions are verified/);
  assert.match(html, /No returns or live strategies are guaranteed/);
  assert.match(html, /Public deposits, rewards, and withdrawals are not live/);
  assert.match(html, /Live trading availability has not been verified/);
  assert.match(html, /This page does not enable trading execution/);
});
