// Quick Stats Card live update logic
function updateQuickStats() {
  // Try to get wallet/account info from existing DOM
  const account =
    document.getElementById('accountAddress')?.textContent?.trim() || '-';
  const aeth =
    document.getElementById('aethBalance')?.textContent?.trim() || '-';
  const staked =
    document
      .getElementById('stakingHistoryTable')
      ?.querySelector('tbody tr:not(.text-gray) td:nth-child(3)')
      ?.textContent?.trim() || '0';
  const treasury =
    document.getElementById('treasuryTotal')?.textContent?.trim() || '-';
  const rewards =
    document.getElementById('stakingRewards')?.textContent?.trim() || '-';
  document.getElementById('quickWallet').textContent = account;
  document.getElementById('quickAeth').textContent = aeth;
  document.getElementById('quickStaked').textContent = staked;
  document.getElementById('quickTreasury').textContent = treasury;
  document.getElementById('quickRewards').textContent = rewards;
}
document.addEventListener('DOMContentLoaded', function () {
  updateQuickStats();
  // Also update on wallet or treasury refresh
  document
    .getElementById('refreshBalancesBtn')
    ?.addEventListener('click', () => setTimeout(updateQuickStats, 1000));
  document
    .getElementById('refreshTreasuryBtn')
    ?.addEventListener('click', () => setTimeout(updateQuickStats, 1000));
});
