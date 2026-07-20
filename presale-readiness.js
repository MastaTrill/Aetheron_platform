(() => {
  const config = window.AETHERON_PRESALE_CONFIG || {};
  const statusText = document.getElementById('presaleStatusText');
  const statusDot = document.getElementById('presaleStatusDot');
  const mobileHelp = document.getElementById('mobileWalletHelp');
  const RPC_TIMEOUT_MS = Number(config.rpcTimeoutMs) || 8000;
  const RPC_CANDIDATES = [...new Set([
    ...(Array.isArray(config.publicRpcUrls) ? config.publicRpcUrls : []),
    config.publicRpcUrl,
    'https://mainnet.base.org'
  ].filter(Boolean))];
  const EXPECTED_OWNER = String(config.expectedOwner || '').toLowerCase();
  const EXPECTED_TREASURY = String(config.expectedTreasury || '').toLowerCase();

  function showStatus(message, state = 'checking') {
    if (statusText) statusText.textContent = message;
    if (statusDot) statusDot.dataset.state = state;
  }

  function setFailureDetails(message) {
    const capStatus = document.getElementById('capStatus');
    if (!capStatus) return;
    capStatus.textContent = '';
    const error = document.createElement('span');
    error.className = 'error';
    error.textContent = message;
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.id = 'readinessRetry';
    retry.textContent = 'Retry Base verification';
    retry.addEventListener('click', verifyReadOnlyState, { once: true });
    capStatus.append(error, retry);
  }

  function failClosed(message) {
    presaleIsLive = false;
    presaleContract = null;
    setPurchaseControlsEnabled(false, 'Unavailable');
    showStatus(message, 'blocked');
    setFailureDetails(message);
  }

  function withTimeout(promise, label) {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = window.setTimeout(() => reject(new Error(`${label} timed out.`)), RPC_TIMEOUT_MS);
    });
    return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timer));
  }

  async function createVerifiedProvider() {
    const failures = [];
    for (const rpcUrl of RPC_CANDIDATES) {
      try {
        const candidate = new ethers.providers.JsonRpcProvider(rpcUrl, { name: 'base', chainId: 8453 });
        const network = await withTimeout(candidate.getNetwork(), 'Base network check');
        if (network.chainId !== 8453) throw new Error('RPC returned the wrong network.');
        const [presaleCode, tokenCode] = await withTimeout(Promise.all([
          candidate.getCode(PRESALE_CONTRACT_ADDRESS),
          candidate.getCode(AETH_TOKEN_ADDRESS)
        ]), 'Base contract bytecode check');
        if (presaleCode === '0x' || tokenCode === '0x') throw new Error('Configured contract bytecode is missing on Base.');
        return candidate;
      } catch (error) {
        failures.push(`${rpcUrl}: ${error?.message || error}`);
      }
    }
    console.error('All Base RPC readiness checks failed', failures);
    throw new Error('Unable to reach Base safely. Retry verification shortly.');
  }

  async function verifyReadOnlyState() {
    showStatus('Checking Base contract status…', 'checking');
    const previousRetry = document.getElementById('readinessRetry');
    if (previousRetry) previousRetry.disabled = true;
    if (!window.ethers || !isPresaleConfigured()) {
      failClosed('Presale configuration is incomplete.');
      return;
    }

    try {
      const readProvider = await createVerifiedProvider();
      const readContract = new ethers.Contract(
        PRESALE_CONTRACT_ADDRESS,
        [...PRESALE_ABI, 'function owner() view returns (address)', 'function treasury() view returns (address)'],
        readProvider
      );
      const [owner, treasury, linkedToken] = await withTimeout(Promise.all([
        readContract.owner(), readContract.treasury(), readContract.token()
      ]), 'Presale custody check');
      if (linkedToken.toLowerCase() !== AETH_TOKEN_ADDRESS.toLowerCase()) throw new Error('Presale token linkage does not match the published AETH token.');
      if (EXPECTED_OWNER && owner.toLowerCase() !== EXPECTED_OWNER) throw new Error('Presale ownership differs from the approved launch owner.');
      if (EXPECTED_TREASURY && treasury.toLowerCase() !== EXPECTED_TREASURY) throw new Error('Presale treasury differs from the approved launch treasury.');

      provider = readProvider;
      presaleContract = readContract;
      await withTimeout(loadPresaleData(), 'Presale state and inventory check');
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

  window.retryPresaleReadiness = verifyReadOnlyState;
  window.addEventListener('load', () => {
    showMobileWalletHelp();
    verifyReadOnlyState();
  }, { once: true });
})();
