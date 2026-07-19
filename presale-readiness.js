(() => {
  const config = window.AETHERON_PRESALE_CONFIG || {};
  const statusText = document.getElementById('presaleStatusText');
  const statusDot = document.getElementById('presaleStatusDot');
  const mobileHelp = document.getElementById('mobileWalletHelp');
  const PUBLIC_RPC = config.publicRpcUrl || 'https://mainnet.base.org';
  const EXPECTED_OWNER = String(config.expectedOwner || '').toLowerCase();
  const EXPECTED_TREASURY = String(config.expectedTreasury || '').toLowerCase();

  function showStatus(message, state = 'checking') {
    if (statusText) statusText.textContent = message;
    if (statusDot) statusDot.dataset.state = state;
  }

  function failClosed(message) {
    presaleIsLive = false;
    setPurchaseControlsEnabled(false, 'Unavailable');
    showStatus(message, 'blocked');
    setHtml('capStatus', `<span class="error">${message}</span>`);
  }

  async function verifyReadOnlyState() {
    showStatus('Checking Base contract status…', 'checking');
    if (!window.ethers || !isPresaleConfigured()) {
      failClosed('Presale configuration is incomplete.');
      return;
    }

    try {
      const readProvider = new ethers.providers.JsonRpcProvider(PUBLIC_RPC, { name: 'base', chainId: 8453 });
      const network = await readProvider.getNetwork();
      if (network.chainId !== 8453) throw new Error('RPC returned the wrong network.');

      const [presaleCode, tokenCode] = await Promise.all([
        readProvider.getCode(PRESALE_CONTRACT_ADDRESS),
        readProvider.getCode(AETH_TOKEN_ADDRESS)
      ]);
      if (presaleCode === '0x' || tokenCode === '0x') throw new Error('Configured contract bytecode is missing on Base.');

      const readContract = new ethers.Contract(
        PRESALE_CONTRACT_ADDRESS,
        [...PRESALE_ABI, 'function owner() view returns (address)', 'function treasury() view returns (address)'],
        readProvider
      );
      const [owner, treasury, linkedToken] = await Promise.all([
        readContract.owner(), readContract.treasury(), readContract.token()
      ]);
      if (linkedToken.toLowerCase() !== AETH_TOKEN_ADDRESS.toLowerCase()) throw new Error('Presale token linkage does not match the published AETH token.');
      if (EXPECTED_OWNER && owner.toLowerCase() !== EXPECTED_OWNER) throw new Error('Presale ownership differs from the approved launch owner.');
      if (EXPECTED_TREASURY && treasury.toLowerCase() !== EXPECTED_TREASURY) throw new Error('Presale treasury differs from the approved launch treasury.');

      provider = readProvider;
      presaleContract = readContract;
      await loadPresaleData();
      if (!presaleContract) throw new Error('Unable to validate live presale parameters and inventory.');
      if (presaleIsLive) showStatus('ON-CHAIN PRESALE LIVE', 'live');
      else showStatus('Presale is not currently accepting purchases', 'blocked');
    } catch (error) {
      console.error('Presale readiness verification failed', error);
      failClosed(error?.message || 'Unable to verify the presale on Base.');
    }
  }

  function showMobileWalletHelp() {
    if (!mobileHelp || window.ethereum) return;
    mobileHelp.hidden = false;
    const page = encodeURIComponent(window.location.href);
    const metamask = document.getElementById('openMetaMask');
    const coinbase = document.getElementById('openCoinbaseWallet');
    if (metamask) metamask.href = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
    if (coinbase) coinbase.href = `https://go.cb-w.com/dapp?cb_url=${page}`;
  }

  window.addEventListener('load', () => {
    showMobileWalletHelp();
    verifyReadOnlyState();
  }, { once: true });
})();
