// Presale Logic
let provider, signer, presaleContract;
const PRESALE_CONFIG = window.AETHERON_PRESALE_CONFIG || {};
const AETH_TOKEN_ADDRESS = PRESALE_CONFIG.aethTokenAddress || "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
const PRESALE_CONTRACT_ADDRESS = PRESALE_CONFIG.presaleContractAddress || "";
const MAX_PRESALE_TOKENS = PRESALE_CONFIG.maxPresaleTokens || 40000000;
const POLYGON_CHAIN_ID = "0x89";
const POLYGON_CHAIN_PARAMS = {
    chainId: POLYGON_CHAIN_ID,
    chainName: "Polygon Mainnet",
    nativeCurrency: {
        name: "POL",
        symbol: "POL",
        decimals: 18
    },
    rpcUrls: ["https://polygon-rpc.com"],
    blockExplorerUrls: ["https://polygonscan.com"]
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
    "function treasury() public view returns (address)",
    "event TokensPurchased(address indexed buyer, uint256 weiAmount, uint256 tokenAmount)",
    "event Finalized(uint256 totalWeiRaised, uint256 totalTokensSold)",
    "event Cancelled()",
    "event RefundClaimed(address indexed contributor, uint256 weiAmount)",
    "event TokensClaimed(address indexed contributor, uint256 tokenAmount)"
];

let currentRate = 1000;
let totalRaisedMatic = 0;
let hardCapMatic = 0;
let minContributionMatic = 0.1;
let maxContributionMatic = 1000;
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

function getEffectiveMaticCap() {
    return hardCapMatic || (MAX_PRESALE_TOKENS / currentRate);
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

async function ensurePolygonNetwork() {
    if (!window.ethereum) {
        throw new Error("No Ethereum wallet detected.");
    }

    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId === POLYGON_CHAIN_ID) return;

    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: POLYGON_CHAIN_ID }]
        });
    } catch (error) {
        if (error.code !== 4902) throw error;
        await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [POLYGON_CHAIN_PARAMS]
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

            await ensurePolygonNetwork();
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
        setText('rateDisplay', `1 MATIC = ${currentRate} AETH`);

        const raisedMatic = parseFloat(ethers.utils.formatEther(raised));
        totalRaisedMatic = raisedMatic;
        setText('raisedDisplay', `${formatNumber(raisedMatic, 2)} MATIC`);

        const softCapMatic = parseFloat(ethers.utils.formatEther(softCap));
        hardCapMatic = parseFloat(ethers.utils.formatEther(hardCap));
        minContributionMatic = parseFloat(ethers.utils.formatEther(minContrib));
        maxContributionMatic = parseFloat(ethers.utils.formatEther(maxContrib));

        setText('maxTokensDisplay', `${Math.min(hardCapMatic * currentRate, MAX_PRESALE_TOKENS).toLocaleString()} AETH`);
        setText('maxRaiseDisplay', `${formatNumber(hardCapMatic, 2)} MATIC`);

        const progress = Math.min((raisedMatic / hardCapMatic) * 100, 100);
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
            setText('capStatus', `Soft Cap: ${formatNumber(softCapMatic, 2)} MATIC | Hard Cap: ${formatNumber(hardCapMatic, 2)} MATIC`);
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
    const maticInput = document.getElementById('maticAmount').value;
    const warning = document.getElementById('capWarning');
    const buyBtn = document.getElementById('buyBtn');

    warning.style.display = 'none';
    warning.innerText = '';

    if(!isPresaleConfigured() || !presaleContract || !presaleIsLive) {
        setPurchaseControlsEnabled(false, 'Coming Soon');
        return;
    }

    if(Number(maticInput) > 0) {
        const effectiveMaticCap = getEffectiveMaticCap();
        const remainingMatic = Math.max(effectiveMaticCap - totalRaisedMatic, 0);
        const maticAmount = parseFloat(maticInput);
        const tokens = maticInput * currentRate;
        getElement('tokenAmount').value = tokens.toLocaleString() + " AETH";

        if (maticAmount < minContributionMatic) {
            warning.innerText = `Minimum contribution is ${formatNumber(minContributionMatic, 2)} MATIC.`;
            warning.style.display = 'block';
            buyBtn.disabled = true;
            buyBtn.innerText = "Below Minimum";
            return;
        }

        if (maticAmount > maxContributionMatic) {
            warning.innerText = `Maximum contribution per wallet is ${formatNumber(maxContributionMatic, 2)} MATIC.`;
            warning.style.display = 'block';
            buyBtn.disabled = true;
            buyBtn.innerText = "Above Maximum";
            return;
        }

        if (maticAmount > remainingMatic) {
            warning.innerText = `Cap reached or exceeded. Remaining capacity: ${formatNumber(remainingMatic, 2)} MATIC.`;
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
    
    const maticAmount = document.getElementById('maticAmount').value;
    if(!maticAmount) return;

    const maticValue = parseFloat(maticAmount);
    if (maticValue < minContributionMatic) {
        alert(`Minimum contribution is ${formatNumber(minContributionMatic, 2)} MATIC`);
        return;
    }
    if (maticValue > maxContributionMatic) {
        alert(`Maximum contribution per wallet is ${formatNumber(maxContributionMatic, 2)} MATIC`);
        return;
    }

    try {
        document.getElementById('buyBtn').innerText = "Processing...";
        document.getElementById('buyBtn').disabled = true;

        const presaleWithSigner = presaleContract.connect(signer);
        const tx = await presaleWithSigner.buyTokens({
            value: ethers.utils.parseEther(maticAmount)
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
