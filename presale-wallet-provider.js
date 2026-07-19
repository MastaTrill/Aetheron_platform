(() => {
  const announcedProviders = [];
  const seenProviders = new Set();

  function rememberProvider(detail) {
    const candidate = detail?.provider || detail;
    if (!candidate || typeof candidate.request !== 'function' || seenProviders.has(candidate)) return;
    seenProviders.add(candidate);
    announcedProviders.push({ provider: candidate, info: detail?.info || {} });
  }

  window.addEventListener('eip6963:announceProvider', (event) => rememberProvider(event.detail));

  async function discoverProviders() {
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    await new Promise((resolve) => setTimeout(resolve, 250));

    const injected = window.ethereum;
    if (Array.isArray(injected?.providers)) injected.providers.forEach(rememberProvider);
    rememberProvider(injected);

    return announcedProviders.sort((a, b) => {
      const score = (entry) => {
        const provider = entry.provider;
        const name = String(entry.info?.name || '').toLowerCase();
        if (provider.isMetaMask && !provider.isBraveWallet) return 30;
        if (provider.isCoinbaseWallet || name.includes('coinbase')) return 20;
        if (name.includes('metamask')) return 15;
        return 0;
      };
      return score(b) - score(a);
    });
  }

  async function selectEthereumProvider() {
    const candidates = await discoverProviders();
    const failures = [];
    for (const candidate of candidates) {
      try {
        const chainId = await candidate.provider.request({ method: 'eth_chainId' });
        if (typeof chainId === 'string' && chainId.startsWith('0x')) return candidate.provider;
      } catch (error) {
        failures.push(error?.message || String(error));
      }
    }
    const detail = failures.length ? ` (${failures[0]})` : '';
    throw new Error(`No compatible Ethereum wallet provider was found${detail}. Open MetaMask or Coinbase Wallet, unlock it, and try again.`);
  }

  async function switchSelectedProviderToBase(selectedProvider) {
    const chainId = await selectedProvider.request({ method: 'eth_chainId' });
    if (chainId.toLowerCase() === CURRENT_CHAIN_ID.toLowerCase()) return;
    try {
      await selectedProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CURRENT_CHAIN_ID }]
      });
    } catch (error) {
      if (error?.code !== 4902) throw error;
      await selectedProvider.request({
        method: 'wallet_addEthereumChain',
        params: [NETWORK_CONFIG]
      });
    }
  }

  window.connectWallet = async function connectCompatibleWallet() {
    const connectBtn = getElement('connectBtn');
    try {
      if (!window.ethers) throw new Error('The wallet library failed to load. Refresh the page and try again.');
      if (connectBtn) {
        connectBtn.disabled = true;
        connectBtn.textContent = 'Finding Wallet…';
      }

      const selectedProvider = await selectEthereumProvider();
      await selectedProvider.request({ method: 'eth_requestAccounts' });
      await switchSelectedProviderToBase(selectedProvider);

      provider = new ethers.providers.Web3Provider(selectedProvider, 'any');
      signer = provider.getSigner();
      const address = await signer.getAddress();

      const walletAddress = getElement('walletAddress');
      if (connectBtn) connectBtn.style.display = 'none';
      if (walletAddress) walletAddress.style.display = 'inline-block';
      setText('walletAddress', `Connected: ${address.substring(0, 6)}...${address.substring(38)}`);

      if (!isPresaleConfigured()) throw new Error('Presale contract configuration is incomplete.');
      presaleContract = new ethers.Contract(PRESALE_CONTRACT_ADDRESS, PRESALE_ABI, provider);
      setText('contractAddr', PRESALE_CONTRACT_ADDRESS);
      await loadPresaleData();
    } catch (error) {
      console.error('Wallet connection failed', error);
      setPurchaseControlsEnabled(false, 'Connect Wallet');
      if (connectBtn) {
        connectBtn.style.display = '';
        connectBtn.disabled = false;
        connectBtn.textContent = 'Connect Wallet';
      }
      const message = error?.code === 4001
        ? 'Wallet connection was cancelled.'
        : (error?.reason || error?.message || 'Unable to connect the wallet.');
      alert(message);
    }
  };
})();
