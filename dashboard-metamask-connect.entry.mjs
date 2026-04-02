import { createMultichainClient } from '@metamask/connect-multichain';

const POLYGON_SCOPE = 'eip155:137';
const POLYGON_CHAIN_ID = '0x89';
const POLYGON_RPC_URL = 'https://polygon-rpc.com/';

class MultichainProviderAdapter {
  constructor(client) {
    this.client = client;
    this.accounts = [];
    this.chainId = POLYGON_CHAIN_ID;
    this.selectedAddress = null;
    this.listeners = new Map();
    this.isMetaMask = true;
    this.isAetheronMetaMaskMultichain = true;
  }

  async ensureConnected(forceRequest = false) {
    const existingAccounts = await this.request({
      method: 'eth_accounts',
      params: [],
    }).catch(function () {
      return [];
    });

    if (!forceRequest && Array.isArray(existingAccounts) && existingAccounts.length > 0) {
      return existingAccounts;
    }

    await this.client.connect([POLYGON_SCOPE], [], undefined, forceRequest);

    return this.request({
      method: 'eth_accounts',
      params: [],
    });
  }

  async request(payload = {}) {
    const method = payload.method;
    const params = Array.isArray(payload.params)
      ? payload.params
      : payload.params === undefined
        ? []
        : [payload.params];

    if (!method) {
      throw new Error('MetaMask request method is required.');
    }

    switch (method) {
      case 'eth_requestAccounts': {
        return this.ensureConnected(true);
      }
      case 'eth_accounts': {
        const result = await this.client
          .invokeMethod({
            scope: POLYGON_SCOPE,
            request: {
              method: 'eth_accounts',
              params: [],
            },
          })
          .catch(function () {
            return [];
          });

        const nextAccounts = Array.isArray(result) ? result : [];
        this.syncAccounts(nextAccounts);
        return nextAccounts;
      }
      case 'eth_chainId': {
        return this.chainId;
      }
      case 'wallet_switchEthereumChain': {
        const nextChainId = params[0] && params[0].chainId;
        if (!nextChainId || nextChainId === POLYGON_CHAIN_ID) {
          this.syncChainId(POLYGON_CHAIN_ID);
          this.emit('chainChanged', this.chainId);
          return null;
        }

        const error = new Error('Aetheron currently supports Polygon Mainnet only.');
        error.code = 4902;
        throw error;
      }
      case 'wallet_addEthereumChain': {
        const nextChainId = params[0] && params[0].chainId;
        if (nextChainId === POLYGON_CHAIN_ID) {
          this.syncChainId(POLYGON_CHAIN_ID);
          this.emit('chainChanged', this.chainId);
          return null;
        }

        const error = new Error('Only Polygon Mainnet is supported.');
        error.code = 4902;
        throw error;
      }
      default: {
        return this.client.invokeMethod({
          scope: POLYGON_SCOPE,
          request: {
            method,
            params,
          },
        });
      }
    }
  }

  on(eventName, handler) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    this.listeners.get(eventName).add(handler);
    return this;
  }

  removeListener(eventName, handler) {
    const handlers = this.listeners.get(eventName);
    if (handlers) {
      handlers.delete(handler);
    }
    return this;
  }

  off(eventName, handler) {
    return this.removeListener(eventName, handler);
  }

  emit(eventName, payload) {
    const handlers = this.listeners.get(eventName);
    if (!handlers) {
      return;
    }

    handlers.forEach(function (handler) {
      try {
        handler(payload);
      } catch (error) {
        console.error('MetaMask multichain listener failed:', error);
      }
    });
  }

  syncAccounts(nextAccounts) {
    this.accounts = Array.isArray(nextAccounts) ? nextAccounts.slice() : [];
    this.selectedAddress = this.accounts[0] || null;
  }

  syncChainId(nextChainId) {
    if (typeof nextChainId === 'string' && nextChainId) {
      this.chainId = nextChainId;
    }
  }
}

function getDappUrl() {
  if (window.location && window.location.origin && window.location.origin !== 'null') {
    return window.location.origin;
  }

  return 'https://mastatrill.github.io';
}

function getDappIconUrl() {
  try {
    return new URL('apple-touch-icon.png', window.location.href).href;
  } catch (_error) {
    return 'https://mastatrill.github.io/Aetheron_platform/apple-touch-icon.png';
  }
}

function exposeBridge(bridge) {
  window.AetheronMetaMaskMultichain = bridge;
  window.dispatchEvent(new CustomEvent('aetheron:metamask-connect-ready'));
}

async function initializeBridge() {
  try {
    const client = await createMultichainClient({
      dapp: {
        name: 'Aetheron Platform',
        url: getDappUrl(),
        iconUrl: getDappIconUrl(),
      },
      api: {
        supportedNetworks: {
          [POLYGON_SCOPE]: POLYGON_RPC_URL,
        },
      },
      ui: {
        preferExtension: true,
        showInstallModal: false,
        headless: false,
      },
    });

    const provider = new MultichainProviderAdapter(client);

    client.on('metamask_accountsChanged', function (accounts) {
      provider.syncAccounts(accounts);
      provider.emit('accountsChanged', provider.accounts);
    });

    client.on('metamask_chainChanged', function (event) {
      provider.syncChainId((event && event.chainId) || POLYGON_CHAIN_ID);
      provider.emit('chainChanged', provider.chainId);
    });

    client.on('wallet_sessionChanged', async function () {
      const nextAccounts = await provider.request({
        method: 'eth_accounts',
        params: [],
      });

      provider.emit('accountsChanged', nextAccounts);
      provider.emit('chainChanged', provider.chainId);
    });

    client.on('stateChanged', function (state) {
      if (state === 'disconnected') {
        provider.syncAccounts([]);
        provider.emit('accountsChanged', []);
      }

      window.dispatchEvent(
        new CustomEvent('aetheron:metamask-connect-state', {
          detail: { state },
        }),
      );
    });

    exposeBridge({
      isReady: function () {
        return true;
      },
      getProvider: function () {
        return provider;
      },
      connect: async function (options = {}) {
        await provider.ensureConnected(Boolean(options.forceRequest));
        return provider;
      },
      getAccounts: async function () {
        return provider.request({
          method: 'eth_accounts',
          params: [],
        });
      },
      disconnect: async function () {
        try {
          await client.disconnect([POLYGON_SCOPE]);
        } catch (_error) {
          await client.disconnect();
        }

        provider.syncAccounts([]);
        provider.emit('accountsChanged', []);
      },
      client,
    });
  } catch (error) {
    console.error('MetaMask multichain bridge failed to initialize:', error);

    exposeBridge({
      isReady: function () {
        return false;
      },
      getProvider: function () {
        return null;
      },
      connect: async function () {
        throw error;
      },
      getAccounts: async function () {
        return [];
      },
      disconnect: async function () {},
      error,
    });
  }
}

initializeBridge();
