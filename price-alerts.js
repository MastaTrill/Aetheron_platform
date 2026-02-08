// Price Alerts System for Aetheron Platform
// Email/push notifications when AETH price hits target levels

class PriceAlertManager {
    constructor() {
        this.alerts = [];
        this.currentPrice = 0;
        this.checkInterval = null;
        this.loadAlerts();
        this.startMonitoring();
    }

    loadAlerts() {
        const saved = localStorage.getItem('aetheron-price-alerts');
        if (saved) {
            try {
                this.alerts = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load alerts:', e);
                this.alerts = [];
            }
        }
    }

    saveAlerts() {
        localStorage.setItem('aetheron-price-alerts', JSON.stringify(this.alerts));
    }

    async getCurrentPrice() {
        try {
            // Fetch from DexScreener API
            const response = await fetch(
                'https://api.dexscreener.com/latest/dex/pairs/polygon/0xd57c5E33ebDC1b565F99d06809debbf86142705D'
            );
            const data = await response.json();
            
            if (data && data.pair && data.pair.priceUsd) {
                this.currentPrice = parseFloat(data.pair.priceUsd);
                return this.currentPrice;
            }
        } catch (error) {
            console.error('Error fetching price:', error);
        }
        return null;
    }

    createAlert(targetPrice, direction, notification = 'browser') {
        if (!targetPrice || targetPrice <= 0) {
            throw new Error('Invalid target price');
        }

        if (!['above', 'below'].includes(direction)) {
            throw new Error('Direction must be "above" or "below"');
        }

        const alert = {
            id: Date.now() + Math.random(),
            targetPrice: parseFloat(targetPrice),
            direction: direction,
            notification: notification,
            createdAt: new Date().toISOString(),
            triggered: false,
            notified: false
        };

        this.alerts.push(alert);
        this.saveAlerts();
        
        return alert;
    }

    deleteAlert(alertId) {
        this.alerts = this.alerts.filter(a => a.id !== alertId);
        this.saveAlerts();
    }

    getActiveAlerts() {
        return this.alerts.filter(a => !a.triggered);
    }

    getTriggeredAlerts() {
        return this.alerts.filter(a => a.triggered);
    }

    async checkAlerts() {
        const price = await this.getCurrentPrice();
        if (!price) return;

        const activeAlerts = this.getActiveAlerts();
        
        for (const alert of activeAlerts) {
            let shouldTrigger = false;

            if (alert.direction === 'above' && price >= alert.targetPrice) {
                shouldTrigger = true;
            } else if (alert.direction === 'below' && price <= alert.targetPrice) {
                shouldTrigger = true;
            }

            if (shouldTrigger && !alert.notified) {
                alert.triggered = true;
                alert.triggeredAt = new Date().toISOString();
                alert.triggeredPrice = price;
                
                this.sendNotification(alert, price);
                alert.notified = true;
            }
        }

        this.saveAlerts();
    }

    sendNotification(alert, currentPrice) {
        const message = `AETH Price Alert! Price is ${alert.direction} $${alert.targetPrice.toFixed(6)}. Current: $${currentPrice.toFixed(6)}`;

        // Browser notification
        if (alert.notification === 'browser' || alert.notification === 'both') {
            this.sendBrowserNotification(message, alert);
        }

        // Email notification (would require backend)
        if (alert.notification === 'email' || alert.notification === 'both') {
            this.sendEmailNotification(alert, currentPrice);
        }

        // Show in-app notification
        this.showInAppNotification(message, alert);
    }

    sendBrowserNotification(message, alert) {
        if (!('Notification' in window)) {
            console.log('Browser does not support notifications');
            return;
        }

        if (Notification.permission === 'granted') {
            new Notification('Aetheron Price Alert', {
                body: message,
                icon: '/logo.png',
                badge: '/logo.png',
                tag: `price-alert-${alert.id}`,
                requireInteraction: true,
                data: { alertId: alert.id }
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('Aetheron Price Alert', {
                        body: message,
                        icon: '/logo.png'
                    });
                }
            });
        }
    }

    sendEmailNotification(alert, currentPrice) {
        // This would require a backend API endpoint
        // For now, log the intent
        console.log('Email notification would be sent:', {
            alert,
            currentPrice,
            message: `Price alert triggered for AETH`
        });

        // Example API call (implement on backend):
        /*
        fetch('/api/send-alert-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: userEmail,
                alertType: alert.direction,
                targetPrice: alert.targetPrice,
                currentPrice: currentPrice
            })
        });
        */
    }

    showInAppNotification(message, alert) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'price-alert-notification';
        notification.innerHTML = `
            <div class="alert-icon">📊</div>
            <div class="alert-content">
                <div class="alert-title">Price Alert Triggered!</div>
                <div class="alert-message">${message}</div>
            </div>
            <button class="alert-close" onclick="this.parentElement.remove()">×</button>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            notification.classList.add('alert-fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 10000);

        // Play sound (optional)
        this.playAlertSound();
    }

    playAlertSound() {
        // Simple beep using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Could not play alert sound:', e);
        }
    }

    startMonitoring() {
        // Check every 30 seconds
        this.checkInterval = setInterval(() => {
            this.checkAlerts();
        }, 30000);

        // Initial check
        this.checkAlerts();
    }

    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            return Notification.requestPermission();
        }
        return Promise.resolve(Notification.permission);
    }

    clearTriggeredAlerts() {
        this.alerts = this.alerts.filter(a => !a.triggered);
        this.saveAlerts();
    }

    exportAlerts() {
        return JSON.stringify(this.alerts, null, 2);
    }

    importAlerts(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            if (Array.isArray(imported)) {
                this.alerts = imported;
                this.saveAlerts();
                return true;
            }
        } catch (e) {
            console.error('Failed to import alerts:', e);
        }
        return false;
    }
}

// CSS Styles for price alerts
const alertStyles = `
    .price-alert-notification {
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 10000;
        
        display: flex;
        align-items: center;
        gap: 12px;
        
        max-width: 400px;
        padding: 16px;
        background: var(--bg-card);
        border: 2px solid var(--accent-blue);
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
        
        animation: slide-in-right 0.3s ease;
    }

    .price-alert-notification.alert-fade-out {
        animation: slide-out-right 0.3s ease forwards;
    }

    .alert-icon {
        font-size: 32px;
        flex-shrink: 0;
    }

    .alert-content {
        flex: 1;
    }

    .alert-title {
        font-weight: 600;
        font-size: 16px;
        color: var(--text-primary);
        margin-bottom: 4px;
    }

    .alert-message {
        font-size: 14px;
        color: var(--text-secondary);
        line-height: 1.4;
    }

    .alert-close {
        background: none;
        border: none;
        font-size: 24px;
        color: var(--text-muted);
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: color 0.2s;
    }

    .alert-close:hover {
        color: var(--text-primary);
    }

    @keyframes slide-in-right {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slide-out-right {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    /* Alert management UI */
    .alerts-container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
    }

    .alert-form {
        background: var(--bg-card);
        padding: 24px;
        border-radius: 12px;
        margin-bottom: 24px;
        box-shadow: var(--shadow-sm);
    }

    .alert-form-group {
        margin-bottom: 16px;
    }

    .alert-form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--text-primary);
    }

    .alert-form-group input,
    .alert-form-group select {
        width: 100%;
        padding: 12px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background: var(--input-bg);
        color: var(--text-primary);
        font-family: inherit;
        font-size: 14px;
    }

    .alert-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .alert-item {
        background: var(--bg-card);
        padding: 16px;
        border-radius: 8px;
        border-left: 4px solid var(--accent-blue);
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: var(--shadow-sm);
    }

    .alert-item.triggered {
        border-left-color: var(--accent-green);
        opacity: 0.7;
    }

    .alert-info {
        flex: 1;
    }

    .alert-price {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
    }

    .alert-direction {
        font-size: 14px;
        color: var(--text-secondary);
        margin-top: 4px;
    }

    .alert-actions {
        display: flex;
        gap: 8px;
    }

    .alert-delete-btn {
        padding: 8px 12px;
        background: var(--accent-red);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: opacity 0.2s;
    }

    .alert-delete-btn:hover {
        opacity: 0.8;
    }

    @media (max-width: 640px) {
        .price-alert-notification {
            top: 60px;
            right: 12px;
            left: 12px;
            max-width: none;
        }
    }
`;

// Inject styles
const alertStyleSheet = document.createElement('style');
alertStyleSheet.textContent = alertStyles;
document.head.appendChild(alertStyleSheet);

// Initialize price alert manager
let priceAlertManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        priceAlertManager = new PriceAlertManager();
    });
} else {
    priceAlertManager = new PriceAlertManager();
}

// Export for use in other scripts
window.PriceAlertManager = PriceAlertManager;
window.priceAlertManager = priceAlertManager;
