const TOKEN_ADDRESS="0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
const STAKING_ADDRESS="0x896D9d37A67B0bBf81dde0005975DA7850FFa638";
const ERC20_ABI=["function approve(address,uint256)","function balanceOf(address)view returns(uint256)","function decimals()view returns(uint8)"];
const STAKING_ABI=["function stake(uint256)","function withdraw(uint256)","function claimRewards()","function balanceOf(address)view returns(uint256)","function earned(address)view returns(uint256)"];
let provider,signer,address,token,staking,decimals=18;
function setStatus(m){document.getElementById("statusBanner").innerText=m;}
async function connectWallet(){provider=new ethers.providers.Web3Provider(window.ethereum);await provider.send("eth_requestAccounts",[]);signer=provider.getSigner();address=await signer.getAddress();token=new ethers.Contract(TOKEN_ADDRESS,ERC20_ABI,signer);staking=new ethers.Contract(STAKING_ADDRESS,STAKING_ABI,signer);decimals=await token.decimals();document.getElementById("walletAddress").innerText=address;loadData();}
async function loadData(){const b=await token.balanceOf(address);const s=await staking.balanceOf(address);const r=await staking.earned(address);document.getElementById("walletBal").innerText=ethers.utils.formatUnits(b,decimals);document.getElementById("stakedBal").innerText=ethers.utils.formatUnits(s,decimals);document.getElementById("rewardBal").innerText=ethers.utils.formatUnits(r,decimals);}
function amt(){return ethers.utils.parseUnits(document.getElementById("amountInput").value,decimals);} 
async function approve(){setStatus("Approving");await (await token.approve(STAKING_ADDRESS,amt())).wait();setStatus("Approved");}
async function stake(){setStatus("Staking");await (await staking.stake(amt())).wait();setStatus("Staked");loadData();}
async function withdraw(){setStatus("Withdrawing");await (await staking.withdraw(amt())).wait();setStatus("Done");loadData();}
async function claim(){setStatus("Claiming");await (await staking.claimRewards()).wait();setStatus("Claimed");loadData();}