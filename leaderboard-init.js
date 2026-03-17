const AETH_ADDRESS = '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e',
  STAKING_ADDRESS = '0x896D9d37A67B0bBf81dde0005975DA7850FFa638',
  AETH_ABI = [
    'function balanceOf(address) view returns (uint256)',
    'function totalSupply() view returns (uint256)',
  ],
  STAKING_ABI = [
    'function getUserStakesCount(address) view returns (uint256)',
    'function getUserStake(address, uint256) view returns (uint256, uint256, uint256, uint256, uint256, uint256)',
    'function totalStaked() view returns (uint256)',
  ];
let provider,
  currentTab = 'holders';
const mockLeaderboardData = {
  holders: [
    {
      address: '0x8A3a...3452',
      value: '125,450,000',
      percentage: '12.5%',
      badges: ['whale', 'og'],
      rank: 1,
    },
    {
      address: '0x6F2B...8971',
      value: '98,320,500',
      percentage: '9.8%',
      badges: ['whale', 'diamond'],
      rank: 2,
    },
    {
      address: '0x4D8E...1234',
      value: '75,890,200',
      percentage: '7.6%',
      badges: ['whale'],
      rank: 3,
    },
    {
      address: '0x9C3F...5678',
      value: '52,100,000',
      percentage: '5.2%',
      badges: ['og'],
      rank: 4,
    },
    {
      address: '0x2A7D...9012',
      value: '41,500,000',
      percentage: '4.2%',
      badges: ['diamond'],
      rank: 5,
    },
    {
      address: '0x5B1C...3456',
      value: '35,200,000',
      percentage: '3.5%',
      badges: [],
      rank: 6,
    },
    {
      address: '0x7E4F...7890',
      value: '28,900,000',
      percentage: '2.9%',
      badges: [],
      rank: 7,
    },
    {
      address: '0x8D2A...2345',
      value: '22,100,000',
      percentage: '2.2%',
      badges: ['og'],
      rank: 8,
    },
    {
      address: '0x3F5E...6789',
      value: '18,500,000',
      percentage: '1.9%',
      badges: [],
      rank: 9,
    },
    {
      address: '0x1C6B...0123',
      value: '15,200,000',
      percentage: '1.5%',
      badges: [],
      rank: 10,
    },
  ],
  stakers: [
    {
      address: '0x4D8E...1234',
      value: '45,890,200',
      duration: '180 days',
      badges: ['diamond'],
      rank: 1,
    },
    {
      address: '0x8A3a...3452',
      value: '38,450,000',
      duration: '90 days',
      badges: ['whale', 'og'],
      rank: 2,
    },
    {
      address: '0x6F2B...8971',
      value: '32,320,500',
      duration: '180 days',
      badges: ['diamond'],
      rank: 3,
    },
  ],
  traders: [
    {
      address: '0x2A7D...9012',
      value: '$125,450',
      trades: '342',
      badges: ['whale'],
      rank: 1,
    },
    {
      address: '0x5B1C...3456',
      value: '$98,320',
      trades: '289',
      badges: [],
      rank: 2,
    },
    {
      address: '0x7E4F...7890',
      value: '$75,890',
      trades: '215',
      badges: ['og'],
      rank: 3,
    },
  ],
  referrers: [
    {
      address: '0x9C3F...5678',
      value: '42',
      rewards: '125,000 AETH',
      badges: ['og'],
      rank: 1,
    },
    {
      address: '0x8D2A...2345',
      value: '35',
      rewards: '98,000 AETH',
      badges: [],
      rank: 2,
    },
    {
      address: '0x3F5E...6789',
      value: '28',
      rewards: '75,000 AETH',
      badges: [],
      rank: 3,
    },
  ],
};
function switchTab(e) {
  currentTab = e;
  document
    .querySelectorAll('.tab')
    .forEach((e) => e.classList.remove('active'));
  event.target.closest('.tab').classList.add('active');
  document.getElementById('categoryTitle').textContent = {
    holders: 'Top Holders',
    stakers: 'Top Stakers',
    traders: 'Top Traders',
    referrers: 'Top Referrers',
  }[e];
  loadLeaderboard(e);
}
function loadLeaderboard(e) {
  const a = document.getElementById('leaderboardContent'),
    s = mockLeaderboardData[e];
  s && 0 !== s.length
    ? (a.innerHTML = s
        .map(
          (a) => `
                <div class="leader-item">
                    <div class="rank ${a.rank <= 3 ? 'rank-' + a.rank : ''}">
                        ${a.rank <= 3 ? (1 === a.rank ? '🥇' : 2 === a.rank ? '🥈' : '🥉') : '#' + a.rank}
                    </div>
                    <div class="leader-info">
                        <div class="leader-address">${a.address}</div>
                        <div class="leader-badges">
                            ${a.badges.includes('whale') ? '<span class="badge badge-whale"><i class="fas fa-water"></i> Whale</span>' : ''}
                            ${a.badges.includes('og') ? '<span class="badge badge-og"><i class="fas fa-crown"></i> OG</span>' : ''}
                            ${a.badges.includes('diamond') ? '<span class="badge badge-diamond"><i class="fas fa-gem"></i> Diamond Hands</span>' : ''}
                        </div>
                    </div>
                    <div class="leader-stats">
                        <div class="stat-value">${a.value}</div>
                        <div class="stat-label">
                            ${'holders' === e ? 'AETH Tokens' : 'stakers' === e ? a.duration : 'traders' === e ? a.trades + ' trades' : 'referrers' === e ? 'referrals' : ''}
                        </div>
                        ${a.percentage ? `<div class="stat-label">${a.percentage} of supply</div>` : ''}
                        ${a.rewards ? `<div class="stat-label">${a.rewards} earned</div>` : ''}
                    </div>
                </div>
            `,
        )
        .join(''))
    : (a.innerHTML = `
                    <div class="loading">
                        <i class="fas fa-inbox" style="font-size: 3rem; opacity: 0.5;"></i>
                        <p style="margin-top: 1rem;">No data available yet</p>
                    </div>
                `);
}
function refreshLeaderboard() {
  document.getElementById('leaderboardContent').innerHTML = `
                <div class="loading">
                    <i class="fas fa-spinner loading-spinner"></i>
                    <p style="margin-top: 1rem;">Refreshing...</p>
                </div>
            `;
  setTimeout(() => loadLeaderboard(currentTab), 1e3);
}
window.addEventListener('load', () => {
  loadLeaderboard('holders');
});
