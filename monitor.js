// Public launch status banner for the verified Base presale.
class AetheronMonitor {
  constructor() {
    this.contracts = {
      AETH: '0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e',
      PRESALE: '0xe0A3B6368312dFd3E7E76202e673f895f8235A3d'
    };
    this.links = {
      buy: 'presale.html',
      presale: 'https://basescan.org/address/0xe0A3B6368312dFd3E7E76202e673f895f8235A3d#code',
      token: 'https://basescan.org/token/0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e'
    };
    this.init();
  }

  init() {
    this.injectStyles();
    this.renderPresaleBanner();
  }

  injectStyles() {
    if (document.getElementById('aetheron-live-banner-styles')) return;
    const style = document.createElement('style');
    style.id = 'aetheron-live-banner-styles';
    style.textContent = `
      .aetheron-live-banner{display:grid;grid-template-columns:1.15fr 2fr auto;gap:16px;align-items:center;margin:20px auto;padding:18px;border-radius:20px;border:1px solid rgba(52,211,153,.4);background:linear-gradient(135deg,rgba(7,24,39,.96),rgba(46,20,101,.84));box-shadow:0 22px 50px rgba(0,0,0,.28);color:#fff}
      .aetheron-live-banner__status{display:flex;flex-direction:column;gap:7px}.aetheron-live-banner__eyebrow{font-size:.76rem;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.7)}
      .aetheron-live-banner__headline{display:flex;align-items:center;gap:10px;font-size:1.14rem;font-weight:800}.aetheron-live-banner__dot{width:11px;height:11px;border-radius:50%;background:#34d399;box-shadow:0 0 18px rgba(52,211,153,.8)}
      .aetheron-live-banner__meta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.aetheron-live-banner__metric{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:11px 12px}
      .aetheron-live-banner__metric-label{font-size:.7rem;color:rgba(255,255,255,.65);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}.aetheron-live-banner__metric-value{font-size:.95rem;font-weight:800}
      .aetheron-live-banner__actions{display:flex;gap:9px;flex-wrap:wrap;justify-content:flex-end}.aetheron-live-banner__button{display:inline-flex;align-items:center;padding:10px 14px;border-radius:999px;text-decoration:none;color:#fff;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);font-weight:700}.aetheron-live-banner__button--primary{background:linear-gradient(135deg,#22c55e,#16a34a)}
      @media(max-width:960px){.aetheron-live-banner{grid-template-columns:1fr}.aetheron-live-banner__meta{grid-template-columns:repeat(2,1fr)}.aetheron-live-banner__actions{justify-content:flex-start}}
    `;
    document.head.appendChild(style);
  }

  renderPresaleBanner() {
    const host = document.querySelector('#main-content .container') || document.querySelector('main .container') || document.body;
    if (!host || document.getElementById('aetheronLiveTradingBanner')) return;
    const banner = document.createElement('section');
    banner.id = 'aetheronLiveTradingBanner';
    banner.className = 'aetheron-live-banner';
    banner.setAttribute('aria-label', 'Verified Base presale status');
    banner.innerHTML = `
      <div class="aetheron-live-banner__status"><div class="aetheron-live-banner__eyebrow">Sale status</div><div class="aetheron-live-banner__headline"><span class="aetheron-live-banner__dot"></span><span>BASE PRESALE LIVE</span></div><div class="aetheron-live-banner__eyebrow">Purchase through the verified contract on Base Mainnet.</div></div>
      <div class="aetheron-live-banner__meta">
        <div class="aetheron-live-banner__metric"><div class="aetheron-live-banner__metric-label">Minimum</div><div class="aetheron-live-banner__metric-value">0.0003 ETH</div></div>
        <div class="aetheron-live-banner__metric"><div class="aetheron-live-banner__metric-label">Rate</div><div class="aetheron-live-banner__metric-value">1M AETH / ETH</div></div>
        <div class="aetheron-live-banner__metric"><div class="aetheron-live-banner__metric-label">Network</div><div class="aetheron-live-banner__metric-value">Base Mainnet</div></div>
        <div class="aetheron-live-banner__metric"><div class="aetheron-live-banner__metric-label">Contract</div><div class="aetheron-live-banner__metric-value">Verified</div></div>
      </div>
      <div class="aetheron-live-banner__actions"><a class="aetheron-live-banner__button aetheron-live-banner__button--primary" href="${this.links.buy}">Buy AETH</a><a class="aetheron-live-banner__button" href="${this.links.presale}" target="_blank" rel="noopener noreferrer">BaseScan</a><a class="aetheron-live-banner__button" href="${this.links.token}" target="_blank" rel="noopener noreferrer">Token</a></div>`;
    host.prepend(banner);
  }
}

document.addEventListener('DOMContentLoaded', () => { window.aetheronMonitor = new AetheronMonitor(); });
