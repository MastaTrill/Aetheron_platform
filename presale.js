// Aetheron Presale — Base mainnet frontend
const POLYGON_NETWORK = {
  chainId: "0x89",
  chainName: "Polygon Mainnet",
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  rpcUrls: ["https://polygon-rpc.com"],
  blockExplorerUrls: ["https://polygonscan.com"]
};

const BASE_NETWORK = {
  chainId: "0x2105",
  chainName: "Base Mainnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://mainnet.base.org", "https://base.drpc.org"],
  blockExplorerUrls: ["https://basescan.org"]
};

const PRESALE_CONFIG = window.AETHERON_PRESALE_CONFIG || {};
const AETH_TOKEN_ADDRESS = PRESALE_CONFIG.aethTokenAddress || "";
const PRESALE_CONTRACT_ADDRESS = PRESALE_CONFIG.presaleContractAddress || "";
const MAX_PRESALE_TOKENS = Number(PRESALE_CONFIG.maxPresaleTokens || 33333333);
const NETWORK_CONFIG = PRESALE_CONFIG.network === "base" ? BASE_NETWORK : POLYGON_NETWORK;
const CURRENT_CHAIN_ID = NETWORK_CONFIG.chainId;

const PRESALE_ABI = [
  "function buyTokens() payable",
  "function rate() view returns (uint256)",
  "function weiRaised() view returns (uint256)",
  "function token() view returns (address)",
  "function softCap() view returns (uint256)",
  "function hardCap() view returns (uint256)",
  "function minContribution() view returns (uint256)",
  "function maxContribution() view returns (uint256)",
  "function startTime() view returns (uint256)",
  "function endTime() view returns (uint256)",
  "function finalized() view returns (bool)",
  "function cancelled() view returns (bool)",
  "function contributions(address) view returns (uint256)",
  "function tokensOwed(address) view returns (uint256)",
  "function refundsAvailable() view returns (bool)",
  "function claimTokens()",
  "function claimRefund()",
  "function withdrawFunds()"
];

let provider;
let signer;
let presaleContract;
let currentRate = 1000;
let totalRaisedETH = 0;
let softCapETH = 0;
let hardCapETH = 0;
let minContributionETH = Number(PRESALE_CONFIG.minContribution || 0.001);
let maxContributionETH = Number(PRESALE_CONFIG.maxContribution || 100);
let presaleIsLive = false;

function getElement(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const element = getElement(id);
  if (element) element.textContent = value;
}

function setHtml(id, value) {
  const element = getElement(id);
  if (element) element.innerHTML = value;
}

function formatNumber(value, decimals = 2) {
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function isPresaleConfigured() {
  return /^0x[a-fA-F0-9]{40}$/.test(PRESALE_CONTRACT_ADDRESS) &&
    PRESALE_CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000";
}

function setPurchaseControlsEnabled(enabled, label) {
  const buyButton = getElement("buyBtn");
  const amountInput = getElement("maticAmount");
  if (buyButton) {
    buyButton.disabled = !enabled;
    if (label) buyButton.textContent = label;
  }
  if (amountInput) amountInput.disabled = !enabled;
}

function setPresaleUnavailable(message) {
  presaleContract = undefined;
  presaleIsLive = false;
  setText("contractAddr", isPresaleConfigured() ? PRESALE_CONTRACT_ADDRESS : "Not deployed");
  setHtml("capStatus", `<span style="color:#ef4444;">${message}</span>`);
  setPurchaseControlsEnabled(false, "Unavailable");
}

function updateTimeRemaining(startTime, endTime) {
  const now = Math.floor(Date.now() / 1000);
  const target = now < startTime ? startTime : endTime;
  const remaining = Math.max(target - now, 0);
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  setText("timeRemaining", `${hours}h ${minutes}m`);
}

async function ensureNetwork() {
  if (!window.ethereum) throw new Error("No Ethereum wallet detected.");
  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  if (chainId.toLowerCase() === CURRENT_CHAIN_ID.toLowerCase()) return;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CURRENT_CHAIN_ID }]
    });
  } catch (error) {
    if (error.code !== 4902) throw error;
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [NETWORK_CONFIG]
    });
  }
}

async function loadPresaleData() {
  if (!presaleContract) return;
  try {
    const [rate, raised, softCap, hardCap, minContrib, maxContrib, start, end, finalized, cancelled, tokenAddress] = await Promise.all([
      presaleContract.rate(),
      presaleContract.weiRaised(),
      presaleContract.softCap(),
      presaleContract.hardCap(),
      presaleContract.minContribution(),
      presaleContract.maxContribution(),
      presaleContract.startTime(),
      presaleContract.endTime(),
      presaleContract.finalized(),
      presaleContract.cancelled(),
      presaleContract.token()
    ]);

    if (AETH_TOKEN_ADDRESS && tokenAddress.toLowerCase() !== AETH_TOKEN_ADDRESS.toLowerCase()) {
      throw new Error("Presale token does not match configured AETH token.");
    }

    currentRate = Number(rate.toString());
    totalRaisedETH = Number(ethers.utils.formatEther(raised));
    softCapETH = Number(ethers.utils.formatEther(softCap));
    hardCapETH = Number(ethers.utils.formatEther(hardCap));
    minContributionETH = Number(ethers.utils.formatEther(minContrib));
    maxContributionETH = Number(ethers.utils.formatEther(maxContrib));

    if (!(hardCapETH > 0) || hardCapETH < softCapETH) {
      throw new Error("Invalid presale cap configuration.");
    }

    const nativeSymbol = NETWORK_CONFIG.nativeCurrency.symbol;
    setText("rateDisplay", `1 ${nativeSymbol} = ${currentRate} AETH`);
    setText("raisedDisplay", `${formatNumber(totalRaisedETH, 6)} ${nativeSymbol}`);
    setText("maxTokensDisplay", `${Math.min(hardCapETH * currentRate, MAX_PRESALE_TOKENS).toLocaleString()} AETH`);
    setText("maxRaiseDisplay", `${formatNumber(hardCapETH, 6)} ${nativeSymbol}`);

    const progress = Math.min((totalRaisedETH / hardCapETH) * 100, 100);
    const progressBar = getElement("progressBar");
    if (progressBar) progressBar.style.width = `${progress.toFixed(2)}%`;

    const startTime = Number(start.toString());
    const endTime = Number(end.toString());
    const now = Math.floor(Date.now() / 1000);
    presaleIsLive = now >= startTime && now < endTime && !finalized && !cancelled && totalRaisedETH < hardCapETH;

    if (finalized) {
      setHtml("capStatus", '<span style="color:#22c55e;">Presale finalized. Tokens can be claimed.</span>');
      const section = getElement("withdrawSection");
      if (section) section.style.display = "block";
      setPurchaseControlsEnabled(false, "Finalized");
    } else if (cancelled || now >= endTime) {
      setHtml("capStatus", '<span style="color:#ef4444;">Presale ended. Refunds may be available.</span>');
      const section = getElement("refundSection");
      if (section) section.style.display = "block";
      setPurchaseControlsEnabled(false, "Presale Ended");
    } else if (presaleIsLive) {
      setText("capStatus", `Soft Cap: ${formatNumber(softCapETH, 6)} ${nativeSymbol} | Hard Cap: ${formatNumber(hardCapETH, 6)} ${nativeSymbol}`);
      setPurchaseControlsEnabled(Boolean(signer), signer ? "Enter Amount" : "Connect Wallet");
    } else {
      setHtml("capStatus", '<span style="color:#f59e0b;">Presale starts in: </span><span id="timeRemaining"></span>');
      updateTimeRemaining(startTime, endTime);
      setPurchaseControlsEnabled(false, "Not Started");
    }
  } catch (error) {
    console.error("Error loading presale data", error);
    setPresaleUnavailable(error.message || "Unable to read presale contract data.");
  }
}

async function connectWallet() {
  try {
    if (!window.ethers) throw new Error("Ethers library failed to load.");
    await ensureNetwork();
    provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    const address = await signer.getAddress();
    const connectButton = getElement("connectBtn");
    if (connectButton) connectButton.style.display = "none";
    const walletAddress = getElement("walletAddress");
    if (walletAddress) walletAddress.style.display = "inline-block";
    setText("walletAddress", `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
    presaleContract = new ethers.Contract(PRESALE_CONTRACT_ADDRESS, PRESALE_ABI, provider);
    setText("contractAddr", PRESALE_CONTRACT_ADDRESS);
    await loadPresaleData();
  } catch (error) {
    console.error("Wallet connection failed", error);
    alert(`Wallet connection failed: ${error.reason || error.message}`);
  }
}

function calculateTokens() {
  const input = getElement("maticAmount");
  const output = getElement("tokenAmount");
  const warning = getElement("capWarning");
  const buyButton = getElement("buyBtn");
  if (!input || !buyButton) return;
  if (warning) {
    warning.style.display = "none";
    warning.textContent = "";
  }

  const amount = Number(input.value);
  if (!presaleIsLive || !Number.isFinite(amount) || amount <= 0) {
    if (output) output.value = "";
    buyButton.disabled = true;
    return;
  }

  const remaining = Math.max(hardCapETH - totalRaisedETH, 0);
  const walletAddress = signer ? undefined : null;
  const tokens = amount * currentRate;
  if (output) output.value = `${tokens.toLocaleString()} AETH`;

  let message = "";
  if (amount < minContributionETH) message = `Minimum contribution is ${formatNumber(minContributionETH, 6)} ${NETWORK_CONFIG.nativeCurrency.symbol}.`;
  else if (amount > maxContributionETH) message = `Maximum contribution per wallet is ${formatNumber(maxContributionETH, 6)} ${NETWORK_CONFIG.nativeCurrency.symbol}.`;
  else if (amount > remaining) message = `Remaining capacity is ${formatNumber(remaining, 6)} ${NETWORK_CONFIG.nativeCurrency.symbol}.`;
  else if (tokens > MAX_PRESALE_TOKENS) message = `Token cap exceeded. Maximum is ${MAX_PRESALE_TOKENS.toLocaleString()} AETH.`;

  if (message) {
    if (warning) {
      warning.textContent = message;
      warning.style.display = "block";
    }
    buyButton.disabled = true;
    buyButton.textContent = "Invalid Amount";
  } else {
    buyButton.disabled = !signer;
    buyButton.textContent = signer ? "Buy Tokens" : "Connect Wallet";
  }
}

async function buyTokens() {
  if (!presaleContract || !signer || !presaleIsLive) {
    alert("Presale is not live.");
    return;
  }
  const input = getElement("maticAmount");
  const buyButton = getElement("buyBtn");
  const amountText = input ? input.value : "";
  const amount = Number(amountText);
  const remaining = Math.max(hardCapETH - totalRaisedETH, 0);
  if (!Number.isFinite(amount) || amount < minContributionETH || amount > maxContributionETH || amount > remaining) {
    alert("Contribution amount is outside the current presale limits.");
    return;
  }

  try {
    if (buyButton) {
      buyButton.disabled = true;
      buyButton.textContent = "Processing...";
    }
    const contractWithSigner = presaleContract.connect(signer);
    const tx = await contractWithSigner.buyTokens({ value: ethers.utils.parseEther(amountText) });
    await tx.wait();
    alert("Success! Tokens purchased.");
    if (input) input.value = "";
    await loadPresaleData();
  } catch (error) {
    console.error("Purchase failed", error);
    alert(`Transaction failed: ${error.reason || error.message}`);
  } finally {
    if (buyButton) {
      buyButton.textContent = "Buy Tokens";
      buyButton.disabled = !presaleIsLive;
    }
  }
}

async function claimRefund() {
  if (!presaleContract || !signer) return;
  try {
    const tx = await presaleContract.connect(signer).claimRefund();
    await tx.wait();
    alert("Refund claimed successfully.");
    await loadPresaleData();
  } catch (error) {
    alert(`Refund failed: ${error.reason || error.message}`);
  }
}

async function withdrawToTreasury() {
  if (!presaleContract || !signer) return;
  try {
    const tx = await presaleContract.connect(signer).withdrawFunds();
    await tx.wait();
    alert("Funds withdrawn to treasury successfully.");
    await loadPresaleData();
  } catch (error) {
    alert(`Withdraw failed: ${error.reason || error.message}`);
  }
}

function initializePresalePage() {
  if (!isPresaleConfigured()) {
    setPresaleUnavailable("Presale contract is not configured.");
    return;
  }
  setText("contractAddr", PRESALE_CONTRACT_ADDRESS);
  setPurchaseControlsEnabled(false, "Connect Wallet");
}

initializePresalePage();
if (window.ethereum && window.ethereum.selectedAddress) connectWallet();
