// Multiplayer Gaming JavaScript
class MultiplayerGaming {
  constructor() {
    this.currentUser = null;
    this.currentRoom = null;
    this.gameSocket = null;
    this.activeTab = 'weekly';
    this.gameModes = {
      tournament: { name: 'Tournament', icon: 'fas fa-trophy', players: '16-64', duration: '2-4 hours' },
      quick: { name: 'Quick Match', icon: 'fas fa-bolt', players: '2-8', duration: '15-30 min' },
      team: { name: 'Team Battle', icon: 'fas fa-users', players: '8-16', duration: '45-60 min' },
      practice: { name: 'Practice', icon: 'fas fa-graduation-cap', players: '1-4', duration: 'Unlimited' }
    };

    this.init();
  }

  init() {
    this.loadUserData();
    this.setupEventListeners();
    this.initializeWebSocket();
    this.updateLiveStats();
    this.loadRooms();
    this.loadLeaderboards();
    this.loadTournaments();
    this.startRealTimeUpdates();
  }

  loadUserData() {
    // Load user data from localStorage or API
    const userData = localStorage.getItem('aetheron_user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
      this.updateUserDisplay();
    } else {
      // Create guest user
      this.currentUser = {
        id: 'guest_' + Date.now(),
        name: 'Guest Player',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest',
        level: 1,
        xp: 0,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalEarnings: 0
      };
      localStorage.setItem('aetheron_user', JSON.stringify(this.currentUser));
    }
  }

  updateUserDisplay() {
    // Update user info in navigation or profile section
    const userElements = document.querySelectorAll('.user-name');
    userElements.forEach(el => el.textContent = this.currentUser.name);
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateToSection(e.target.closest('.nav-link').dataset.section);
      });
    });

    // Game mode buttons
    document.querySelectorAll('.join-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.target.closest('.mode-card').dataset.mode;
        this.joinGameMode(mode);
      });
    });

    // Create room button
    const createRoomBtn = document.querySelector('.create-room-btn');
    if (createRoomBtn) {
      createRoomBtn.addEventListener('click', () => this.showCreateRoomModal());
    }

    // Leaderboard tabs
    document.querySelectorAll('.tab-btn').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchLeaderboardTab(e.target.dataset.tab);
      });
    });

    // Tournament registration
    document.querySelectorAll('.register-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tournamentId = e.target.closest('.tournament-card').dataset.tournament;
        this.registerForTournament(tournamentId);
      });
    });

    // Room join buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('join-room-btn')) {
        const roomId = e.target.closest('.room-card').dataset.room;
        this.joinRoom(roomId);
      }
    });

    // Modal close
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('close-modal') || e.target.classList.contains('game-modal')) {
        this.closeGameModal();
      }
    });

    // Search and filters
    const searchInput = document.querySelector('.search-filters input');
    const modeFilter = document.querySelector('.search-filters select');

    if (searchInput) {
      searchInput.addEventListener('input', () => this.filterRooms());
    }
    if (modeFilter) {
      modeFilter.addEventListener('change', () => this.filterRooms());
    }
  }

  navigateToSection(section) {
    // Handle navigation between different sections
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    // Scroll to section if needed
    const sectionElement = document.getElementById(section);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  joinGameMode(mode) {
    if (mode === 'practice') {
      this.startPracticeGame();
    } else {
      this.showRoomSelection(mode);
    }
  }

  showRoomSelection(mode) {
    // Filter rooms by mode and show lobby
    this.filterRooms(mode);
    this.navigateToSection('lobby');
  }

  startPracticeGame() {
    this.showLoading('Starting practice game...');
    setTimeout(() => {
      this.openGameModal('practice');
      this.hideLoading();
    }, 2000);
  }

  showCreateRoomModal() {
    // Show modal for creating new room
    const modal = document.createElement('div');
    modal.className = 'game-modal';
    modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Create New Room</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="create-room-form">
                        <div class="form-group">
                            <label for="room-name">Room Name</label>
                            <input type="text" id="room-name" required>
                        </div>
                        <div class="form-group">
                            <label for="game-mode">Game Mode</label>
                            <select id="game-mode" required>
                                <option value="tournament">Tournament</option>
                                <option value="quick">Quick Match</option>
                                <option value="team">Team Battle</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="max-players">Max Players</label>
                            <input type="number" id="max-players" min="2" max="64" value="8" required>
                        </div>
                        <div class="form-group">
                            <label for="entry-fee">Entry Fee (AETHER)</label>
                            <input type="number" id="entry-fee" min="0" step="0.01" value="0" required>
                        </div>
                        <button type="submit" class="create-room-submit-btn">Create Room</button>
                    </form>
                </div>
            </div>
        `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';

    // Handle form submission
    const form = modal.querySelector('#create-room-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.createRoom(new FormData(form));
      modal.remove();
    });
  }

  createRoom(formData) {
    const roomData = {
      id: 'room_' + Date.now(),
      name: formData.get('room-name'),
      mode: formData.get('game-mode'),
      maxPlayers: parseInt(formData.get('max-players')),
      entryFee: parseFloat(formData.get('entry-fee')),
      host: this.currentUser.id,
      players: [this.currentUser],
      status: 'waiting',
      created: new Date().toISOString()
    };

    // Save to localStorage (in real app, send to server)
    const rooms = JSON.parse(localStorage.getItem('gaming_rooms') || '[]');
    rooms.push(roomData);
    localStorage.setItem('gaming_rooms', JSON.stringify(rooms));

    this.showToast('Room created successfully!', 'success');
    this.loadRooms();
    this.joinRoom(roomData.id);
  }

  joinRoom(roomId) {
    const rooms = JSON.parse(localStorage.getItem('gaming_rooms') || '[]');
    const room = rooms.find(r => r.id === roomId);

    if (!room) {
      this.showToast('Room not found', 'error');
      return;
    }

    if (room.players.length >= room.maxPlayers) {
      this.showToast('Room is full', 'error');
      return;
    }

    if (room.players.find(p => p.id === this.currentUser.id)) {
      this.showToast('Already in this room', 'warning');
      return;
    }

    // Add player to room
    room.players.push(this.currentUser);
    localStorage.setItem('gaming_rooms', JSON.stringify(rooms));

    this.currentRoom = room;
    this.showToast(`Joined ${room.name}`, 'success');
    this.loadRooms();

    // If room is full or host starts game, begin
    if (room.players.length >= room.maxPlayers) {
      this.startGame(room);
    }
  }

  startGame(room) {
    this.showLoading('Starting game...');
    setTimeout(() => {
      this.openGameModal(room.mode, room);
      this.hideLoading();
    }, 3000);
  }

  openGameModal(mode, room = null) {
    const modal = document.querySelector('.game-modal') || this.createGameModal();
    const gameInterface = modal.querySelector('.game-interface');

    // Initialize game based on mode
    switch (mode) {
      case 'practice':
        gameInterface.innerHTML = this.createPracticeGame();
        break;
      case 'quick':
        gameInterface.innerHTML = this.createQuickMatchGame(room);
        break;
      case 'tournament':
        gameInterface.innerHTML = this.createTournamentGame(room);
        break;
      case 'team':
        gameInterface.innerHTML = this.createTeamGame(room);
        break;
    }

    modal.style.display = 'flex';
    this.initializeGameLogic(mode, room);
  }

  createGameModal() {
    const modal = document.createElement('div');
    modal.className = 'game-modal';
    modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="game-title">Game in Progress</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="game-interface">
                        <!-- Game content will be inserted here -->
                    </div>
                </div>
            </div>
        `;
    document.body.appendChild(modal);
    return modal;
  }

  createPracticeGame() {
    return `
            <div class="practice-game">
                <div class="game-header">
                    <h4>Practice Mode</h4>
                    <div class="game-timer">Time: <span id="practice-timer">00:00</span></div>
                </div>
                <div class="trading-interface">
                    <div class="portfolio-value">$10,000</div>
                    <div class="trading-buttons">
                        <button class="trade-btn buy">Buy</button>
                        <button class="trade-btn sell">Sell</button>
                        <button class="trade-btn hold">Hold</button>
                    </div>
                    <div class="market-chart">
                        <canvas id="practice-chart"></canvas>
                    </div>
                </div>
                <div class="practice-stats">
                    <div class="stat">Trades: <span id="trade-count">0</span></div>
                    <div class="stat">Profit: <span id="profit-loss">$0</span></div>
                </div>
            </div>
        `;
  }

  createQuickMatchGame(room) {
    const players = room.players.map(p => `<div class="player">${p.name}</div>`).join('');
    return `
            <div class="quick-match-game">
                <div class="game-header">
                    <h4>Quick Match - ${room.name}</h4>
                    <div class="game-timer">Time: <span id="match-timer">15:00</span></div>
                </div>
                <div class="players-list">
                    ${players}
                </div>
                <div class="game-board">
                    <div class="market-data">
                        <div class="price">Current Price: $<span id="current-price">100</span></div>
                        <div class="trend">Trend: <span id="price-trend">Stable</span></div>
                    </div>
                    <div class="action-buttons">
                        <button class="action-btn buy">Buy Long</button>
                        <button class="action-btn sell">Sell Short</button>
                        <button class="action-btn hold">Hold Position</button>
                    </div>
                </div>
                <div class="leaderboard-mini">
                    <h5>Current Standings</h5>
                    <div id="mini-leaderboard"></div>
                </div>
            </div>
        `;
  }

  createTournamentGame(room) {
    return `
            <div class="tournament-game">
                <div class="tournament-bracket">
                    <!-- Tournament bracket will be generated here -->
                </div>
                <div class="current-match">
                    <h4>Current Match</h4>
                    <div class="match-players">
                        <div class="player-card">
                            <div class="player-name">Player 1</div>
                            <div class="player-score">0</div>
                        </div>
                        <div class="vs">VS</div>
                        <div class="player-card">
                            <div class="player-name">Player 2</div>
                            <div class="player-score">0</div>
                        </div>
                    </div>
                    <div class="match-actions">
                        <button class="match-btn">Make Trade</button>
                        <button class="match-btn">End Turn</button>
                    </div>
                </div>
            </div>
        `;
  }

  createTeamGame(room) {
    return `
            <div class="team-game">
                <div class="teams-container">
                    <div class="team team-a">
                        <h4>Team A</h4>
                        <div class="team-players"></div>
                        <div class="team-score">Score: 0</div>
                    </div>
                    <div class="team team-b">
                        <h4>Team B</h4>
                        <div class="team-players"></div>
                        <div class="team-score">Score: 0</div>
                    </div>
                </div>
                <div class="team-actions">
                    <button class="team-btn">Team Trade</button>
                    <button class="team-btn">Individual Trade</button>
                </div>
            </div>
        `;
  }

  initializeGameLogic(mode, room) {
    // Initialize game-specific logic
    switch (mode) {
      case 'practice':
        this.initPracticeGame();
        break;
      case 'quick':
        this.initQuickMatch(room);
        break;
      case 'tournament':
        this.initTournament(room);
        break;
      case 'team':
        this.initTeamGame(room);
        break;
    }
  }

  initPracticeGame() {
    let time = 0;
    const timer = setInterval(() => {
      time++;
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
      document.getElementById('practice-timer').textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);

    // Initialize chart
    const ctx = document.getElementById('practice-chart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Price',
          data: [],
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  initQuickMatch(room) {
    // Initialize quick match logic
    let timeLeft = 900; // 15 minutes
    const timer = setInterval(() => {
      timeLeft--;
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      document.getElementById('match-timer').textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      if (timeLeft <= 0) {
        clearInterval(timer);
        this.endGame('time_up');
      }
    }, 1000);
  }

  initTournament(room) {
    // Initialize tournament logic
    this.generateTournamentBracket(room.players);
  }

  initTeamGame(room) {
    // Initialize team game logic
    this.assignTeams(room.players);
  }

  endGame(reason) {
    // Handle game end
    this.showToast(`Game ended: ${reason}`, 'info');
    this.closeGameModal();
    this.updateUserStats();
  }

  closeGameModal() {
    const modal = document.querySelector('.game-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.currentRoom = null;
  }

  switchLeaderboardTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    this.loadLeaderboards();
  }

  loadLeaderboards() {
    // Load leaderboard data based on active tab
    const leaderboardData = this.getLeaderboardData(this.activeTab);
    this.renderLeaderboard(leaderboardData);
  }

  getLeaderboardData(period) {
    // Mock leaderboard data - in real app, fetch from API
    const mockData = {
      weekly: [
        { rank: 1, name: 'CryptoKing', score: 15420, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1', change: '+5' },
        { rank: 2, name: 'TradeMaster', score: 14850, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2', change: '+2' },
        { rank: 3, name: 'BullRunner', score: 14200, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3', change: '-1' },
        { rank: 4, name: 'BearHunter', score: 13890, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4', change: '+3' },
        { rank: 5, name: 'MoonShooter', score: 13500, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5', change: 'new' }
      ],
      monthly: [
        { rank: 1, name: 'TradeMaster', score: 45200, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2', change: '+1' },
        { rank: 2, name: 'CryptoKing', score: 44850, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1', change: '-1' },
        { rank: 3, name: 'BullRunner', score: 42100, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3', change: '0' },
        { rank: 4, name: 'DiamondHands', score: 41500, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6', change: '+2' },
        { rank: 5, name: 'BearHunter', score: 41200, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4', change: '-1' }
      ],
      allTime: [
        { rank: 1, name: 'LegendTrader', score: 125000, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=7', change: '0' },
        { rank: 2, name: 'CryptoKing', score: 118500, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1', change: '+1' },
        { rank: 3, name: 'TradeMaster', score: 115200, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2', change: '+2' },
        { rank: 4, name: 'BullRunner', score: 112000, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3', change: '-2' },
        { rank: 5, name: 'DiamondHands', score: 108900, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6', change: '+1' }
      ]
    };

    return mockData[period] || mockData.weekly;
  }

  renderLeaderboard(data) {
    const leaderboardContainer = document.querySelector('.leaderboard');
    leaderboardContainer.innerHTML = data.map(player => `
            <div class="leaderboard-item ${player.rank <= 3 ? 'top-player' : ''}">
                <div class="rank">#${player.rank}</div>
                <div class="player-info">
                    <img src="${player.avatar}" alt="${player.name}" class="player-avatar">
                    <div class="player-details">
                        <div class="player-name">${player.name}</div>
                        <div class="player-stats">Level ${Math.floor(player.score / 1000) + 1}</div>
                    </div>
                </div>
                <div class="player-score">${player.score.toLocaleString()}</div>
            </div>
        `).join('');
  }

  loadRooms() {
    const rooms = JSON.parse(localStorage.getItem('gaming_rooms') || '[]');
    this.renderRooms(rooms);
  }

  renderRooms(rooms) {
    const roomsContainer = document.querySelector('.rooms-list');
    if (!roomsContainer) return;

    roomsContainer.innerHTML = rooms.map(room => `
            <div class="room-card ${room.status}" data-room="${room.id}">
                <div class="room-header">
                    <div class="room-info">
                        <h4>${room.name}</h4>
                        <span class="room-mode ${room.mode}">${this.gameModes[room.mode].name}</span>
                    </div>
                    <div class="room-status">
                        <span class="status-indicator ${room.status}-indicator">${room.status}</span>
                        <span class="players">${room.players.length}/${room.maxPlayers}</span>
                    </div>
                </div>
                <div class="room-details">
                    <div class="room-stats">
                        <span>Entry: ${room.entryFee} AETHER</span>
                        <span>Host: ${room.players[0]?.name || 'Unknown'}</span>
                    </div>
                    <button class="join-room-btn">
                        <i class="fas fa-sign-in-alt"></i> Join
                    </button>
                </div>
            </div>
        `).join('');
  }

  filterRooms(mode = null) {
    const searchTerm = document.querySelector('.search-filters input')?.value.toLowerCase() || '';
    const selectedMode = mode || document.querySelector('.search-filters select')?.value || '';

    const rooms = JSON.parse(localStorage.getItem('gaming_rooms') || '[]');
    const filteredRooms = rooms.filter(room => {
      const matchesSearch = room.name.toLowerCase().includes(searchTerm);
      const matchesMode = !selectedMode || room.mode === selectedMode;
      return matchesSearch && matchesMode;
    });

    this.renderRooms(filteredRooms);
  }

  loadTournaments() {
    // Mock tournament data
    const tournaments = [
      {
        id: 'tournament_1',
        name: 'Weekly Championship',
        prize: '1000 AETHER',
        players: 32,
        maxPlayers: 64,
        startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        status: 'registering'
      },
      {
        id: 'tournament_2',
        name: 'Daily Quick Play',
        prize: '100 AETHER',
        players: 8,
        maxPlayers: 16,
        startTime: new Date(Date.now() + 1800000).toISOString(), // 30 min from now
        status: 'registering'
      },
      {
        id: 'tournament_3',
        name: 'Monthly Masters',
        prize: '5000 AETHER',
        players: 128,
        maxPlayers: 128,
        startTime: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
        status: 'upcoming'
      }
    ];

    this.renderTournaments(tournaments);
  }

  renderTournaments(tournaments) {
    const tournamentsContainer = document.querySelector('.tournaments-list');
    if (!tournamentsContainer) return;

    tournamentsContainer.innerHTML = tournaments.map(tournament => `
            <div class="tournament-card" data-tournament="${tournament.id}">
                <div class="tournament-header">
                    <h4>${tournament.name}</h4>
                    <span class="tournament-prize">${tournament.prize}</span>
                </div>
                <div class="tournament-details">
                    <div class="tournament-info">
                        <div>Players: ${tournament.players}/${tournament.maxPlayers}</div>
                        <div>Starts: ${new Date(tournament.startTime).toLocaleString()}</div>
                        <div>Status: ${tournament.status}</div>
                    </div>
                    <button class="register-btn" ${tournament.status !== 'registering' ? 'disabled' : ''}>
                        <i class="fas fa-user-plus"></i> Register
                    </button>
                </div>
            </div>
        `).join('');
  }

  registerForTournament(tournamentId) {
    // Mock registration
    this.showToast('Successfully registered for tournament!', 'success');
    // In real app, send registration to server
  }

  updateLiveStats() {
    // Update live stats in hero section
    const stats = {
      activePlayers: Math.floor(Math.random() * 1000) + 5000,
      activeGames: Math.floor(Math.random() * 100) + 200,
      totalPrizePool: Math.floor(Math.random() * 50000) + 100000
    };

    document.querySelectorAll('.stat-value')[0].textContent = stats.activePlayers.toLocaleString();
    document.querySelectorAll('.stat-value')[1].textContent = stats.activeGames.toLocaleString();
    document.querySelectorAll('.stat-value')[2].textContent = `$${stats.totalPrizePool.toLocaleString()}`;
  }

  initializeWebSocket() {
    // Initialize WebSocket connection for real-time updates
    try {
      // In a real implementation, connect to game server
      // this.gameSocket = new WebSocket('ws://game-server-url');

      // Mock real-time updates
      this.mockWebSocketUpdates();
    } catch (error) {
      console.log('WebSocket not available, using polling');
    }
  }

  mockWebSocketUpdates() {
    // Simulate real-time updates
    setInterval(() => {
      this.updateLiveStats();
    }, 30000); // Update every 30 seconds
  }

  startRealTimeUpdates() {
    // Update rooms and leaderboards periodically
    setInterval(() => {
      this.loadRooms();
      this.loadLeaderboards();
    }, 10000); // Update every 10 seconds
  }

  updateUserStats() {
    // Update user stats after game
    this.currentUser.gamesPlayed++;
    // Add win/loss logic here
    localStorage.setItem('aetheron_user', JSON.stringify(this.currentUser));
  }

  showLoading(message = 'Loading...') {
    const overlay = document.querySelector('.loading-overlay') || this.createLoadingOverlay();
    overlay.querySelector('.loading-text').textContent = message;
    overlay.style.display = 'flex';
  }

  hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  createLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p class="loading-text">Loading...</p>
            </div>
        `;
    document.body.appendChild(overlay);
    return overlay;
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

    const container = document.querySelector('.toast-container') || this.createToastContainer();
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  }

  // Additional utility methods
  generateTournamentBracket(players) {
    // Generate tournament bracket logic
    console.log('Generating bracket for', players.length, 'players');
  }

  assignTeams(players) {
    // Assign players to teams
    const teamA = players.slice(0, Math.ceil(players.length / 2));
    const teamB = players.slice(Math.ceil(players.length / 2));

    console.log('Team A:', teamA.length, 'players');
    console.log('Team B:', teamB.length, 'players');
  }
}

// Initialize the multiplayer gaming system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.multiplayerGaming = new MultiplayerGaming();
});