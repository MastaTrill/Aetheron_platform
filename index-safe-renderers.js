import { clear, el, append } from './safe-dom.js';

export function renderWalletStatus(statusDiv,{state,walletName=''}={}){
  if(!statusDiv)return;
  clear(statusDiv);
  if(state==='detected'){
    append(statusDiv,el('i',{className:'fas fa-check-circle',attrs:{style:'color: var(--success);'}}),document.createTextNode(` ${walletName} Detected ✓`),el('br'),el('small',{text:'Ready to connect',attrs:{style:'color: #6b7280;'}}));
    statusDiv.style.background='linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))';
    statusDiv.style.border='2px solid var(--success)';
    return;
  }
  if(state==='other-wallet'){
    append(statusDiv,el('i',{className:'fas fa-exclamation-triangle',attrs:{style:'color: var(--warning);'}}),document.createTextNode(' Other wallet detected'),el('br'),el('small',{text:'Coinbase Wallet or MetaMask not found',attrs:{style:'color: #6b7280;'}}));
    statusDiv.style.background='linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1))';
    statusDiv.style.border='2px solid var(--warning)';
    return;
  }
  append(statusDiv,el('i',{className:'fas fa-times-circle',attrs:{style:'color: var(--danger);'}}),document.createTextNode(' Wallet Not Detected'),el('br'),el('small',{text:'Install Coinbase Wallet or MetaMask and refresh page',attrs:{style:'color: #6b7280;'}}));
  statusDiv.style.background='linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))';
  statusDiv.style.border='2px solid var(--danger)';
}

export function renderTransactions(list,txEmpty,transactions){
  if(!list||!txEmpty)return;
  clear(list);
  if(!transactions||transactions.length===0){
    txEmpty.classList.remove('hidden');
    list.classList.add('hidden');
    return;
  }
  txEmpty.classList.add('hidden');
  list.classList.remove('hidden');
  transactions.forEach((tx)=>{
    const item=el('div',{className:'tx-item'});
    const left=el('div');
    append(left,el('span',{className:`tx-type ${tx.type}`,text:tx.type==='send'?'Sent':'Received'}),el('div',{className:'text-sm text-gray mt-05',text:tx.timestamp.toLocaleString()}));
    const right=el('div',{attrs:{style:'text-align: right;'}});
    const link=el('a',{className:'text-sm',text:'View',attrs:{href:`https://polygonscan.com/tx/${tx.hash}`,target:'_blank',rel:'noopener',style:'color: var(--primary);'}});
    append(link,document.createTextNode(' '),el('i',{className:'fas fa-external-link-alt'}));
    append(right,el('div',{className:'fw-600',text:`${parseFloat(tx.value).toFixed(4)} AETH`}),link);
    append(item,left,right);
    list.appendChild(item);
  });
}
