# Corrected Base presale safety boundaries

The production deployment commands are intentionally routed through `deploy-base-presale-production.mjs`.

Before importing the transaction-sending deployment sequence, the guard verifies:

- Base chain ID 8453
- the approved Base AETH token address
- the approved owner/treasury signer
- the exact rate, caps, limits, delay, duration, and funding arithmetic
- ownership of the invalid presale
- continued token-link mismatch evidence
- `cancelled() == true` before a live replacement deployment

The replacement-state verifier treats a fully funded contract with `launchable: false` as a successful safe-disabled state. It does not populate the public purchase address.

No workflow should enable public purchases or automate a real smoke purchase. Those remain separate owner-controlled launch decisions.
