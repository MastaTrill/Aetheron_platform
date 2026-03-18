const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { parseHTML } = require('linkedom');

function createStorage() {
  const store = new Map();

  return {
    getItem: jest.fn((key) => (store.has(key) ? store.get(key) : null)),
    setItem: jest.fn((key, value) => {
      store.set(key, String(value));
    }),
    removeItem: jest.fn((key) => {
      store.delete(key);
    }),
    clear: jest.fn(() => {
      store.clear();
    }),
  };
}

function createDashboardContext(html, options = {}) {
  const dom = parseHTML(html);
  const { window, document } = dom;
  const localStorage = createStorage();

  Object.defineProperty(document, 'readyState', {
    configurable: true,
    value: options.readyState || 'complete',
  });

  window.localStorage = localStorage;
  window.alert = jest.fn();
  window.open = jest.fn();
  window.showToast = jest.fn();
  window.navigator.clipboard = {
    writeText: jest.fn().mockResolvedValue(undefined),
  };
  window.console = console;
  window.dashboard = {
    walletAccount: null,
  };

  const ethers = {
    providers: {
      Web3Provider: jest.fn((providerLike) => ({
        providerLike,
        getSigner: () => ({
          getAddress: async () =>
            options.connectedAccount || providerLike.accounts?.[0] || '0x0000000000000000000000000000000000000001',
        }),
        getBalance: async () => '1000000000000000000',
      })),
    },
    utils: {
      formatEther: (value) => String(Number(value) / 1e18),
      parseEther: (value) => value,
    },
    Contract: jest.fn(() => ({
      balanceOf: async () => '2500000000000000000',
      transfer: jest.fn(),
      stake: jest.fn(),
    })),
  };

  const context = vm.createContext({
    window,
    document,
    localStorage,
    navigator: window.navigator,
    location: window.location,
    console,
    alert: window.alert,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    Node: window.Node,
    HTMLElement: window.HTMLElement,
    ethers,
  });

  context.global = context;
  context.globalThis = context;
  context.self = window;
  context.navigator.clipboard = window.navigator.clipboard;
  window.ethers = ethers;

  return { window, document, localStorage, context };
}

function runScript(context, filename) {
  const scriptPath = path.join(__dirname, filename);
  const scriptSource = fs.readFileSync(scriptPath, 'utf8');
  vm.runInContext(scriptSource, context, { filename });
}

describe('Dashboard wallet wiring', () => {
  test('renders chooser options for injected wallets and WalletConnect', () => {
    const { window, document, context } = createDashboardContext(`
      <!DOCTYPE html>
      <html>
        <body>
          <button id="connectBtn">Connect</button>
          <div id="walletInfo"></div>
          <span id="walletType">-</span>
          <span id="accountAddress">-</span>
          <span id="ethBalance">-</span>
          <span id="aethBalance">-</span>
        </body>
      </html>
    `);

    window.ethereum = {
      providers: [
        { isMetaMask: true },
        { isCoinbaseWallet: true },
      ],
    };

    runScript(context, 'dashboard-main.js');

    window.openWalletChooser();

    const options = document.getElementById('walletChooserOptions');
    expect(options).toBeTruthy();
    expect(options.textContent).toContain('MetaMask');
    expect(options.textContent).toContain('Coinbase Wallet');
    expect(options.textContent).toContain('WalletConnect');
  });

  test('WalletConnect uses the main dashboard connection path', async () => {
    const account = '0x1234567890abcdef1234567890abcdef12345678';
    const { window, document, localStorage, context } = createDashboardContext(
      `
        <!DOCTYPE html>
        <html>
          <body>
            <button id="connectBtn">Connect</button>
            <button id="walletConnectBtn">WalletConnect</button>
            <div id="walletInfo"></div>
            <span id="walletStatusText"></span>
            <span id="walletStatusIcon"></span>
            <span id="walletType">-</span>
            <span id="accountAddress">-</span>
            <span id="ethBalance">-</span>
            <span id="aethBalance">-</span>
          </body>
        </html>
      `,
      {
        connectedAccount: account,
      },
    );

    const wcProvider = {
      accounts: [account],
      enable: jest.fn().mockResolvedValue([account]),
      on: jest.fn(),
      request: jest.fn().mockRejectedValue({ code: -32601 }),
    };

    window.WalletConnectProvider = {
      default: jest.fn(() => wcProvider),
    };

    runScript(context, 'dashboard-main.js');
    runScript(context, 'dashboard-wallet.js');

    await window.connectWalletConnect();

    expect(window.WalletConnectProvider.default).toHaveBeenCalled();
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'aetheron_connected_wallet',
      'walletconnect',
    );
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'aetheron_connected',
      account,
    );
    expect(document.getElementById('walletType').textContent).toBe('WalletConnect');
    expect(document.getElementById('walletStatusText').textContent).toBe(
      'Wallet connected',
    );
    expect(window.dashboard.walletAccount).toBe(account);
  });

  test('body actions wire profile and referral buttons', async () => {
    const account = '0xabc1230000000000000000000000000000000000';
    const { window, document, context } = createDashboardContext(
      `
        <!DOCTYPE html>
        <html>
          <body>
            <a class="skip-to-content" href="#mainContent">Skip</a>
            <main id="mainContent"></main>
            <button id="editProfileBtn1">Edit Profile</button>
            <button id="copyReferralBtn">Copy referral</button>
            <input id="referralLink" value="" />
            <div id="profileModal" class="modal-bg" hidden>
              <div class="modal">
                <button class="close-modal-btn" type="button">x</button>
                <input id="nicknameInput" />
                <button id="closeProfileModal" type="button">Cancel</button>
              </div>
            </div>
            <span id="accountAddress">${account}</span>
          </body>
        </html>
      `,
      {
        connectedAccount: account,
      },
    );

    runScript(context, 'dashboard-body-init.js');

    document
      .getElementById('editProfileBtn1')
      .dispatchEvent(new window.Event('click', { bubbles: true }));

    expect(document.getElementById('profileModal').hidden).toBe(false);

    document
      .getElementById('copyReferralBtn')
      .dispatchEvent(new window.Event('click', { bubbles: true }));

    await Promise.resolve();

    expect(document.getElementById('referralLink').value).toContain(account);
    expect(window.showToast).toHaveBeenCalled();
  });
});
