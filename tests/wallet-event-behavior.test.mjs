import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const dashboard = readFileSync(new URL('../index.js', import.meta.url), 'utf8');
const begin = '// Track wallet account and network changes without requesting new permissions.';
const end = '// Add token to wallet function';
const snippet = dashboard.slice(dashboard.indexOf(begin), dashboard.indexOf(end));
if (!snippet.startsWith(begin) || !snippet.includes('async function connectWallet')) {
  throw new Error('Cannot locate the actual dashboard wallet implementation');
}

function harness({ reject = false, chainId = '0x2105' } = {}) {
  const requests = [], listeners = {}, toasts = [], elements = new Map();
  const address = '0x1234567890123456789012345678901234567890';
  const wallet = {
    on: (name, handler) => { listeners[name] = handler; },
    request: async ({ method }) => {
      requests.push(method);
      if (method === 'eth_requestAccounts') {
        if (reject) throw Object.assign(new Error('User rejected'), { code: 4001 });
        return [address];
      }
      if (method === 'wallet_switchEthereumChain') return null;
      if (method === 'eth_chainId') return chainId;
      throw new Error('Unexpected wallet method: ' + method);
    },
  };
  const el = (id) => {
    if (!elements.has(id)) {
      elements.set(id, {
        textContent: '',
        classList: { add() {}, remove() {} },
        remove() {},
      });
    }
    return elements.get(id);
  };
  const noop = async () => {};
  const sandbox = {
    wallet,
    window: {},
    document: { getElementById: el },
    console: { log() {}, warn() {}, error() {} },
    alert() {},
    resolveInjectedProvider: () => wallet,
    showToast: (...args) => toasts.push(args),
    showAlert: () => {},
    showProgress: () => {},
    hideProgress: () => {},
    updateStats: noop,
    loadUserStakes: noop,
    loadTransactionHistory: noop,
    getWalletName: () => 'MetaMask',
    openWalletChooser: () => {},
    recheckWallet: () => {},
    ethers: {
      providers: { Web3Provider: class {
        getSigner() { return { getAddress: async () => address }; }
      } },
      Contract: class {},
    },
  };
  const prefix = `let provider, signer, account, aethContract, stakingContract;
const BASE_CHAIN_ID = '0x2105';
const BASE_RPC_URLS = ['https://mainnet.base.org'];
const AETH_ADDRESS = '0x1111111111111111111111111111111111111111';
const STAKING_ADDRESS = '0x2222222222222222222222222222222222222222';
const AETH_ABI = []; const STAKING_ABI = [];`;
  runInNewContext(prefix + '\n' + snippet + '\nglobalThis.qa = { connectWallet, account: () => account };', sandbox);
  return { ...sandbox.qa, wallet, listeners, requests, toasts, el, address };
}

test('MetaMask rejection keeps wallet disconnected and never signs', async () => {
  const qa = harness({ reject: true });
  const result = await qa.connectWallet();
  assert.equal(result.connected, false);
  assert.equal(result.reason, 'rejected');
  assert.equal(qa.account(), null);
  assert.equal(qa.el('connectBtn').textContent, 'Connect Wallet');
  assert.deepEqual(qa.requests, ['eth_requestAccounts']);
});

test('wrong network does not show connected status', async () => {
  const qa = harness({ chainId: '0x89' });
  const result = await qa.connectWallet();
  assert.equal(result.connected, false);
  assert.equal(qa.account(), null);
  assert.equal(qa.el('connectBtn').textContent, 'Connect Wallet');
  assert.deepEqual(qa.requests, ['eth_requestAccounts','wallet_switchEthereumChain','eth_chainId']);
});

test('Base connection is read-only and exposes confirmed account', async () => {
  const qa = harness();
  const result = await qa.connectWallet();
  assert.equal(result.connected, true);
  assert.equal(result.account, qa.address);
  assert.equal(result.chainId, '0x2105');
  assert.equal(qa.account(), qa.address);
  assert.equal(qa.el('connectBtn').textContent, 'Connected ✓');
  assert.deepEqual(qa.requests, ['eth_requestAccounts','wallet_switchEthereumChain','eth_chainId']);
});

test('account or chain change invalidates connected account', async () => {
  const qa = harness();
  await qa.connectWallet();
  qa.listeners.accountsChanged(['0x9999999999999999999999999999999999999999']);
  assert.equal(qa.account(), null);
  await qa.connectWallet();
  qa.listeners.chainChanged('0x89');
  assert.equal(qa.account(), null);
});
