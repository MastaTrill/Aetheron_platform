// Presale Logic
let provider, signer, presaleContract;
const AETH_TOKEN_ADDRESS = "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
const PRESALE_CONTRACT_ADDRESS = "REPLACE_WITH_DEPLOYED_ADDRESS";
const MAX_PRESALE_TOKENS = 40000000;
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

function getEffectiveMaticCap(rate) {
    return hardCapMatic || 33333;
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
            provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            const address = await signer.getAddress();
            
            document.getElementById('connectBtn').style.display = 'none';
            document.getElementById('walletAddress').style.display = 'inline-block';
            document.getElementById('walletAddress').innerText = `Connected: ${address.substring(0,6)}...${address.substring(38)}`;
            document.getElementById('buyBtn').disabled = false;
            
            if (PRESALE_CONTRACT_ADDRESS !== "REPLACE_WITH_DEPLOYED_ADDRESS") {
                presaleContract = new ethers.Contract(PRESALE_CONTRACT_ADDRESS, PRESALE_ABI, provider);
                document.getElementById('contractAddr').innerText = PRESALE_CONTRACT_ADDRESS;
                loadPresaleData();
            } else {
                document.getElementById('contractAddr').innerText = "Presale contract not deployed yet";
                document.getElementById('buyBtn').disabled = true;
                document.getElementById('buyBtn').innerText = "Coming Soon";
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
        document.getElementById('rateDisplay').innerText = `1 MATIC = ${currentRate} AETH`;

        const raisedMatic = parseFloat(ethers.utils.formatEther(raised));
        totalRaisedMatic = raisedMatic;
        document.getElementById('raisedDisplay').innerText = `${formatNumber(raisedMatic, 2)} MATIC`;

        const maxMaticByTokens = currentRate;
        const softCapMatic = parseFloat(ethers.utils.formatEther(softCap));
        const hardCapMatic = parseFloat(ethers.utils.formatEther(hardCap));
        const minMatic = parseFloat(ethers.utils.formatEther(minContrib));
        const maxMaticPerWallet = parseFloat(ethers.utils.formatEther(maxContrib));

        document.getElementById('maxTokensDisplay').innerText = `${(hardCapMatic * currentRate).toLocaleString()} AETH`;
        document.getElementById('maxRaiseDisplay').innerText = `$${formatNumber(hardCapMatic * 0.75, 0)}`;

        const progress = Math.min((raisedMatic / hardCapMatic) * 100, 100);
        document.getElementById('progressBar').style.width = `${progress.toFixed(2)}%`;

        const now = Date.now() / 1000;
        const isLive = now >= startTime.toNumber() && now < endTime.toNumber() && !finalized && !cancelled;
        const isEnded = finalized || cancelled || now >= endTime.toNumber();

        if (isEnded && !finalized) {
            document.getElementById('capStatus').innerHTML = '<span style="color:#ef4444;">Presale ended. </span><button onclick="loadPresaleData()" style="margin-left:8px;padding:4px 8px;font-size:12px;">Refund Available</button>';
            document.getElementById('refundSection').style.display = 'block';
        } else if (isLive) {
            document.getElementById('capStatus').innerText = `Soft Cap: ${formatNumber(softCapMatic, 2)} MATIC | Hard Cap: ${formatNumber(hardCapMatic, 2)} MATIC`;
        } else if (finalized) {
            document.getElementById('capStatus').innerHTML = '<span style="color:#22c55e;">Presale finalized! </span>Tokens can be claimed.';
            document.getElementById('withdrawSection').style.display = 'block';
        } else {
            document.getElementById('capStatus').innerHTML = '<span style="color:#f59e0b;">Presale starts in: </span><span id="timeRemaining"></span>';
            updateTimeRemaining(startTime.toNumber(), endTime.toNumber());
        }
        
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

    const maticValue = parseFloat(maticAmount);
    if (maticValue < 0.1) {
        alert("Minimum contribution is 0.1 MATIC");
        return;
    }
    if (maticValue > 1000) {
        alert("Maximum contribution per wallet is 1000 MATIC");
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

// Auto connect if already permitted
if(window.ethereum && window.ethereum.selectedAddress) {
    connectWallet();
}
