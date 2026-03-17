// Dark mode toggle logic
document.addEventListener('DOMContentLoaded', function () {
  var themeBtn = document.getElementById('themeToggleBtn');
  themeBtn &&
    themeBtn.addEventListener('click', function () {
      document.body.classList.toggle('dark-mode');
    });
});
// Example ARIA live region update for balance
function updateBalanceLive(newBalance) {
  var balanceLive = document.getElementById('balanceLiveRegion');
  if (balanceLive) {
    balanceLive.textContent = 'Balance updated: ' + newBalance;
  }
}
