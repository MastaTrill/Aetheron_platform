// admin-dashboard-init.js
// Extracted from inline <script> in admin-dashboard.html

async function fetchAllPayments() {
  // For demo, fetch a flat file or extend backend for admin
  const res = await fetch('/api/all-payments');
  if (!res.ok) return [];
  const data = await res.json();
  return data.payments || [];
}

async function renderAdminPayments() {
  const table = document.getElementById('adminPaymentTableBody');
  if (!table) return;
  const payments = await fetchAllPayments();
  if (!payments.length) {
    table.innerHTML = '<tr><td colspan="6">No payments found.</td></tr>';
    return;
  }
  table.innerHTML = payments
    .map(
      (p) => `
    <tr>
      <td>${p.user || '-'}</td>
      <td>${p.date ? new Date(p.date).toLocaleString() : '-'}</td>
      <td>${p.amount} ${p.currency}</td>
      <td>${p.status || '-'}</td>
      <td>${p.txid ? `<a href="${p.txid}" target="_blank">View</a>` : '-'}</td>
      <td>${p.gateway || 'Coinbase'}</td>
    </tr>
  `,
    )
    .join('');
}

// Navigation logic to switch sections
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
        if (section.id === target) {
          section.classList.add('active');
        } else {
          section.classList.remove('active');
        }
      });
    });
  });
});
