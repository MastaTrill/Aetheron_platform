class NFTIntegration {
  constructor() {
    this.currentTab = 'marketplace';
    this.nfts = [];
    this.userNFTs = [];
    this.collections = [];
    this.analyticsData = {};
    this.filters = {
      collection: 'all',
      price: 'all',
      sort: 'recent',
      search: ''
    };
    this.charts = {};
    this.isWalletConnected = false;
    this.walletAddress = null;

    this.init();
  }

  async init() {
    this.showLoading();
    await this.loadDependencies();
    this.setupEventListeners();
    await this.loadNFTData();
    await this.loadAnalyticsData();
    this.renderMarketplace();
    this.renderGallery();
    this.renderAnalytics();
    this.hideLoading();
    this.showToast('NFT Marketplace loaded successfully!', 'success');
  }

  async loadDependencies() {
    // Ensure Chart.js is loaded
    if (typeof Chart === 'undefined') {
      await this.loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js');
    }
    if (typeof Chart && typeof Chart.register === 'function' && typeof chartjs_adapter_date_fns !== 'undefined') {
      Chart.register(chartjs_adapter_date_fns);
    }
  }

  async loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.closest('.tab-btn').dataset.tab);
      });
    });

    // Search and filters
    document.getElementById('searchInput').addEventListener('input', (e) => {
      this.filters.search = e.target.value.toLowerCase();
      this.applyFilters();
    });

    document.getElementById('collectionFilter').addEventListener('change', (e) => {
      this.filters.collection = e.target.value;
      this.applyFilters();
    });

    document.getElementById('priceFilter').addEventListener('change', (e) => {
      this.filters.price = e.target.value;
      this.applyFilters();
    });

    document.getElementById('sortFilter').addEventListener('change', (e) => {
      this.filters.sort = e.target.value;
      this.applyFilters();
    });

    // Load more button
    document.getElementById('loadMoreBtn').addEventListener('click', () => {
      this.loadMoreNFTs();
    });

    // Wallet connection
    document.getElementById('connectWallet').addEventListener('click', () => {
      this.connectWallet();
    });

    // Create NFT form
    document.getElementById('nftCollection').addEventListener('change', (e) => {
      this.toggleNewCollectionField(e.target.value === 'custom');
    });

    document.getElementById('uploadArea').addEventListener('click', () => {
      document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput').addEventListener('change', (e) => {
      this.handleFileUpload(e.target.files[0]);
    });

    document.getElementById('previewBtn').addEventListener('click', () => {
      this.previewNFT();
    });

    document.getElementById('mintBtn').addEventListener('click', () => {
      this.mintNFT();
    });

    // Analytics time filters
    document.querySelectorAll('.time-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.updateAnalytics(e.target.dataset.period);
      });
    });

    // Drag and drop for file upload
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFileUpload(files[0]);
      }
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    this.currentTab = tabName;

    // Update URL hash
    window.location.hash = tabName;
  }

  async loadNFTData() {
    // Simulate API call - replace with real API endpoints
    this.nfts = await this.fetchNFTs();
    this.collections = await this.fetchCollections();
    this.userNFTs = await this.fetchUserNFTs();
  }

  async fetchNFTs() {
    // Mock NFT data - replace with real API
    return [
      {
        id: 1,
        name: "Cosmic Explorer #001",
        collection: "Aetheron",
        image: "https://via.placeholder.com/400x400/6366f1/ffffff?text=NFT+1",
        price: 2.5,
        currency: "ETH",
        rarity: "Legendary",
        owner: "0x1234...5678",
        likes: 245,
        views: 1250,
        description: "A unique cosmic explorer NFT from the Aetheron collection.",
        attributes: [
          { trait_type: "Background", value: "Cosmic" },
          { trait_type: "Character", value: "Explorer" },
          { trait_type: "Rarity", value: "Legendary" }
        ]
      },
      {
        id: 2,
        name: "Bored Ape #1234",
        collection: "Bored Ape Yacht Club",
        image: "https://via.placeholder.com/400x400/10b981/ffffff?text=BAYC",
        price: 45.8,
        currency: "ETH",
        rarity: "Epic",
        owner: "0xabcd...efgh",
        likes: 892,
        views: 3450,
        description: "A rare Bored Ape Yacht Club NFT.",
        attributes: [
          { trait_type: "Fur", value: "Golden" },
          { trait_type: "Eyes", value: "Laser" },
          { trait_type: "Hat", value: "Crown" }
        ]
      },
      {
        id: 3,
        name: "CryptoPunk #5678",
        collection: "CryptoPunks",
        image: "https://via.placeholder.com/400x400/f59e0b/ffffff?text=PUNK",
        price: 89.2,
        currency: "ETH",
        rarity: "Mythic",
        owner: "0x9876...5432",
        likes: 1205,
        views: 5670,
        description: "An iconic CryptoPunk with unique attributes.",
        attributes: [
          { trait_type: "Type", value: "Alien" },
          { trait_type: "Accessory", value: "Pipe" },
          { trait_type: "Mouth", value: "Smile" }
        ]
      },
      {
        id: 4,
        name: "Azuki #999",
        collection: "Azuki",
        image: "https://via.placeholder.com/400x400/ef4444/ffffff?text=AZUKI",
        price: 12.3,
        currency: "ETH",
        rarity: "Rare",
        owner: "0x1111...2222",
        likes: 456,
        views: 2100,
        description: "A beautiful Azuki NFT from the garden.",
        attributes: [
          { trait_type: "Background", value: "Garden" },
          { trait_type: "Clothing", value: "Kimono" },
          { trait_type: "Eyes", value: "Determined" }
        ]
      },
      {
        id: 5,
        name: "World of Women #777",
        collection: "World of Women",
        image: "https://via.placeholder.com/400x400/8b5cf6/ffffff?text=WOW",
        price: 8.9,
        currency: "ETH",
        rarity: "Uncommon",
        owner: "0x3333...4444",
        likes: 678,
        views: 2890,
        description: "An empowering World of Women NFT.",
        attributes: [
          { trait_type: "Background", value: "Urban" },
          { trait_type: "Hair", value: "Purple" },
          { trait_type: "Expression", value: "Confident" }
        ]
      },
      {
        id: 6,
        name: "Pancake Bunny #456",
        collection: "PancakeSwap",
        image: "https://via.placeholder.com/400x400/f97316/ffffff?text=BUNNY",
        price: 3.2,
        currency: "ETH",
        rarity: "Common",
        owner: "0x5555...6666",
        likes: 234,
        views: 1450,
        description: "A cute PancakeSwap bunny NFT.",
        attributes: [
          { trait_type: "Type", value: "Bunny" },
          { trait_type: "Color", value: "Pink" },
          { trait_type: "Accessory", value: "Bow" }
        ]
      }
    ];
  }

  async fetchCollections() {
    return [
      { id: 'aetheron', name: 'Aetheron', floorPrice: 1.2, volume: 125000 },
      { id: 'bored-ape', name: 'Bored Ape Yacht Club', floorPrice: 35.5, volume: 2500000 },
      { id: 'cryptopunks', name: 'CryptoPunks', floorPrice: 68.9, volume: 1800000 },
      { id: 'azuki', name: 'Azuki', floorPrice: 8.7, volume: 890000 },
      { id: 'world-of-women', name: 'World of Women', floorPrice: 6.4, volume: 650000 },
      { id: 'pancake', name: 'PancakeSwap', floorPrice: 2.1, volume: 340000 }
    ];
  }

  async fetchUserNFTs() {
    // Mock user NFTs - replace with real user data
    return [
      {
        id: 1,
        name: "Cosmic Explorer #001",
        collection: "Aetheron",
        image: "https://via.placeholder.com/400x400/6366f1/ffffff?text=NFT+1",
        floorPrice: 1.2,
        lastPrice: 2.5,
        acquired: "2024-01-15"
      }
    ];
  }

  async loadAnalyticsData() {
    // Mock analytics data
    this.analyticsData = {
      volume: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: [1200000, 1450000, 1800000, 2100000, 1950000, 2400000]
      },
      floorPrice: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: [25.5, 28.2, 32.1, 29.8, 31.5, 35.2]
      },
      topCollections: [
        { name: 'Bored Ape Yacht Club', image: 'https://via.placeholder.com/40x40/10b981/ffffff?text=B', volume: 2500000, change: 12.5 },
        { name: 'CryptoPunks', image: 'https://via.placeholder.com/40x40/f59e0b/ffffff?text=C', volume: 1800000, change: -3.2 },
        { name: 'Azuki', image: 'https://via.placeholder.com/40x40/ef4444/ffffff?text=A', volume: 890000, change: 8.7 }
      ],
      tradingActivity: [
        { type: 'sale', text: 'Bored Ape #1234 sold for 45.8 ETH', time: '2 hours ago', image: 'https://via.placeholder.com/40x40/10b981/ffffff?text=B' },
        { type: 'mint', text: 'New Aetheron NFT minted', time: '4 hours ago', image: 'https://via.placeholder.com/40x40/6366f1/ffffff?text=A' },
        { type: 'transfer', text: 'CryptoPunk #5678 transferred', time: '6 hours ago', image: 'https://via.placeholder.com/40x40/f59e0b/ffffff?text=C' }
      ]
    };
  }

  renderMarketplace() {
    const nftGrid = document.getElementById('nftGrid');
    nftGrid.innerHTML = '';

    const filteredNFTs = this.applyFiltersToNFTs();

    filteredNFTs.forEach(nft => {
      const nftCard = this.createNFTCard(nft);
      nftGrid.appendChild(nftCard);
    });

    this.updateStats();
  }

  createNFTCard(nft) {
    const card = document.createElement('div');
    card.className = 'nft-card';
    card.onclick = () => this.showNFTModal(nft);

    card.innerHTML = `
            <div class="nft-image">
                <img src="${nft.image}" alt="${nft.name}" loading="lazy">
                <div class="nft-badge">${nft.rarity}</div>
            </div>
            <div class="nft-info">
                <div class="nft-name">${nft.name}</div>
                <div class="nft-collection">${nft.collection}</div>
                <div class="nft-price">
                    <div>
                        <div class="price-amount">${nft.price} ${nft.currency}</div>
                        <div class="price-label">Price</div>
                    </div>
                </div>
                <div class="nft-stats">
                    <span>❤️ ${nft.likes}</span>
                    <span>👁️ ${nft.views}</span>
                </div>
                <div class="nft-action">
                    <button onclick="event.stopPropagation(); nftIntegration.buyNFT(${nft.id})">
                        <i class="fas fa-shopping-cart"></i> Buy Now
                    </button>
                </div>
            </div>
        `;

    return card;
  }

  renderGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    const emptyGallery = document.getElementById('emptyGallery');

    if (this.userNFTs.length === 0) {
      galleryGrid.style.display = 'none';
      emptyGallery.style.display = 'block';
    } else {
      galleryGrid.style.display = 'grid';
      emptyGallery.style.display = 'none';
      galleryGrid.innerHTML = '';

      this.userNFTs.forEach(nft => {
        const nftCard = this.createGalleryCard(nft);
        galleryGrid.appendChild(nftCard);
      });
    }

    this.updateGalleryStats();
  }

  createGalleryCard(nft) {
    const card = document.createElement('div');
    card.className = 'nft-card';

    const priceChange = ((nft.lastPrice - nft.floorPrice) / nft.floorPrice * 100).toFixed(1);
    const changeClass = priceChange >= 0 ? 'positive' : 'negative';
    const changeIcon = priceChange >= 0 ? '↗️' : '↘️';

    card.innerHTML = `
            <div class="nft-image">
                <img src="${nft.image}" alt="${nft.name}" loading="lazy">
            </div>
            <div class="nft-info">
                <div class="nft-name">${nft.name}</div>
                <div class="nft-collection">${nft.collection}</div>
                <div class="nft-price">
                    <div>
                        <div class="price-amount">${nft.lastPrice} ETH</div>
                        <div class="price-label">Last Price</div>
                    </div>
                    <div class="price-change ${changeClass}">
                        ${changeIcon} ${Math.abs(priceChange)}%
                    </div>
                </div>
                <div class="nft-stats">
                    <span>Floor: ${nft.floorPrice} ETH</span>
                    <span>Acquired: ${new Date(nft.acquired).toLocaleDateString()}</span>
                </div>
                <div class="nft-action">
                    <button onclick="nftIntegration.sellNFT(${nft.id})">
                        <i class="fas fa-tag"></i> List for Sale
                    </button>
                </div>
            </div>
        `;

    return card;
  }

  renderAnalytics() {
    this.renderVolumeChart();
    this.renderFloorPriceChart();
    this.renderTopCollections();
    this.renderTradingActivity();
  }

  renderVolumeChart() {
    const ctx = document.getElementById('volumeChart');
    if (this.charts.volume) {
      this.charts.volume.destroy();
    }

    this.charts.volume = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.analyticsData.volume.labels,
        datasets: [{
          label: 'Volume (ETH)',
          data: this.analyticsData.volume.data,
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
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#cbd5e1'
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#cbd5e1'
            }
          }
        }
      }
    });
  }

  renderFloorPriceChart() {
    const ctx = document.getElementById('floorPriceChart');
    if (this.charts.floorPrice) {
      this.charts.floorPrice.destroy();
    }

    this.charts.floorPrice = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.analyticsData.floorPrice.labels,
        datasets: [{
          label: 'Floor Price (ETH)',
          data: this.analyticsData.floorPrice.data,
          backgroundColor: '#10b981',
          borderRadius: 4
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
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#cbd5e1'
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#cbd5e1'
            }
          }
        }
      }
    });
  }

  renderTopCollections() {
    const container = document.getElementById('topCollections');
    container.innerHTML = '';

    this.analyticsData.topCollections.forEach(collection => {
      const item = document.createElement('div');
      item.className = 'collection-item';

      const changeClass = collection.change >= 0 ? 'positive' : 'negative';
      const changeIcon = collection.change >= 0 ? '↗️' : '↘️';

      item.innerHTML = `
                <img src="${collection.image}" alt="${collection.name}">
                <div class="collection-info">
                    <div class="collection-name">${collection.name}</div>
                    <div class="collection-stats">Volume: ${(collection.volume / 1000000).toFixed(1)}M ETH</div>
                </div>
                <div class="collection-price ${changeClass}">
                    ${changeIcon} ${Math.abs(collection.change)}%
                </div>
            `;

      container.appendChild(item);
    });
  }

  renderTradingActivity() {
    const container = document.getElementById('tradingActivity');
    container.innerHTML = '';

    this.analyticsData.tradingActivity.forEach(activity => {
      const item = document.createElement('div');
      item.className = 'activity-item';

      const iconClass = activity.type === 'sale' ? 'fas fa-shopping-cart' :
        activity.type === 'mint' ? 'fas fa-magic' : 'fas fa-exchange-alt';

      item.innerHTML = `
                <img src="${activity.image}" alt="Activity">
                <div class="activity-info">
                    <div class="activity-text">${activity.text}</div>
                    <div class="activity-meta">${activity.time}</div>
                </div>
                <i class="${iconClass}"></i>
            `;

      container.appendChild(item);
    });
  }

  applyFilters() {
    this.renderMarketplace();
  }

  applyFiltersToNFTs() {
    let filtered = [...this.nfts];

    // Search filter
    if (this.filters.search) {
      filtered = filtered.filter(nft =>
        nft.name.toLowerCase().includes(this.filters.search) ||
        nft.collection.toLowerCase().includes(this.filters.search)
      );
    }

    // Collection filter
    if (this.filters.collection !== 'all') {
      filtered = filtered.filter(nft => {
        const collectionMap = {
          'aetheron': 'Aetheron',
          'bored-ape': 'Bored Ape Yacht Club',
          'cryptopunks': 'CryptoPunks',
          'azuki': 'Azuki',
          'world-of-women': 'World of Women',
          'pancake': 'PancakeSwap'
        };
        return nft.collection === collectionMap[this.filters.collection];
      });
    }

    // Price filter
    if (this.filters.price !== 'all') {
      filtered = filtered.filter(nft => {
        const price = nft.price;
        switch (this.filters.price) {
          case '0-1': return price >= 0 && price < 1;
          case '1-5': return price >= 1 && price < 5;
          case '5-10': return price >= 5 && price < 10;
          case '10+': return price >= 10;
          default: return true;
        }
      });
    }

    // Sort
    switch (this.filters.sort) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        filtered.sort((a, b) => b.likes - a.likes);
        break;
      case 'recent':
      default:
        // Keep original order for recent
        break;
    }

    return filtered;
  }

  loadMoreNFTs() {
    // Simulate loading more NFTs
    this.showToast('Loading more NFTs...', 'info');
    setTimeout(() => {
      // Add more mock NFTs
      const newNFTs = [
        {
          id: 7,
          name: "Space Explorer #002",
          collection: "Aetheron",
          image: "https://via.placeholder.com/400x400/6366f1/ffffff?text=NFT+7",
          price: 1.8,
          currency: "ETH",
          rarity: "Rare",
          owner: "0x7777...8888",
          likes: 156,
          views: 890,
          description: "Another cosmic explorer from Aetheron.",
          attributes: [
            { trait_type: "Background", value: "Space" },
            { trait_type: "Character", value: "Explorer" },
            { trait_type: "Rarity", value: "Rare" }
          ]
        }
      ];
      this.nfts.push(...newNFTs);
      this.renderMarketplace();
      this.showToast('More NFTs loaded!', 'success');
    }, 1000);
  }

  showNFTModal(nft) {
    const modal = document.getElementById('nftModal');
    const modalBody = document.getElementById('modalBody');
    const modalActionBtn = document.getElementById('modalActionBtn');

    document.getElementById('modalTitle').textContent = nft.name;

    modalBody.innerHTML = `
            <div class="nft-modal-content">
                <div class="nft-modal-image">
                    <img src="${nft.image}" alt="${nft.name}">
                </div>
                <div class="nft-modal-details">
                    <div class="nft-modal-info">
                        <h4>${nft.collection}</h4>
                        <p class="nft-description">${nft.description}</p>
                        <div class="nft-modal-price">
                            <div class="price-amount">${nft.price} ${nft.currency}</div>
                            <div class="price-label">Current Price</div>
                        </div>
                        <div class="nft-modal-stats">
                            <div class="stat">
                                <span class="stat-value">${nft.likes}</span>
                                <span class="stat-label">Likes</span>
                            </div>
                            <div class="stat">
                                <span class="stat-value">${nft.views}</span>
                                <span class="stat-label">Views</span>
                            </div>
                            <div class="stat">
                                <span class="stat-value">${nft.rarity}</span>
                                <span class="stat-label">Rarity</span>
                            </div>
                        </div>
                    </div>
                    <div class="nft-modal-attributes">
                        <h4>Attributes</h4>
                        <div class="attributes-grid">
                            ${nft.attributes.map(attr => `
                                <div class="attribute-item">
                                    <div class="attribute-type">${attr.trait_type}</div>
                                    <div class="attribute-value">${attr.value}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

    modalActionBtn.textContent = 'Buy Now';
    modalActionBtn.onclick = () => this.buyNFT(nft.id);

    modal.classList.add('active');
  }

  closeModal() {
    document.getElementById('nftModal').classList.remove('active');
  }

  async connectWallet() {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        this.walletAddress = accounts[0];
        this.isWalletConnected = true;

        const walletBtn = document.getElementById('connectWallet');
        walletBtn.innerHTML = `
                    <i class="fas fa-check"></i>
                    <span>${this.walletAddress.slice(0, 6)}...${this.walletAddress.slice(-4)}</span>
                `;
        walletBtn.classList.add('connected');

        this.showToast('Wallet connected successfully!', 'success');
        this.loadUserNFTs();
      } else {
        this.showToast('Please install MetaMask to connect your wallet', 'error');
      }
    } catch (error) {
      this.showToast('Failed to connect wallet', 'error');
      console.error('Wallet connection error:', error);
    }
  }

  async buyNFT(nftId) {
    if (!this.isWalletConnected) {
      this.showToast('Please connect your wallet first', 'warning');
      return;
    }

    const nft = this.nfts.find(n => n.id === nftId);
    if (!nft) return;

    try {
      this.showLoading();
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Add to user's collection
      this.userNFTs.push({
        ...nft,
        floorPrice: nft.price * 0.8, // Mock floor price
        lastPrice: nft.price,
        acquired: new Date().toISOString().split('T')[0]
      });

      // Remove from marketplace
      this.nfts = this.nfts.filter(n => n.id !== nftId);

      this.renderMarketplace();
      this.renderGallery();
      this.closeModal();

      this.showToast(`Successfully purchased ${nft.name}!`, 'success');
    } catch (error) {
      this.showToast('Purchase failed. Please try again.', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async sellNFT(nftId) {
    // Mock sell functionality
    this.showToast('List for sale feature coming soon!', 'info');
  }

  loadUserNFTs() {
    // Reload user NFTs after wallet connection
    this.renderGallery();
  }

  handleFileUpload(file) {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mpeg'];
    if (!validTypes.includes(file.type)) {
      this.showToast('Invalid file type. Please upload JPG, PNG, GIF, MP4, or MP3 files.', 'error');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      this.showToast('File size too large. Maximum size is 50MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.displayFilePreview(file, e.target.result);
    };
    reader.readAsDataURL(file);
  }

  displayFilePreview(file, dataUrl) {
    const previewContainer = document.getElementById('previewContainer');
    const previewImage = document.getElementById('previewImage');
    const previewVideo = document.getElementById('previewVideo');
    const previewAudio = document.getElementById('previewAudio');

    // Hide all previews first
    previewImage.style.display = 'none';
    previewVideo.style.display = 'none';
    previewAudio.style.display = 'none';

    if (file.type.startsWith('image/')) {
      previewImage.src = dataUrl;
      previewImage.style.display = 'block';
    } else if (file.type.startsWith('video/')) {
      previewVideo.src = dataUrl;
      previewVideo.style.display = 'block';
    } else if (file.type.startsWith('audio/')) {
      previewAudio.src = dataUrl;
      previewAudio.style.display = 'block';
    }

    previewContainer.style.display = 'block';
    this.showToast('File uploaded successfully!', 'success');
  }

  toggleNewCollectionField(show) {
    const newCollectionGroup = document.getElementById('newCollectionGroup');
    newCollectionGroup.style.display = show ? 'block' : 'none';
  }

  addProperty() {
    const container = document.getElementById('propertiesContainer');
    const propertyItem = document.createElement('div');
    propertyItem.className = 'property-item';

    propertyItem.innerHTML = `
            <input type="text" placeholder="Trait Type (e.g., Background)" class="trait-type">
            <input type="text" placeholder="Value (e.g., Blue)" class="trait-value">
            <button class="remove-property" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

    container.appendChild(propertyItem);
  }

  previewNFT() {
    const name = document.getElementById('nftName').value;
    const description = document.getElementById('nftDescription').value;

    if (!name) {
      this.showToast('Please enter an NFT name', 'warning');
      return;
    }

    // Mock preview functionality
    this.showToast('NFT preview feature coming soon!', 'info');
  }

  async mintNFT() {
    if (!this.isWalletConnected) {
      this.showToast('Please connect your wallet first', 'warning');
      return;
    }

    const name = document.getElementById('nftName').value;
    const description = document.getElementById('nftDescription').value;
    const fileInput = document.getElementById('fileInput');

    if (!name || !fileInput.files[0]) {
      this.showToast('Please fill in all required fields', 'warning');
      return;
    }

    try {
      this.showLoading();
      // Simulate minting process
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Create new NFT object
      const newNFT = {
        id: Date.now(),
        name: name,
        collection: 'Aetheron',
        image: URL.createObjectURL(fileInput.files[0]),
        price: 0.1,
        currency: 'ETH',
        rarity: 'Common',
        owner: this.walletAddress,
        likes: 0,
        views: 0,
        description: description,
        attributes: []
      };

      // Add to marketplace
      this.nfts.unshift(newNFT);
      this.renderMarketplace();

      // Reset form
      document.getElementById('nftName').value = '';
      document.getElementById('nftDescription').value = '';
      document.getElementById('fileInput').value = '';
      document.getElementById('previewContainer').style.display = 'none';

      this.showToast(`Successfully minted ${name}!`, 'success');
    } catch (error) {
      this.showToast('Minting failed. Please try again.', 'error');
    } finally {
      this.hideLoading();
    }
  }

  updateStats() {
    const totalVolume = this.nfts.reduce((sum, nft) => sum + nft.price, 0);
    const totalNFTs = this.nfts.length;
    const activeUsers = Math.floor(Math.random() * 10000) + 5000; // Mock data

    document.getElementById('totalVolume').textContent = totalVolume.toFixed(1) + 'K';
    document.getElementById('totalNFTs').textContent = totalNFTs.toLocaleString();
    document.getElementById('activeUsers').textContent = activeUsers.toLocaleString();
  }

  updateGalleryStats() {
    const ownedCount = this.userNFTs.length;
    const totalValue = this.userNFTs.reduce((sum, nft) => sum + nft.lastPrice, 0);
    const floorValue = this.userNFTs.reduce((sum, nft) => sum + nft.floorPrice, 0);

    document.getElementById('ownedCount').textContent = ownedCount;
    document.getElementById('totalValue').textContent = totalValue.toFixed(2);
    document.getElementById('floorValue').textContent = floorValue.toFixed(2);
  }

  updateAnalytics(period) {
    // Mock updating analytics for different time periods
    this.showToast(`Updated analytics for ${period}`, 'info');
  }

  showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
  }

  hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
  }

  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconClass = type === 'success' ? 'fas fa-check-circle' :
      type === 'error' ? 'fas fa-exclamation-circle' :
        type === 'warning' ? 'fas fa-exclamation-triangle' :
          'fas fa-info-circle';

    toast.innerHTML = `
            <i class="${iconClass}"></i>
            <div class="toast-content">
                <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

    toastContainer.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }
}

// Global function for onclick handlers
function removeProperty(button) {
  button.parentElement.remove();
}

// Initialize the NFT integration when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.nftIntegration = new NFTIntegration();
});

// Handle browser back/forward navigation
window.addEventListener('hashchange', () => {
  const tab = window.location.hash.substring(1) || 'marketplace';
  if (window.nftIntegration) {
    window.nftIntegration.switchTab(tab);
  }
});