// Handles the click event for the marketing launch button
// and updates the status div accordingly.
document.getElementById('launchBtn').addEventListener('click', () => {
  new MarketingLauncher();
  document.getElementById('status').innerText =
    'Campaign launched! Check browser tabs for posts.';
});
