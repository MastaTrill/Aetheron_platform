// --- Onboarding Tour --- Disabled for CSP compliance
document.getElementById('onboardingBtn').addEventListener('click', () => {
  alert(
    'Onboarding tour temporarily disabled for security. Please explore the dashboard manually.',
  );
});

// New Features Scripts
async function loadPrice() {
  try {
    const res = await fetch(
      'https://api.dexscreener.com/latest/dex/tokens/' + AETH_ADDRESS,
    );
    const data = await res.json();
    const price = data.pairs[0].priceUsd;
    const el = document.createElement('div');
    el.innerHTML = 'AETH Price: $' + parseFloat(price).toFixed(4);
    el.style.color = '#00d4ff';
    document.querySelector('.header').appendChild(el);
  } catch {}
}
loadPrice();
setInterval(loadPrice, 30000);

async function loadPoolData() {
  if (!stakingContract) return;
  for (let i = 0; i < 3; i++) {
    const pool = await stakingContract.pools(i);
    console.log('Pool', i, pool);
  }
}
setInterval(loadPoolData, 15000);

if (window.ethereum) {
  ethereum.on('accountsChanged', () => location.reload());
  ethereum.on('chainChanged', () => location.reload());
}

async function loadTreasury() {
  if (!stakingContract || !aethContract || !provider) return;
  try {
    // Example: Fetch staking totals from pools
    let totalTreasury = 0;
    let stakingRewards = 0;
    for (let i = 0; i < 3; i++) {
      const pool = await stakingContract.pools(i);
      totalTreasury += parseFloat(ethers.utils.formatEther(pool[0]));
      stakingRewards += parseFloat(ethers.utils.formatEther(pool[1]));
    }
    document.getElementById('treasuryTotal').textContent =
      totalTreasury.toFixed(2) + ' AETH';
    document.getElementById('stakingRewards').textContent =
      stakingRewards.toFixed(2) + ' AETH';
    // Example: Protocol fees stored in contract
    // If you track fees in MATIC:
    const fees = await provider.getBalance(AETH_ADDRESS); // Replace with actual contract method if exists
    document.getElementById('protocolFees').textContent =
      parseFloat(ethers.utils.formatEther(fees)).toFixed(4) + ' MATIC';
  } catch (e) {
    console.error('Error loading treasury:', e);
  }
}
// Refresh button
document
  .getElementById('refreshTreasuryBtn')
  .addEventListener('click', loadTreasury);
// Auto-load on page
window.addEventListener('DOMContentLoaded', loadTreasury);

let treasuryChartInstance;
async function updateTreasuryChart() {
  if (!stakingContract || !aethContract || !provider) return;
  try {
    // Fetch pool info
    const labels = ['Pool 0', 'Pool 1', 'Pool 2'];
    const stakingData = [];
    const treasuryData = [];
    for (let i = 0; i < 3; i++) {
      const pool = await stakingContract.pools(i);
      treasuryData.push(parseFloat(ethers.utils.formatEther(pool[0])));
      stakingData.push(parseFloat(ethers.utils.formatEther(pool[1])));
    }
    // Protocol fees in MATIC (example)
    const fees = parseFloat(
      ethers.utils.formatEther(await provider.getBalance(AETH_ADDRESS)),
    );
    const data = {
      labels,
      datasets: [
        {
          label: 'Treasury (AETH)',
          data: treasuryData,
          backgroundColor: 'rgba(0, 212, 255, 0.3)',
          borderColor: 'rgba(0, 212, 255, 1)',
          borderWidth: 2,
          tension: 0.4,
          type: 'bar',
        },
        {
          label: 'Staking Rewards (AETH)',
          data: stakingData,
          backgroundColor: 'rgba(138, 43, 226, 0.2)',
          borderColor: 'rgba(138, 43, 226, 1)',
          borderWidth: 2,
          tension: 0.4,
          type: 'line',
          fill: true,
        },
        {
          label: 'Protocol Fees (MATIC)',
          data: [fees, fees, fees],
          borderColor: 'rgba(255, 107, 53, 1)',
          backgroundColor: 'rgba(255, 107, 53, 0.1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(255, 107, 53, 1)',
          type: 'line',
          fill: false,
        },
      ],
    };
    const config = {
      type: 'bar',
      data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Treasury & Staking Overview',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    };
    if (treasuryChartInstance) {
      treasuryChartInstance.destroy();
    }
    treasuryChartInstance = new Chart(
      document.getElementById('treasuryChart'),
      config,
    );
  } catch (e) {
    console.error('Error updating treasury chart:', e);
  }
}
window.addEventListener('DOMContentLoaded', updateTreasuryChart);
setInterval(updateTreasuryChart, 30000);

// Analytics/Engagement Chart
window.addEventListener('DOMContentLoaded', () => {
  const ctx = document.getElementById('engagementChart');
  if (ctx && window.Chart) {
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Active Users',
            data: [12, 19, 14, 17, 23, 20, 25],
            fill: true,
            backgroundColor: 'rgba(0,212,255,0.12)',
            borderColor: 'rgba(0,212,255,1)',
            tension: 0.4,
            pointBackgroundColor: 'var(--accent)',
            pointRadius: 5,
            borderWidth: 3,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            labels: {
              color:
                getComputedStyle(document.body).getPropertyValue('--primary') ||
                '#00d4ff',
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color:
                getComputedStyle(document.body).getPropertyValue(
                  '--text-main',
                ) || '#fff',
            },
          },
          y: {
            ticks: {
              color:
                getComputedStyle(document.body).getPropertyValue(
                  '--text-main',
                ) || '#fff',
            },
          },
        },
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }
});

// Payment history render
window.addEventListener('DOMContentLoaded', () => {
  window.renderPaymentHistory && window.renderPaymentHistory();
});

// Localization/i18n
const translations = {
  en: {
    title: 'Aetheron Platform',
    subtitle: 'Decentralized Token & Staking Platform',
    connect: 'Connect Wallet',
    buy: 'Buy AETH',
    pay: 'Pay with Crypto (Coinbase)',
    refresh: 'Refresh Balances',
    walletType: 'Wallet Type:',
    connectedAccount: 'Connected Account:',
    network: 'Network:',
    maticBalance: 'MATIC Balance:',
    aethBalance: 'AETH Balance:',
    transfer: 'Transfer AETH',
    recipient: 'Recipient Address:',
    amount: 'Amount (AETH):',
    transferBtn: 'Transfer',
    stake: 'Stake AETH',
    poolId: 'Pool ID:',
    stakeBtn: 'Stake',
    contractInfo: 'Contract Info',
    paymentHistory: 'Payment History',
    engagement: 'Engagement Analytics',
  },
  es: {
    title: 'Plataforma Aetheron',
    subtitle: 'Plataforma Descentralizada de Token y Staking',
    connect: 'Conectar Billetera',
    buy: 'Comprar AETH',
    pay: 'Pagar con Cripto (Coinbase)',
    refresh: 'Actualizar Saldos',
    walletType: 'Tipo de Billetera:',
    connectedAccount: 'Cuenta Conectada:',
    network: 'Red:',
    maticBalance: 'Saldo MATIC:',
    aethBalance: 'Saldo AETH:',
    transfer: 'Transferir AETH',
    recipient: 'Dirección del Destinatario:',
    amount: 'Cantidad (AETH):',
    stake: 'Apostar AETH',
    poolId: 'Pool-ID:',
    stakeBtn: 'Apostar',
    contractInfo: 'Información del Contrato',
    paymentHistory: 'Historial de Pagos',
    engagement: 'Analítica de Participación',
  },
  fr: {
    title: 'Plateforme Aetheron',
    subtitle: 'Plateforme Décentralisée de Jeton & Staking',
    connect: 'Connecter le Portefeuille',
    buy: 'Acheter AETH',
    pay: 'Payer en Crypto (Coinbase)',
    refresh: 'Rafraîchir Soldes',
    walletType: 'Type de Portefeuille:',
    connectedAccount: 'Compte Connecté:',
    network: 'Réseau:',
    maticBalance: 'Solde MATIC:',
    aethBalance: 'Solde AETH:',
    transfer: 'Transférer AETH',
    recipient: 'Adresse du Destinataire:',
    amount: 'Montant (AETH):',
    transferBtn: 'Transférer',
    stake: 'Staker AETH',
    poolId: 'Pool-ID:',
    stakeBtn: 'Staker',
    contractInfo: 'Info du Contrat',
    paymentHistory: 'Historique des Paiements',
    engagement: "Analytique d'Engagement",
  },
  de: {
    title: 'Aetheron Plattform',
    subtitle: 'Dezentrale Token- & Staking-Plattform',
    connect: 'Wallet Verbinden',
    buy: 'AETH Kaufen',
    pay: 'Mit Krypto Bezahlen (Coinbase)',
    refresh: 'Salden Aktualisieren',
    walletType: 'Wallet-Typ:',
    connectedAccount: 'Verbundenes Konto:',
    network: 'Netzwerk:',
    maticBalance: 'MATIC Kontostand:',
    aethBalance: 'AETH Kontostand:',
    transfer: 'AETH Übertragen',
    recipient: 'Empfängeradresse:',
    amount: 'Betrag (AETH):',
    transferBtn: 'Übertragen',
    stake: 'AETH Staken',
    poolId: 'Pool-ID:',
    stakeBtn: 'Staken',
    contractInfo: 'Vertragsinfo',
    paymentHistory: 'Zahlungsverlauf',
    engagement: 'Engagement-Analyse',
  },
};
function setLang(lang) {
  const t = translations[lang] || translations.en;
  document.querySelector('.logo').textContent = '🌌 ' + t.title;
  document.querySelector('.header p').textContent = t.subtitle;
  document.getElementById('connectBtn').textContent = t.connect;
  document.querySelector('.buy-btn').textContent = t.buy;
  document.querySelector('.coinbase-btn').textContent = t.pay;
  document.querySelector('.refresh-btn').textContent = '🔄 ' + t.refresh;
  document.getElementById('walletType').previousSibling.textContent =
    t.walletType + ' ';
  document.getElementById('accountAddress').previousSibling.textContent =
    t.connectedAccount + ' ';
  document.getElementById('networkName').previousSibling.textContent =
    t.network + ' ';
  document.getElementById('ethBalance').previousSibling.textContent =
    t.maticBalance + ' ';
  document.getElementById('aethBalance').previousSibling.textContent =
    t.aethBalance + ' ';
  document.querySelector('.card h2').textContent = '💰 ' + t.transfer;
  document.getElementById('transferTo').previousSibling.textContent =
    t.recipient;
  document.getElementById('transferAmount').previousSibling.textContent =
    t.amount;
  document.querySelector('.card .action-btn').textContent = t.transferBtn;
  document.querySelectorAll('.card h2')[1].textContent = '🎯 ' + t.stake;
  document.getElementById('poolId').previousSibling.textContent = t.poolId;
  document.getElementById('stakeAmount').previousSibling.textContent = t.amount;
  document.querySelectorAll('.card .action-btn')[1].textContent = t.stakeBtn;
  document.querySelectorAll('.card h2')[2].textContent = '📊 ' + t.contractInfo;
  document.querySelector('.payment-history-title').textContent =
    t.paymentHistory;
  document.getElementById('analyticsCard').querySelector('h2').textContent =
    '📈 ' + t.engagement;
}
document.getElementById('langSelect').addEventListener('change', (e) => {
  setLang(e.target.value);
  localStorage.setItem('dashboard-lang', e.target.value);
});
window.addEventListener('DOMContentLoaded', () => {
  const lang = localStorage.getItem('dashboard-lang') || 'en';
  document.getElementById('langSelect').value = lang;
  setLang(lang);
});
