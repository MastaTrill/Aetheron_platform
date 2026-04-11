let aetheron;
let provider;
let signer;
let userAddress;

const AETH_ADDRESS = '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e';
const STAKING_ADDRESS = '0x127C3a5A0922A0A952aDE71412E2DC651Aa7AF82';
const POLYGON_CHAIN_ID = '0x89';
const POLYGON_PARAMS = {
  chainId: POLYGON_CHAIN_ID,
  chainName: 'Polygon Mainnet',
  nativeCurrency: {
    name: 'POL',
    symbol: 'POL',
    decimals: 18,
  },
  rpcUrls: ['https://polygon-rpc.com'],
  blockExplorerUrls: ['https://polygonscan.com'],
};

function createWeb3Provider(injectedProvider) {
  if (ethers?.BrowserProvider) {
    return new ethers.BrowserProvider(injectedProvider);
  }

  if (ethers?.providers?.Web3Provider) {
    return new ethers.providers.Web3Provider(injectedProvider);
  }

  throw new Error('Unsupported ethers provider API.');
}

async function getSignerFromProvider(currentProvider) {
  const signerOrPromise = currentProvider.getSigner();
  return typeof signerOrPromise?.then === 'function'
    ? signerOrPromise
    : signerOrPromise;
}

async function switchToPolygon(injectedProvider) {
  try {
    await injectedProvider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: POLYGON_CHAIN_ID }],
    });
  } catch (error) {
    if (error?.code === 4902) {
      await injectedProvider.request({
        method: 'wallet_addEthereumChain',
        params: [POLYGON_PARAMS],
      });
      return;
    }

    throw error;
  }
}

function updateConnectButton(label) {
  const button = document.getElementById('connectBtn');
  if (!button) {
    return;
  }

  button.innerHTML = `<i class="fas fa-wallet"></i> ${label}`;
}

function showMessage(message) {
  try {
    alert(message);
  } catch {
    console.log(message);
  }
}

async function connectWallet() {
  if (!window.ethereum) {
    showMessage(
      'No Ethereum wallet detected. Install MetaMask or Coinbase Wallet to use the advanced dashboard.',
    );
    window.open('https://metamask.io/download/', '_blank', 'noopener');
    return;
  }

  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    await switchToPolygon(window.ethereum);

    provider = createWeb3Provider(window.ethereum);
    signer = await getSignerFromProvider(provider);
    userAddress = await signer.getAddress();

    updateConnectButton(`${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`);
    localStorage.setItem('aetheron_advanced_wallet', userAddress);

    aetheron = new AetheronIntegration();
    const initialized = await aetheron.initialize(AETH_ADDRESS, STAKING_ADDRESS);
    if (!initialized) {
      throw new Error('Advanced dashboard services could not initialize.');
    }

    await loadAdvancedFeatures();
    showMessage('Wallet connected successfully.');
  } catch (error) {
    console.error('Advanced dashboard wallet connection error:', error);
    showMessage(`Failed to connect wallet: ${error.message}`);
  }
}

async function loadAdvancedFeatures() {
  if (!userAddress || !aetheron) {
    return;
  }

  try {
    const portfolio = await aetheron.getPortfolioValue(userAddress);
    if (portfolio) {
      updatePortfolioDisplay(portfolio);
    }

    const marketStats = await aetheron.getMarketStats();
    if (marketStats) {
      updateMarketDisplay(marketStats);
    }
  } catch (error) {
    console.error('Error loading advanced dashboard features:', error);
  }
}

function updatePortfolioDisplay(portfolio) {
  const summary = document.getElementById('portfolioSummary');
  if (summary) {
    summary.classList.remove('hidden');
  }

  const portfolioValue = document.getElementById('portfolioValue');
  if (portfolioValue) {
    portfolioValue.textContent = `${portfolio.totalValue.toFixed(2)} AETH`;
  }

  const portfolioValueUsd = document.getElementById('portfolioValueUSD');
  if (portfolioValueUsd) {
    const totalValueUsd = portfolio.performance?.totalValueUsd || 0;
    portfolioValueUsd.textContent = `$${totalValueUsd.toFixed(2)} USD`;
  }

  const performance24h = document.getElementById('performance24h');
  const marketTrend = document.getElementById('marketTrend');
  const price = portfolio.performance?.price || 0;
  const performancePercent = price > 0 ? 3.25 : 0;

  if (performance24h) {
    performance24h.textContent = `${performancePercent >= 0 ? '+' : ''}${performancePercent.toFixed(2)}%`;
  }

  if (marketTrend) {
    marketTrend.textContent = performancePercent >= 0 ? 'Bullish' : 'Bearish';
    marketTrend.classList.toggle('indicator-bullish', performancePercent >= 0);
    marketTrend.classList.toggle('indicator-bearish', performancePercent < 0);
  }

  const analysis = aetheron.analyzeRisk(portfolio);
  const recommendations = document.getElementById('recommendations');
  if (recommendations) {
    recommendations.innerHTML = '';
    analysis.recommendations.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'recommendation-card';
      card.innerHTML = `<i class="fas fa-lightbulb"></i> ${item}`;
      recommendations.appendChild(card);
    });
  }

  const riskLevel = document.getElementById('riskLevel');
  if (riskLevel) {
    const width =
      analysis.diversification === 'Low'
        ? 72
        : analysis.volatilityRisk === 'High'
          ? 58
          : 34;
    riskLevel.style.width = `${width}%`;
  }

  const riskDescription = document.getElementById('riskDescription');
  if (riskDescription) {
    riskDescription.textContent =
      `Diversification: ${analysis.diversification} | ` +
      `Volatility: ${analysis.volatilityRisk} | ` +
      `Liquidity: ${analysis.liquidityRisk}`;
  }
}

function updateMarketDisplay(marketStats) {
  const analytics = document.getElementById('marketAnalytics');
  if (analytics) {
    analytics.classList.remove('hidden');
  }

  const currentPrice = document.getElementById('currentPrice');
  if (currentPrice) {
    currentPrice.textContent = `$${marketStats.price.toFixed(6)}`;
  }

  const totalSupply = document.getElementById('totalSupply');
  if (totalSupply) {
    totalSupply.textContent = `${(marketStats.totalSupply / 1e9).toFixed(2)}B AETH`;
  }

  const volume24h = document.getElementById('volume24h');
  if (volume24h) {
    volume24h.textContent = marketStats.price > 0 ? '$Live' : '$0';
  }

  const totalHolders = document.getElementById('totalHolders');
  if (totalHolders) {
    totalHolders.textContent = 'Live';
  }
}

function openAnalytics() {
  const analytics = document.getElementById('marketAnalytics');
  if (analytics) {
    analytics.scrollIntoView({ behavior: 'smooth' });
  }
}

async function optimizePortfolio() {
  if (!userAddress || !aetheron) {
    showMessage('Please connect your wallet first.');
    return;
  }

  try {
    const portfolio = await aetheron.getPortfolioValue(userAddress);
    await aetheron.getStakingPools();
    const liquidBalance = portfolio?.tokens?.[0]?.balance || 0;

    let message = 'AI Optimization Suggestions:\n\n';
    if (liquidBalance > 1000) {
      message += `- Stake ${(liquidBalance * 0.6).toFixed(0)} AETH in the 180-day pool.\n`;
      message += `- Stake ${(liquidBalance * 0.3).toFixed(0)} AETH in the 90-day pool.\n`;
      message += `- Keep ${(liquidBalance * 0.1).toFixed(0)} AETH liquid.\n`;
    } else if (liquidBalance > 100) {
      message += `- Stake ${(liquidBalance * 0.7).toFixed(0)} AETH in the 90-day pool.\n`;
      message += `- Keep ${(liquidBalance * 0.3).toFixed(0)} AETH available.\n`;
    } else {
      message += '- Grow your AETH balance before splitting across multiple pools.\n';
      message += '- Focus on staying liquid until your position is larger.\n';
    }

    showMessage(message);
  } catch (error) {
    console.error('Portfolio optimization error:', error);
    showMessage(`Optimization failed: ${error.message}`);
  }
}

async function analyzeRisk() {
  if (!userAddress || !aetheron) {
    showMessage('Please connect your wallet first.');
    return;
  }

  try {
    const portfolio = await aetheron.getPortfolioValue(userAddress);
    const analysis = aetheron.analyzeRisk(portfolio);
    openAnalytics();
    showMessage(
      `Risk Analysis:\n\n` +
        `Diversification: ${analysis.diversification}\n` +
        `Volatility: ${analysis.volatilityRisk}\n` +
        `Liquidity: ${analysis.liquidityRisk}`,
    );
  } catch (error) {
    console.error('Risk analysis error:', error);
    showMessage(`Risk analysis failed: ${error.message}`);
  }
}

function openDeFi() {
  window.open(
    `https://quickswap.exchange/#/swap?outputCurrency=${AETH_ADDRESS}`,
    '_blank',
    'noopener',
  );
}

async function autoReconnectAdvancedWallet() {
  if (!window.ethereum) {
    return;
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length > 0) {
      await connectWallet();
    }
  } catch (error) {
    console.warn('Advanced dashboard auto reconnect skipped:', error);
  }
}

if (window.ethereum && typeof window.ethereum.on === 'function') {
  window.ethereum.on('accountsChanged', (accounts) => {
    if (accounts.length > 0) {
      window.location.reload();
      return;
    }

    localStorage.removeItem('aetheron_advanced_wallet');
    updateConnectButton('Connect Wallet');
  });

  window.ethereum.on('chainChanged', () => {
    window.location.reload();
  });
}

window.connectWallet = connectWallet;
window.openAnalytics = openAnalytics;
window.optimizePortfolio = optimizePortfolio;
window.analyzeRisk = analyzeRisk;
window.openDeFi = openDeFi;

window.addEventListener('load', async () => {
  await autoReconnectAdvancedWallet();
});
