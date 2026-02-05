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
        document.getElementById('raisedDisplay').innerText = `${parseFloat(raisedMatic).toFixed(2)} MATIC`;
        
    } catch(err) {
        console.error("Error loading data", err);
    }
}

function calculateTokens() {
    const maticInput = document.getElementById('maticAmount').value;
    if(maticInput > 0) {
        const tokens = maticInput * currentRate;
        document.getElementById('tokenAmount').value = tokens + " AETH";
        if(signer) document.getElementById('buyBtn').disabled = false;
        document.getElementById('buyBtn').innerText = "Buy Tokens";
    } else {
        document.getElementById('tokenAmount').value = "";
        document.getElementById('buyBtn').disabled = true;
    }
}

async function buyTokens() {
    if(!presaleContract || !signer) return;
    
    const maticAmount = document.getElementById('maticAmount').value;
    if(!maticAmount) return;

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
