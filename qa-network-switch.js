/* Isolated Aetheron physical-device QA. Only eth_chainId and wallet_switchEthereumChain. */
(() => {
  'use strict';
  const BASE = '0x2105'; // decimal 8453
  const ETHEREUM = '0x1';
  const expectedOrigin = 'https://mastatrill.github.io';
  const expectedPath = '/aetheron-wallet-preview/';

  const chain = document.getElementById('chain');
  const status = document.getElementById('status');
  const check = document.getElementById('check');
  const ethereum = document.getElementById('ethereum');
  const base = document.getElementById('base');
  const controls = [check, ethereum, base];
  const enabled = location.origin === expectedOrigin && location.pathname === expectedPath + 'qa-network-switch.html';

  const display = message => { status.textContent = message; };
  const nameFor = id => id === BASE ? 'Base Mainnet (8453)' :
    id === ETHEREUM ? 'Ethereum Mainnet (1)' : 'Unsupported network (' + id + ')';
  const readProvider = () => {
    const provider = window.ethereum;
    if (!provider || typeof provider.request !== 'function') throw new Error('MetaMask provider is unavailable');
    return provider;
  };
  const read = async () => {
    const current = String(await readProvider().request({method:'eth_chainId'})).toLowerCase();
    chain.textContent = nameFor(current);
    return current;
  };

  if (!enabled) {
    controls.forEach(button => { button.disabled = true; });
    chain.textContent = 'Unavailable';
    display('QA controls require the authorized isolated GitHub Pages preview origin.');
    return;
  }
  check.addEventListener('click', async () => {
    try { await read(); display('Network read only. No permission was changed.'); }
    catch(error) { display('Network read failed: ' + (error.message || 'Unknown error')); }
  });
  const switchTo = async (target) => {
    controls.forEach(button => { button.disabled = true; });
    try {
      const previous = await read();
      if (previous === target) {
        display('Already on ' + nameFor(target) + '. No switch requested.');
        return;
      }
      display('Requesting ' + nameFor(target) + ' from MetaMask. Do not approve signatures or transactions.');
      await readProvider().request({method:'wallet_switchEthereumChain', params:[{chainId:target}]});
      const current = await read();
      display(current === target ? 'Confirmed ' + nameFor(current) + '. Remember to restore Base.' :
        'Request returned, but chain does not match expected destination. Use Restore Base.');
    } catch(error) {
      try { await read(); } catch {}
      display(error?.code === 4001 ? 'Network switch rejected by user. No transaction was submitted.' :
        'Network request failed: ' + (error.message || 'Unknown error'));
    } finally {
      controls.forEach(button => { button.disabled = false; });
    }
  };
  ethereum.addEventListener('click', () => switchTo(ETHEREUM));
  base.addEventListener('click', () => switchTo(BASE));

  const ethereumProvider = window.ethereum;
  if (ethereumProvider && typeof ethereumProvider.on === 'function') {
    ethereumProvider.on('chainChanged', () => { read().catch(() => {}); });
  }
  // MetaMask Mobile may inject the provider shortly after document ready.
  // Retry read-only detection without requesting accounts or changing chains.
  const initialRead = async () => {
    for (let i = 0; i < 8; i++) {
      try {
        await read();
        display('Ready. No network switch has been requested.');
        return;
      } catch (error) {
        if (i === 7) {
          display('Unable to read network: ' + (error.message || 'Unknown error') + '. Select Check network to retry.');
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  };
  initialRead();
})();
