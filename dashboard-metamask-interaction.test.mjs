import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('./dashboard-metamask-connect.entry.mjs', import.meta.url), 'utf8')
  .replace(/^import .*;\s*/m, '')
  .replace(/initializeBridge\(\);\s*$/, 'globalThis.__initializeBridge = initializeBridge; globalThis.__Adapter = MultichainProviderAdapter;');

let accounts = [];
let connectCount = 0;
let disconnectCount = 0;
const callbacks = new Map();
const client = {
  async connect(scopes) { assert.deepEqual(scopes, ['eip155:8453']); connectCount++; accounts = ['0x1111111111111111111111111111111111111111']; },
  async disconnect() { disconnectCount++; accounts = []; },
  async invokeMethod({scope, request}) {
    assert.equal(scope, 'eip155:8453');
    if (request.method === 'eth_accounts') return accounts;
    throw new Error('Unexpected RPC request: ' + request.method);
  },
  on(event, cb) { callbacks.set(event, cb); },
};
const events = [];
const window = {
  location: {origin:'https://mastatrill.github.io', href:'https://mastatrill.github.io/aetheron-wallet-preview/'},
  dispatchEvent(event) { events.push(event.type); },
};
const context = vm.createContext({
  window, URL, console, CustomEvent: class {constructor(type, options) {this.type=type;this.detail=options?.detail;}},
  createMultichainClient: async (config) => {
    assert.equal(config.api.supportedNetworks['eip155:8453'], 'https://mainnet.base.org');
    return client;
  },
});
vm.runInContext(source, context, {filename:'dashboard-metamask-connect.entry.mjs'});
await context.__initializeBridge();
const bridge = window.AetheronMetaMaskMultichain;
assert.equal(bridge.isReady(), true);
const provider = bridge.getProvider();
assert.deepEqual(Array.from(await provider.request({method:'eth_accounts'})), []);
assert.equal(await provider.request({method:'eth_chainId'}), '0x2105');
await bridge.connect({forceRequest:true});
assert.equal(connectCount, 1);
assert.equal(provider.selectedAddress, accounts[0]);
await bridge.connect();
assert.equal(connectCount, 1, 'Reconnect with an existing account must not reprompt');
let accountEvents = 0;
provider.on('accountsChanged', () => accountEvents++);
callbacks.get('metamask_accountsChanged')(['0x2222222222222222222222222222222222222222']);
assert.equal(provider.selectedAddress, '0x2222222222222222222222222222222222222222');
assert.equal(accountEvents, 1);
await assert.rejects(provider.request({method:'wallet_switchEthereumChain',params:[{chainId:'0x89'}]}), /Base Mainnet only/);
await bridge.disconnect();
assert.equal(disconnectCount, 1);
assert.equal(provider.selectedAddress, null);
assert.ok(events.includes('aetheron:metamask-connect-ready'));
console.log('Mocked MetaMask connection, reconnection, account events, network rejection and disconnect passed');
