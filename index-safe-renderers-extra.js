import { clear, el, button, append } from './safe-dom.js';

export function renderUserStakes(list,stakes,{onClaim,onUnstake,onEmergencyUnstake}={}){
  if(!list)return;
  clear(list);
  if(!stakes||stakes.length===0){
    const empty=el('div',{className:'wallet-section'});
    append(empty,el('i',{className:'fas fa-inbox empty-icon'}),el('p',{className:'text-gray',text:'No active stakes yet. Start staking to earn rewards!'}));
    list.appendChild(empty);
    return;
  }
  const poolNames=['30 Days (5% APY)','90 Days (12% APY)','180 Days (25% APY)'];
  stakes.forEach((stake)=>{
    const isUnlocked=new Date()>=stake.unlockTime;
    const item=el('div',{className:'stake-item slide-up'});
    const header=el('div',{className:'stake-header'});
    const left=el('div');
    append(left,el('div',{className:'fw-600',text:poolNames[stake.poolId]||'Unknown Pool'}),el('div',{className:'text-sm text-gray',text:`Stake #${stake.id}`}));
    append(header,left,el('span',{className:`stake-badge ${isUnlocked?'completed':'active'}`,text:isUnlocked?'Unlocked':'Locked'}));
    const details=el('div',{className:'stake-details'});
    [['Staked Amount',`${parseFloat(stake.amount).toFixed(2)} AETH`],['Pending Rewards',`${parseFloat(stake.pendingReward).toFixed(4)} AETH`],['Started',stake.startTime.toLocaleDateString()],['Unlock Date',stake.unlockTime.toLocaleDateString()]].forEach(([label,value])=>{const row=el('div',{className:'stake-detail-item'});append(row,el('span',{className:'stake-detail-label',text:label}),el('span',{className:'stake-detail-value',text:value}));details.appendChild(row);});
    const actions=el('div',{className:'stake-actions'});
    if(parseFloat(stake.pendingReward)>0){const claim=button('Claim Rewards',{className:'btn btn-success btn-sm'});claim.prepend(el('i',{className:'fas fa-coins'}));claim.append(document.createTextNode(' '));if(!isUnlocked)claim.disabled=true;claim.addEventListener('click',()=>onClaim?.(stake.id));actions.appendChild(claim);}
    const action=button(isUnlocked?'Unstake':'Emergency Withdraw',{className:isUnlocked?'btn btn-primary btn-sm':'btn btn-warning btn-sm'});action.prepend(el('i',{className:isUnlocked?'fas fa-unlock':'fas fa-exclamation-triangle'}));action.append(document.createTextNode(' '));action.addEventListener('click',()=> (isUnlocked?onUnstake:onEmergencyUnstake)?.(stake.id));actions.appendChild(action);
    append(item,header,details,actions);list.appendChild(item);
  });
}

export function renderWalletChooser(modal,{providers,onClose,onMetaMask,onCoinbase,onBrowser}={}){
  if(!modal)return;
  clear(modal);
  modal.className='modal';
  modal.style.display='none';
  const content=el('div',{className:'modal-content',attrs:{role:'dialog','aria-modal':'true','aria-labelledby':'walletChooserTitle'}});
  const close=el('span',{className:'close-modal',text:'×',attrs:{id:'walletChooserClose',role:'button',tabindex:'0','aria-label':'Close wallet chooser'}});
  const actions=el('div',{className:'quick-actions',attrs:{style:'margin-top:1rem;'}});
  const mm=button(' MetaMask',{className:'quick-action-btn'});mm.prepend(el('i',{className:'fas fa-wallet'}));
  const cb=button(' Coinbase Wallet',{className:'quick-action-btn'});cb.prepend(el('i',{className:'fas fa-wallet'}));
  const bw=button(' Browser Wallet',{className:'quick-action-btn'});bw.prepend(el('i',{className:'fas fa-plug'}));
  mm.style.display=providers?.some((p)=>p?.isMetaMask)?'':'none';
  cb.style.display=providers?.some((p)=>p?.isCoinbaseWallet)?'':'none';
  mm.addEventListener('click',onMetaMask||(()=>{}));
  cb.addEventListener('click',onCoinbase||(()=>{}));
  bw.addEventListener('click',onBrowser||(()=>{}));
  close.addEventListener('click',onClose||(()=>{}));
  append(actions,mm,cb,bw);
  append(content,close,el('h2',{text:'Choose Wallet',attrs:{id:'walletChooserTitle'}}),el('p',{className:'text-gray paragraph-spacing',text:'Select the wallet you want to connect on this device.'}),actions);
  modal.appendChild(content);
}
