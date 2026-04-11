// Simple viral + growth loop system
const GROWTH_KEY = 'aetheron_growth';

function gLoad(){return JSON.parse(localStorage.getItem(GROWTH_KEY)||'{"referrals":0,"invited":[]}');}
function gSave(d){localStorage.setItem(GROWTH_KEY,JSON.stringify(d));}

function gGenerateReferral(){
  let code = localStorage.getItem('aetheron_ref_code');
  if(!code){
    code = Math.random().toString(36).substring(2,8);
    localStorage.setItem('aetheron_ref_code', code);
  }
  return code;
}

function gGetReferralLink(){
  const code = gGenerateReferral();
  return window.location.origin + window.location.pathname + '?ref=' + code;
}

function gCopyLink(){
  const link = gGetReferralLink();
  navigator.clipboard.writeText(link);
  alert('Referral link copied!');
}

function gCaptureReferral(){
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if(ref){
    localStorage.setItem('aetheron_referred_by', ref);
  }
}

function gRewardReferral(){
  const data = gLoad();
  data.referrals += 1;
  gSave(data);
  gRender();
}

function gRender(){
  const data = gLoad();
  const el = document.getElementById('gReferrals');
  if(el) el.innerText = data.referrals;
}

function gShareTwitter(){
  const url = encodeURIComponent(gGetReferralLink());
  window.open(`https://twitter.com/intent/tweet?text=Try%20Aetheron%20DeFi%20Terminal&url=${url}`,'_blank');
}

function gShareDiscord(){
  alert('Paste your referral link in Discord: ' + gGetReferralLink());
}

document.addEventListener('DOMContentLoaded',()=>{
  gCaptureReferral();
  gRender();
});