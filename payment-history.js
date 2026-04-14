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

function isSafeHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const parsed = new URL(value, window.location.origin);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (_error) {
    return false;
  }
}

function appendCell(row, text) {
  const cell = document.createElement('td');
  cell.textContent = text;
  row.appendChild(cell);
}

function appendLinkCell(row, url) {
  const cell = document.createElement('td');
  if (isSafeHttpUrl(url)) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'View';
    cell.appendChild(link);
  } else {
    cell.textContent = '-';
  }
  row.appendChild(cell);
}

async function fetchPaymentHistory() {
  try {
    const apiBase = getPaymentHistoryApiBase();
    const res = await fetch(apiBase + '/api/payment-history');
    if (!res.ok) throw new Error('Failed to fetch payment history');
    const data = await res.json();
    return data.history || [];
  } catch (_err) {
    return [];
  }
}

async function renderPaymentHistory() {
  const history = await fetchPaymentHistory();
  const container = document.getElementById('paymentHistoryTableBody');
  if (!container) return;

  container.replaceChildren();

  if (!history.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.textContent = 'No payment history found.';
    row.appendChild(cell);
    container.appendChild(row);
    return;
  }

  history.forEach((item) => {
    const row = document.createElement('tr');
    appendCell(row, item.date ? new Date(item.date).toLocaleString() : '-');
    appendCell(row, `${item.amount} ${item.currency}`);
    appendCell(row, item.status || '-');
    appendLinkCell(row, item.txid);
    appendCell(row, item.gateway || 'Coinbase');
    container.appendChild(row);
  });
}

window.renderPaymentHistory = renderPaymentHistory;
