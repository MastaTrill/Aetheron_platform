// Bridge Modal Logic
document.addEventListener('DOMContentLoaded', function () {
  const openBridgeBtn = document.getElementById('openBridgeBtn');
  const bridgeModal = document.getElementById('bridgeModal');
  const closeBridgeModal = document.getElementById('closeBridgeModal');
  const bridgeForm = document.getElementById('bridgeForm');
  if (openBridgeBtn && bridgeModal) {
    openBridgeBtn.onclick = function () {
      bridgeModal.style.display = 'block';
    };
  }
  if (closeBridgeModal && bridgeModal) {
    closeBridgeModal.onclick = function () {
      bridgeModal.style.display = 'none';
    };
  }
  if (bridgeForm) {
    bridgeForm.onsubmit = async function (e) {
      e.preventDefault();
      const asset = document.getElementById('bridgeAsset').value;
      const amount = document.getElementById('bridgeAmount').value;
      const fromChain = document.getElementById('bridgeFromChain').value;
      const toChain = document.getElementById('bridgeToChain').value;
      // TODO: Integrate with real bridge API (e.g., Wormhole, Synapse)
      alert(`Bridge request: ${amount} ${asset} from ${fromChain} to ${toChain}. Integration coming soon.`);
      bridgeModal.style.display = 'none';
    };
  }
});
// Aetheron Dashboard JavaScript
class AetheronDashboard {
  constructor() {
    // Initialize all properties before use
    this.tradingVolume = 0;
    this.tradingRewards = null;
    this.communityStats = {};
    this.achievements = [];
    this.currentSection = 'dashboard';
    this.referralCode = this.generateReferralCode();
    
    // Initialize all setup methods
    this.setupTradingIncentives();
    this.setupCommunityFeatures();
    this.setupEventListeners();
    this.startRealTimeUpdates();
    this.loadDashboardData();
    
    console.log('🚀 AetheronDashboard initialized');
  }

  // Alias notify to showNotification for compatibility
  notify(message, type = 'info') {
    this.showNotification(message, type);
  }

  // Transaction history demo data (replace with real API integration)
  getTxHistory() {
    return JSON.parse(localStorage.getItem('aetheron-tx-history') || '[]');
  }

  setTxHistory(txs) {
    localStorage.setItem('aetheron-tx-history', JSON.stringify(txs));
  }

  renderTxHistory() {
    const table = document.getElementById('txHistoryTable').querySelector('tbody');
    const type = document.getElementById('txTypeFilter').value;
    const date = document.getElementById('txDateFilter').value;
    let txs = this.getTxHistory();
    if (type !== 'all') txs = txs.filter(tx => tx.type === type);
    if (date) txs = txs.filter(tx => tx.date.startsWith(date));
    table.innerHTML = txs.length ? txs.map(tx => `<tr><td>${tx.date}</td><td>${tx.type}</td><td>${tx.amount}</td><td>${tx.token}</td><td>${tx.status}</td></tr>`).join('') : `<tr><td colspan="5" class="text-gray">No transactions found.</td></tr>`;
  }

  exportTxCsv() {
    // ... class methods ...
  }

  handleWalletConnected(account) {
    this.notify('Wallet connected', 'success');
    const spinner = document.getElementById('walletLoadingSpinner');
    this.refreshBalances();
    this.refreshAnalytics();
    if (spinner) spinner.style.display = 'flex';
    if (!account && window.ethereum && window.ethereum.selectedAddress) {
      account = window.ethereum.selectedAddress;
    }
    if (account) {
      const accountEl = document.getElementById('accountAddress');
      if (accountEl) accountEl.textContent = account;
      this.updateWalletStatusBar(true);
      setTimeout(() => { if (spinner) spinner.style.display = 'none'; }, 800);
    } else {
      this.updateWalletStatusBar(false);
      if (spinner) spinner.style.display = 'none';
    }
  }

  async getDeFiRates(protocol = 'aave') {
    try {
      let rates;
      if (protocol === 'aave') {
        const response = await fetch('https://api.thegraph.com/subgraphs/name/aave/protocol-v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `{
              reserves(first: 1) { supplyAPY borrowAPY }
            }`
          })
        });
        const data = await response.json();
        rates = data.data.reserves[0];
      } else if (protocol === 'compound') {
        const response = await fetch('https://api.compound.finance/api/v2/ctoken');
        const data = await response.json();
        rates = {
          supplyApy: data.cToken[0].supply_rate.value,
          borrowApy: data.cToken[0].borrow_rate.value
        };
      } else if (protocol === '1inch') {
        rates = { supplyApy: 0, borrowApy: 0, swapRate: 'See 1inch API' };
      } else {
        throw new Error('Unsupported protocol');
      }
      this.notify('Fetched rates from ' + protocol, 'success');
      return rates;
    } catch (err) {
      this.notify('Failed to fetch rates: ' + err.message, 'error');
      return null;
    }
  }

  async executeDeFiAction(action, params) {
                                              // Cross-chain Bridge
                                              if (params.protocol === 'bridge') {
                                                this.notify('Cross-chain bridge: Please use a supported bridge provider (e.g., Wormhole, Synapse, Multichain). Integration coming soon.', 'info');
                                                return;
                                              }

                                              // On-chain Governance
                                              if (params.protocol === 'governance') {
                                                this.notify('On-chain governance: View and vote on proposals via Snapshot or Tally. Integration coming soon.', 'info');
                                                return;
                                              }

                                              // Portfolio Analytics
                                              if (params.protocol === 'portfolio') {
                                                this.notify('Portfolio analytics: Aggregating DeFi and NFT holdings. Integration coming soon.', 'info');
                                                return;
                                              }

                                              // Fiat On/Off Ramp
                                              if (params.protocol === 'fiat') {
                                                this.notify('Fiat on/off ramp: Use a provider like MoonPay, Ramp, or Coinbase Pay. Integration coming soon.', 'info');
                                                return;
                                              }

                                              // Social Trading
                                              if (params.protocol === 'socialtrading') {
                                                this.notify('Social trading: Copy top traders and view leaderboards. Integration coming soon.', 'info');
                                                return;
                                              }

                                              // DAO Management
                                              if (params.protocol === 'dao') {
                                                this.notify('DAO management: Manage DAOs, members, and proposals. Integration coming soon.', 'info');
                                                return;
                                              }

                                              // Token Launchpad
                                              if (params.protocol === 'launchpad') {
                                                this.notify('Token launchpad: Participate in IDOs and token launches. Integration coming soon.', 'info');
                                                return;
                                              }

                                              // Wallet Security
                                              if (params.protocol === 'walletsecurity') {
                                                this.notify('Wallet security: Enable 2FA, multisig, and advanced security features. Integration coming soon.', 'info');
                                                return;
                                              }

                                              // Real-time Alerts
                                              if (params.protocol === 'alerts') {
                                                this.notify('Real-time alerts: Get notified about price, liquidation, and governance events. Integration coming soon.', 'info');
                                                return;
                                              }

                                              // NFT Marketplace Aggregator
                                              if (params.protocol === 'nft-aggregator') {
                                                this.notify('NFT marketplace aggregator: Browse and compare NFTs across multiple marketplaces. Integration coming soon.', 'info');
                                                return;
                                              }
                                        // NFT Management actions
                                        if (params.protocol === 'nft') {
                                          if (action === 'view') {
                                            // View NFTs (fetch owned ERC-721 tokens)
                                            if (!window.ethereum) throw new Error('Wallet not found');
                                            const provider = new ethers.providers.Web3Provider(window.ethereum);
                                            await provider.send('eth_requestAccounts', []);
                                            const signer = provider.getSigner();
                                            const userAddress = await signer.getAddress();
                                            // Example: fetch NFTs using OpenSea API (client-side fetch)
                                            const url = `https://api.opensea.io/api/v1/assets?owner=${userAddress}&order_direction=desc&offset=0&limit=20`;
                                            const response = await fetch(url);
                                            const data = await response.json();
                                            this.notify(`You own ${data.assets.length} NFTs (see console for details)`, 'info');
                                            console.log('NFTs:', data.assets);
                                          } else if (action === 'mint') {
                                            // Mint NFT (ERC-721 example, requires deployed contract)
                                            if (!window.ethereum) throw new Error('Wallet not found');
                                            const provider = new ethers.providers.Web3Provider(window.ethereum);
                                            await provider.send('eth_requestAccounts', []);
                                            const signer = provider.getSigner();
                                            // Example ERC-721 contract address and ABI (replace with your own)
                                            const NFT_CONTRACT_ADDRESS = '0xYourNftContractAddress';
                                            const NFT_ABI = [
                                              'function mint(address to, string memory tokenURI) public returns (uint256)'
                                            ];
                                            const nft = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
                                            const tokenURI = 'https://your-metadata-url.com/metadata/1.json';
                                            await nft.mint(await signer.getAddress(), tokenURI);
                                            this.notify('NFT mint transaction submitted!', 'success');
                                          } else if (action === 'transfer') {
                                            // Transfer NFT (ERC-721 safeTransferFrom)
                                            if (!window.ethereum) throw new Error('Wallet not found');
                                            const provider = new ethers.providers.Web3Provider(window.ethereum);
                                            await provider.send('eth_requestAccounts', []);
                                            const signer = provider.getSigner();
                                            // Example ERC-721 contract address and ABI (replace with your own)
                                            const NFT_CONTRACT_ADDRESS = '0xYourNftContractAddress';
                                            const NFT_ABI = [
                                              'function safeTransferFrom(address from, address to, uint256 tokenId) public'
                                            ];
                                            const nft = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
                                            const from = await signer.getAddress();
                                            const to = prompt('Enter recipient address:');
                                            const tokenId = prompt('Enter token ID to transfer:');
                                            await nft.safeTransferFrom(from, to, tokenId);
                                            this.notify('NFT transfer transaction submitted!', 'success');
                                          } else if (action === 'list') {
                                            // List NFT for sale (OpenSea example, user guidance)
                                            this.notify('To list your NFT for sale, use OpenSea or another NFT marketplace. Listing requires off-chain signature and marketplace UI.', 'info');
                                          }
                                          return;
                                        }
                                  // dYdX protocol actions
                                  if (params.protocol === 'dydx') {
                                    if (action === 'trade') {
                                      // dYdX trade perpetuals logic (API-based, not direct contract call)
                                      this.notify('dYdX trade: Please use the official dYdX web app for perpetual trading. API integration requires user authentication and off-chain order signing.', 'info');
                                    } else if (action === 'margin') {
                                      // dYdX open margin position logic (API-based)
                                      this.notify('dYdX margin: Please use the official dYdX web app for margin trading. API integration requires user authentication and off-chain order signing.', 'info');
                                    } else if (action === 'collateral') {
                                      // dYdX manage collateral logic (API-based)
                                      this.notify('dYdX collateral: Please use the official dYdX web app for collateral management. API integration requires user authentication and off-chain order signing.', 'info');
                                    }
                                    return;
                                  }
                            // MakerDAO protocol actions
                            if (params.protocol === 'makerdao') {
                              if (action === 'openVault') {
                                // MakerDAO open vault logic (example: open ETH-A vault)
                                // Note: Opening a vault on MakerDAO is complex and typically done via proxy contracts or dapps like Oasis. Here, we show a placeholder for the action.
                                this.notify('MakerDAO open vault: Please use the official MakerDAO UI or Oasis app for full vault management.', 'info');
                              } else if (action === 'generateDai') {
                                // MakerDAO generate DAI logic (example: draw DAI from vault)
                                // Note: Drawing DAI from a vault is complex and requires proxy and CDP management. Placeholder for demonstration.
                                this.notify('MakerDAO generate DAI: Please use the official MakerDAO UI or Oasis app for full vault management.', 'info');
                              } else if (action === 'repay') {
                                // MakerDAO repay logic (example: repay DAI to vault)
                                // Note: Repaying DAI to a vault is complex and requires proxy and CDP management. Placeholder for demonstration.
                                this.notify('MakerDAO repay: Please use the official MakerDAO UI or Oasis app for full vault management.', 'info');
                              }
                              return;
                            }
                      // Yearn Finance protocol actions
                      if (params.protocol === 'yearn') {
                        if (action === 'deposit') {
                          // Yearn deposit logic (example: deposit DAI to yDAI vault)
                          if (!window.ethereum) throw new Error('Wallet not found');
                          const provider = new ethers.providers.Web3Provider(window.ethereum);
                          await provider.send('eth_requestAccounts', []);
                          const signer = provider.getSigner();
                          // Yearn yDAI vault contract address (mainnet)
                          const YEARN_YDAI_VAULT_ADDRESS = '0x19D3364A399d251E894aC732651be8B0E4e85001';
                          const YEARN_YDAI_VAULT_ABI = [
                            'function deposit(uint256 amount) returns (uint256)'
                          ];
                          const vault = new ethers.Contract(YEARN_YDAI_VAULT_ADDRESS, YEARN_YDAI_VAULT_ABI, signer);
                          const amount = ethers.utils.parseUnits('10', 18); // 10 DAI
                          await vault.deposit(amount);
                          this.notify('Yearn deposit submitted!', 'success');
                        } else if (action === 'withdraw') {
                          // Yearn withdraw logic (example: withdraw yDAI)
                          if (!window.ethereum) throw new Error('Wallet not found');
                          const provider = new ethers.providers.Web3Provider(window.ethereum);
                          await provider.send('eth_requestAccounts', []);
                          const signer = provider.getSigner();
                          // Yearn yDAI vault contract address (mainnet)
                          const YEARN_YDAI_VAULT_ADDRESS = '0x19D3364A399d251E894aC732651be8B0E4e85001';
                          const YEARN_YDAI_VAULT_ABI = [
                            'function withdraw(uint256 maxShares) returns (uint256)'
                          ];
                          const vault = new ethers.Contract(YEARN_YDAI_VAULT_ADDRESS, YEARN_YDAI_VAULT_ABI, signer);
                          const maxShares = ethers.utils.parseUnits('1', 18); // 1 yDAI share
                          await vault.withdraw(maxShares);
                          this.notify('Yearn withdrawal submitted!', 'success');
                        } else if (action === 'viewYield') {
                          // Yearn view yield logic (example: get pricePerShare)
                          if (!window.ethereum) throw new Error('Wallet not found');
                          const provider = new ethers.providers.Web3Provider(window.ethereum);
                          await provider.send('eth_requestAccounts', []);
                          const signer = provider.getSigner();
                          // Yearn yDAI vault contract address (mainnet)
                          const YEARN_YDAI_VAULT_ADDRESS = '0x19D3364A399d251E894aC732651be8B0E4e85001';
                          const YEARN_YDAI_VAULT_ABI = [
                            'function pricePerShare() view returns (uint256)'
                          ];
                          const vault = new ethers.Contract(YEARN_YDAI_VAULT_ADDRESS, YEARN_YDAI_VAULT_ABI, signer);
                          const pricePerShare = await vault.pricePerShare();
                          this.notify('Yearn price per share: ' + ethers.utils.formatUnits(pricePerShare, 18), 'info');
                        }
                        return;
                      }
                // Compound protocol actions
                if (params.protocol === 'compound') {
                  if (action === 'supply') {
                    // Compound supply logic (example: supply DAI)
                    if (!window.ethereum) throw new Error('Wallet not found');
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    await provider.send('eth_requestAccounts', []);
                    const signer = provider.getSigner();
                    // Compound cDAI contract address (mainnet)
                    const COMPOUND_CDAI_ADDRESS = '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643';
                    const COMPOUND_CDAI_ABI = [
                      'function mint(uint256 mintAmount) returns (uint256)'
                    ];
                    const cDAI = new ethers.Contract(COMPOUND_CDAI_ADDRESS, COMPOUND_CDAI_ABI, signer);
                    const amount = ethers.utils.parseUnits('10', 18); // 10 DAI
                    await cDAI.mint(amount);
                    this.notify('Compound supply submitted!', 'success');
                  } else if (action === 'borrow') {
                    // Compound borrow logic (example: borrow DAI)
                    if (!window.ethereum) throw new Error('Wallet not found');
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    await provider.send('eth_requestAccounts', []);
                    const signer = provider.getSigner();
                    // Compound cDAI contract address (mainnet)
                    const COMPOUND_CDAI_ADDRESS = '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643';
                    const COMPOUND_CDAI_ABI = [
                      'function borrow(uint256 borrowAmount) returns (uint256)'
                    ];
                    const cDAI = new ethers.Contract(COMPOUND_CDAI_ADDRESS, COMPOUND_CDAI_ABI, signer);
                    const amount = ethers.utils.parseUnits('5', 18); // 5 DAI
                    await cDAI.borrow(amount);
                    this.notify('Compound borrow submitted!', 'success');
                  } else if (action === 'repay') {
                    // Compound repay logic (example: repay DAI loan)
                    if (!window.ethereum) throw new Error('Wallet not found');
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    await provider.send('eth_requestAccounts', []);
                    const signer = provider.getSigner();
                    // Compound cDAI contract address (mainnet)
                    const COMPOUND_CDAI_ADDRESS = '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643';
                    const COMPOUND_CDAI_ABI = [
                      'function repayBorrow(uint256 repayAmount) returns (uint256)'
                    ];
                    const cDAI = new ethers.Contract(COMPOUND_CDAI_ADDRESS, COMPOUND_CDAI_ABI, signer);
                    const amount = ethers.utils.parseUnits('5', 18); // 5 DAI
                    await cDAI.repayBorrow(amount);
                    this.notify('Compound repay submitted!', 'success');
                  }
                  return;
                }
          // Aave protocol actions
          if (params.protocol === 'aave') {
            if (action === 'lend') {
              // Aave lend logic (example: deposit DAI)
              if (!window.ethereum) throw new Error('Wallet not found');
              const provider = new ethers.providers.Web3Provider(window.ethereum);
              await provider.send('eth_requestAccounts', []);
              const signer = provider.getSigner();
              // Aave v2 LendingPool contract address (mainnet)
              const AAVE_LENDING_POOL_ADDRESS = '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9';
              const AAVE_LENDING_POOL_ABI = [
                'function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)'
              ];
              const lendingPool = new ethers.Contract(AAVE_LENDING_POOL_ADDRESS, AAVE_LENDING_POOL_ABI, signer);
              const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
              const amount = ethers.utils.parseUnits('10', 18); // 10 DAI
              const onBehalfOf = await signer.getAddress();
              const referralCode = 0;
              await lendingPool.deposit(DAI, amount, onBehalfOf, referralCode);
              this.notify('Aave deposit submitted!', 'success');
            } else if (action === 'borrow') {
              // Aave borrow logic (example: borrow USDC)
              if (!window.ethereum) throw new Error('Wallet not found');
              const provider = new ethers.providers.Web3Provider(window.ethereum);
              await provider.send('eth_requestAccounts', []);
              const signer = provider.getSigner();
              // Aave v2 LendingPool contract address (mainnet)
              const AAVE_LENDING_POOL_ADDRESS = '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9';
              const AAVE_LENDING_POOL_ABI = [
                'function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)'
              ];
              const lendingPool = new ethers.Contract(AAVE_LENDING_POOL_ADDRESS, AAVE_LENDING_POOL_ABI, signer);
              const USDC = '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
              const amount = ethers.utils.parseUnits('10', 6); // 10 USDC
              const interestRateMode = 2; // variable
              const referralCode = 0;
              const onBehalfOf = await signer.getAddress();
              await lendingPool.borrow(USDC, amount, interestRateMode, referralCode, onBehalfOf);
              this.notify('Aave borrow submitted!', 'success');
            } else if (action === 'repay') {
              // Aave repay logic (example: repay USDC loan)
              if (!window.ethereum) throw new Error('Wallet not found');
              const provider = new ethers.providers.Web3Provider(window.ethereum);
              await provider.send('eth_requestAccounts', []);
              const signer = provider.getSigner();
              // Aave v2 LendingPool contract address (mainnet)
              const AAVE_LENDING_POOL_ADDRESS = '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9';
              const AAVE_LENDING_POOL_ABI = [
                'function repay(address asset, uint256 amount, uint256 rateMode, address onBehalfOf) returns (uint256)'
              ];
              const lendingPool = new ethers.Contract(AAVE_LENDING_POOL_ADDRESS, AAVE_LENDING_POOL_ABI, signer);
              const USDC = '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
              const amount = ethers.utils.parseUnits('10', 6); // 10 USDC
              const rateMode = 2; // variable
              const onBehalfOf = await signer.getAddress();
              await lendingPool.repay(USDC, amount, rateMode, onBehalfOf);
              this.notify('Aave repay submitted!', 'success');
            }
            return;
          }
    try {
      this.notify('Executing ' + action + '...', 'info');
      if (action === 'lend') {
        // TODO: Integrate with Aave/Compound lending contract
      } else if (action === 'borrow') {
        // TODO: Integrate with Aave/Compound borrowing contract
      } else if (action === 'swap') {
        if (params.protocol === 'uniswap') {
          // TODO: Integrate Uniswap swap logic (call Uniswap router contract or SDK)
        } else if (params.protocol === '1inch') {
          // TODO: Integrate with 1inch swap API
        } else if (params.protocol === 'curve') {
          // Curve swap logic (example: swap DAI to USDC)
          if (!window.ethereum) throw new Error('Wallet not found');
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          await provider.send('eth_requestAccounts', []);
          const signer = provider.getSigner();
          // Curve pool contract address (example: 3pool mainnet)
          const CURVE_3POOL_ADDRESS = '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7';
          const CURVE_3POOL_ABI = [
            'function exchange(int128 i, int128 j, uint256 dx, uint256 min_dy) returns (uint256)' // i: from, j: to
          ];
          const pool = new ethers.Contract(CURVE_3POOL_ADDRESS, CURVE_3POOL_ABI, signer);
          // Example: swap DAI (0) to USDC (1)
          const i = 0; // DAI
          const j = 1; // USDC
          const dx = ethers.utils.parseUnits('10', 18); // 10 DAI
          const min_dy = 0;
          await pool.exchange(i, j, dx, min_dy);
          this.notify('Curve swap submitted!', 'success');
        } else if (params.protocol === 'balancer') {
          // TODO: Integrate Balancer swap logic (call Balancer vault contract or SDK)
        } else if (params.protocol === 'sushiswap') {
          // SushiSwap swap logic (example: swap USDC to WETH)
          if (!window.ethereum) throw new Error('Wallet not found');
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          await provider.send('eth_requestAccounts', []);
          const signer = provider.getSigner();
          // SushiSwap Router contract address (mainnet)
          const SUSHISWAP_ROUTER_ADDRESS = '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F';
          const SUSHISWAP_ROUTER_ABI = [
            'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)'
          ];
          const router = new ethers.Contract(SUSHISWAP_ROUTER_ADDRESS, SUSHISWAP_ROUTER_ABI, signer);
          // Example swap: USDC to WETH
          const USDC = '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
          const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
          const amountIn = ethers.utils.parseUnits('10', 6); // 10 USDC
          const amountOutMin = 0;
          const path = [USDC, WETH];
          const to = await signer.getAddress();
          const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
          await router.swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline);
          this.notify('SushiSwap swap submitted!', 'success');
        }
      } else if (action === 'liquidity') {
        if (params.protocol === 'uniswap') {
          // ...existing Uniswap liquidity logic...
        } else if (params.protocol === 'sushiswap') {
            // SushiSwap add liquidity logic (simplified)
            if (!window.ethereum) throw new Error('Wallet not found');
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send('eth_requestAccounts', []);
            // SushiSwap add liquidity logic (simplified)
            if (!window.ethereum) throw new Error('Wallet not found');
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send('eth_requestAccounts', []);
            const signer = provider.getSigner();
            // SushiSwap Router contract address (mainnet)
            const SUSHISWAP_ROUTER_ADDRESS = '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F';
            const SUSHISWAP_ROUTER_ABI = [
              'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB, uint liquidity)'
            ];
            const router = new ethers.Contract(SUSHISWAP_ROUTER_ADDRESS, SUSHISWAP_ROUTER_ABI, signer);
            // Example: Add liquidity USDC/WETH
            const USDC = '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
            const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
            const amountADesired = ethers.utils.parseUnits('10', 6);
            const amountBDesired = ethers.utils.parseUnits('0.005', 18);
            const amountAMin = 0;
            const amountBMin = 0;
            const to = await signer.getAddress();
            const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
            await router.addLiquidity(USDC, WETH, amountADesired, amountBDesired, amountAMin, amountBMin, to, deadline);
            this.notify('SushiSwap liquidity added!', 'success');
        }
      } else if (action === 'yield') {
        if (params.protocol === 'sushiswap') {
            // SushiSwap yield farming logic (stake LP tokens)
            if (!window.ethereum) throw new Error('Wallet not found');
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send('eth_requestAccounts', []);
            const signer = provider.getSigner();
            // SushiSwap MasterChef contract address (mainnet)
            const MASTERCHEF_ADDRESS = '0xC2EdBaB3a7bA1e4eA1e1e1e1e1e1e1e1e1e1e1e1'; // Replace with actual address
            const MASTERCHEF_ABI = [
              'function deposit(uint256 pid, uint256 amount)'
            ];
            const masterChef = new ethers.Contract(MASTERCHEF_ADDRESS, MASTERCHEF_ABI, signer);
            // Example: Stake LP tokens (pid and amount should be set by user)
            const pid = 0; // Pool ID for USDC/WETH
            const amount = ethers.utils.parseUnits('1', 18); // 1 LP token
            await masterChef.deposit(pid, amount);
            this.notify('SushiSwap yield farming deposit submitted!', 'success');
        } else {
          // TODO: Integrate with other yield farming contracts
        }
      }
      await new Promise(r => setTimeout(r, 1500));
      this.notify(action + ' successful!', 'success');
      return true;
    } catch (err) {
      this.notify(action + ' failed: ' + err.message, 'error');
      return false;
    }
  }

  async refreshBalances() {
    this.notify('Refreshing wallet balances...', 'info');
    setTimeout(() => {
      document.getElementById('ethBalance').textContent = '123.45 MATIC';
      document.getElementById('aethBalance').textContent = '6789 AETH';
    }, 1000);
  }

  async refreshAnalytics() {
    this.notify('Refreshing analytics...', 'info');
    setTimeout(() => {
      document.getElementById('stakingAnalyticsPlaceholder').textContent = 'Staking APY: 12%';
    }, 1000);
  }

  setupEventListeners() {
    // Balancer actions
    const openBalancerSwapBtn = document.getElementById('openBalancerSwapBtn');
    if (openBalancerSwapBtn) {
      openBalancerSwapBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.executeDeFiAction('swap', { protocol: 'balancer' });
      });
    }
    const openBalancerLiquidityBtn = document.getElementById('openBalancerLiquidityBtn');
    if (openBalancerLiquidityBtn) {
      openBalancerLiquidityBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.executeDeFiAction('liquidity', { protocol: 'balancer' });
      });
    }
    const openBalancerWithdrawBtn = document.getElementById('openBalancerWithdrawBtn');
    if (openBalancerWithdrawBtn) {
      openBalancerWithdrawBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.executeDeFiAction('withdraw', { protocol: 'balancer' });
      });
    }
    // Navigation links
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const section =
          e.target.getAttribute('data-section') ||
          e.target.closest('.nav-link').getAttribute('data-section');
        if (section) {
          this.showSection(section);
        }
      });
    });

    // DeFi actions: Lend, Borrow, Swap, Yield
    const lendBtn = document.getElementById('lendBtn');
    if (lendBtn) {
      lendBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.executeDeFiAction('lend', { protocol: 'aave' });
      });
    }
    const borrowBtn = document.getElementById('borrowBtn');
    if (borrowBtn) {
      borrowBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.executeDeFiAction('borrow', { protocol: 'compound' });
      });
    }
    const swapBtn = document.getElementById('swapBtn');
    if (swapBtn) {
      swapBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.executeDeFiAction('swap', { protocol: '1inch' });
      });
    }
    const yieldBtn = document.getElementById('yieldBtn');
    if (yieldBtn) {
      yieldBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.executeDeFiAction('yield', { protocol: 'aave' });
      });
    }
    // Uniswap actions
    const openUniswapSwapBtn = document.getElementById('openUniswapSwapBtn');
    if (openUniswapSwapBtn) {
      openUniswapSwapBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.executeDeFiAction('swap', { protocol: 'uniswap' });
      });
    }
    const openUniswapLiquidityBtn = document.getElementById('openUniswapLiquidityBtn');
    if (openUniswapLiquidityBtn) {
      openUniswapLiquidityBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.executeDeFiAction('liquidity', { protocol: 'uniswap' });
      });
    }
    // SushiSwap actions
    const openSushiSwapBtn = document.getElementById('openSushiSwapBtn');
    if (openSushiSwapBtn) {
      openSushiSwapBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.executeDeFiAction('swap', { protocol: 'sushiswap' });
      });
    }
    const openSushiLiquidityBtn = document.getElementById('openSushiLiquidityBtn');
    if (openSushiLiquidityBtn) {
      openSushiLiquidityBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.executeDeFiAction('liquidity', { protocol: 'sushiswap' });
      });
    }
    const openSushiYieldBtn = document.getElementById('openSushiYieldBtn');
    if (openSushiYieldBtn) {
      openSushiYieldBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.executeDeFiAction('yield', { protocol: 'sushiswap' });
      });
    }
    // Curve Finance actions
    const openCurveSwapBtn = document.getElementById('openCurveSwapBtn');
    if (openCurveSwapBtn) {
      openCurveSwapBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.executeDeFiAction('swap', { protocol: 'curve' });
      });
    }
    const openCurveDepositBtn = document.getElementById('openCurveDepositBtn');
    if (openCurveDepositBtn) {
      openCurveDepositBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.executeDeFiAction('deposit', { protocol: 'curve' });
      });
    }
    const openCurveWithdrawBtn = document.getElementById('openCurveWithdrawBtn');
    if (openCurveWithdrawBtn) {
      openCurveWithdrawBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.executeDeFiAction('withdraw', { protocol: 'curve' });
      });
    }

    // Portfolio tracker
    const portfolioBtn = document.getElementById('portfolioBtn');
    if (portfolioBtn) {
      portfolioBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.refreshAnalytics();
        this.notify('Portfolio tracker updated (stub)', 'info');
      });
    }

    // Governance voting
    const governanceBtn = document.getElementById('openGovernanceMainBtn');
    if (governanceBtn) {
      governanceBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        window.dashboard.notify('Loading governance proposals...', 'info');
        try {
          const res = await fetch('https://hub.snapshot.org/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `query Proposals($space: String!) { proposals(space: $space) { id title body choices start end state } }`,
              variables: { space: 'aetheron.eth' }
            })
          });
          const result = await res.json();
          const proposals = result.data?.proposals || [];
          if (proposals.length === 0) {
            window.dashboard.notify('No governance proposals found.', 'info');
            return;
          }
          // Render proposals in a modal (simple alert for now)
          let msg = 'Active Governance Proposals:\n';
          proposals.forEach(p => {
            msg += `\n${p.title}\n${p.body}\nChoices: ${p.choices.join(', ')}\nStatus: ${p.state}\n`;
          });
          alert(msg);
        } catch (err) {
          window.dashboard.notify('Failed to load governance proposals.', 'error');
        }
      });
    }

    // Notifications
    const notificationsBtn = document.getElementById('notificationsBtn');
    if (notificationsBtn) {
      notificationsBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        this.notify('Notifications refreshed (stub)', 'info');
        // TODO: Fetch notifications from backend
      });
    }
    // Trading volume incentives
    const tradeButton = document.getElementById('simulate-trade');
    if (tradeButton) {
      tradeButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.simulateTrade();
      });
    }

    // Referral system
    const referralButton = document.getElementById('generate-referral');
    if (referralButton) {
      referralButton.addEventListener('click', () =>
        this.generateReferralLink(),
      );
    }

    // Social media sharing
    document.querySelectorAll('.share-button').forEach((button) => {
      button.addEventListener('click', (e) => {
        const platform = e.target.dataset.platform;
        this.shareOnSocial(platform);
      });
    });
  }

  setupTradingIncentives() {
    // Trading volume rewards system
    this.tradingRewards = {
      dailyTarget: 1000, // $1000 daily volume target
      currentProgress: 0,
      rewards: [
        { threshold: 100, reward: '5% bonus APY for 24h' },
        { threshold: 500, reward: '10% bonus APY for 24h' },
        { threshold: 1000, reward: '25% bonus APY for 24h' },
        { threshold: 2500, reward: '50% bonus APY for 24h' },
      ],
    };

    this.updateTradingRewards();
  }

  setupCommunityFeatures() {
    // Community engagement features
    this.communityFeatures = {
      leaderboard: [],
      achievements: [],
      events: [],
    };

    this.loadCommunityStats();
    this.setupAchievementSystem();
  }

  startRealTimeUpdates() {
    // Update dashboard data every 30 seconds
    setInterval(() => {
      this.updateLiveStats();
      this.checkTradingMilestones();
    }, 30000);

    // Update community stats every 5 minutes
    setInterval(() => {
      this.updateCommunityStats();
    }, 300000);
  }

  simulateTrade() {
    // Simulate a trade for demo purposes
    const tradeAmount = Math.random() * 100 + 10; // $10-110 trade
    this.tradingVolume += tradeAmount;
    this.tradingRewards.currentProgress += tradeAmount;

    this.updateTradingRewards();
    this.showTradeNotification(tradeAmount);

    console.log(`💰 Simulated trade: $${tradeAmount.toFixed(2)}`);
  }

  updateTradingRewards() {
    const progressBar = document.getElementById('volume-progress');
    const progressText = document.getElementById('volume-text');
    const rewardsList = document.getElementById('trading-rewards');

    if (progressBar && progressText) {
      const progress =
        (this.tradingRewards.currentProgress /
          this.tradingRewards.dailyTarget) *
        100;
      progressBar.style.width = `${Math.min(progress, 100)}%`;
      progressText.textContent = `$${this.tradingRewards.currentProgress.toFixed(0)} / $${this.tradingRewards.dailyTarget}`;
    }

    if (rewardsList) {
      rewardsList.innerHTML = '';
      this.tradingRewards.rewards.forEach((reward) => {
        const li = document.createElement('li');
        const isUnlocked =
          this.tradingRewards.currentProgress >= reward.threshold;
        li.className = isUnlocked ? 'unlocked' : 'locked';
        li.innerHTML = `<span class="reward-icon">${isUnlocked ? '✅' : '🔒'}</span> $${reward.threshold}+: ${reward.reward}`;
        rewardsList.appendChild(li);
      });
    }
  }

  showTradeNotification(amount) {
    // Create floating notification
    const notification = document.createElement('div');
    notification.className = 'trade-notification';
    notification.innerHTML = `💰 +$${amount.toFixed(2)} volume!`;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  generateReferralCode() {
    return 'AETH' + Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  generateReferralLink() {
    const baseUrl = 'https://mastatrill.github.io/Aetheron_platform/';
    const referralLink = `${baseUrl}?ref=${this.referralCode}`;

    // Copy to clipboard
    navigator.clipboard.writeText(referralLink).then(() => {
      this.showNotification('Referral link copied to clipboard!', 'success');
    });

    console.log(`🔗 Generated referral link: ${referralLink}`);
  }

  shareOnSocial(platform) {
    const url = 'https://mastatrill.github.io/Aetheron_platform/';
    const text = `🚀 Check out $AETH - Aetheron Platform! Staking up to 25% APY on Polygon. #DeFi #AETH`;

    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'reddit':
        shareUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  }

  loadCommunityStats() {
    // Simulate loading community stats (in real app, fetch from API)
    this.communityStats = {
      twitterFollowers: Math.floor(Math.random() * 1000) + 100,
      telegramMembers: Math.floor(Math.random() * 500) + 50,
      discordMembers: Math.floor(Math.random() * 200) + 20,
      totalHolders: Math.floor(Math.random() * 100) + 10,
    };

    this.updateCommunityDisplay();
  }

  updateCommunityStats() {
    // Simulate community growth
    Object.keys(this.communityStats).forEach((key) => {
      this.communityStats[key] += Math.floor(Math.random() * 5);
    });

    this.updateCommunityDisplay();
  }

  updateCommunityDisplay() {
    Object.keys(this.communityStats).forEach((key) => {
      const element = document.getElementById(`${key}-count`);
      if (element) {
        element.textContent = this.communityStats[key].toLocaleString();
      }
    });
  }

  setupAchievementSystem() {
    this.achievements = [
      {
        id: 'first-trade',
        name: 'First Trader',
        description: 'Complete your first trade',
        unlocked: false,
      },
      {
        id: 'volume-warrior',
        name: 'Volume Warrior',
        description: 'Reach $1000 daily volume',
        unlocked: false,
      },
      {
        id: 'community-builder',
        name: 'Community Builder',
        description: 'Get 100 social media followers',
        unlocked: false,
      },
      {
        id: 'referral-master',
        name: 'Referral Master',
        description: 'Generate 10 referral links',
        unlocked: false,
      },
    ];

    this.updateAchievements();
  }

  updateAchievements() {
    const achievementsList = document.getElementById('achievements-list');
    if (achievementsList) {
      achievementsList.innerHTML = '';
      this.achievements.forEach((achievement) => {
        const li = document.createElement('li');
        li.className = `achievement ${achievement.unlocked ? 'unlocked' : 'locked'}`;
        li.innerHTML = `
					<div class="achievement-icon">${achievement.unlocked ? '🏆' : '🔒'}</div>
					<div class="achievement-info">
						<h4>${achievement.name}</h4>
						<p>${achievement.description}</p>
					</div>
				`;
        achievementsList.appendChild(li);
      });
    }
  }

  async updateLiveStats() {
    const quickStatsSpinner = document.getElementById('quickStatsLoading');
    if (quickStatsSpinner) quickStatsSpinner.style.display = 'flex';
    // Update live trading stats
    const priceElement = document.getElementById('live-price');
    const volumeElement = document.getElementById('live-volume');
    const holdersElement = document.getElementById('live-holders');
    if (priceElement) {
      try {
        // Fetch real price from DexScreener API using the pair address
        const response = await fetch(
          'https://api.dexscreener.com/latest/dex/pairs/polygon/0xd57c5E33ebDC1b565F99d06809debbf86142705D'
        );
        const data = await response.json();

        if (data && data.pairs && data.pairs[0]) {
          const price = parseFloat(data.pairs[0].priceUsd);
          priceElement.textContent = `$${price.toFixed(6)}`;
          console.log(`📊 Real price updated: $${price.toFixed(6)}`);
        } else {
          // Fallback to mock price if API fails
          const mockPrice = (0.0001 + Math.random() * 0.0002).toFixed(6);
          priceElement.textContent = `$${mockPrice}`;
          console.log(`📊 Mock price (API failed): $${mockPrice}`);
        }
      } catch (error) {
        // Fallback to mock price if API fails
        const mockPrice = (0.0001 + Math.random() * 0.0002).toFixed(6);
        priceElement.textContent = `$${mockPrice}`;
        console.log(`📊 Mock price (API error): $${mockPrice}`, error);
      }
    }

    if (volumeElement) {
      volumeElement.textContent = `$${this.tradingVolume.toFixed(0)}`;
    }

    if (holdersElement) {
      holdersElement.textContent = this.communityStats.totalHolders.toString();
    }
    // Hide quick stats spinner after data loads
    setTimeout(() => { if (quickStatsSpinner) quickStatsSpinner.style.display = 'none'; }, 800);
  }

  checkTradingMilestones() {
    // Check for milestone achievements
    if (
      this.tradingVolume >= 1000 &&
      !this.achievements.find((a) => a.id === 'volume-warrior').unlocked
    ) {
      this.unlockAchievement('volume-warrior');
    }
  }

  unlockAchievement(achievementId) {
    const achievement = this.achievements.find((a) => a.id === achievementId);
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      this.updateAchievements();
      this.showNotification(
        `🏆 Achievement Unlocked: ${achievement.name}!`,
        'achievement'
      );
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  // Duplicate setupEventListeners removed. The main setupEventListeners is above.

  setupSpaceBackground() {
    const canvas = document.getElementById('space-bg');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2,
        opacity: Math.random(),
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();

        star.opacity += (Math.random() - 0.5) * 0.02;
        star.opacity = Math.max(0, Math.min(1, star.opacity));
      });

      requestAnimationFrame(animate);
    }
    animate();
  }

  showSection(sectionName) {
    console.log(`Attempting to show section: ${sectionName}`);

    // Hide all sections
    document.querySelectorAll('.content-section').forEach((section) => {
      section.classList.remove('active');
      section.style.display = 'none';
    });

    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
      targetSection.classList.add('active');
      targetSection.style.display = 'block';
      console.log(`Successfully showed section: ${sectionName}`);
    } else {
      console.error(`Section not found: ${sectionName}`);
    }

    // Update navigation
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.classList.remove('active');
    });
    const activeLink = document.querySelector(
      `[data-section="${sectionName}"]`,
    );
    if (activeLink) {
      activeLink.classList.add('active');
    }

    this.currentSection = sectionName;
  }

  loadDashboardData() {
    // Load initial dashboard data
    console.log('Loading dashboard data...');
    this.updateLiveStats();
    this.updateTradingRewards();
    this.updateCommunityDisplay();
    this.updateAchievements();
  }
}

// Initialize dashboard immediately
const dashboard = new AetheronDashboard();
window.dashboard = dashboard; // Make globally available

// Also initialize on DOMContentLoaded for safety
document.addEventListener('DOMContentLoaded', () => {
  if (!window.dashboard) {
    const dashboard = new AetheronDashboard();
    window.dashboard = dashboard; // Make globally available
  }

  // --- New Feature Placeholders ---
  // 1. Wallet Portfolio Breakdown
  function initWalletPortfolio() {
    const el = document.getElementById('walletPortfolioPlaceholder');
    if (el) el.textContent = 'Loading wallet portfolio...';
    fetch('https://api.covalenthq.com/v1/137/address/' + window.dashboard.walletAccount + '/balances_v2/?key=IlX80zDtd-GkH015Waioo')
      .then(res => res.json())
      .then(data => {
        if (el) el.textContent = 'Portfolio loaded: ' + (data.data.items.length) + ' tokens.';
        // Render Chart.js pie chart with token balances
        const chartEl = document.getElementById('walletPortfolioChart');
        if (chartEl && data.data.items.length > 0 && window.Chart) {
          const labels = data.data.items.map(t => t.contract_ticker_symbol);
          const values = data.data.items.map(t => t.balance / Math.pow(10, t.contract_decimals));
          new Chart(chartEl, {
            type: 'pie',
            data: {
              labels,
              datasets: [{ data: values, backgroundColor: ['#2d6cdf','#1a4fa0','#f7b731','#20bf6b','#eb3b5a','#8854d0','#fd9644'] }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
          });
        }
      })
      .catch(() => { if (el) el.textContent = 'Failed to load portfolio.'; });
  }

    // 4. NFT Analytics
    function initNFTAnalytics() {
      const el = document.getElementById('nftAnalyticsPlaceholder');
      if (el) el.textContent = 'Loading NFT analytics...';
      // Example: Fetch NFT data (stub)
      setTimeout(() => {
        if (el) el.textContent = 'NFTs loaded: 3 collections.';
        const chartEl = document.getElementById('nftAnalyticsChart');
        if (chartEl && window.Chart) {
          new Chart(chartEl, {
            type: 'bar',
            data: {
              labels: ['CryptoPunks', 'BoredApe', 'AetheronArt'],
              datasets: [{ label: 'NFTs', data: [2, 5, 1], backgroundColor: ['#8854d0','#fd9644','#20bf6b'] }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
          });
        }
      }, 1200);
    }

    // 5. Governance Voting
    function initGovernanceVoting() {
      const el = document.getElementById('governanceVotingPlaceholder');
      if (el) el.textContent = 'Loading governance proposals...';
      fetch('https://hub.snapshot.org/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query Proposals($space: String!) { proposals(space: $space) { id title body choices start end state } }`,
          variables: { space: 'aetheron.eth' }
        })
      })
        .then(res => res.json())
        .then(result => {
          const proposals = result.data?.proposals || [];
          if (el) el.textContent = proposals.length > 0 ? `Proposals loaded: ${proposals.length}` : 'No proposals found.';
          // TODO: Render proposals and enable voting
        })
        .catch(() => { if (el) el.textContent = 'Failed to load proposals.'; });
      const btn = document.getElementById('openGovernanceVoteBtn');
      if (btn) {
        btn.onclick = function () {
          window.dashboard.notify('Governance voting portal opened', 'info');
          // TODO: Open governance voting modal/portal
        };
      }
    }

    // 6. Portfolio Tracker
    function initPortfolioTracker() {
      const el = document.getElementById('portfolioTrackerPlaceholder');
      if (el) el.textContent = 'Loading portfolio tracker...';
      fetch('https://api.coingecko.com/api/v3/coins/aetheron/market_chart?vs_currency=usd&days=7')
        .then(res => res.json())
        .then(data => {
          if (el) el.textContent = 'Performance loaded.';
          // Render Chart.js line chart
          const chartEl = document.getElementById('portfolioTrackerChart');
          if (chartEl && data.prices && window.Chart) {
            const labels = data.prices.map(p => new Date(p[0]).toLocaleDateString());
            const values = data.prices.map(p => p[1]);
            new Chart(chartEl, {
              type: 'line',
              data: {
                labels,
                datasets: [{ label: 'Aetheron Price (USD)', data: values, borderColor: '#2d6cdf', backgroundColor: 'rgba(45,108,223,0.08)', fill: true }]
              },
              options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
            });
          }
        })
        .catch(() => { if (el) el.textContent = 'Failed to load performance.'; });
    }
  // 2. Real-Time Notifications
  function initNotifications() {
    const el = document.getElementById('notificationsPlaceholder');
    if (el) el.textContent = 'Loading notifications...';
    // Example: Fetch notifications (stub)
    fetch('https://api.mocknotifications.com/aetheron/' + window.dashboard.walletAccount)
      .then(res => res.json())
      .then(data => {
        if (el) el.textContent = 'Notifications loaded: ' + (data.notifications ? data.notifications.length : 0);
        // TODO: Render notifications
      })
      .catch(() => { if (el) el.textContent = 'Failed to load notifications.'; });
  }
  // 3. Theme Auto-Switch
  function initThemeSettings() {
    const themeStatus = document.getElementById('themeStatus');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeToggleSwitch = document.getElementById('themeToggleSwitch');
    // Helper: get preferred theme
    function getPreferredTheme() {
      const stored = localStorage.getItem('aetheron-theme');
      if (stored === 'dark' || stored === 'light') return stored;
      // System preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    // Helper: set theme
    function setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('aetheron-theme', theme);
      if (themeStatus) themeStatus.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
      if (themeToggleBtn) themeToggleBtn.textContent = theme === 'dark' ? '🌙' : '☀️';
      if (themeToggleSwitch) themeToggleSwitch.checked = theme === 'auto';
    }
    // Initialize theme
    let theme = getPreferredTheme();
    setTheme(theme);
    // Button click toggles theme
    if (themeToggleBtn) {
      themeToggleBtn.onclick = function () {
        theme = getPreferredTheme() === 'dark' ? 'light' : 'dark';
        setTheme(theme);
      };
    }
    // Switch toggles auto mode
    if (themeToggleSwitch) {
      themeToggleSwitch.onchange = function () {
        if (themeToggleSwitch.checked) {
          localStorage.removeItem('aetheron-theme');
          setTheme(getPreferredTheme());
        } else {
          setTheme(getPreferredTheme());
        }
      };
    }
    // Listen for system theme changes if auto
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('aetheron-theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  // 4. Staking History & Analytics
  // ... rest of code ...
    const el = document.getElementById('stakingHistoryTable');
    const spinner = document.getElementById('stakingHistorySpinner');
    if (spinner) spinner.style.display = 'flex';
    setTimeout(() => {
      if (el)
        el.querySelector('tbody').innerHTML =
          '<tr><td colspan="5">No data (stub)</td></tr>';
      if (spinner) spinner.style.display = 'none';
    }, 800);
    // TODO: Fetch staking/unstaking events, render table and chart

  
  // 5. Community Chat Widget
      initWalletPortfolio();
      initNFTAnalytics();
      initGovernanceVoting();
      initPortfolioTracker();

      // DeFi Integrations
      function initDefiLending() {
        const el = document.getElementById('defiLendingPlaceholder');
        if (el) el.textContent = 'Connect your wallet and select a protocol to lend or borrow assets.';
        const btn = document.getElementById('openLendingBtn');
        if (btn) {
          btn.onclick = async function () {
            // Connect wallet if not connected
            if (!window.dashboard.walletAccount) {
              await window.dashboard.connectWallet('metamask');
            }
            // Example: Select protocol (Aave)
            const rates = await window.dashboard.getDeFiRates('aave');
            if (rates) {
              el.textContent = `Aave Rates: Supply APY: ${rates.supplyApy * 100}% | Borrow APY: ${rates.borrowApy * 100}%`;
              // Example: Execute lend action
              const success = await window.dashboard.executeDeFiAction('lend', { protocol: 'aave', amount: 100 });
              if (success) el.textContent += '\nLending successful!';
            }
          };
        }
      }
      function initYieldFarming() {
        const el = document.getElementById('yieldFarmingPlaceholder');
        if (el) el.textContent = 'Connect your wallet and select a protocol to view farming opportunities.';
        const btn = document.getElementById('openYieldFarmingBtn');
        if (btn) {
          btn.onclick = async function () {
            if (!window.dashboard.walletAccount) {
              await window.dashboard.connectWallet('metamask');
            }
            // Example: Select protocol (Compound)
            const rates = await window.dashboard.getDeFiRates('compound');
            if (rates) {
              el.textContent = `Compound Rates: Supply APY: ${rates.supplyApy * 100}% | Borrow APY: ${rates.borrowApy * 100}%`;
              // Example: Execute yield farming action
              const success = await window.dashboard.executeDeFiAction('farm', { protocol: 'compound', amount: 50 });
              if (success) el.textContent += '\nYield farming started!';
            }
          };
        }
      }
      function initCrossChainSwaps() {
        const el = document.getElementById('crossChainSwapsPlaceholder');
        if (el) el.textContent = 'Connect your wallet and select assets to swap across chains.';
        const btn = document.getElementById('openCrossChainSwapBtn');
        if (btn) {
          btn.onclick = async function () {
            if (!window.dashboard.walletAccount) {
              await window.dashboard.connectWallet('metamask');
            }
            // Example: Use 1inch for swap
            const rates = await window.dashboard.getDeFiRates('1inch');
            if (rates) {
              el.textContent = `1inch Rates: Supply APY: ${rates.supplyApy * 100}% | Borrow APY: ${rates.borrowApy * 100}%`;
              // Example: Execute swap action
              const success = await window.dashboard.executeDeFiAction('swap', { protocol: '1inch', from: 'AETH', to: 'MATIC', amount: 25 });
              if (success) el.textContent += '\nSwap successful!';
            }
          };
        }
      }

      initDefiLending();
      initYieldFarming();
      initCrossChainSwaps();

      // Advanced Security Features
      function initBiometricLogin() {
        const el = document.getElementById('biometricLoginPlaceholder');
        if (el) el.textContent = 'Loading biometric login (stub)...';
        const btn = document.getElementById('enableBiometricBtn');
        if (btn) {
          btn.onclick = function () {
            window.dashboard.notify('Biometric login enabled (stub)', 'success');
            // TODO: Integrate with WebAuthn or device biometrics
          };
        }
      }
      function initDeviceTrust() {
        const el = document.getElementById('deviceTrustPlaceholder');
        if (el) el.textContent = 'Loading device trust management (stub)...';
        const btn = document.getElementById('manageDeviceTrustBtn');
        if (btn) {
          btn.onclick = function () {
            window.dashboard.notify('Device trust management opened (stub)', 'info');
            // TODO: Show/manage trusted devices
          };
        }
      }
      function initAntiPhishing() {
        const el = document.getElementById('antiPhishingPlaceholder');
        if (el) el.textContent = 'Loading anti-phishing protection (stub)...';
        const btn = document.getElementById('enableAntiPhishingBtn');
        if (btn) {
          btn.onclick = function () {
            window.dashboard.notify('Anti-phishing protection enabled (stub)', 'success');
            // TODO: Integrate anti-phishing features
          };
        }
      }

      initBiometricLogin();
      initDeviceTrust();
      initAntiPhishing();

      // Social/Community Features
      function initLiveChat() {
        const el = document.getElementById('liveChatPlaceholder');
        if (el) el.textContent = 'Loading live chat (stub)...';
        const btn = document.getElementById('openLiveChatBtn');
        if (btn) {
          btn.onclick = function () {
            window.dashboard.notify('Live chat opened (stub)', 'info');
            // TODO: Integrate chat widget (Discord, Telegram, custom)
          };
        }
      }
      function initUserProfiles() {
        const el = document.getElementById('userProfilesPlaceholder');
        if (el) el.textContent = 'Loading user profiles...';
        // Simulate fetching user profile
        setTimeout(() => {
          if (el) el.textContent = 'Welcome, Alex!';
        }, 600);
        const btn = document.getElementById('editProfileBtn');
        if (btn) {
          btn.onclick = function () {
            // Open profile editor modal
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
              <div class="modal-content">
                <h2>Edit Profile</h2>
                <label>Name: <input id="profileNameInput" type="text" value="Alex" /></label><br>
                <label>Email: <input id="profileEmailInput" type="email" value="alex@email.com" /></label><br>
                <button id="saveProfileBtn">Save</button>
                <button id="closeProfileModalBtn">Close</button>
              </div>
            `;
            document.body.appendChild(modal);
            document.getElementById('closeProfileModalBtn').onclick = () => modal.remove();
            document.getElementById('saveProfileBtn').onclick = () => {
              const name = document.getElementById('profileNameInput').value;
              const email = document.getElementById('profileEmailInput').value;
              el.textContent = `Welcome, ${name}!`;
              window.dashboard.notify('Profile updated!', 'success');
              modal.remove();
              // TODO: Persist profile changes to backend/localStorage
            };
          };
        }
      }
      function initLeaderboard() {
        const el = document.getElementById('leaderboardPlaceholder');
        if (el) el.textContent = 'Loading leaderboard (stub)...';
        const btn = document.getElementById('viewLeaderboardBtn');
        if (btn) {
          btn.onclick = function () {
            window.dashboard.notify('Leaderboard viewed (stub)', 'info');
            // TODO: Show leaderboard modal
          };
        }
      }

      initLiveChat();
      initUserProfiles();
      initLeaderboard();

      // AI-Powered Analytics
      function initPredictiveTrends() {
        const el = document.getElementById('predictiveTrendsPlaceholder');
        if (el) el.textContent = 'Loading predictive trends (stub)...';
        const btn = document.getElementById('runPredictiveTrendsBtn');
        if (btn) {
          btn.onclick = function () {
            window.dashboard.notify('Predictive trends analysis started (stub)', 'info');
            // TODO: Run AI model and render chart
          };
        }
      }
      function initAnomalyDetection() {
        const el = document.getElementById('anomalyDetectionPlaceholder');
        if (el) el.textContent = 'Loading anomaly detection (stub)...';
        const btn = document.getElementById('runAnomalyDetectionBtn');
        if (btn) {
          btn.onclick = function () {
            window.dashboard.notify('Anomaly detection started (stub)', 'warning');
            // TODO: Run anomaly detection model and render chart
          };
        }
      }

      initPredictiveTrends();
      initAnomalyDetection();

      // Onboarding Enhancements
      function initVideoWalkthrough() {
        const el = document.getElementById('videoWalkthroughPlaceholder');
        if (el) el.textContent = 'Loading video walkthrough...';
        const btn = document.getElementById('playVideoWalkthroughBtn');
        if (btn) {
          btn.onclick = function () {
            // Play onboarding video modal
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
              <div class="modal-content">
                <h2>Welcome to Aetheron!</h2>
                <video controls autoplay width="400">
                  <source src="onboarding.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <button id="closeVideoModalBtn">Close</button>
              </div>
            `;
            document.body.appendChild(modal);
            document.getElementById('closeVideoModalBtn').onclick = () => modal.remove();
          };
        }
      }
      function initGamifiedTutorial() {
        const el = document.getElementById('gamifiedTutorialPlaceholder');
        if (el) el.textContent = 'Loading gamified tutorial...';
        const btn = document.getElementById('startGamifiedTutorialBtn');
        if (btn) {
          btn.onclick = function () {
            // Launch interactive tutorial modal
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
              <div class="modal-content">
                <h2>Gamified Tutorial</h2>
                <p>Complete tasks to earn badges and rewards!</p>
                <ul>
                  <li>Connect your wallet <span id="task1Status">❌</span></li>
                  <li>Make your first trade <span id="task2Status">❌</span></li>
                  <li>Vote in governance <span id="task3Status">❌</span></li>
                </ul>
                <button id="closeTutorialModalBtn">Close</button>
              </div>
            `;
            document.body.appendChild(modal);
            document.getElementById('closeTutorialModalBtn').onclick = () => modal.remove();
            // TODO: Track and update progress, persist to backend/localStorage
          };
        }
      }

      initVideoWalkthrough();
      initGamifiedTutorial();

      // Localization & RTL Support
      function initLocalization() {
        const el = document.getElementById('localizationPlaceholder');
        if (el) el.textContent = 'Loading localization settings...';
        const langSelector = document.getElementById('languageSelector');
        const rtlToggle = document.getElementById('rtlToggle');
        if (langSelector) {
          langSelector.onchange = function () {
            window.dashboard.notify('Language changed to ' + langSelector.value, 'info');
            localStorage.setItem('aetheron-language', langSelector.value);
            // TODO: Integrate with i18next or other i18n library
          };
          // Load saved language
          const savedLang = localStorage.getItem('aetheron-language');
          if (savedLang) langSelector.value = savedLang;
        }
        if (rtlToggle) {
          rtlToggle.onchange = function () {
            const enabled = rtlToggle.checked;
            document.documentElement.dir = enabled ? 'rtl' : 'ltr';
            window.dashboard.notify('RTL mode ' + (enabled ? 'enabled' : 'disabled'), 'info');
            localStorage.setItem('aetheron-rtl', enabled ? '1' : '0');
            // TODO: Persist RTL setting and update layout
          };
          // Load saved RTL setting
          const savedRtl = localStorage.getItem('aetheron-rtl');
          rtlToggle.checked = savedRtl === '1';
          document.documentElement.dir = rtlToggle.checked ? 'rtl' : 'ltr';
        }
      }

      initLocalization();

      // Accessibility Upgrades
      function initAccessibility() {
        const el = document.getElementById('accessibilityPlaceholder');
        if (el) el.textContent = 'Loading accessibility settings...';
        const srToggle = document.getElementById('screenReaderToggle');
        const dyslexiaToggle = document.getElementById('dyslexiaToggle');
        if (srToggle) {
          srToggle.onchange = function () {
            window.dashboard.notify('Screen reader optimization ' + (srToggle.checked ? 'enabled' : 'disabled'), 'info');
            localStorage.setItem('aetheron-screenreader', srToggle.checked ? '1' : '0');
            // TODO: Apply ARIA roles, landmarks, and focus management
          };
          // Load saved screen reader setting
          const savedSr = localStorage.getItem('aetheron-screenreader');
          srToggle.checked = savedSr === '1';
        }
        if (dyslexiaToggle) {
          dyslexiaToggle.onchange = function () {
            document.body.classList.toggle('dyslexia-font', dyslexiaToggle.checked);
            window.dashboard.notify('Dyslexia-friendly mode ' + (dyslexiaToggle.checked ? 'enabled' : 'disabled'), 'info');
            localStorage.setItem('aetheron-dyslexia', dyslexiaToggle.checked ? '1' : '0');
            // TODO: Apply OpenDyslexic or similar font
          };
          // Load saved dyslexia setting
          const savedDys = localStorage.getItem('aetheron-dyslexia');
          dyslexiaToggle.checked = savedDys === '1';
          document.body.classList.toggle('dyslexia-font', dyslexiaToggle.checked);
        }
      }

      initAccessibility();

      // Custom Notifications
      function initNotificationsSettings() {
        const el = document.getElementById('notificationsSettingsPlaceholder');
        if (el) el.textContent = 'Loading notification settings...';
        const pushToggle = document.getElementById('pushToggle');
        const emailToggle = document.getElementById('emailToggle');
        const inAppToggle = document.getElementById('inAppToggle');
        if (pushToggle) {
          pushToggle.onchange = function () {
            window.dashboard.notify('Push notifications ' + (pushToggle.checked ? 'enabled' : 'disabled'), 'info');
            localStorage.setItem('aetheron-push', pushToggle.checked ? '1' : '0');
            // TODO: Integrate with push notification service
          };
          // Load saved push setting
          const savedPush = localStorage.getItem('aetheron-push');
          pushToggle.checked = savedPush === '1';
        }
        if (emailToggle) {
          emailToggle.onchange = function () {
            window.dashboard.notify('Email notifications ' + (emailToggle.checked ? 'enabled' : 'disabled'), 'info');
            localStorage.setItem('aetheron-email', emailToggle.checked ? '1' : '0');
            // TODO: Integrate with email notification service
          };
          // Load saved email setting
          const savedEmail = localStorage.getItem('aetheron-email');
          emailToggle.checked = savedEmail === '1';
        }
        if (inAppToggle) {
          inAppToggle.onchange = function () {
            window.dashboard.notify('In-app notifications ' + (inAppToggle.checked ? 'enabled' : 'disabled'), 'info');
            localStorage.setItem('aetheron-inapp', inAppToggle.checked ? '1' : '0');
            // TODO: Integrate with in-app notification system
          };
          // Load saved in-app setting
          const savedInApp = localStorage.getItem('aetheron-inapp');
          inAppToggle.checked = savedInApp === '1';
        }
      }

      initNotificationsSettings();

      // Developer Tools
      function initDeveloperTools() {
        const el = document.getElementById('developerToolsPlaceholder');
        if (el) el.textContent = 'Loading developer tools (stub)...';
        const apiBtn = document.getElementById('openApiExplorerBtn');
        const contractBtn = document.getElementById('openContractPlaygroundBtn');
        if (apiBtn) {
          apiBtn.onclick = function () {
            window.dashboard.notify('API Explorer opened (stub)', 'info');
            // TODO: Launch API explorer modal
          };
        }
        if (contractBtn) {
          contractBtn.onclick = function () {
            window.dashboard.notify('Contract Playground opened (stub)', 'info');
            // TODO: Launch smart contract playground modal
          };
        }
      }

      initDeveloperTools();
  function initCommunityChat() {
    const el = document.getElementById('communityChatWidget');
    if (el) el.textContent = 'Chat widget coming soon (stub).';
    // TODO: Embed Discord/Telegram widget
  }
  // 6. NFT Gallery
  function initNFTGallery() {
    const el = document.getElementById('nftGalleryPlaceholder');
    if (el) el.textContent = 'No NFTs found (stub).';
    // TODO: Fetch/display user NFTs
  }
  // 7. Gas Fee Estimator
  function initGasFeeEstimator() {
    const el = document.getElementById('gasFeeEstimate');
    if (el) el.textContent = 'Estimated gas fee: -- (stub)';
    // TODO: Fetch Polygon gas price, update on speed select
  }
  // 8. Referral Leaderboard
  function initReferralLeaderboard() {
    const el = document.getElementById('referralLeaderboardPlaceholder');
    if (el) el.textContent = 'Leaderboard coming soon (stub).';
    // TODO: Fetch/display top referrers, handle referral link copy
  }
  // 9. Multi-Language Support
  function initLanguageSelector() {
    const el = document.getElementById('currentLanguage');
    if (el) el.textContent = 'Current: English (stub)';
    // TODO: Wire up language selector, load translations
  }
  // 10. Advanced Analytics
  function initAdvancedAnalytics() {
    const el = document.getElementById('advancedAnalyticsPlaceholder');
    const chartEl = document.getElementById('advancedAnalyticsChart');
    if (!chartEl) {
      if (el) el.textContent = 'Analytics chart not found.';
      return;
    }
    if (el) el.textContent = '';

    // Demo data for APY, wallet growth, protocol health
    const labels = [
      'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'
    ];
    const apyData = [5, 5.2, 5.1, 5.3, 5.4, 5.5, 5.6]; // %
    const walletGrowthData = [100, 120, 140, 180, 210, 250, 300]; // # wallets
    const protocolHealthData = [80, 82, 85, 87, 90, 92, 95]; // health score

    // Destroy previous chart if exists
    if (window.advancedAnalyticsChartInstance) {
      window.advancedAnalyticsChartInstance.destroy();
    }

    window.advancedAnalyticsChartInstance = new Chart(chartEl, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'APY (%)',
            data: apyData,
            borderColor: 'rgba(34,197,94,1)',
            backgroundColor: 'rgba(34,197,94,0.1)',
            yAxisID: 'y',
            tension: 0.4,
            pointRadius: 4,
            fill: true,
          },
          {
            label: 'Wallet Growth',
            data: walletGrowthData,
            borderColor: 'rgba(59,130,246,1)',
            backgroundColor: 'rgba(59,130,246,0.1)',
            yAxisID: 'y1',
            tension: 0.4,
            pointRadius: 4,
            fill: true,
          },
          {
            label: 'Protocol Health',
            data: protocolHealthData,
            borderColor: 'rgba(234,179,8,1)',
            backgroundColor: 'rgba(234,179,8,0.1)',
            yAxisID: 'y2',
            tension: 0.4,
            pointRadius: 4,
            fill: true,
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: '#fff' } },
          title: {
            display: true,
            text: 'Advanced Analytics: APY, Wallet Growth, Protocol Health',
            color: '#fff',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#fff',
            borderWidth: 1
          }
        },
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'APY (%)', color: '#fff' },
            ticks: { color: '#fff', callback: v => v + '%' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'Wallets', color: '#fff' },
            ticks: { color: '#fff' },
            grid: { drawOnChartArea: false }
          },
          y2: {
            type: 'linear',
            display: true,
            position: 'right',
            offset: true,
            title: { display: true, text: 'Health Score', color: '#fff' },
            ticks: { color: '#fff' },
            grid: { drawOnChartArea: false }
          },
          x: {
            ticks: { color: '#fff' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          }
        }
      }
    });
  }

// Add some startup animations
// Note: The initialization functions are now handled by the AetheronDashboard class constructor

window.addEventListener('load', () => {
  console.log('🚀 Aetheron Platform Loaded Successfully!');
  console.log('🌌 Welcome to the future of space exploration!');
});
