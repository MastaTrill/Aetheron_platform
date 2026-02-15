// stripe-frontend.js - Handles Stripe payment for Token Security Scanner
// Requires Stripe.js loaded in the HTML

let stripe;

async function payForFullScan(address, priceCents) {
  if (!window.Stripe) {
    alert('Stripe.js not loaded.');
    return;
  }
  if (!stripe) {
    stripe = Stripe('pk_test_xxx'); // TODO: Replace with your real publishable key
  }
  // Create payment intent on backend
  const res = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: priceCents,
      currency: 'usd',
      metadata: { address },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    alert(data.error || 'Payment failed.');
    return;
  }
  // Show Stripe payment modal
  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: window.location.href + '?scan=paid',
    },
  });
  if (error) {
    alert(error.message);
  }
}

window.payForFullScan = payForFullScan;
