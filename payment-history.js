// payment-history.js - Handles fetching and displaying user payment history

async function fetchPaymentHistory() {
  try {
    const res = await fetch('/api/payment-history');
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
