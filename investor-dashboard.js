const TOKEN="0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
const STAKING="0x896D9d37A67B0bBf81dde0005975DA7850FFa638";
let provider,signer,user,token,staking,decimals=18;

function s(m){document.getElementById("status").innerText=m;}

async function connect(){provider=new ethers.providers.Web3Provider(window.ethereum);await provider.send("eth_requestAccounts",[]);signer=provider.getSigner();user=await signer.getAddress();token=new ethers.Contract(TOKEN,["function balanceOf(address)view returns(uint)","function approve(address,uint)","function decimals()view returns(uint8)"],signer);staking=new ethers.Contract(STAKING,["function stake(uint)","function withdraw(uint)","function claimRewards()","function balanceOf(address)view returns(uint)","function earned(address)view returns(uint)"],signer);decimals=await token.decimals();document.getElementById("addr").innerText=user;load();}

async function load(){const b=await token.balanceOf(user);const st=await staking.balanceOf(user);const r=await staking.earned(user);document.getElementById("bal").innerText=ethers.utils.formatUnits(b,decimals);document.getElementById("stk").innerText=ethers.utils.formatUnits(st,decimals);document.getElementById("rew").innerText=ethers.utils.formatUnits(r,decimals);}

function amt(){return ethers.utils.parseUnits(document.getElementById("amt").value,decimals);}

async function approve(){s("Approving...");await (await token.approve(STAKING,amt())).wait();s("Approved");}
async function stake(){s("Staking...");await (await staking.stake(amt())).wait();s("Staked");load();}
async function withdraw(){s("Withdrawing...");await (await staking.withdraw(amt())).wait();s("Done");load();}
async function claim(){s("Claiming...");await (await staking.claimRewards()).wait();s("Claimed");load();}
