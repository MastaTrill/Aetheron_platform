Remaining index.js hardening targets for follow-up wiring:

1. ensureWalletChooser() modal construction
2. checkWalletStatus() wallet status rendering
3. displayUserStakes() stake list rendering
4. displayTransactions() transaction list rendering

Groundwork already added in this branch:
- safe-dom.js
- index-safe-renderers.js

Next code step is to replace string-built UI rendering in index.js with calls into the extracted renderers.
