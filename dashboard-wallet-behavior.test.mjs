import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('./dashboard-metamask-connect.entry.mjs', import.meta.url), 'utf8');
const adapterSource = source.slice(source.indexOf('class MultichainProviderAdapter'), source.indexOf('function getDappUrl'));
const Adapter = vm.runInNewContext(adapterSource + '\nMultichainProviderAdapter');

function setup(chain = '0x2105') {
  const calls = [];
  const client = {
    connect: async (...args) => { calls.push(['connect', ...args]); },
    invokeMethod: async ({ scope, request }) => {
      calls.push([scope, request.method]);
      if (request.method === 'eth_chainId') return chain;
      if (request.method === 'eth_accounts') return ['0x1111111111111111111111111111111111111111'];
      return null;
    },
  };
  return { provider: new Adapter(client), calls };
}

test('reports actual chain from provider, not a hardcoded Base result', async () => {
  const { provider } = setup('0x89');
  assert.equal(await provider.request({ method: 'eth_chainId' }), '0x89');
});

test('refuses to pretend a wrong-chain wallet switched to Base', async () => {
  const { provider } = setup('0x89');
  await assert.rejects(provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] }), { code: 4901 });
  await assert.rejects(provider.request({ method: 'wallet_addEthereumChain', params: [{ chainId: '0x2105' }] }), { code: 4901 });
});

test('accepts already active Base but refuses unsupported chain', async () => {
  const { provider } = setup();
  assert.equal(await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] }), null);
  await assert.rejects(provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x89' }] }), { code: 4902 });
});

test('requests connection and updates account state', async () => {
  const { provider, calls } = setup();
  const accounts = await provider.request({ method: 'eth_requestAccounts' });
  assert.equal(accounts.length, 1);
  assert.equal(provider.selectedAddress, accounts[0]);
  assert.ok(calls.some(c => c[0] === 'connect'));
  provider.syncAccounts([]);
  assert.equal(provider.selectedAddress, null);
});
