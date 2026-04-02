// payment-history.js - Handles fetching and displaying user payment history

const STATIC_HOST_SUFFIXES = ['github.io', 'pages.dev'];
const DEFAULT_API_BASE = 'https://vercel-node-app-1.vercel.app';

function getPaymentHistoryApiBase() {
  const metaBase = document
    .querySelector('meta[name="aetheron-api-base"]')
    ?.getAttribute('content')
    ?.trim();
  const globalBase =
    typeof window.AETHERON_API_BASE_URL === 'string'
      ? window.AETHERON_API_BASE_URL.trim()
      : '';
  const configuredBase = globalBase || metaBase || '';

  if (configuredBase) {
    return configuredBase.replace(/\/+$/, '');
  }

  const hostname = window.location.hostname;
  const isStaticHost = STATIC_HOST_SUFFIXES.some(function (suffix) {
    return hostname === suffix || hostname.endsWith('.' + suffix);
  });

  return isStaticHost ? DEFAULT_API_BASE : window.location.origin;
}

async function fetchPaymentHistory() {
  try {
    const apiBase = getPaymentHistoryApiBase();
    const res = await fetch(apiBase + '/api/payment-history');
    if (!res.ok) throw new Error('Failed to fetch payment history');
    const data = await res.json();
    return data.history || [];
  } catch (err) {
    return [];
  }
}

async function renderPaymentHistory() {
  const history = await fetchPaymentHistory();
  const container = document.getElementById('paymentHistoryTableBody');
  if (!container) return;
  if (!history.length) {
    container.innerHTML =
      '<tr><td colspan="5">No payment history found.</td></tr>';
    return;
  }
  container.innerHTML = history
    .map(
      (item) => `
    <tr>
      <td>${item.date ? new Date(item.date).toLocaleString() : '-'}</td>
      <td>${item.amount} ${item.currency}</td>
      <td>${item.status || '-'}</td>
      <td>${item.txid ? `<a href="${item.txid}" target="_blank">View</a>` : '-'}</td>
      <td>${item.gateway || 'Coinbase'}</td>
    </tr>
  `,
    )
    .join('');
}

window.renderPaymentHistory = renderPaymentHistory;
