// stripe-launchpad-frontend.js - Handles Stripe payment for Token Launchpad
// Requires Stripe.js loaded in the HTML

let stripeLaunchpad;

async function payForLaunchpad(name, symbol, priceCents) {
  if (!window.Stripe) {
    alert('Stripe.js not loaded.');
    return;
  }
  if (!stripeLaunchpad) {
    stripeLaunchpad = Stripe('pk_test_xxx'); // TODO: Replace with your real publishable key
  }
  // Create payment intent on backend
  const res = await fetch('/api/create-launchpad-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: priceCents,
      currency: 'usd',
      metadata: { name, symbol },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    alert(data.error || 'Payment failed.');
    return;
  }
  // Show Stripe payment modal
  const { error } = await stripeLaunchpad.confirmPayment({
    elements,
    confirmParams: {
      return_url: window.location.href + '?launchpad=paid',
    },
  });
  if (error) {
    alert(error.message);
  }
}

window.payForLaunchpad = payForLaunchpad;
