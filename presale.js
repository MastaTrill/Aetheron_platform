// Aetheron Base Presale Logic
let provider, signer, presaleContract;

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
const MAX_PRESALE_TOKENS = PRESALE_CONFIG.maxPresaleTokens || 33333333;
const CURRENT_CHAIN_ID = BASE_NETWORK.chainId;

const PRESALE_ABI = [
    "function buyTokens() public payable",
    "function rate() public view returns (uint256)",
    "function weiRaised() public view returns (uint256)",
    "function tokensReserved() public view returns (uint256)",
    "function token() public view returns (address)",
    "function softCap() public view returns (uint256)",
    "function hardCap() public view returns (uint256)",
    "function minContribution() public view returns (uint256)",
    "function maxContribution() public view returns (uint256)",
    "function startTime() public view returns (uint256)",
    "function endTime() public view returns (uint256)",
    "function finalized() public view returns (bool)",
    "function cancelled() public view returns (bool)",
    "function contributions(address) public view returns (uint256)",
    "function claimRefund() external",
    "function withdrawFunds() external"
];

const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)"
];

let currentRate = 1000000;
let totalRaisedETH = 0;
let hardCapETH = 0;
let minContributionETH = 0.0003;
let maxContributionETH = 33.333333;
let userContributionETH = 0;
let availablePurchaseTokens = 0;
let presaleIsLive = false;

function getElement(id) { return document.getElementById(id); }
function setText(id, value) { const element = getElement(id); if (element) element.innerText = value; }
function setHtml(id, value) { const element = getElement(id); if (element) element.innerHTML = value; }
function isAddressConfigured(address) { return /^0x[a-fA-F0-9]{40}$/.test(address) && address !== "0x0000000000000000000000000000000000000000"; }
function isPresaleConfigured() { return PRESALE_CONFIG.status === "live" && isAddressConfigured(PRESALE_CONTRACT_ADDRESS) && isAddressConfigured(AETH_TOKEN_ADDRESS); }
function formatNumber(value, decimals = 2) { return Number(value).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }); }

function setPurchaseControlsEnabled(enabled, label) {
    const buyBtn = getElement("buyBtn");
    const amountInput = getElement("maticAmount");
    if (buyBtn) { buyBtn.disabled = !enabled; if (label) buyBtn.innerText = label; }
    if (amountInput) amountInput.disabled = !enabled;
}

function setPresaleUnavailable(message) {
    presaleContract = null;
    presaleIsLive = false;
    setText("contractAddr", isAddressConfigured(PRESALE_CONTRACT_ADDRESS) ? PRESALE_CONTRACT_ADDRESS : "Not configured");
    setHtml("capStatus", `<span style="color:#ef4444;">${message}</span>`);
    setPurchaseControlsEnabled(false, "Unavailable");
}

function validatePurchaseAmount(amount) {
    if (!Number.isFinite(amount) || amount <= 0) return "Enter a valid contribution amount.";
    if (amount < minContributionETH) return `Minimum contribution is ${formatNumber(minContributionETH, 6)} ETH.`;
    const walletRemaining = Math.max(maxContributionETH - userContributionETH, 0);
    if (amount > walletRemaining) return `Wallet contribution limit remaining: ${formatNumber(walletRemaining, 6)} ETH.`;
    const hardCapRemaining = Math.max(hardCapETH - totalRaisedETH, 0);
    if (amount > hardCapRemaining) return `Hard-cap capacity remaining: ${formatNumber(hardCapRemaining, 6)} ETH.`;
    if (amount * currentRate > availablePurchaseTokens) return `Only ${formatNumber(availablePurchaseTokens, 2)} AETH remain available.`;
    return null;
}

async function ensureNetwork() {
    if (!window.ethereum) throw new Error("No Ethereum wallet detected.");
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId.toLowerCase() === CURRENT_CHAIN_ID) return;
    try {
        await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CURRENT_CHAIN_ID }] });
    } catch (error) {
        if (error.code !== 4902) throw error;
        await window.ethereum.request({ method: "wallet_addEthereumChain", params: [BASE_NETWORK] });
    }
}

async function connectWallet() {
    if (!window.ethereum) { alert("Please install MetaMask or another Base-compatible wallet."); return; }
    try {
        if (!window.ethers) throw new Error("Ethers library failed to load.");
        await ensureNetwork();
        provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        const address = await signer.getAddress();
        const connectBtn = getElement("connectBtn");
        const walletAddress = getElement("walletAddress");
        if (connectBtn) connectBtn.style.display = "none";
        if (walletAddress) walletAddress.style.display = "inline-block";
        setText("walletAddress", `Connected: ${address.substring(0, 6)}...${address.substring(38)}`);
        if (!isPresaleConfigured()) throw new Error("The verified presale configuration is not live.");
        presaleContract = new ethers.Contract(PRESALE_CONTRACT_ADDRESS, PRESALE_ABI, provider);
        setText("contractAddr", PRESALE_CONTRACT_ADDRESS);
        await loadPresaleData();
    } catch (error) {
        console.error("Connection failed", error);
        setPurchaseControlsEnabled(false, "Connect Wallet");
        alert("Wallet connection failed: " + (error.reason || error.message));
    }
}

async function loadPresaleData() {
    if (!presaleContract) return;
    try {
        const [rate, raised, reserved, tokenAddress, softCap, hardCap, minimum, maximum, start, end, finalized, cancelled] = await Promise.all([
            presaleContract.rate(), presaleContract.weiRaised(), presaleContract.tokensReserved(), presaleContract.token(),
            presaleContract.softCap(), presaleContract.hardCap(), presaleContract.minContribution(), presaleContract.maxContribution(),
            presaleContract.startTime(), presaleContract.endTime(), presaleContract.finalized(), presaleContract.cancelled()
        ]);
        if (tokenAddress.toLowerCase() !== AETH_TOKEN_ADDRESS.toLowerCase()) throw new Error("Presale token linkage does not match verified AETH.");
        const tokenContract = new ethers.Contract(AETH_TOKEN_ADDRESS, ERC20_ABI, provider);
        const [tokenBalance, decimals] = await Promise.all([tokenContract.balanceOf(PRESALE_CONTRACT_ADDRESS), tokenContract.decimals()]);
        if (tokenBalance.lt(reserved)) throw new Error("Presale inventory is below reserved-token liability.");
        let userContribution = ethers.constants.Zero;
        if (signer) userContribution = await presaleContract.contributions(await signer.getAddress());

        currentRate = rate.toNumber();
        totalRaisedETH = parseFloat(ethers.utils.formatEther(raised));
        hardCapETH = parseFloat(ethers.utils.formatEther(hardCap));
        minContributionETH = parseFloat(ethers.utils.formatEther(minimum));
        maxContributionETH = parseFloat(ethers.utils.formatEther(maximum));
        userContributionETH = parseFloat(ethers.utils.formatEther(userContribution));

        const inventory = parseFloat(ethers.utils.formatUnits(tokenBalance, decimals));
        const reservedTokens = parseFloat(ethers.utils.formatUnits(reserved, decimals));
        availablePurchaseTokens = Math.min(
            Math.max(inventory - reservedTokens, 0),
            Math.max((hardCapETH - totalRaisedETH) * currentRate, 0),
            Math.max(MAX_PRESALE_TOKENS - reservedTokens, 0)
        );

        setText("rateDisplay", `1 ETH = ${currentRate.toLocaleString()} AETH`);
        setText("raisedDisplay", `${formatNumber(totalRaisedETH, 6)} ETH`);
        setText("maxTokensDisplay", `${formatNumber(availablePurchaseTokens, 2)} AETH available`);
        setText("maxRaiseDisplay", `${formatNumber(hardCapETH, 6)} ETH`);
        const progressBar = getElement("progressBar");
        if (progressBar) progressBar.style.width = `${Math.min((totalRaisedETH / hardCapETH) * 100, 100).toFixed(2)}%`;

        const now = Math.floor(Date.now() / 1000);
        const starts = start.toNumber();
        const ends = end.toNumber();
        presaleIsLive = now >= starts && now <= ends && !finalized && !cancelled;
        if (presaleIsLive) {
            const walletRemaining = Math.max(maxContributionETH - userContributionETH, 0);
            setText("capStatus", `Soft Cap: ${formatNumber(parseFloat(ethers.utils.formatEther(softCap)), 6)} ETH | Hard Cap: ${formatNumber(hardCapETH, 6)} ETH | Wallet Remaining: ${formatNumber(walletRemaining, 6)} ETH`);
            setPurchaseControlsEnabled(walletRemaining >= minContributionETH && availablePurchaseTokens > 0, "Enter Amount");
        } else if (finalized) {
            setHtml("capStatus", '<span style="color:#22c55e;">Presale finalized.</span>');
            setPurchaseControlsEnabled(false, "Finalized");
        } else if (cancelled || now > ends) {
            setHtml("capStatus", '<span style="color:#ef4444;">Presale ended. Refunds may be available.</span>');
            const section = getElement("refundSection"); if (section) section.style.display = "block";
            setPurchaseControlsEnabled(false, "Presale Ended");
        } else {
            setHtml("capStatus", '<span style="color:#f59e0b;">Presale has not started.</span>');
            setPurchaseControlsEnabled(false, "Not Started");
        }
    } catch (error) {
        console.error("Error loading presale", error);
        setPresaleUnavailable(error.message || "Unable to verify the presale contract. Purchases are disabled.");
    }
}

function calculateTokens() {
    const input = getElement("maticAmount");
    const output = getElement("tokenAmount");
    const warning = getElement("capWarning");
    const buyBtn = getElement("buyBtn");
    if (!input || !output || !warning || !buyBtn) return;
    const amount = Number(input.value);
    warning.style.display = "none";
    if (!presaleContract || !presaleIsLive) { setPurchaseControlsEnabled(false, "Unavailable"); return; }
    if (!Number.isFinite(amount) || amount <= 0) { output.value = ""; buyBtn.disabled = true; return; }
    output.value = `${(amount * currentRate).toLocaleString()} AETH`;
    const error = validatePurchaseAmount(amount);
    if (error) { warning.innerText = error; warning.style.display = "block"; buyBtn.disabled = true; buyBtn.innerText = "Invalid Amount"; return; }
    buyBtn.disabled = !signer;
    buyBtn.innerText = "Buy Tokens";
}

async function buyTokens() {
    if (!presaleContract || !signer || !presaleIsLive) { alert("Presale is not available."); return; }
    const input = getElement("maticAmount");
    const buyBtn = getElement("buyBtn");
    const amount = input?.value || "";
    const error = validatePurchaseAmount(Number(amount));
    if (error) { alert(error); return; }
    try {
        buyBtn.disabled = true; buyBtn.innerText = "Simulating...";
        const writable = presaleContract.connect(signer);
        const value = ethers.utils.parseEther(amount);
        await writable.callStatic.buyTokens({ value });
        const estimate = await writable.estimateGas.buyTokens({ value });
        buyBtn.innerText = "Confirm in Wallet";
        const tx = await writable.buyTokens({ value, gasLimit: estimate.mul(120).div(100) });
        alert("Purchase submitted. Waiting for Base confirmation...");
        await tx.wait();
        alert("Success! Your AETH allocation is reserved.");
        input.value = "";
        await loadPresaleData();
    } catch (error) {
        console.error(error);
        alert("Transaction failed: " + (error.reason || error.data?.message || error.message));
    } finally {
        buyBtn.innerText = "Buy Tokens";
        calculateTokens();
    }
}

async function claimRefund() {
    if (!presaleContract || !signer) return;
    try { const tx = await presaleContract.connect(signer).claimRefund(); await tx.wait(); alert("Refund claimed."); await loadPresaleData(); }
    catch (error) { alert("Refund failed: " + (error.reason || error.message)); }
}

async function withdrawToTreasury() {
    if (!presaleContract || !signer) return;
    try { const tx = await presaleContract.connect(signer).withdrawFunds(); await tx.wait(); alert("Funds withdrawn to treasury."); await loadPresaleData(); }
    catch (error) { alert("Withdrawal failed: " + (error.reason || error.message)); }
}

if (!isPresaleConfigured()) setPresaleUnavailable("The verified Base presale configuration is unavailable.");
else { setText("contractAddr", PRESALE_CONTRACT_ADDRESS); setPurchaseControlsEnabled(false, "Connect Wallet"); }
if (window.ethereum && window.ethereum.selectedAddress) connectWallet();
