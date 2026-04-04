let provider;
let signer;
let userAddress;
let token;
let staking;
let decimals = 18;

function setStatus(msg){ document.getElementById("status").innerText = msg; }

async function ensurePolygon(){
  const chainId = await window.ethereum.request({method:"eth_chainId"});
  if(chainId === POLYGON_MAINNET.chainIdHex) return;
  try{
    await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId: POLYGON_MAINNET.chainIdHex}]});
  }catch{
    await window.ethereum.request({method:"wallet_addEthereumChain",params:[POLYGON_MAINNET]});
  }
}

async function connect(){
  if(!window.ethereum){ alert("Install MetaMask"); return; }
  await ensurePolygon();
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts",[]);
  signer = provider.getSigner();
  userAddress = await signer.getAddress();
  token = new ethers.Contract(AETHERON_TOKEN_ADDRESS, ERC20_ABI, signer);
  staking = new ethers.Contract(AETHERON_STAKING_ADDRESS, STAKING_ABI, signer);
  decimals = await token.decimals();
  document.getElementById("wallet").innerText = userAddress;
  load();
}

async function load(){
  const bal = await token.balanceOf(userAddress);
  const staked = await staking.balanceOf(userAddress);
  const rewards = await staking.earned(userAddress);
  document.getElementById("balance").innerText = ethers.utils.formatUnits(bal, decimals);
  document.getElementById("staked").innerText = ethers.utils.formatUnits(staked, decimals);
  document.getElementById("rewards").innerText = ethers.utils.formatUnits(rewards, decimals);
}

function amt(){ return ethers.utils.parseUnits(document.getElementById("amount").value, decimals); }

async function approve(){ const tx = await token.approve(AETHERON_STAKING_ADDRESS, amt()); await tx.wait(); setStatus("Approved"); }
async function stake(){ const tx = await staking.stake(amt()); await tx.wait(); setStatus("Staked"); load(); }
async function withdraw(){ const tx = await staking.withdraw(amt()); await tx.wait(); setStatus("Withdrawn"); load(); }
async function claim(){ const tx = await staking.claimRewards(); await tx.wait(); setStatus("Rewards claimed"); load(); }

window.onload = ()=>{
 document.getElementById("connect").onclick=connect;
 document.getElementById("approve").onclick=approve;
 document.getElementById("stake").onclick=stake;
 document.getElementById("withdraw").onclick=withdraw;
 document.getElementById("claim").onclick=claim;
};