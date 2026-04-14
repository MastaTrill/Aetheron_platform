// admin-dashboard-init.js
// Extracted from inline <script> in admin-dashboard.html

async function fetchAllPayments() {
  const res = await fetch('/api/all-payments');
  if (!res.ok) return [];
  const data = await res.json();
  return data.payments || [];
}

function el(tag, { text, attrs } = {}) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = String(text);
  if (attrs) {
    Object.entries(attrs).forEach(([key, value]) => {
      if (value !== undefined && value !== null) node.setAttribute(key, String(value));
    });
  }
  return node;
}

function clear(node) {
  if (node) node.replaceChildren();
}

function paymentCell(value) {
  return el('td', { text: value });
}

function buildPaymentRow(payment) {
  const row = document.createElement('tr');
  row.appendChild(paymentCell(payment.user || '-'));
  row.appendChild(paymentCell(payment.date ? new Date(payment.date).toLocaleString() : '-'));
  row.appendChild(paymentCell(`${payment.amount} ${payment.currency}`));
  row.appendChild(paymentCell(payment.status || '-'));

  const txCell = document.createElement('td');
  if (payment.txid) {
    txCell.appendChild(el('a', { text: 'View', attrs: { href: payment.txid, target: '_blank', rel: 'noopener' } }));
  } else {
    txCell.textContent = '-';
  }
  row.appendChild(txCell);
  row.appendChild(paymentCell(payment.gateway || 'Coinbase'));
  return row;
}

async function renderAdminPayments() {
  const table = document.getElementById('adminPaymentTableBody');
  if (!table) return;
  const payments = await fetchAllPayments();
  clear(table);
  if (!payments.length) {
    const row = document.createElement('tr');
    row.appendChild(el('td', { text: 'No payments found.', attrs: { colspan: '6' } }));
    table.appendChild(row);
    return;
  }
  payments.forEach((payment) => table.appendChild(buildPaymentRow(payment)));
}

document.addEventListener('DOMContentLoaded', () => {
  renderAdminPayments();
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.content-section');
  navLinks.forEach((link) => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      navLinks.forEach((l) => l.classList.remove('active'));
      this.classList.add('active');
      const target = this.getAttribute('href').replace('#', '');
      sections.forEach((section) => {
        if (section.id === target) section.classList.add('active');
        else section.classList.remove('active');
      });
    });
  });
});
