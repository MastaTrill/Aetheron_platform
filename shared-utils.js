// Aetheron Platform - Shared Utilities
// Handles wallet connections, user state, and cross-feature functionality

class AetheronPlatform {
    constructor() {
        this.currentUser = null;
        this.isConnected = false;
        this.userBalance = 0;
        this.userBalanceUSD = 0;
        this.priceData = null;

        this.init();
    }

    init() {
        this.bindGlobalEvents();
        this.loadPriceData();
        this.checkWalletConnection();
    }

    bindGlobalEvents() {
        // Global wallet connection handler
        document.addEventListener('click', (e) => {
            if (e.target.closest('.wallet-btn, #connectWallet, #connectWalletBtn, #connectBtn')) {
                e.preventDefault();
                this.connectWallet();
            }
        });

        // Global wallet disconnection
        document.addEventListener('click', (e) => {
            if (e.target.closest('[onclick*="disconnectWallet"]')) {
                this.disconnectWallet();
            }
        });
    }

    async connectWallet() {
        try {
            if (typeof window.ethereum === 'undefined') {
                this.showToast('MetaMask not detected. Please install MetaMask.', 'error');
                return;
            }

            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.currentUser = accounts[0];
            this.isConnected = true;

            this.updateUI();
            this.loadUserData();
            this.showToast('Wallet connected successfully!', 'success');

        } catch (error) {
            console.error('Wallet connection failed:', error);
            this.showToast('Failed to connect wallet', 'error');
        }
    }

    disconnectWallet() {
        this.currentUser = null;
        this.isConnected = false;
        this.userBalance = 0;
        this.userBalanceUSD = 0;
        this.updateUI();
        this.showToast('Wallet disconnected', 'info');
    }

    async checkWalletConnection() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    this.currentUser = accounts[0];
                    this.isConnected = true;
                    this.loadUserData();
                }
            } catch (error) {
                console.error('Error checking wallet connection:', error);
            }
        }
        this.updateUI();
    }

    async loadUserData() {
        if (!this.isConnected || !this.currentUser) return;

        try {
            // Load AETH balance (mock for now)
            this.userBalance = Math.random() * 1000; // Mock balance
            this.userBalanceUSD = this.userBalance * (this.priceData?.price || 0.0001);

            this.updateUI();
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async loadPriceData() {
        try {
            // Mock price data - in production, fetch from DexScreener API
            this.priceData = {
                price: 0.0001234,
                marketCap: 1234567,
                change24h: 5.67,
                liquidity: 890123
            };

            // Update price displays across the platform
            this.updatePriceDisplays();
        } catch (error) {
            console.error('Error loading price data:', error);
        }
    }

    updateUI() {
        // Update wallet buttons
        const walletButtons = document.querySelectorAll('.wallet-btn, #connectWallet, #connectWalletBtn, #connectBtn');
        walletButtons.forEach(btn => {
            if (this.isConnected) {
                btn.innerHTML = `<i class="fas fa-check"></i> ${this.currentUser.slice(0, 6)}...${this.currentUser.slice(-4)}`;
                btn.classList.add('connected');
            } else {
                btn.innerHTML = `<i class="fas fa-wallet"></i> Connect Wallet`;
                btn.classList.remove('connected');
            }
        });

        // Update balance displays
        const balanceElements = document.querySelectorAll('#userBalance, .user-balance');
        balanceElements.forEach(el => {
            el.textContent = this.userBalance.toFixed(2);
        });

        const usdElements = document.querySelectorAll('#userBalanceUSD, .user-balance-usd');
        usdElements.forEach(el => {
            el.textContent = `$${this.userBalanceUSD.toFixed(2)} USD`;
        });

        // Show/hide connected sections
        const connectedSections = document.querySelectorAll('#walletConnected, .wallet-connected');
        const notConnectedSections = document.querySelectorAll('#walletNotConnected, .wallet-not-connected');

        connectedSections.forEach(el => {
            el.classList.toggle('hidden', !this.isConnected);
        });

        notConnectedSections.forEach(el => {
            el.classList.toggle('hidden', this.isConnected);
        });
    }

    updatePriceDisplays() {
        if (!this.priceData) return;

        // Update price displays
        const priceElements = document.querySelectorAll('#priceValue, .aeth-price');
        priceElements.forEach(el => {
            el.textContent = `$${this.priceData.price.toFixed(6)}`;
        });

        // Update market cap
        const mcapElements = document.querySelectorAll('.market-cap');
        mcapElements.forEach(el => {
            el.textContent = `$${(this.priceData.marketCap / 1000000).toFixed(1)}M`;
        });

        // Update price change
        const changeElements = document.querySelectorAll('#priceChange, .price-change');
        changeElements.forEach(el => {
            const change = this.priceData.change24h;
            el.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
            el.className = change >= 0 ? 'change positive' : 'change negative';
        });
    }

    showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;

        // Add to toast container
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        container.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto hide
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });
    }

    // Utility methods for cross-feature communication
    navigateToFeature(feature) {
        const featureMap = {
            'social-trading': 'social-trading/index.html',
            'yield-aggregator': 'yield-aggregator/index.html',
            'nft-integration': 'nft-integration/index.html',
            'analytics': 'analytics/index.html',
            'dashboard': 'dashboard-enhanced.html',
            'home': 'index.html'
        };

        const path = featureMap[feature];
        if (path) {
            window.location.href = path;
        }
    }

    shareToSocialTrading(signal) {
        // Store signal data for social trading feature
        sessionStorage.setItem('sharedSignal', JSON.stringify(signal));
        this.navigateToFeature('social-trading');
    }

    // Cross-feature data sharing
    getSharedData(key) {
        return JSON.parse(sessionStorage.getItem(key) || 'null');
    }

    setSharedData(key, data) {
        sessionStorage.setItem(key, JSON.stringify(data));
    }
}

// Initialize platform when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.aetheronPlatform = new AetheronPlatform();
});

// Global functions for backward compatibility
window.connectWallet = () => window.aetheronPlatform.connectWallet();
window.disconnectWallet = () => window.aetheronPlatform.disconnectWallet();
window.addTokenToWallet = async () => {
    // Mock token addition
    window.aetheronPlatform.showToast('Token added to wallet!', 'success');
};