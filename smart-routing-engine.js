const SR_CONFIG={
  chainIdHex:'0x89',
  routers:[
    {name:'QuickSwap V2',address:'0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff'},
    {name:'SushiSwap',address:'0x1b02da8cb0d097eb8d57a175b88c7d8b47997506'}
  ],
  tokens:{
    AETH:{symbol:'AETH',address:'0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e',decimals:18},
    WMATIC:{symbol:'WMATIC',address:'0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',decimals:18},
    USDC:{symbol:'USDC',address:'0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',decimals:6}
  }
};
const SR_ERC20=[
  'function approve(address spender,uint256 amount) external returns (bool)',
  'function allowance(address owner,address spender) external view returns(uint256)',
  'function balanceOf(address owner) external view returns(uint256)'
];
const SR_ROUTER=[
  'function getAmountsOut(uint amountIn,address[] memory path) public view returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline) external returns (uint[] memory amounts)'
];
let srProvider,srSigner,srUser;
function srStatus(msg){const el=document.getElementById('srStatus');if(el)el.innerText=msg;}
function srToken(id){return SR_CONFIG.tokens[document.getElementById(id).value];}
function srFmt(n,d=4){return Number(n).toLocaleString(undefined,{maximumFractionDigits:d});}
function srPath(a,b){if(a.address===b.address) throw new Error('Choose different tokens.'); return [a.address,b.address];}
async function srConnect(){
  if(!window.ethereum) throw new Error('MetaMask required.');
  const chain=await window.ethereum.request({method:'eth_chainId'});
  if(chain!==SR_CONFIG.chainIdHex){await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:SR_CONFIG.chainIdHex}]});}
  srProvider=new ethers.providers.Web3Provider(window.ethereum);
  await srProvider.send('eth_requestAccounts',[]);
  srSigner=srProvider.getSigner();
  srUser=await srSigner.getAddress();
  document.getElementById('srWallet').innerText=srUser;
  srStatus('Wallet connected.');
  await srRefreshBalances();
}
async function srRefreshBalances(){
  if(!srSigner||!srUser) return;
  const from=srToken('srTokenIn');
  const to=srToken('srTokenOut');
  const inC=new ethers.Contract(from.address,SR_ERC20,srSigner);
  const outC=new ethers.Contract(to.address,SR_ERC20,srSigner);
  const [inBal,outBal]=await Promise.all([inC.balanceOf(srUser),outC.balanceOf(srUser)]);
  document.getElementById('srBalanceIn').innerText=ethers.utils.formatUnits(inBal,from.decimals);
  document.getElementById('srBalanceOut').innerText=ethers.utils.formatUnits(outBal,to.decimals);
}
async function srBestRoute(){
  if(!srSigner) await srConnect();
  const from=srToken('srTokenIn');
  const to=srToken('srTokenOut');
  const raw=document.getElementById('srAmountIn').value.trim();
  if(!raw||Number(raw)<=0) throw new Error('Enter amount.');
  const amountIn=ethers.utils.parseUnits(raw,from.decimals);
  const path=srPath(from,to);
  let best=null;
  for(const r of SR_CONFIG.routers){
    try{
      const router=new ethers.Contract(r.address,SR_ROUTER,srSigner);
      const amounts=await router.getAmountsOut(amountIn,path);
      const out=amounts[amounts.length-1];
      if(!best||out.gt(best.out)) best={routerName:r.name,routerAddress:r.address,out};
    }catch(e){}
  }
  if(!best) throw new Error('No route available.');
  document.getElementById('srBestRouter').innerText=best.routerName;
  document.getElementById('srQuoteOut').innerText=ethers.utils.formatUnits(best.out,to.decimals);
  return {best,amountIn,path,from,to};
}
async function srEstimateGas(){
  try{
    const {best,amountIn,path}=await srBestRoute();
    const slippage=Math.max(0.1,Number(document.getElementById('srSlippage').value||'1'));
    const outMin=best.out.mul(Math.round((100-slippage)*100)).div(10000);
    const router=new ethers.Contract(best.routerAddress,SR_ROUTER,srSigner);
    const gas=await router.estimateGas.swapExactTokensForTokens(amountIn,outMin,path,srUser,Math.floor(Date.now()/1000)+600);
    const gasPrice=await srProvider.getGasPrice();
    const fee=gas.mul(gasPrice);
    document.getElementById('srGas').innerText=gas.toString();
    document.getElementById('srFee').innerText=ethers.utils.formatEther(fee);
    return {best,amountIn,path,outMin};
  }catch(err){srStatus(err.message||'Gas estimate failed.'); throw err;}
}
async function srApprove(){
  try{
    if(!srSigner) await srConnect();
    const {best,amountIn,from}=await srBestRoute();
    const token=new ethers.Contract(from.address,SR_ERC20,srSigner);
    srStatus('Sending approval...');
    const tx=await token.approve(best.routerAddress,amountIn);
    await tx.wait();
    srStatus('Approval complete.');
  }catch(err){srStatus(err.message||'Approval failed.');}
}
function srSaveTrade(trade){
  const key='aetheron_trade_history';
  const rows=JSON.parse(localStorage.getItem(key)||'[]');
  rows.unshift(trade);
  localStorage.setItem(key,JSON.stringify(rows.slice(0,25)));
  srRenderHistory();
}
function srRenderHistory(){
  const key='aetheron_trade_history';
  const rows=JSON.parse(localStorage.getItem(key)||'[]');
  const el=document.getElementById('srHistory');
  if(!el) return;
  if(!rows.length){el.innerHTML='<div class="flow-row"><div>No trades yet</div><div>-</div><div>-</div></div>';return;}
  el.innerHTML='<div class="flow-head">Pair | Route | Output</div>' + rows.map(r=>`<div class="flow-row"><div>${r.pair}</div><div>${r.route}</div><div>${r.output}</div></div>`).join('');
}
async function srExecute(oneClick=false){
  try{
    if(!srSigner) await srConnect();
    const est=await srEstimateGas();
    const token=new ethers.Contract(est.from.address,SR_ERC20,srSigner);
    const allowance=await token.allowance(srUser,est.best.routerAddress);
    if(allowance.lt(est.amountIn)){
      if(!oneClick) throw new Error('Approve first.');
      srStatus('Approving token...');
      await (await token.approve(est.best.routerAddress,est.amountIn)).wait();
    }
    srStatus('Submitting trade...');
    const router=new ethers.Contract(est.best.routerAddress,SR_ROUTER,srSigner);
    const tx=await router.swapExactTokensForTokens(est.amountIn,est.outMin,est.path,srUser,Math.floor(Date.now()/1000)+600);
    await tx.wait();
    srStatus('Trade executed.');
    srSaveTrade({pair:`${est.from.symbol}/${est.to.symbol}`,route:est.best.routerName,output:document.getElementById('srQuoteOut').innerText,time:Date.now()});
    await srRefreshBalances();
  }catch(err){console.error(err);srStatus(err.message||'Trade failed.');}
}
document.addEventListener('DOMContentLoaded',()=>{
  ['srTokenIn','srTokenOut'].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener('change',()=>{srRefreshBalances();srBestRoute().catch(()=>{});});});
  const amt=document.getElementById('srAmountIn'); if(amt) amt.addEventListener('input',()=>{srBestRoute().catch(()=>{});});
  srRenderHistory();
});
