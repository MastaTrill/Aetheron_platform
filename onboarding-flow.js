function aoSetStep(step){
  document.querySelectorAll('[data-step]').forEach(el=>el.classList.remove('active'));
  const current=document.querySelector(`[data-step="${step}"]`);
  if(current) current.classList.add('active');
}

async function aoConnectWallet(){
  try{
    if(!window.ethereum){
      aoToast('MetaMask is required to continue.');
      return;
    }
    const provider=new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts',[]);
    const signer=provider.getSigner();
    const address=await signer.getAddress();
    const walletEl=document.getElementById('aoWallet');
    if(walletEl) walletEl.innerText=address;
    localStorage.setItem('aetheron_onboard_wallet', address);
    aoSetStep(2);
    aoToast('Wallet connected. Next: choose tokens and get a quote.');
  }catch(err){
    console.error(err);
    aoToast('Wallet connection failed.');
  }
}

function aoGoToTrade(){
  window.location.href='smart-routing-ui.html';
}

function aoPrefillTrade(){
  const pair=document.getElementById('aoPair');
  const amount=document.getElementById('aoAmount');
  if(pair) localStorage.setItem('aetheron_prefill_pair', pair.value);
  if(amount) localStorage.setItem('aetheron_prefill_amount', amount.value || '10');
  aoSetStep(3);
  aoToast('Trade preferences saved. Opening smart routing.');
  setTimeout(()=>{ window.location.href='smart-routing-ui.html'; },700);
}

function aoMarkTradeDone(){
  localStorage.setItem('aetheron_first_trade_done','true');
  aoSetStep(4);
  aoToast('First trade flow completed. Explore analytics next.');
}

function aoToast(message){
  const el=document.getElementById('aoToast');
  if(!el) return;
  el.innerText=message;
  el.classList.add('show');
  clearTimeout(window.__aoToastTimer);
  window.__aoToastTimer=setTimeout(()=>el.classList.remove('show'),2600);
}

function aoHydrateTradePage(){
  const pair=localStorage.getItem('aetheron_prefill_pair');
  const amount=localStorage.getItem('aetheron_prefill_amount');
  if(document.getElementById('srTokenIn') && pair){
    const [from,to]=pair.split('/');
    if(from && document.getElementById('srTokenIn')) document.getElementById('srTokenIn').value=from;
    if(to && document.getElementById('srTokenOut')) document.getElementById('srTokenOut').value=to;
  }
  if(document.getElementById('srAmountIn') && amount){
    document.getElementById('srAmountIn').value=amount;
  }
}

document.addEventListener('DOMContentLoaded',()=>{
  const done=localStorage.getItem('aetheron_first_trade_done')==='true';
  if(done && document.querySelector('[data-step="4"]')) aoSetStep(4); else aoSetStep(1);
  aoHydrateTradePage();
});