let provider,
  signer,
  userAddress,
  tokenContract,
  stakingContract,
  aethPrice = 487e-6;
const TOKEN_ADDRESS = '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e',
  STAKING_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  TOKEN_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
  ],
  STAKING_ABI = [
    'function userStakes(address user, uint256 poolId) view returns (uint256 amount, uint256 stakeTime, uint256 unlockTime)',
    'function calculateReward(address user, uint256 poolId) view returns (uint256)',
    'function poolCount() view returns (uint256)',
  ];
async function connectWallet() {
  try {
    if (window.ethereum === undefined) {
      alert('Please install MetaMask to use this feature!');
      return;
    }
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    if ((await provider.getNetwork()).chainId !== 137) {
      alert('Please switch to Polygon Mainnet (Chain ID: 137)');
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x89' }],
        });
        location.reload();
        return;
      } catch (t) {
        console.error('Failed to switch network:', t);
        return;
      }
    }
    tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
    stakingContract = new ethers.Contract(
      STAKING_ADDRESS,
      STAKING_ABI,
      provider,
    );
    document.getElementById('walletStatus').style.display = 'none';
    document.getElementById('portfolioContent').style.display = 'block';
    await loadPortfolioData();
  } catch (t) {
    console.error('Error connecting wallet:', t);
    alert('Failed to connect wallet. Please try again.');
  }
}
async function fetchAethPrice() {
  try {
    const t = await fetch(
      'https://api.dexscreener.com/latest/dex/pairs/polygon/0xd57c5E33ebDC1b565F99d06809debbf86142705D',
    );
    const e = await t.json();
    if (e.pair && e.pair.priceUsd) aethPrice = parseFloat(e.pair.priceUsd);
  } catch (t) {
    console.log('Failed to fetch price, using default:', t);
  }
}
async function loadPortfolioData() {
  try {
    await fetchAethPrice();
    const t = await tokenContract.balanceOf(userAddress);
    const e = await tokenContract.decimals();
    const n = parseFloat(ethers.utils.formatUnits(t, e));
    let o = 0,
      a = 0;
    const d = [],
      r = [
        { id: 0, apy: 5, days: 30, name: '30-Day Pool (5% APY)' },
        { id: 1, apy: 12, days: 90, name: '90-Day Pool (12% APY)' },
        { id: 2, apy: 25, days: 180, name: '180-Day Pool (25% APY)' },
      ];
    for (const t of r) {
      try {
        const n = await stakingContract.userStakes(userAddress, t.id);
        const r = parseFloat(ethers.utils.formatUnits(n.amount, e));
        if (r > 0) {
          const e = n.stakeTime.toNumber(),
            i = n.unlockTime.toNumber(),
            s = (Date.now() / 1e3 - e) / 86400,
            l = ((r * t.apy) / 100 / 365) * s;
          o += r;
          a += l;
          d.push({
            pool: t.name,
            poolId: t.id,
            amount: r,
            rewards: l,
            apy: t.apy,
            lockDays: t.days,
            stakeTime: e,
            unlockTime: i,
          });
        }
        document.getElementById(`staked${t.id + 1}`).textContent =
          `${r.toFixed(2)} AETH`;
        document.getElementById(`staked${t.id + 1}Value`).textContent =
          `$${(r * aethPrice).toFixed(2)}`;
      } catch (e) {
        console.log(`No stake in pool ${t.id}`, e);
        document.getElementById(`staked${t.id + 1}`).textContent = '0 AETH';
        document.getElementById(`staked${t.id + 1}Value`).textContent = '$0.00';
        document.getElementById(`staked${t.id + 1}Percentage`).textContent =
          '0%';
      }
    }
    const i = n + o,
      s = i * aethPrice;
    document.getElementById('totalValue').textContent = `$${s.toFixed(2)}`;
    document.getElementById('totalChange').textContent =
      `+${a.toFixed(4)} AETH earned`;
    document.getElementById('totalAETH').textContent = `${i.toFixed(2)} AETH`;
    document.getElementById('aethUSD').textContent =
      `$${(i * aethPrice).toFixed(2)}`;
    document.getElementById('stakedAETH').textContent = `${o.toFixed(2)} AETH`;
    document.getElementById('stakedUSD').textContent =
      `$${(o * aethPrice).toFixed(2)}`;
    document.getElementById('totalRewards').textContent =
      `${a.toFixed(4)} AETH`;
    document.getElementById('rewardsUSD').textContent =
      `$${(a * aethPrice).toFixed(4)}`;
    document.getElementById('walletBalance').textContent =
      `${n.toFixed(2)} AETH`;
    document.getElementById('walletValue').textContent =
      `$${(n * aethPrice).toFixed(2)}`;
    document.getElementById('walletPercentage').textContent =
      `${i > 0 ? ((n / i) * 100).toFixed(1) : 0}%`;
    r.forEach((t, e) => {
      const n = document.getElementById(`staked${e + 1}`).textContent,
        o = parseFloat(n.replace(' AETH', '')),
        a = i > 0 ? ((o / i) * 100).toFixed(1) : 0;
      document.getElementById(`staked${e + 1}Percentage`).textContent = `${a}%`;
    });
    updateStakingTable(d);
    if (o > 0) {
      const t =
        d.length > 0 ? d.reduce((t, e) => t + (e.amount / o) * e.apy, 0) : 0;
      document.getElementById('avgAPY').textContent = `${t.toFixed(2)}%`;
      const e = (o * t) / 100 / 365;
      document.getElementById('dailyEarnings').textContent =
        `${e.toFixed(4)} AETH`;
      document.getElementById('monthlyEarnings').textContent =
        `${(30 * e).toFixed(2)} AETH`;
      document.getElementById('yearlyEarnings').textContent =
        `${(365 * e).toFixed(2)} AETH`;
      const n = o > 0 ? (a / o) * 100 : 0;
      document.getElementById('roi').textContent = `${n.toFixed(2)}%`;
      const r =
        d.length > 0
          ? Math.floor(
              d.reduce(
                (t, e) => t + (Date.now() / 1e3 - e.stakeTime) / 86400,
                0,
              ) / d.length,
            )
          : 0;
      document.getElementById('daysStaking').textContent = r;
    } else {
      document.getElementById('avgAPY').textContent = '0%';
      document.getElementById('dailyEarnings').textContent = '0 AETH';
      document.getElementById('monthlyEarnings').textContent = '0 AETH';
      document.getElementById('yearlyEarnings').textContent = '0 AETH';
      document.getElementById('roi').textContent = '0%';
      document.getElementById('daysStaking').textContent = '0';
    }
  } catch (t) {
    console.error('Error loading portfolio data:', t);
    alert(
      'Failed to load portfolio data. Some features may not work correctly.',
    );
  }
}
function updateStakingTable(t) {
  const e = document.getElementById('stakesTableBody');
  e.innerHTML = '';
  if (t.length !== 0) {
    t.forEach((t) => {
      new Date(1e3 * t.stakeTime);
      const n = new Date(1e3 * t.unlockTime),
        o = Date.now(),
        a = o < n.getTime(),
        d = Math.max(0, Math.ceil((n.getTime() - o) / 864e5)),
        r = (t.amount * t.apy) / 100,
        i = document.createElement('tr');
      i.innerHTML = `
        <td><strong>${t.pool}</strong></td>
        <td>${t.amount.toFixed(2)} AETH</td>
        <td><span class="badge badge-success">${t.apy}%</span></td>
        <td>${t.rewards.toFixed(4)} AETH</td>
        <td>${r.toFixed(2)} AETH/yr</td>
        <td>${t.lockDays} days</td>
        <td>${n.toLocaleDateString()}</td>
        <td>
          ${a ? `<span class="badge badge-warning"><i class="fas fa-lock"></i> Locked (${d}d)</span>` : '<span class="badge badge-success"><i class="fas fa-unlock"></i> Unlocked</span>'}
        </td>
      `;
      e.appendChild(i);
    });
  } else {
    e.innerHTML =
      '<tr>\n<td colspan="8" class="empty-state">\n<i class="fas fa-inbox empty-state-icon"></i>\nNo active staking positions\n</td>\n</tr>';
  }
}
window.addEventListener('load', async () => {
  if (window.ethereum) {
    const t = await window.ethereum.request({ method: 'eth_accounts' });
    if (t.length > 0) {
      userAddress = t[0];
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();
      tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
      stakingContract = new ethers.Contract(
        STAKING_ADDRESS,
        STAKING_ABI,
        provider,
      );
      document.getElementById('walletStatus').style.display = 'none';
      document.getElementById('portfolioContent').style.display = 'block';
      await loadPortfolioData();
    }
  }
});
setInterval(() => {
  if (userAddress) loadPortfolioData();
}, 3e4);
