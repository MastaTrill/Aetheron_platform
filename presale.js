// Presale Logic
let provider, signer, presaleContract;
const PRESALE_CONFIG = window.AETHERON_PRESALE_CONFIG || {};
const AETH_TOKEN_ADDRESS = PRESALE_CONFIG.aethTokenAddress || "";
const PRESALE_CONTRACT_ADDRESS = PRESALE_CONFIG.presaleContractAddress || "";
const MAX_PRESALE_TOKENS = PRESALE_CONFIG.maxPresaleTokens || 33333333;
const NETWORK_CONFIG = PRESALE_CONFIG.network === "base" ? BASE_NETWORK : POLYGON_NETWORK;
const CURRENT_CHAIN_ID = NETWORK_CONFIG.chainId;

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
const PRESALE_ABI = [
    "function buyTokens() public payable",
    "function rate() public view returns (uint256)",
    "function weiRaised() public view returns (uint256)",
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
    "function updateRate(uint256) external onlyOwner",
    "function updateCaps(uint256,uint256) external onlyOwner",
    "function updateContributionLimits(uint256,uint256) external onlyOwner",
    "function updateSchedule(uint256,uint256) external onlyOwner",
    "function timeRemaining() external view returns (uint256)",
    "function withdrawFunds() external",
    "event TokensPurchased(address indexed buyer, uint256 weiAmount, uint256 tokenAmount)",
    "event Finalized(uint256 totalWeiRaised, uint256 totalTokensSold)",
    "event Cancelled()",
    "event RefundClaimed(address indexed contributor, uint256 weiAmount)",
    "event TokensClaimed(address indexed contributor, uint256 tokenAmount)"
];

let currentRate = 1000;
let totalRaisedETH = 0;
let hardCapETH = 0;
let minContributionETH = 0.001;
let maxContributionETH = 100;
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

function isPresaleConfigured() {
    return /^0x[a-fA-F0-9]{40}$/.test(PRESALE_CONTRACT_ADDRESS) &&
        PRESALE_CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000";
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
    setPurchaseControlsEnabled(false, 'Coming Soon');
}

function getEffectiveNativeCap() {
    return hardCapETH || (MAX_PRESALE_TOKENS / currentRate);
}

function formatNumber(value, decimals = 2) {
    return Number(value).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function updateTimeRemaining(startTime, endTime) {
    const now = Date.now() / 1000;
    if (now < startTime) {
        const diff = startTime - now;
        const hours = Math.floor(diff / 3600);
        const mins = Math.floor((diff % 3600) / 60);
        document.getElementById('timeRemaining').innerText = `${hours}h ${mins}m`;
    } else if (now < endTime) {
        const diff = endTime - now;
        const hours = Math.floor(diff / 3600);
        const mins = Math.floor((diff % 3600) / 60);
        document.getElementById('timeRemaining').innerText = `${hours}h ${mins}m`;
    }
}

async function ensureNetwork() {
    if (!window.ethereum) {
        throw new Error("No Ethereum wallet detected.");
    }

    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId === CURRENT_CHAIN_ID) return;

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
    if(!presaleContract || !signer) return;
    try {
        const presaleWithSigner = presaleContract.connect(signer);
        const tx = await presaleWithSigner.withdrawFunds();
        alert("Transaction sent! Waiting for confirmation...");
        await tx.wait();
        alert("Funds withdrawn to treasury successfully!");
        loadPresaleData();
    } catch (error) {
        alert("Withdraw failed: " + (error.reason || error.message));
    }
}

async function claimRefund() {
    if(!presaleContract || !signer) return;
    try {
        const tx = await presaleContract.claimRefund();
        alert("Transaction sent! Waiting for confirmation...");
        await tx.wait();
        alert("Refund claimed successfully!");
        loadPresaleData();
    } catch (error) {
        alert("Refund failed: " + (error.reason || error.message));
    }
}

async function connectWallet() {
    if (window.ethereum) {
        try {
            if (!window.ethers) {
                throw new Error("Ethers library failed to load.");
            }

            await ensureNetwork();
            provider = new ethers.providers.Web3Provider(window.ethereum, "any");
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            const address = await signer.getAddress();
            
            getElement('connectBtn').style.display = 'none';
            getElement('walletAddress').style.display = 'inline-block';
            setText('walletAddress', `Connected: ${address.substring(0,6)}...${address.substring(38)}`);
            
            if (isPresaleConfigured()) {
                presaleContract = new ethers.Contract(PRESALE_CONTRACT_ADDRESS, PRESALE_ABI, provider);
                setText('contractAddr', PRESALE_CONTRACT_ADDRESS);
                loadPresaleData();
            } else {
                setPresaleUnavailable("Presale contract is not deployed yet.");
            }

        } catch (error) {
            console.error("Connection failed", error);
            alert("Wallet connection failed: " + (error.reason || error.message));
        }
    } else {
        alert("Please install MetaMask!");
    }
}

async function loadPresaleData() {
    if(!presaleContract) return;
    try {
        const [rate, raised, softCap, hardCap, minContrib, maxContrib, startTime, endTime, finalized, cancelled] = await Promise.all([
            presaleContract.rate(),
            presaleContract.weiRaised(),
            presaleContract.softCap(),
            presaleContract.hardCap(),
            presaleContract.minContribution(),
            presaleContract.maxContribution(),
            presaleContract.startTime(),
            presaleContract.endTime(),
            presaleContract.finalized(),
            presaleContract.cancelled()
        ]);
        
        currentRate = rate.toNumber();
        const nativeSymbol = NETWORK_CONFIG.nativeCurrency.symbol;
        setText('rateDisplay', `1 ${nativeSymbol} = ${currentRate} AETH`);

        const raisedNative = parseFloat(ethers.utils.formatEther(raised));
        totalRaisedETH = raisedNative;
        setText('raisedDisplay', `${formatNumber(raisedNative, 6)} ${nativeSymbol}`);

        const softCapNative = parseFloat(ethers.utils.formatEther(softCap));
        hardCapETH = softCapNative;
        minContributionETH = parseFloat(ethers.utils.formatEther(minContrib));
        maxContributionETH = parseFloat(ethers.utils.formatEther(maxContrib));

        setText('maxTokensDisplay', `${Math.min(hardCapETH * currentRate, MAX_PRESALE_TOKENS).toLocaleString()} AETH`);
        setText('maxRaiseDisplay', `${formatNumber(hardCapETH, 6)} ${nativeSymbol}`);

        const progress = Math.min((raisedNative / hardCapETH) * 100, 100);
        getElement('progressBar').style.width = `${progress.toFixed(2)}%`;

        const now = Date.now() / 1000;
        const isLive = now >= startTime.toNumber() && now < endTime.toNumber() && !finalized && !cancelled;
        const isEnded = finalized || cancelled || now >= endTime.toNumber();
        presaleIsLive = isLive;

        if (isEnded && !finalized) {
            setHtml('capStatus', '<span style="color:#ef4444;">Presale ended. Refunds may be available.</span>');
            getElement('refundSection').style.display = 'block';
            setPurchaseControlsEnabled(false, 'Presale Ended');
        } else if (isLive) {
            setText('capStatus', `Soft Cap: ${formatNumber(softCapNative, 6)} ${nativeSymbol} | Hard Cap: ${formatNumber(hardCapETH, 6)} ${nativeSymbol}`);
            setPurchaseControlsEnabled(Boolean(signer), signer ? 'Enter Amount' : 'Connect Wallet');
        } else if (finalized) {
            setHtml('capStatus', '<span style="color:#22c55e;">Presale finalized! </span>Tokens can be claimed.');
            getElement('withdrawSection').style.display = 'block';
            setPurchaseControlsEnabled(false, 'Finalized');
        } else {
            setHtml('capStatus', '<span style="color:#f59e0b;">Presale starts in: </span><span id="timeRemaining"></span>');
            updateTimeRemaining(startTime.toNumber(), endTime.toNumber());
            setPurchaseControlsEnabled(false, 'Not Started');
        }
        
    } catch(err) {
        console.error("Error loading data", err);
        setPresaleUnavailable("Unable to read presale contract data. Purchases are disabled.");
    }
}

function calculateTokens() {
    const nativeInput = document.getElementById('maticAmount');
    const nativeValue = nativeInput.value;
    const warning = document.getElementById('capWarning');
    const buyBtn = document.getElementById('buyBtn');
    const nativeSymbol = NETWORK_CONFIG.nativeCurrency.symbol;

    warning.style.display = 'none';
    warning.innerText = '';

    if(!isPresaleConfigured() || !presaleContract || !presaleIsLive) {
        setPurchaseControlsEnabled(false, 'Coming Soon');
        return;
    }

    if(Number(nativeValue) > 0) {
        const effectiveNativeCap = hardCapETH || (MAX_PRESALE_TOKENS / currentRate);
        const remainingNative = Math.max(effectiveNativeCap - totalRaisedETH, 0);
        const nativeAmount = parseFloat(nativeValue);
        const tokens = nativeValue * currentRate;
        getElement('tokenAmount').value = tokens.toLocaleString() + " AETH";

        if (nativeAmount < minContributionETH) {
            warning.innerText = `Minimum contribution is ${formatNumber(minContributionETH, 6)} ${nativeSymbol}.`;
            warning.style.display = 'block';
            buyBtn.disabled = true;
            buyBtn.innerText = "Below Minimum";
            return;
        }

        if (nativeAmount > maxContributionETH) {
            warning.innerText = `Maximum contribution per wallet is ${formatNumber(maxContributionETH, 6)} ${nativeSymbol}.`;
            warning.style.display = 'block';
            buyBtn.disabled = true;
            buyBtn.innerText = "Above Maximum";
            return;
        }

        if (nativeAmount > remainingNative) {
            warning.innerText = `Cap reached or exceeded. Remaining capacity: ${formatNumber(remainingNative, 6)} ${nativeSymbol}.`;
            warning.style.display = 'block';
            buyBtn.disabled = true;
            buyBtn.innerText = "Cap Reached";
            return;
        }

        if (tokens > MAX_PRESALE_TOKENS) {
            warning.innerText = `Token cap exceeded. Max presale tokens: ${MAX_PRESALE_TOKENS.toLocaleString()} AETH.`;
            warning.style.display = 'block';
            buyBtn.disabled = true;
            buyBtn.innerText = "Cap Reached";
            return;
        }

        if(signer) buyBtn.disabled = false;
        buyBtn.innerText = "Buy Tokens";
    } else {
        document.getElementById('tokenAmount').value = "";
        buyBtn.disabled = true;
    }
}

async function buyTokens() {
    if(!isPresaleConfigured() || !presaleContract || !signer || !presaleIsLive) {
        alert("Presale is not live yet.");
        return;
    }
    
    const nativeAmount = document.getElementById('maticAmount').value;
    if(!nativeAmount) return;

    const nativeValue = parseFloat(nativeAmount);
    const nativeSymbol = NETWORK_CONFIG.nativeCurrency.symbol;
    
    if (nativeValue < minContributionETH) {
        alert(`Minimum contribution is ${formatNumber(minContributionETH, 6)} ${nativeSymbol}`);
        return;
    }
    if (nativeValue > maxContributionETH) {
        alert(`Maximum contribution per wallet is ${formatNumber(maxContributionETH, 6)} ${nativeSymbol}`);
        return;
    }

    try {
        document.getElementById('buyBtn').innerText = "Processing...";
        document.getElementById('buyBtn').disabled = true;

        const presaleWithSigner = presaleContract.connect(signer);
        const tx = await presaleWithSigner.buyTokens({
            value: ethers.utils.parseEther(nativeAmount)
        });
        
        alert("Transaction Sent! Waiting for confirmation...");
        
        await tx.wait();
        
        alert("Success! Tokens purchased.");
        document.getElementById('buyBtn').innerText = "Buy Tokens";
        document.getElementById('maticAmount').value = "";
        loadPresaleData();

    } catch (error) {
        console.error(error);
        alert("Transaction failed: " + (error.reason || error.message));
        document.getElementById('buyBtn').innerText = "Buy Tokens";
        document.getElementById('buyBtn').disabled = false;
    }
}

function initializePresalePage() {
    if (!isPresaleConfigured()) {
        setPresaleUnavailable("Presale contract is not deployed yet.");
        return;
    }

    setText('contractAddr', PRESALE_CONTRACT_ADDRESS);
    setPurchaseControlsEnabled(false, 'Connect Wallet');
}

// Auto connect if already permitted
initializePresalePage();

if(window.ethereum && window.ethereum.selectedAddress) {
    connectWallet();
}
