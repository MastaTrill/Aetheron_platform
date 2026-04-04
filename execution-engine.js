const EXEC_CONFIG={
  chainId:137,
  chainIdHex:'0x89',
  chainName:'Polygon Mainnet',
  router:'0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
  tokens:{
    AETH:{symbol:'AETH',address:'0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e',decimals:18},
    WMATIC:{symbol:'WMATIC',address:'0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',decimals:18},
    USDC:{symbol:'USDC',address:'0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',decimals:6}
  }
};
const ERC20_ABI=[
 'function approve(address spender,uint256 amount) external returns (bool)',
 'function allowance(address owner,address spender) external view returns(uint256)',
 'function balanceOf(address owner) external view returns(uint256)',
 'function decimals() external view returns(uint8)',
 'function symbol() external view returns(string)'
];
const ROUTER_ABI=[
 'function getAmountsOut(uint amountIn,address[] memory path) public view returns (uint[] memory amounts)',
 'function swapExactTokensForTokens(uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline) external returns (uint[] memory amounts)',
 'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline) external'
];
let execProvider,execSigner,execUser,execRouter;
function eStatus(msg){const el=document.getElementById('execStatus');if(el)el.innerText=msg;}
async function ensurePolygonMainnet(){
  if(!window.ethereum) throw new Error('MetaMask is required.');
  const chainId=await window.ethereum.request({method:'eth_chainId'});
  if(chainId===EXEC_CONFIG.chainIdHex) return;
  await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:EXEC_CONFIG.chainIdHex}]});
}
async function execConnect(){
  await ensurePolygonMainnet();
  execProvider=new ethers.providers.Web3Provider(window.ethereum);
  await execProvider.send('eth_requestAccounts',[]);
  execSigner=execProvider.getSigner();
  execUser=await execSigner.getAddress();
  execRouter=new ethers.Contract(EXEC_CONFIG.router,ROUTER_ABI,execSigner);
  document.getElementById('execWallet').innerText=execUser;
  eStatus('Wallet connected.');
  await refreshExecBalances();
}
function selectedToken(key){return EXEC_CONFIG.tokens[document.getElementById(key).value];}
function buildPath(fromToken,toToken){
  if(fromToken.address===toToken.address) throw new Error('Select two different tokens.');
  return [fromToken.address,toToken.address];
}
async function refreshExecBalances(){
  if(!execSigner||!execUser) return;
  const fromToken=selectedToken('tokenIn');
  const toToken=selectedToken('tokenOut');
  const inC=new ethers.Contract(fromToken.address,ERC20_ABI,execSigner);
  const outC=new ethers.Contract(toToken.address,ERC20_ABI,execSigner);
  const [inBal,outBal]=await Promise.all([inC.balanceOf(execUser),outC.balanceOf(execUser)]);
  document.getElementById('balanceIn').innerText=ethers.utils.formatUnits(inBal,fromToken.decimals);
  document.getElementById('balanceOut').innerText=ethers.utils.formatUnits(outBal,toToken.decimals);
}
async function quoteSwap(){
  try{
    if(!execSigner) await execConnect();
    const fromToken=selectedToken('tokenIn');
    const toToken=selectedToken('tokenOut');
    const amountRaw=document.getElementById('amountIn').value.trim();
    if(!amountRaw||Number(amountRaw)<=0) throw new Error('Enter a valid amount.');
    const amountIn=ethers.utils.parseUnits(amountRaw,fromToken.decimals);
    const path=buildPath(fromToken,toToken);
    const amounts=await execRouter.getAmountsOut(amountIn,path);
    const out=amounts[amounts.length-1];
    document.getElementById('quoteOut').innerText=ethers.utils.formatUnits(out,toToken.decimals);
    eStatus('Quote ready.');
  }catch(err){
    console.error(err);eStatus(err.message||'Quote failed.');
  }
}
async function approveExecution(){
  try{
    if(!execSigner) await execConnect();
    const fromToken=selectedToken('tokenIn');
    const amountRaw=document.getElementById('amountIn').value.trim();
    if(!amountRaw||Number(amountRaw)<=0) throw new Error('Enter a valid amount.');
    const amountIn=ethers.utils.parseUnits(amountRaw,fromToken.decimals);
    const token=new ethers.Contract(fromToken.address,ERC20_ABI,execSigner);
    eStatus('Sending approval...');
    const tx=await token.approve(EXEC_CONFIG.router,amountIn);
    await tx.wait();
    eStatus('Approval confirmed.');
  }catch(err){console.error(err);eStatus(err.message||'Approval failed.');}
}
async function executeSwap(){
  try{
    if(!execSigner) await execConnect();
    const fromToken=selectedToken('tokenIn');
    const toToken=selectedToken('tokenOut');
    const amountRaw=document.getElementById('amountIn').value.trim();
    const slippageRaw=document.getElementById('slippage').value.trim()||'1';
    if(!amountRaw||Number(amountRaw)<=0) throw new Error('Enter a valid amount.');
    const amountIn=ethers.utils.parseUnits(amountRaw,fromToken.decimals);
    const slippagePct=Math.max(0.1,Number(slippageRaw));
    const path=buildPath(fromToken,toToken);
    const token=new ethers.Contract(fromToken.address,ERC20_ABI,execSigner);
    const allowance=await token.allowance(execUser,EXEC_CONFIG.router);
    if(allowance.lt(amountIn)) throw new Error('Approve the router first.');
    const amounts=await execRouter.getAmountsOut(amountIn,path);
    const quotedOut=amounts[amounts.length-1];
    const amountOutMin=quotedOut.mul(Math.round((100-slippagePct)*100)).div(10000);
    const deadline=Math.floor(Date.now()/1000)+60*10;
    eStatus('Submitting swap...');
    const tx=await execRouter.swapExactTokensForTokens(amountIn,amountOutMin,path,execUser,deadline);
    await tx.wait();
    document.getElementById('quoteOut').innerText=ethers.utils.formatUnits(quotedOut,toToken.decimals);
    eStatus('Swap executed successfully.');
    await refreshExecBalances();
  }catch(err){console.error(err);eStatus(err.message||'Swap failed.');}
}
document.addEventListener('DOMContentLoaded',()=>{
  ['tokenIn','tokenOut'].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener('change',()=>{refreshExecBalances();quoteSwap();});});
  const amt=document.getElementById('amountIn'); if(amt) amt.addEventListener('input',quoteSwap);
});
