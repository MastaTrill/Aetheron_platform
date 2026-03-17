// coinbase-commerce-frontend.js - Coinbase Commerce integration for Launchpad & Scanner
// Usage: window.payWithCoinbase({ name, description, amount, currency, metadata, redirect_url, cancel_url })

async function payWithCoinbase({
  name,
  description,
  amount,
  currency = 'USD',
  metadata = {},
  redirect_url,
  cancel_url,
}) {
  if (window.showPaymentStatusModal)
    showPaymentStatusModal('pending', 'Redirecting to Coinbase Commerce...');
  let data;
  try {
    const res = await fetch('/api/create-coinbase-charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        amount,
        currency,
        metadata,
        redirect_url,
        cancel_url,
      }),
    });
    data = await res.json();
    if (!res.ok || !data || !data.data || !data.data.hosted_url) {
      let msg =
        data && data.error
          ? data.error
          : 'Failed to create Coinbase Commerce charge.';
      if (window.showPaymentStatusModal) showPaymentStatusModal('error', msg);
      else alert(msg);
      return;
    }
    if (window.showPaymentStatusModal)
      showPaymentStatusModal('success', 'Redirecting to Coinbase Commerce...');
    setTimeout(() => {
      window.open(data.data.hosted_url, '_blank');
      closePaymentStatusModal && closePaymentStatusModal();
    }, 1000);
  } catch (err) {
    let msg = err && err.message ? err.message : 'Payment failed.';
    if (window.showPaymentStatusModal) showPaymentStatusModal('error', msg);
    else alert(msg);
  }
}

window.payWithCoinbase = payWithCoinbase;
