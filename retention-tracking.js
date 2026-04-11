const RETENTION_KEY = 'aetheron_user_events';
const RETENTION_PROFILE_KEY = 'aetheron_user_profile';

function rtNow(){ return Date.now(); }
function rtLoad(key, fallback){ try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function rtSave(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

function rtTrack(eventName, meta = {}) {
  const events = rtLoad(RETENTION_KEY, []);
  events.push({ event: eventName, meta, time: rtNow() });
  rtSave(RETENTION_KEY, events.slice(-500));
  rtUpdateProfile();
}

function rtUpdateProfile(){
  const events = rtLoad(RETENTION_KEY, []);
  const firstSeen = events[0]?.time || rtNow();
  const lastSeen = events[events.length - 1]?.time || rtNow();
  const connects = events.filter(e => e.event === 'wallet_connected').length;
  const visits = events.filter(e => e.event === 'visit').length || 1;
  const trades = events.filter(e => e.event === 'trade_executed').length;
  const onboardingDone = events.some(e => e.event === 'onboarding_complete');
  const profile = {
    firstSeen,
    lastSeen,
    connects,
    visits,
    trades,
    onboardingDone,
    retentionScore: Math.min(100, Math.round((visits * 8) + (connects * 12) + (trades * 20) + (onboardingDone ? 15 : 0)))
  };
  rtSave(RETENTION_PROFILE_KEY, profile);
  rtRenderProfile(profile);
}

function rtRenderProfile(profile = null){
  const p = profile || rtLoad(RETENTION_PROFILE_KEY, null);
  if(!p) return;
  const set = (id, val) => { const el = document.getElementById(id); if(el) el.innerText = String(val); };
  set('rtVisits', p.visits);
  set('rtConnects', p.connects);
  set('rtTrades', p.trades);
  set('rtRetentionScore', p.retentionScore + '/100');
  set('rtStatus', p.trades > 0 ? 'Activated trader' : p.onboardingDone ? 'Onboarded user' : 'New visitor');
}

function rtRecordVisit(page = '') { rtTrack('visit', { page }); }
function rtRecordWalletConnected(address = '') { rtTrack('wallet_connected', { address }); }
function rtRecordOnboardingComplete(){ rtTrack('onboarding_complete'); }
function rtRecordTrade(pair = '', amount = '') { rtTrack('trade_executed', { pair, amount }); }

function rtRenderEventFeed(){
  const feed = document.getElementById('rtEventFeed');
  if(!feed) return;
  const events = rtLoad(RETENTION_KEY, []).slice(-8).reverse();
  if(!events.length){ feed.innerHTML = '<div class="rt-row"><div>No activity yet</div><div>-</div></div>'; return; }
  feed.innerHTML = events.map(e => `<div class="rt-row"><div>${e.event.replaceAll('_',' ')}</div><div>${new Date(e.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div></div>`).join('');
}

function rtMaybeNudge(){
  const profile = rtLoad(RETENTION_PROFILE_KEY, null);
  const el = document.getElementById('rtNudge');
  if(!el || !profile) return;
  if(profile.trades === 0 && profile.onboardingDone) el.innerText = 'Next best action: make your first trade.';
  else if(profile.trades > 0 && profile.visits < 3) el.innerText = 'Come back tomorrow to review your portfolio.';
  else if(profile.retentionScore >= 60) el.innerText = 'Power user path unlocked: explore analytics + smart routing.';
  else el.innerText = 'Connect wallet and complete onboarding to unlock the full platform.';
}

document.addEventListener('DOMContentLoaded', () => {
  rtRecordVisit(location.pathname || 'unknown');
  rtUpdateProfile();
  rtRenderEventFeed();
  rtMaybeNudge();
});