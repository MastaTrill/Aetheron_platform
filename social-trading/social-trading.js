// Social Trading JavaScript
class SocialTrading {
  constructor() {
    this.currentTab = 'feed';
    this.currentUser = {
      id: 'user1',
      name: 'Alex Thompson',
      handle: '@alexthompson',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      followers: 1247,
      following: 892,
      portfolioValue: 45678.90,
      winRate: 68.5,
      totalTrades: 234
    };
    this.posts = [];
    this.traders = [];
    this.competitions = [];
    this.leaderboard = [];
    this.following = new Set(['user2', 'user3', 'user5']);
    this.notifications = [];

    this.init();
  }

  init() {
    this.bindEvents();
    this.loadInitialData();
    this.setupCharts();
    this.startRealTimeUpdates();
    this.showTab('feed');
  }

  bindEvents() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        this.showTab(tab);
      });
    });

    // Profile tabs
    document.querySelectorAll('.profile-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        this.showProfileTab(tab);
      });
    });

    // Post creation
    const postForm = document.getElementById('postForm');
    if (postForm) {
      postForm.addEventListener('submit', (e) => this.createPost(e));
    }

    // Signal creation
    const signalForm = document.getElementById('signalForm');
    if (signalForm) {
      signalForm.addEventListener('submit', (e) => this.createSignal(e));
    }

    // Modal management
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeModal();
      }
    });

    document.querySelectorAll('.close-modal').forEach(btn => {
      btn.addEventListener('click', () => this.closeModal());
    });

    // Follow buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('follow-btn') || e.target.closest('.follow-btn')) {
        const btn = e.target.classList.contains('follow-btn') ? e.target : e.target.closest('.follow-btn');
        this.toggleFollow(btn);
      }
    });

    // Post interactions
    document.addEventListener('click', (e) => {
      if (e.target.closest('.post-action')) {
        const action = e.target.closest('.post-action');
        const postId = action.closest('.post-card').dataset.postId;
        const actionType = action.dataset.action;
        this.handlePostAction(postId, actionType, action);
      }
    });

    // Load more posts
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => this.loadMorePosts());
    }

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.searchTraders(e.target.value));
    }

    // Competition filters
    document.querySelectorAll('.time-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filterLeaderboard(btn.dataset.time);
      });
    });

    // Leaderboard tabs
    document.querySelectorAll('.leader-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.leader-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.showLeaderboardTab(btn.dataset.tab);
      });
    });
  }

  showTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Hide all tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });

    // Show selected tab content
    const tabContent = document.getElementById(`${tabName}Tab`);
    if (tabContent) {
      tabContent.classList.add('active');
    }

    this.currentTab = tabName;

    // Load tab-specific data
    switch (tabName) {
      case 'feed':
        this.loadFeed();
        break;
      case 'discover':
        this.loadDiscover();
        break;
      case 'competitions':
        this.loadCompetitions();
        break;
      case 'leaderboard':
        this.loadLeaderboard();
        break;
      case 'profile':
        this.loadProfile();
        break;
    }
  }

  showProfileTab(tabName) {
    // Update profile tab buttons
    document.querySelectorAll('.profile-tab').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Hide all profile sections
    document.querySelectorAll('.profile-section').forEach(section => {
      section.classList.remove('active');
    });

    // Show selected profile section
    const section = document.getElementById(`${tabName}Section`);
    if (section) {
      section.classList.add('active');
    }
  }

  async loadInitialData() {
    this.showLoading();

    try {
      // Simulate API calls
      await Promise.all([
        this.loadPosts(),
        this.loadTraders(),
        this.loadCompetitions(),
        this.loadLeaderboard()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showToast('Error loading data', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async loadPosts() {
    // Simulate API call
    const mockPosts = [
      {
        id: 'post1',
        user: {
          id: 'user2',
          name: 'Sarah Chen',
          handle: '@sarahchen',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'
        },
        content: 'Just entered a long position on ETH/USDT. The technicals look strong with support at $3,200. Expecting a breakout soon! 🚀',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        likes: 24,
        reposts: 8,
        comments: 12,
        type: 'text'
      },
      {
        id: 'post2',
        user: {
          id: 'user3',
          name: 'Mike Rodriguez',
          handle: '@mikerod',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
        },
        content: 'New trading signal: SHORT BTC/USDT',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        likes: 18,
        reposts: 5,
        comments: 7,
        type: 'signal',
        signal: {
          type: 'sell',
          asset: 'BTC/USDT',
          entry: 43250.00,
          stopLoss: 44500.00,
          takeProfit: 41000.00,
          reason: 'Overbought conditions on RSI and MACD divergence'
        }
      },
      {
        id: 'post3',
        user: {
          id: 'user4',
          name: 'Emma Wilson',
          handle: '@emmawilson',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
        },
        content: 'Portfolio update: +12.5% this week! My DeFi strategy is really paying off. Here\'s my current allocation breakdown.',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        likes: 31,
        reposts: 15,
        comments: 9,
        type: 'text',
        attachment: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop'
      }
    ];

    this.posts = mockPosts;
    this.renderPosts();
  }

  async loadTraders() {
    const mockTraders = [
      {
        id: 'user2',
        name: 'Sarah Chen',
        handle: '@sarahchen',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
        bio: 'Professional trader specializing in crypto and forex markets. 5+ years experience.',
        followers: 2847,
        following: 456,
        winRate: 72.3,
        totalTrades: 1247,
        portfolioValue: 89234.56,
        monthlyReturn: 15.8,
        riskScore: 6.2,
        isFollowing: this.following.has('user2')
      },
      {
        id: 'user3',
        name: 'Mike Rodriguez',
        handle: '@mikerod',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        bio: 'Day trader and technical analyst. Love sharing market insights and trading strategies.',
        followers: 1923,
        following: 234,
        winRate: 68.9,
        totalTrades: 892,
        portfolioValue: 56789.12,
        monthlyReturn: 12.4,
        riskScore: 7.8,
        isFollowing: this.following.has('user3')
      },
      {
        id: 'user5',
        name: 'David Kim',
        handle: '@davidkim',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
        bio: 'Quantitative trader using AI and machine learning for market predictions.',
        followers: 3456,
        following: 123,
        winRate: 75.1,
        totalTrades: 2156,
        portfolioValue: 145678.90,
        monthlyReturn: 18.2,
        riskScore: 5.4,
        isFollowing: this.following.has('user5')
      }
    ];

    this.traders = mockTraders;
    this.renderTraders();
  }

  async loadCompetitions() {
    const mockCompetitions = [
      {
        id: 'comp1',
        title: 'Monthly Trading Championship',
        description: 'Compete with traders worldwide for the top spot this month!',
        icon: '🏆',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        participants: 1247,
        prizePool: 50000,
        status: 'active',
        isJoined: false,
        rules: 'Trade with at least $1000 portfolio value. Winner takes 50% of prize pool.'
      },
      {
        id: 'comp2',
        title: 'DeFi Yield Hunter',
        description: 'Find the highest yielding DeFi opportunities and share your strategies.',
        icon: '🚀',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-02-15'),
        participants: 892,
        prizePool: 25000,
        status: 'upcoming',
        isJoined: true,
        rules: 'Focus on DeFi protocols. Minimum 5 different protocols in portfolio.'
      },
      {
        id: 'comp3',
        title: 'Risk Management Challenge',
        description: 'Demonstrate excellent risk management while achieving returns.',
        icon: '🛡️',
        startDate: new Date('2023-12-01'),
        endDate: new Date('2023-12-31'),
        participants: 654,
        prizePool: 15000,
        status: 'ended',
        isJoined: false,
        rules: 'Maximum drawdown of 10%. Sharpe ratio above 2.0 required.'
      }
    ];

    this.competitions = mockCompetitions;
    this.renderCompetitions();
  }

  async loadLeaderboard() {
    const mockLeaderboard = [
      {
        rank: 1,
        user: {
          id: 'user2',
          name: 'Sarah Chen',
          handle: '@sarahchen',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'
        },
        score: 24567.89,
        change: 12.5,
        winRate: 72.3,
        totalTrades: 1247
      },
      {
        rank: 2,
        user: {
          id: 'user5',
          name: 'David Kim',
          handle: '@davidkim',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'
        },
        score: 22341.67,
        change: 8.9,
        winRate: 75.1,
        totalTrades: 2156
      },
      {
        rank: 3,
        user: {
          id: 'user3',
          name: 'Mike Rodriguez',
          handle: '@mikerod',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
        },
        score: 19876.43,
        change: 15.2,
        winRate: 68.9,
        totalTrades: 892
      }
    ];

    this.leaderboard = mockLeaderboard;
    this.renderLeaderboard();
  }

  renderPosts() {
    const container = document.getElementById('postsContainer');
    if (!container) return;

    container.innerHTML = '';

    this.posts.forEach(post => {
      const postElement = this.createPostElement(post);
      container.appendChild(postElement);
    });
  }

  createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post-card';
    postDiv.dataset.postId = post.id;

    const timeAgo = this.getTimeAgo(post.timestamp);

    postDiv.innerHTML = `
            <div class="post-header">
                <img src="${post.user.avatar}" alt="${post.user.name}" class="post-user-avatar">
                <div class="post-user-info">
                    <div class="post-user-name">${post.user.name}</div>
                    <div class="post-user-handle">${post.user.handle}</div>
                    <div class="post-timestamp">${timeAgo}</div>
                </div>
            </div>
            <div class="post-content">${this.formatPostContent(post.content)}</div>
            ${post.attachment ? `<img src="${post.attachment}" alt="Post attachment" class="post-attachment">` : ''}
            ${post.type === 'signal' ? this.createSignalElement(post.signal) : ''}
            <div class="post-actions">
                <div class="post-action" data-action="like">
                    <i class="fas fa-heart"></i>
                    <span>${post.likes}</span>
                </div>
                <div class="post-action" data-action="repost">
                    <i class="fas fa-retweet"></i>
                    <span>${post.reposts}</span>
                </div>
                <div class="post-action" data-action="comment">
                    <i class="fas fa-comment"></i>
                    <span>${post.comments}</span>
                </div>
                <div class="post-action" data-action="share">
                    <i class="fas fa-share"></i>
                </div>
            </div>
        `;

    return postDiv;
  }

  createSignalElement(signal) {
    return `
            <div class="post-signal">
                <div class="signal-header">
                    <div class="signal-type ${signal.type}">
                        <i class="fas fa-${signal.type === 'buy' ? 'arrow-up' : 'arrow-down'}"></i>
                        ${signal.type.toUpperCase()}
                    </div>
                    <div class="signal-asset">${signal.asset}</div>
                </div>
                <div class="signal-details">
                    <div class="signal-detail">
                        <div class="signal-label">Entry</div>
                        <div class="signal-value">$${signal.entry.toLocaleString()}</div>
                    </div>
                    <div class="signal-detail">
                        <div class="signal-label">Stop Loss</div>
                        <div class="signal-value">$${signal.stopLoss.toLocaleString()}</div>
                    </div>
                    <div class="signal-detail">
                        <div class="signal-label">Take Profit</div>
                        <div class="signal-value">$${signal.takeProfit.toLocaleString()}</div>
                    </div>
                </div>
                <div class="signal-reason">${signal.reason}</div>
            </div>
        `;
  }

  renderTraders() {
    const container = document.getElementById('tradersGrid');
    if (!container) return;

    container.innerHTML = '';

    this.traders.forEach(trader => {
      const traderElement = this.createTraderElement(trader);
      container.appendChild(traderElement);
    });
  }

  createTraderElement(trader) {
    const traderDiv = document.createElement('div');
    traderDiv.className = 'trader-card';

    traderDiv.innerHTML = `
            <div class="trader-header">
                <img src="${trader.avatar}" alt="${trader.name}" class="trader-avatar">
                <div class="trader-info">
                    <h3>${trader.name}</h3>
                    <p>${trader.handle}</p>
                </div>
            </div>
            <div class="trader-stats">
                <div class="trader-stat">
                    <div class="trader-stat-value">${trader.winRate}%</div>
                    <div class="trader-stat-label">Win Rate</div>
                </div>
                <div class="trader-stat">
                    <div class="trader-stat-value">${trader.monthlyReturn}%</div>
                    <div class="trader-stat-label">Monthly</div>
                </div>
                <div class="trader-stat">
                    <div class="trader-stat-value">${trader.followers.toLocaleString()}</div>
                    <div class="trader-stat-label">Followers</div>
                </div>
            </div>
            <div class="trader-bio">${trader.bio}</div>
            <button class="follow-btn ${trader.isFollowing ? 'following' : ''}" data-user-id="${trader.id}">
                <i class="fas fa-${trader.isFollowing ? 'check' : 'plus'}"></i>
                ${trader.isFollowing ? 'Following' : 'Follow'}
            </button>
        `;

    return traderDiv;
  }

  renderCompetitions() {
    const container = document.getElementById('competitionsGrid');
    if (!container) return;

    container.innerHTML = '';

    this.competitions.forEach(competition => {
      const compElement = this.createCompetitionElement(competition);
      container.appendChild(compElement);
    });
  }

  createCompetitionElement(competition) {
    const compDiv = document.createElement('div');
    compDiv.className = 'competition-card';

    const statusClass = competition.status === 'active' ? 'success' :
      competition.status === 'upcoming' ? 'warning' : 'secondary';
    const statusText = competition.status.charAt(0).toUpperCase() + competition.status.slice(1);

    compDiv.innerHTML = `
            <div class="competition-header">
                <div class="competition-icon">${competition.icon}</div>
                <div class="competition-info">
                    <h3>${competition.title}</h3>
                    <p>${competition.description}</p>
                </div>
            </div>
            <div class="competition-details">
                <div class="competition-detail">
                    <div class="competition-label">Participants</div>
                    <div class="competition-value">${competition.participants.toLocaleString()}</div>
                </div>
                <div class="competition-detail">
                    <div class="competition-label">Prize Pool</div>
                    <div class="competition-value">$${competition.prizePool.toLocaleString()}</div>
                </div>
            </div>
            <div class="competition-prize">
                <div class="prize-amount">$${competition.prizePool.toLocaleString()}</div>
                <div class="prize-label">Total Prize Pool</div>
            </div>
            <button class="join-btn ${competition.isJoined ? 'joined' : ''} ${statusClass}" data-comp-id="${competition.id}">
                <i class="fas fa-${competition.isJoined ? 'check' : 'trophy'}"></i>
                ${competition.isJoined ? 'Joined' : 'Join Competition'}
            </button>
        `;

    return compDiv;
  }

  renderLeaderboard() {
    const container = document.getElementById('leaderboardList');
    if (!container) return;

    container.innerHTML = '';

    this.leaderboard.forEach((entry, index) => {
      const entryElement = this.createLeaderboardElement(entry, index);
      container.appendChild(entryElement);
    });
  }

  createLeaderboardElement(entry, index) {
    const entryDiv = document.createElement('div');
    entryDiv.className = `leaderboard-item ${index < 3 ? 'top-3' : ''}`;

    entryDiv.innerHTML = `
            <div class="rank">${entry.rank}</div>
            <img src="${entry.user.avatar}" alt="${entry.user.name}" class="leader-avatar">
            <div class="leader-info">
                <div class="leader-name">${entry.user.name}</div>
                <div class="leader-handle">${entry.user.handle}</div>
            </div>
            <div class="leader-score">$${entry.score.toLocaleString()}</div>
        `;

    return entryDiv;
  }

  async createPost(e) {
    e.preventDefault();

    const form = e.target;
    const content = form.querySelector('textarea').value.trim();

    if (!content) {
      this.showToast('Please enter some content for your post', 'warning');
      return;
    }

    this.showLoading();

    try {
      // Simulate API call
      await this.delay(1000);

      const newPost = {
        id: `post${Date.now()}`,
        user: this.currentUser,
        content: content,
        timestamp: new Date(),
        likes: 0,
        reposts: 0,
        comments: 0,
        type: 'text'
      };

      this.posts.unshift(newPost);
      this.renderPosts();

      // Reset form
      form.reset();

      this.showToast('Post created successfully!', 'success');
    } catch (error) {
      console.error('Error creating post:', error);
      this.showToast('Error creating post', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async createSignal(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    const signalData = {
      type: formData.get('signalType'),
      asset: formData.get('asset'),
      entry: parseFloat(formData.get('entryPrice')),
      stopLoss: parseFloat(formData.get('stopLoss')),
      takeProfit: parseFloat(formData.get('takeProfit')),
      reason: formData.get('reason')
    };

    // Basic validation
    if (!signalData.asset || !signalData.entry || !signalData.stopLoss || !signalData.takeProfit) {
      this.showToast('Please fill in all required fields', 'warning');
      return;
    }

    this.showLoading();

    try {
      // Simulate API call
      await this.delay(1000);

      const newPost = {
        id: `signal${Date.now()}`,
        user: this.currentUser,
        content: `New trading signal: ${signalData.type.toUpperCase()} ${signalData.asset}`,
        timestamp: new Date(),
        likes: 0,
        reposts: 0,
        comments: 0,
        type: 'signal',
        signal: signalData
      };

      this.posts.unshift(newPost);
      this.renderPosts();

      // Close modal and reset form
      this.closeModal();
      form.reset();

      this.showToast('Trading signal created successfully!', 'success');
    } catch (error) {
      console.error('Error creating signal:', error);
      this.showToast('Error creating signal', 'error');
    } finally {
      this.hideLoading();
    }
  }

  toggleFollow(btn) {
    const userId = btn.dataset.userId;
    const isFollowing = this.following.has(userId);

    if (isFollowing) {
      this.following.delete(userId);
      btn.classList.remove('following');
      btn.innerHTML = '<i class="fas fa-plus"></i> Follow';
    } else {
      this.following.add(userId);
      btn.classList.add('following');
      btn.innerHTML = '<i class="fas fa-check"></i> Following';
    }

    // Update trader data
    const trader = this.traders.find(t => t.id === userId);
    if (trader) {
      trader.isFollowing = !isFollowing;
    }

    this.showToast(
      isFollowing ? 'Unfollowed trader' : 'Following trader',
      'success'
    );
  }

  handlePostAction(postId, actionType, element) {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    switch (actionType) {
      case 'like':
        post.likes += post.likes === 0 ? 1 : -1;
        element.classList.toggle('liked');
        break;
      case 'repost':
        post.reposts += 1;
        element.classList.add('reposted');
        break;
      case 'comment':
        // Open comments modal or expand comments
        this.showToast('Comments feature coming soon!', 'info');
        break;
      case 'share':
        // Share functionality
        this.showToast('Share link copied to clipboard!', 'success');
        break;
    }

    // Update UI
    element.querySelector('span').textContent = post[actionType === 'like' ? 'likes' : actionType === 'repost' ? 'reposts' : 'comments'];
  }

  searchTraders(query) {
    const filtered = this.traders.filter(trader =>
      trader.name.toLowerCase().includes(query.toLowerCase()) ||
      trader.handle.toLowerCase().includes(query.toLowerCase()) ||
      trader.bio.toLowerCase().includes(query.toLowerCase())
    );

    const container = document.getElementById('tradersGrid');
    container.innerHTML = '';

    filtered.forEach(trader => {
      const traderElement = this.createTraderElement(trader);
      container.appendChild(traderElement);
    });
  }

  filterLeaderboard(timeframe) {
    // Simulate different timeframes
    this.showToast(`Showing ${timeframe} leaderboard`, 'info');
  }

  showLeaderboardTab(tab) {
    // Different leaderboard categories
    this.showToast(`Showing ${tab} leaderboard`, 'info');
  }

  loadFeed() {
    // Feed is already loaded in loadPosts
  }

  loadDiscover() {
    // Traders are already loaded in loadTraders
  }

  loadCompetitions() {
    // Competitions are already loaded in loadCompetitions
  }

  loadLeaderboard() {
    // Leaderboard is already loaded in loadLeaderboard
  }

  loadProfile() {
    this.renderProfile();
    this.showProfileTab('overview');
  }

  renderProfile() {
    // Update profile header
    const profileAvatar = document.querySelector('.profile-avatar-large');
    const profileName = document.querySelector('.profile-details h2');
    const profileBio = document.querySelector('.profile-bio');

    if (profileAvatar) profileAvatar.src = this.currentUser.avatar;
    if (profileName) profileName.textContent = this.currentUser.name;
    if (profileBio) profileBio.textContent = 'Passionate trader focused on cryptocurrency and DeFi opportunities. Always learning and sharing insights with the community.';

    // Update stats
    this.updateProfileStats();
  }

  updateProfileStats() {
    const statElements = document.querySelectorAll('.profile-stats-grid .stat-card');
    const stats = [
      { value: this.currentUser.followers.toLocaleString(), label: 'Followers' },
      { value: this.currentUser.following.toLocaleString(), label: 'Following' },
      { value: `$${this.currentUser.portfolioValue.toLocaleString()}`, label: 'Portfolio Value' },
      { value: `${this.currentUser.winRate}%`, label: 'Win Rate' },
      { value: this.currentUser.totalTrades.toLocaleString(), label: 'Total Trades' },
      { value: '7.2', label: 'Risk Score' }
    ];

    statElements.forEach((card, index) => {
      if (stats[index]) {
        card.querySelector('.stat-value').textContent = stats[index].value;
        card.querySelector('.stat-label').textContent = stats[index].label;
      }
    });
  }

  setupCharts() {
    // Portfolio chart
    const portfolioCtx = document.getElementById('portfolioChart');
    if (portfolioCtx) {
      new Chart(portfolioCtx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Portfolio Value',
            data: [35000, 38000, 42000, 39500, 43500, 45678.90],
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              ticks: {
                callback: function (value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          }
        }
      });
    }

    // Sentiment chart
    const sentimentCtx = document.getElementById('sentimentChart');
    if (sentimentCtx) {
      new Chart(sentimentCtx, {
        type: 'doughnut',
        data: {
          labels: ['Bullish', 'Bearish', 'Neutral'],
          datasets: [{
            data: [65, 25, 10],
            backgroundColor: ['#22c55e', '#ef4444', '#f59e0b'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }
  }

  startRealTimeUpdates() {
    // Simulate real-time updates every 30 seconds
    setInterval(() => {
      this.updateLiveData();
    }, 30000);
  }

  updateLiveData() {
    // Update follower counts, post likes, etc.
    // This would typically connect to WebSocket or polling API
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.classList.remove('active'));
    document.body.style.overflow = '';
  }

  showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.add('active');
    }
  }

  hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }

  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? 'check-circle' :
      type === 'error' ? 'exclamation-circle' :
        type === 'warning' ? 'exclamation-triangle' : 'info-circle';

    toast.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <div class="toast-content">
                <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

    toastContainer.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 5000);

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    });
  }

  loadMorePosts() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
      loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
      loadMoreBtn.disabled = true;
    }

    // Simulate loading more posts
    setTimeout(() => {
      const newPosts = [
        {
          id: `post${Date.now()}`,
          user: {
            id: 'user6',
            name: 'Lisa Park',
            handle: '@lisapark',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face'
          },
          content: 'Market analysis: BTC showing strong bullish divergence on the 4-hour chart. Watch for breakout above $44,000.',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          likes: 15,
          reposts: 3,
          comments: 5,
          type: 'text'
        }
      ];

      this.posts.push(...newPosts);
      this.renderPosts();

      if (loadMoreBtn) {
        loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Load More';
        loadMoreBtn.disabled = false;
      }
    }, 2000);
  }

  // Utility functions
  getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  }

  formatPostContent(content) {
    // Simple text formatting - convert URLs, mentions, hashtags
    return content
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
      .replace(/(@\w+)/g, '<span class="mention">$1</span>')
      .replace(/(#\w+)/g, '<span class="hashtag">$1</span>');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.socialTrading = new SocialTrading();
});

// Wallet connection functionality
function connectWallet() {
  const btn = document.querySelector('.wallet-btn');
  if (btn.classList.contains('connected')) {
    // Disconnect
    btn.classList.remove('connected');
    btn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
    window.socialTrading.showToast('Wallet disconnected', 'info');
  } else {
    // Simulate connection
    window.socialTrading.showLoading();
    setTimeout(() => {
      window.socialTrading.hideLoading();
      btn.classList.add('connected');
      btn.innerHTML = '<i class="fas fa-check"></i> 0x1234...5678';
      window.socialTrading.showToast('Wallet connected successfully!', 'success');
    }, 2000);
  }
}

// Make functions globally available
window.connectWallet = connectWallet;
window.showSignalModal = () => window.socialTrading.showModal('signalModal');
window.showPostModal = () => window.socialTrading.showModal('postModal');