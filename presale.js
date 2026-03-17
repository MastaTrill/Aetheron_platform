// Presale Logic
let provider, signer, presaleContract;
const PRESALE_CONTRACT_ADDRESS = "REPLACE_WITH_DEPLOYED_ADDRESS"; // You must update this after deployment
const PRESALE_ABI = [
    "function buyTokens() public payable",
    "function rate() public view returns (uint256)",
    "function weiRaised() public view returns (uint256)",
    "event TokensPurchased(address indexed purchaser, uint256 value, uint256 amount)"
];

let currentRate = 1000;
let totalRaisedMatic = 0;

const MAX_PRESALE_TOKENS = 40000000;
const MAX_TOTAL_USD = 25000;
const MATIC_USD = 0.75;

function getMaxMaticByUsd() {
    return MAX_TOTAL_USD / MATIC_USD;
}

function getMaxMaticByTokens(rate) {
    return MAX_PRESALE_TOKENS / rate;
}

function getEffectiveMaticCap(rate) {
    return Math.min(getMaxMaticByUsd(), getMaxMaticByTokens(rate));
}

function formatNumber(value, decimals = 2) {
    return Number(value).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

async function connectWallet() {
    if (window.ethereum) {
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            const address = await signer.getAddress();
            
            document.getElementById('connectBtn').style.display = 'none';
            document.getElementById('walletAddress').style.display = 'inline-block';
            document.getElementById('walletAddress').innerText = `Connected: ${address.substring(0,6)}...${address.substring(38)}`;
            document.getElementById('buyBtn').disabled = false;
            
            // Initialize Contract
            if (PRESALE_CONTRACT_ADDRESS !== "REPLACE_WITH_DEPLOYED_ADDRESS") {
                presaleContract = new ethers.Contract(PRESALE_CONTRACT_ADDRESS, PRESALE_ABI, provider);
                document.getElementById('contractAddr').innerText = PRESALE_CONTRACT_ADDRESS;
                loadPresaleData();
            } else {
                alert("Presale contract address not set yet. Please check back later.");
            }

        } catch (error) {
            console.error("Connection failed", error);
        }
    } else {
        alert("Please install MetaMask!");
    }
}

async function loadPresaleData() {
    if(!presaleContract) return;
    try {
        const rate = await presaleContract.rate();
        currentRate = rate.toNumber();
        document.getElementById('rateDisplay').innerText = `1 MATIC = ${currentRate} AETH`;

        const raised = await presaleContract.weiRaised();
        const raisedMatic = ethers.utils.formatEther(raised);
        totalRaisedMatic = parseFloat(raisedMatic);
        document.getElementById('raisedDisplay').innerText = `${formatNumber(totalRaisedMatic, 2)} MATIC`;

        const maxMaticByUsd = getMaxMaticByUsd();
        const maxMaticByTokens = getMaxMaticByTokens(currentRate);
        const effectiveMaticCap = getEffectiveMaticCap(currentRate);

        const tokenCapDisplay = `${MAX_PRESALE_TOKENS.toLocaleString()} AETH`;
        const usdCapDisplay = `$${MAX_TOTAL_USD.toLocaleString()}`;
        document.getElementById('maxTokensDisplay').innerText = tokenCapDisplay;
        document.getElementById('maxRaiseDisplay').innerText = usdCapDisplay;

        const progress = Math.min((totalRaisedMatic / effectiveMaticCap) * 100, 100);
        document.getElementById('progressBar').style.width = `${progress.toFixed(2)}%`;

        const capNote = `Caps: ${formatNumber(maxMaticByUsd, 2)} MATIC ($${MAX_TOTAL_USD.toLocaleString()}) or ${formatNumber(maxMaticByTokens, 2)} MATIC (${MAX_PRESALE_TOKENS.toLocaleString()} AETH), whichever comes first.`;
        document.getElementById('capStatus').innerText = capNote;
        
    } catch(err) {
        console.error("Error loading data", err);
    }
}

function calculateTokens() {
    const maticInput = document.getElementById('maticAmount').value;
    const warning = document.getElementById('capWarning');
    const buyBtn = document.getElementById('buyBtn');

    warning.style.display = 'none';
    warning.innerText = '';

    if(maticInput > 0) {
        const effectiveMaticCap = getEffectiveMaticCap(currentRate);
        const remainingMatic = Math.max(effectiveMaticCap - totalRaisedMatic, 0);
        const maticAmount = parseFloat(maticInput);
        const tokens = maticInput * currentRate;
        document.getElementById('tokenAmount').value = tokens + " AETH";

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
    if(!presaleContract || !signer) return;
    
    const maticAmount = document.getElementById('maticAmount').value;
    if(!maticAmount) return;

    const effectiveMaticCap = getEffectiveMaticCap(currentRate);
    const remainingMatic = Math.max(effectiveMaticCap - totalRaisedMatic, 0);
    const maticValue = parseFloat(maticAmount);
    if (maticValue > remainingMatic) {
        alert(`Cap reached. Remaining capacity: ${formatNumber(remainingMatic, 2)} MATIC.`);
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
        
        alert("Success! tokens purchased.");
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

// Auto connect if already permitted
if(window.ethereum && window.ethereum.selectedAddress) {
    connectWallet();
}
