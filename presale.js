// Presale Logic
let provider, signer, presaleContract;

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
const MAX_PRESALE_TOKENS = PRESALE_CONFIG.maxPresaleTokens || 33333333;
const NETWORK_CONFIG = PRESALE_CONFIG.network === "base" ? BASE_NETWORK : POLYGON_NETWORK;
const CURRENT_CHAIN_ID = NETWORK_CONFIG.chainId;

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
    "function tokensOwed(address) public view returns (uint256)",
    "function refundsAvailable() public view returns (bool)",
    "function claimTokens() external",
    "function claimRefund() external",
    "function updateRate(uint256) external",
    "function updateCaps(uint256,uint256) external",
    "function updateContributionLimits(uint256,uint256) external",
    "function updateSchedule(uint256,uint256) external",
    "function timeRemaining() external view returns (uint256)",
    "function withdrawFunds() external",
    "event TokensPurchased(address indexed buyer, uint256 weiAmount, uint256 tokenAmount)",
    "event Finalized(uint256 totalWeiRaised, uint256 totalTokensSold)",
    "event Cancelled()",
    "event RefundClaimed(address indexed contributor, uint256 weiAmount)",
    "event TokensClaimed(address indexed contributor, uint256 tokenAmount)"
];

const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)"
];

let currentRate = 1000;
let totalRaisedETH = 0;
let hardCapETH = 0;
let minContributionETH = 0.001;
let maxContributionETH = 100;
let userContributionETH = 0;
let availablePurchaseTokens = 0;
let presaleIsLive = false;

function getElement(id) {
    return document.getElementById(id);
}

function setText(id, value) {
    const element = getElement(id);
    if (element) element.innerText = value;
}

function setHtml(id, value) {
    const element = getElement(id);
    if (element) element.innerHTML = value;
}

function isAddressConfigured(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address) &&
        address !== "0x0000000000000000000000000000000000000000";
}

function isPresaleConfigured() {
    return isAddressConfigured(PRESALE_CONTRACT_ADDRESS) && isAddressConfigured(AETH_TOKEN_ADDRESS);
}

function setPurchaseControlsEnabled(enabled, label) {
    const buyBtn = getElement('buyBtn');
    const amountInput = getElement('maticAmount');
    if (buyBtn) {
        buyBtn.disabled = !enabled;
        if (label) buyBtn.innerText = label;
    }
    if (amountInput) amountInput.disabled = !enabled;
}

function setPresaleUnavailable(message) {
    presaleContract = null;
    presaleIsLive = false;
    setText('contractAddr', isPresaleConfigured() ? PRESALE_CONTRACT_ADDRESS : 'Not deployed');
    setHtml('capStatus', `<span style="color:#ef4444;">${message}</span>`);
    setPurchaseControlsEnabled(false, 'Unavailable');
}

function formatNumber(value, decimals = 2) {
    return Number(value).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function updateTimeRemaining(startTime, endTime) {
    const element = getElement('timeRemaining');
    if (!element) return;

    const now = Date.now() / 1000;
    if (now < startTime) {
        const diff = startTime - now;
        const hours = Math.floor(diff / 3600);
        const mins = Math.floor((diff % 3600) / 60);
        element.innerText = `${hours}h ${mins}m`;
    } else if (now < endTime) {
        const diff = endTime - now;
        const hours = Math.floor(diff / 3600);
        const mins = Math.floor((diff % 3600) / 60);
        element.innerText = `${hours}h ${mins}m`;
    } else {
        element.innerText = 'Ended';
    }
}

function validatePurchaseAmount(nativeAmount) {
    const nativeSymbol = NETWORK_CONFIG.nativeCurrency.symbol;
    if (!Number.isFinite(nativeAmount) || nativeAmount <= 0) {
        return "Enter a valid contribution amount.";
    }
    if (nativeAmount < minContributionETH) {
        return `Minimum contribution is ${formatNumber(minContributionETH, 6)} ${nativeSymbol}.`;
    }

    const walletRemaining = Math.max(maxContributionETH - userContributionETH, 0);
    if (nativeAmount > walletRemaining) {
        return `Wallet contribution limit remaining: ${formatNumber(walletRemaining, 6)} ${nativeSymbol}.`;
    }

    const hardCapRemaining = Math.max(hardCapETH - totalRaisedETH, 0);
    if (nativeAmount > hardCapRemaining) {
        return `Hard-cap capacity remaining: ${formatNumber(hardCapRemaining, 6)} ${nativeSymbol}.`;
    }

    const requestedTokens = nativeAmount * currentRate;
    if (requestedTokens > availablePurchaseTokens) {
        return `Only ${formatNumber(availablePurchaseTokens, 2)} AETH remain available for purchase.`;
    }

    return null;
}

async function ensureNetwork() {
    if (!window.ethereum) {
        throw new Error("No Ethereum wallet detected.");
    }

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

async function withdrawToTreasury() {
    if (!presaleContract || !signer) return;
    try {
        const presaleWithSigner = presaleContract.connect(signer);
        const tx = await presaleWithSigner.withdrawFunds();
        alert("Transaction sent! Waiting for confirmation...");
        await tx.wait();
        alert("Funds withdrawn to treasury successfully!");
        await loadPresaleData();
    } catch (error) {
        alert("Withdraw failed: " + (error.reason || error.message));
    }
}

async function claimRefund() {
    if (!presaleContract || !signer) return;
    try {
        const presaleWithSigner = presaleContract.connect(signer);
        const tx = await presaleWithSigner.claimRefund();
        alert("Transaction sent! Waiting for confirmation...");
        await tx.wait();
        alert("Refund claimed successfully!");
        await loadPresaleData();
    } catch (error) {
        alert("Refund failed: " + (error.reason || error.message));
    }
}

async function connectWallet() {
    if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
    }

    try {
        if (!window.ethers) {
            throw new Error("Ethers library failed to load.");
        }

        await ensureNetwork();
        provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        const address = await signer.getAddress();

        const connectBtn = getElement('connectBtn');
        const walletAddress = getElement('walletAddress');
        if (connectBtn) connectBtn.style.display = 'none';
        if (walletAddress) walletAddress.style.display = 'inline-block';
        setText('walletAddress', `Connected: ${address.substring(0, 6)}...${address.substring(38)}`);

        if (isPresaleConfigured()) {
            presaleContract = new ethers.Contract(PRESALE_CONTRACT_ADDRESS, PRESALE_ABI, provider);
            setText('contractAddr', PRESALE_CONTRACT_ADDRESS);
            await loadPresaleData();
        } else {
            setPresaleUnavailable("Presale contract configuration is incomplete.");
        }
    } catch (error) {
        console.error("Connection failed", error);
        setPurchaseControlsEnabled(false, 'Connect Wallet');
        alert("Wallet connection failed: " + (error.reason || error.message));
    }
}

async function loadPresaleData() {
    if (!presaleContract) return;

    try {
        const [
            rate,
            raised,
            tokensReserved,
            tokenAddress,
            softCap,
            hardCap,
            minContrib,
            maxContrib,
            startTime,
            endTime,
            finalized,
            cancelled
        ] = await Promise.all([
            presaleContract.rate(),
            presaleContract.weiRaised(),
            presaleContract.tokensReserved(),
            presaleContract.token(),
            presaleContract.softCap(),
            presaleContract.hardCap(),
            presaleContract.minContribution(),
            presaleContract.maxContribution(),
            presaleContract.startTime(),
            presaleContract.endTime(),
            presaleContract.finalized(),
            presaleContract.cancelled()
        ]);

        if (tokenAddress.toLowerCase() !== AETH_TOKEN_ADDRESS.toLowerCase()) {
            throw new Error("Configured AETH token does not match the presale contract token.");
        }

        const tokenContract = new ethers.Contract(AETH_TOKEN_ADDRESS, ERC20_ABI, provider);
        const [tokenBalance, tokenDecimals] = await Promise.all([
            tokenContract.balanceOf(PRESALE_CONTRACT_ADDRESS),
            tokenContract.decimals()
        ]);

        if (tokenBalance.lt(tokensReserved)) {
            throw new Error("Presale token inventory is below its reserved-token liability.");
        }

        let userContribution = ethers.constants.Zero;
        if (signer) {
            userContribution = await presaleContract.contributions(await signer.getAddress());
        }

        currentRate = rate.toNumber();
        const nativeSymbol = NETWORK_CONFIG.nativeCurrency.symbol;
        setText('rateDisplay', `1 ${nativeSymbol} = ${currentRate} AETH`);

        const raisedNative = parseFloat(ethers.utils.formatEther(raised));
        totalRaisedETH = raisedNative;
        userContributionETH = parseFloat(ethers.utils.formatEther(userContribution));
        setText('raisedDisplay', `${formatNumber(raisedNative, 6)} ${nativeSymbol}`);

        const softCapNative = parseFloat(ethers.utils.formatEther(softCap));
        const hardCapNative = parseFloat(ethers.utils.formatEther(hardCap));
        hardCapETH = hardCapNative;
        minContributionETH = parseFloat(ethers.utils.formatEther(minContrib));
        maxContributionETH = parseFloat(ethers.utils.formatEther(maxContrib));

        const inventory = parseFloat(ethers.utils.formatUnits(tokenBalance, tokenDecimals));
        const reserved = parseFloat(ethers.utils.formatUnits(tokensReserved, tokenDecimals));
        const unreservedInventory = Math.max(inventory - reserved, 0);
        const remainingByHardCap = Math.max((hardCapNative - raisedNative) * currentRate, 0);
        const remainingByConfiguredTokenCap = Math.max(MAX_PRESALE_TOKENS - reserved, 0);
        availablePurchaseTokens = Math.min(
            unreservedInventory,
            remainingByHardCap,
            remainingByConfiguredTokenCap
        );

        setText('maxTokensDisplay', `${formatNumber(availablePurchaseTokens, 2)} AETH available`);
        setText('maxRaiseDisplay', `${formatNumber(hardCapNative, 6)} ${nativeSymbol}`);

        const progress = hardCapNative > 0
            ? Math.min((raisedNative / hardCapNative) * 100, 100)
            : 0;
        const progressBar = getElement('progressBar');
        if (progressBar) progressBar.style.width = `${progress.toFixed(2)}%`;

        const now = Date.now() / 1000;
        const start = startTime.toNumber();
        const end = endTime.toNumber();
        const isLive = now >= start && now <= end && !finalized && !cancelled;
        const isEnded = finalized || cancelled || now > end;
        presaleIsLive = isLive;

        if (isEnded && !finalized) {
            setHtml('capStatus', '<span style="color:#ef4444;">Presale ended. Refunds may be available.</span>');
            const refundSection = getElement('refundSection');
            if (refundSection) refundSection.style.display = 'block';
            setPurchaseControlsEnabled(false, 'Presale Ended');
        } else if (isLive) {
            const walletRemaining = Math.max(maxContributionETH - userContributionETH, 0);
            setText(
                'capStatus',
                `Soft Cap: ${formatNumber(softCapNative, 6)} ${nativeSymbol} | Hard Cap: ${formatNumber(hardCapNative, 6)} ${nativeSymbol} | Wallet Remaining: ${formatNumber(walletRemaining, 6)} ${nativeSymbol}`
            );
            setPurchaseControlsEnabled(Boolean(signer) && walletRemaining >= minContributionETH && availablePurchaseTokens > 0, signer ? 'Enter Amount' : 'Connect Wallet');
        } else if (finalized) {
            setHtml('capStatus', '<span style="color:#22c55e;">Presale finalized! </span>Tokens can be claimed.');
            const withdrawSection = getElement('withdrawSection');
            if (withdrawSection) withdrawSection.style.display = 'block';
            setPurchaseControlsEnabled(false, 'Finalized');
        } else {
            setHtml('capStatus', '<span style="color:#f59e0b;">Presale starts in: </span><span id="timeRemaining"></span>');
            updateTimeRemaining(start, end);
            setPurchaseControlsEnabled(false, 'Not Started');
        }
    } catch (error) {
        console.error("Error loading data", error);
        setPresaleUnavailable(error.message || "Unable to read presale contract data. Purchases are disabled.");
    }
}

function calculateTokens() {
    const nativeInput = getElement('maticAmount');
    const tokenAmount = getElement('tokenAmount');
    const warning = getElement('capWarning');
    const buyBtn = getElement('buyBtn');

    if (!nativeInput || !tokenAmount || !warning || !buyBtn) return;

    const nativeAmount = Number(nativeInput.value);
    warning.style.display = 'none';
    warning.innerText = '';

    if (!isPresaleConfigured() || !presaleContract || !presaleIsLive) {
        setPurchaseControlsEnabled(false, 'Unavailable');
        return;
    }

    if (!Number.isFinite(nativeAmount) || nativeAmount <= 0) {
        tokenAmount.value = "";
        buyBtn.disabled = true;
        return;
    }

    tokenAmount.value = `${(nativeAmount * currentRate).toLocaleString()} AETH`;
    const validationError = validatePurchaseAmount(nativeAmount);
    if (validationError) {
        warning.innerText = validationError;
        warning.style.display = 'block';
        buyBtn.disabled = true;
        buyBtn.innerText = "Invalid Amount";
        return;
    }

    buyBtn.disabled = !signer;
    buyBtn.innerText = "Buy Tokens";
}

async function buyTokens() {
    if (!isPresaleConfigured() || !presaleContract || !signer || !presaleIsLive) {
        alert("Presale is not live yet.");
        return;
    }

    const amountInput = getElement('maticAmount');
    const buyBtn = getElement('buyBtn');
    if (!amountInput || !buyBtn) return;

    const nativeAmount = amountInput.value;
    const nativeValue = Number(nativeAmount);
    const validationError = validatePurchaseAmount(nativeValue);
    if (validationError) {
        alert(validationError);
        return;
    }

    try {
        buyBtn.innerText = "Processing...";
        buyBtn.disabled = true;

        const presaleWithSigner = presaleContract.connect(signer);
        const value = ethers.utils.parseEther(nativeAmount);
        await presaleWithSigner.callStatic.buyTokens({ value });
        const gasEstimate = await presaleWithSigner.estimateGas.buyTokens({ value });
        const tx = await presaleWithSigner.buyTokens({
            value,
            gasLimit: gasEstimate.mul(120).div(100)
        });

        alert("Transaction sent! Waiting for confirmation...");
        await tx.wait();

        alert("Success! Tokens purchased.");
        amountInput.value = "";
        await loadPresaleData();
    } catch (error) {
        console.error(error);
        alert("Transaction failed: " + (error.reason || error.data?.message || error.message));
    } finally {
        buyBtn.innerText = "Buy Tokens";
        calculateTokens();
    }
}

function initializePresalePage() {
    if (!isPresaleConfigured()) {
        setPresaleUnavailable("Presale contract configuration is incomplete.");
        return;
    }

    setText('contractAddr', PRESALE_CONTRACT_ADDRESS);
    setPurchaseControlsEnabled(false, 'Connect Wallet');
}

initializePresalePage();

if (window.ethereum && window.ethereum.selectedAddress) {
    connectWallet();
}
