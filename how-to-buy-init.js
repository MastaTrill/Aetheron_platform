function copyToClipboard(o) {
  navigator.clipboard
    .writeText(o)
    .then(() => {
      alert('✅ Contract address copied to clipboard!\n\n' + o);
    })
    .catch((r) => {
      console.error('Failed to copy:', r);
      prompt('Copy this address:', o);
    });
}
