/**
 * Aetheron Portfolio Management System
 * Advanced portfolio tracking with real-time P&L and performance metrics
 */

class PortfolioManager {
    constructor(marketDataEngine) {
        this.marketData = marketDataEngine;
        this.portfolios = new Map();
        this.currentPortfolio = "default";
        this.transactions = [];
        this.alerts = [];
        this.performanceHistory = [];
        
        // Initialize default portfolio
        this.createPortfolio("default", "My Portfolio");
        
        // Load saved data
        this.loadFromStorage();
        
        // Start performance tracking
        this.startPerformanceTracking();
    }
    
    // Create a new portfolio
    createPortfolio(id, name) {
        const portfolio = {
            id: id,
            name: name,
            holdings: new Map(),
            totalValue: 0,
            totalCost: 0,
            totalPnL: 0,
            totalPnLPercent: 0,
            diversificationScore: 0,
            riskScore: 0,
            createdAt: Date.now(),
            lastUpdated: Date.now()
        };
        
        this.portfolios.set(id, portfolio);
        return portfolio;
    }
    
    // Add or update a holding
    addHolding(symbol, amount, averagePrice = null, portfolioId = null) {
        const portfolio = this.getPortfolio(portfolioId);
        const currentPrice = this.marketData.getMarketData(symbol)?.price || 0;
        
        if (portfolio.holdings.has(symbol)) {
            // Update existing holding
            const holding = portfolio.holdings.get(symbol);
            const totalAmount = holding.amount + amount;
            const totalCost = holding.totalCost + (amount * (averagePrice || currentPrice));
            const newAveragePrice = totalCost / totalAmount;
            
            holding.amount = totalAmount;
            holding.averagePrice = newAveragePrice;
            holding.totalCost = totalCost;
        } else {
            // Create new holding
            const holding = {
                symbol: symbol,
                amount: amount,
                averagePrice: averagePrice || currentPrice,
                totalCost: amount * (averagePrice || currentPrice),
                currentPrice: currentPrice,
                marketValue: amount * currentPrice,
                pnl: 0,
                pnlPercent: 0,
                allocation: 0,
                lastUpdated: Date.now()
            };
            
            portfolio.holdings.set(symbol, holding);
        }
        
        // Record transaction
        this.recordTransaction({
            type: "buy",
            symbol: symbol,
            amount: amount,
            price: averagePrice || currentPrice,
            timestamp: Date.now(),
            portfolioId: portfolio.id
        });
        
        this.updatePortfolioMetrics(portfolio.id);
        this.saveToStorage();
        
        return portfolio.holdings.get(symbol);
    }
    
    // Remove or reduce a holding
    removeHolding(symbol, amount, salePrice = null, portfolioId = null) {
        const portfolio = this.getPortfolio(portfolioId);
        const holding = portfolio.holdings.get(symbol);
        
        if (!holding || holding.amount < amount) {
            throw new Error("Insufficient holdings");
        }
        
        const currentPrice = this.marketData.getMarketData(symbol)?.price || 0;
        const actualSalePrice = salePrice || currentPrice;
        
        // Calculate realized P&L
        const costBasis = (holding.totalCost / holding.amount) * amount;
        const saleProceeds = amount * actualSalePrice;
        const realizedPnL = saleProceeds - costBasis;
        
        // Update holding
        holding.amount -= amount;
        holding.totalCost -= costBasis;
        
        if (holding.amount <= 0) {
            portfolio.holdings.delete(symbol);
        }
        
        // Record transaction
        this.recordTransaction({
            type: "sell",
            symbol: symbol,
            amount: amount,
            price: actualSalePrice,
            realizedPnL: realizedPnL,
            timestamp: Date.now(),
            portfolioId: portfolio.id
        });
        
        this.updatePortfolioMetrics(portfolio.id);
        this.saveToStorage();
        
        return realizedPnL;
    }
    
    // Update portfolio with real-time market data
    updatePortfolioMetrics(portfolioId = null) {
        const portfolio = this.getPortfolio(portfolioId);
        let totalValue = 0;
        let totalCost = 0;
        
        // Update each holding
        portfolio.holdings.forEach((holding, symbol) => {
            const marketData = this.marketData.getMarketData(symbol);
            if (marketData) {
                holding.currentPrice = marketData.price;
                holding.marketValue = holding.amount * marketData.price;
                holding.pnl = holding.marketValue - holding.totalCost;
                holding.pnlPercent = holding.totalCost > 0 ? (holding.pnl / holding.totalCost) * 100 : 0;
                holding.priceDirection = marketData.priceDirection;
                holding.change24h = marketData.change24h;
                holding.lastUpdated = Date.now();
            }
            
            totalValue += holding.marketValue;
            totalCost += holding.totalCost;
        });
        
        // Update portfolio totals
        portfolio.totalValue = totalValue;
        portfolio.totalCost = totalCost;
        portfolio.totalPnL = totalValue - totalCost;
        portfolio.totalPnLPercent = totalCost > 0 ? (portfolio.totalPnL / totalCost) * 100 : 0;
        
        // Calculate allocations
        portfolio.holdings.forEach(holding => {
            holding.allocation = totalValue > 0 ? (holding.marketValue / totalValue) * 100 : 0;
        });
        
        // Calculate portfolio metrics
        portfolio.diversificationScore = this.calculateDiversificationScore(portfolio);
        portfolio.riskScore = this.calculateRiskScore(portfolio);
        portfolio.lastUpdated = Date.now();
        
        return portfolio;
    }
    
    // Calculate diversification score (0-100)
    calculateDiversificationScore(portfolio) {
        const holdings = Array.from(portfolio.holdings.values());
        if (holdings.length === 0) return 0;
        
        // Calculate Herfindahl-Hirschman Index (HHI)
        const hhi = holdings.reduce((sum, holding) => {
            const allocation = holding.allocation / 100;
            return sum + (allocation * allocation);
        }, 0);
        
        // Convert to diversification score (inverse of concentration)
        return Math.max(0, 100 - (hhi * 100));
    }
    
    // Calculate portfolio risk score (0-100)
    calculateRiskScore(portfolio) {
        const holdings = Array.from(portfolio.holdings.values());
        if (holdings.length === 0) return 0;
        
        // Risk based on volatility and concentration
        let weightedVolatility = 0;
        holdings.forEach(holding => {
            const volatility = Math.abs(holding.change24h || 0);
            const weight = holding.allocation / 100;
            weightedVolatility += volatility * weight;
        });
        
        // Normalize to 0-100 scale
        return Math.min(100, weightedVolatility);
    }
    
    // Get portfolio performance metrics
    getPerformanceMetrics(portfolioId = null) {
        const portfolio = this.getPortfolio(portfolioId);
        const holdings = Array.from(portfolio.holdings.values());
        
        // Calculate additional metrics
        const topPerformer = holdings.reduce((best, holding) => 
            (!best || holding.pnlPercent > best.pnlPercent) ? holding : best, null);
        
        const worstPerformer = holdings.reduce((worst, holding) => 
            (!worst || holding.pnlPercent < worst.pnlPercent) ? holding : worst, null);
        
        const totalRealizedPnL = this.transactions
            .filter(tx => tx.portfolioId === portfolio.id && tx.realizedPnL)
            .reduce((sum, tx) => sum + tx.realizedPnL, 0);
        
        return {
            totalValue: portfolio.totalValue,
            totalCost: portfolio.totalCost,
            totalPnL: portfolio.totalPnL,
            totalPnLPercent: portfolio.totalPnLPercent,
            totalRealizedPnL: totalRealizedPnL,
            diversificationScore: portfolio.diversificationScore,
            riskScore: portfolio.riskScore,
            holdingsCount: holdings.length,
            topPerformer: topPerformer,
            worstPerformer: worstPerformer,
            lastUpdated: portfolio.lastUpdated
        };
    }
    
    // Get portfolio holdings sorted by value
    getHoldingsSorted(portfolioId = null, sortBy = "value") {
        const portfolio = this.getPortfolio(portfolioId);
        const holdings = Array.from(portfolio.holdings.values());
        
        switch (sortBy) {
            case "value":
                return holdings.sort((a, b) => b.marketValue - a.marketValue);
            case "pnl":
                return holdings.sort((a, b) => b.pnl - a.pnl);
            case "pnlPercent":
                return holdings.sort((a, b) => b.pnlPercent - a.pnlPercent);
            case "allocation":
                return holdings.sort((a, b) => b.allocation - a.allocation);
            case "symbol":
                return holdings.sort((a, b) => a.symbol.localeCompare(b.symbol));
            default:
                return holdings;
        }
    }
    
    // Record a transaction
    recordTransaction(transaction) {
        transaction.id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.transactions.push(transaction);
        
        // Keep only last 1000 transactions
        if (this.transactions.length > 1000) {
            this.transactions = this.transactions.slice(-1000);
        }
    }
    
    // Get transaction history
    getTransactionHistory(portfolioId = null, limit = 50) {
        let transactions = this.transactions;
        
        if (portfolioId) {
            transactions = transactions.filter(tx => tx.portfolioId === portfolioId);
        }
        
        return transactions
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }
    
    // Start performance tracking
    startPerformanceTracking() {
        // Record performance every 5 minutes
        setInterval(() => {
            this.recordPerformanceSnapshot();
        }, 5 * 60 * 1000);
        
        // Initial snapshot
        this.recordPerformanceSnapshot();
    }
    
    // Record portfolio performance snapshot
    recordPerformanceSnapshot() {
        this.portfolios.forEach(portfolio => {
            const snapshot = {
                portfolioId: portfolio.id,
                timestamp: Date.now(),
                totalValue: portfolio.totalValue,
                totalCost: portfolio.totalCost,
                totalPnL: portfolio.totalPnL,
                totalPnLPercent: portfolio.totalPnLPercent
            };
            
            this.performanceHistory.push(snapshot);
        });
        
        // Keep only last 30 days of snapshots
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        this.performanceHistory = this.performanceHistory
            .filter(snapshot => snapshot.timestamp > thirtyDaysAgo);
    }
    
    // Get performance history for charts
    getPerformanceHistory(portfolioId = null, timeframe = "24h") {
        let history = this.performanceHistory;
        
        if (portfolioId) {
            history = history.filter(snapshot => snapshot.portfolioId === portfolioId);
        }
        
        // Filter by timeframe
        const now = Date.now();
        let timeLimit;
        switch (timeframe) {
            case "1h":
                timeLimit = now - (60 * 60 * 1000);
                break;
            case "24h":
                timeLimit = now - (24 * 60 * 60 * 1000);
                break;
            case "7d":
                timeLimit = now - (7 * 24 * 60 * 60 * 1000);
                break;
            case "30d":
                timeLimit = now - (30 * 24 * 60 * 60 * 1000);
                break;
            default:
                timeLimit = 0;
        }
        
        return history
            .filter(snapshot => snapshot.timestamp > timeLimit)
            .sort((a, b) => a.timestamp - b.timestamp);
    }
    
    // Helper methods
    getPortfolio(portfolioId = null) {
        const id = portfolioId || this.currentPortfolio;
        const portfolio = this.portfolios.get(id);
        if (!portfolio) {
            throw new Error(`Portfolio ${id} not found`);
        }
        return portfolio;
    }
    
    getAllPortfolios() {
        return Array.from(this.portfolios.values());
    }
    
    setCurrentPortfolio(portfolioId) {
        if (this.portfolios.has(portfolioId)) {
            this.currentPortfolio = portfolioId;
            this.saveToStorage();
        }
    }
    
    // Save to localStorage
    saveToStorage() {
        try {
            const data = {
                portfolios: Array.from(this.portfolios.entries()).map(([id, portfolio]) => ({
                    ...portfolio,
                    holdings: Array.from(portfolio.holdings.entries())
                })),
                transactions: this.transactions,
                performanceHistory: this.performanceHistory,
                currentPortfolio: this.currentPortfolio
            };
            
            localStorage.setItem("aetheron_portfolio", JSON.stringify(data));
        } catch (error) {
            console.error("Error saving portfolio data:", error);
        }
    }
    
    // Load from localStorage
    loadFromStorage() {
        try {
            const saved = localStorage.getItem("aetheron_portfolio");
            if (saved) {
                const data = JSON.parse(saved);
                
                // Restore portfolios
                if (data.portfolios) {
                    data.portfolios.forEach(portfolioData => {
                        const portfolio = { ...portfolioData };
                        portfolio.holdings = new Map(portfolioData.holdings || []);
                        this.portfolios.set(portfolio.id, portfolio);
                    });
                }
                
                // Restore transactions
                if (data.transactions) {
                    this.transactions = data.transactions;
                }
                
                // Restore performance history
                if (data.performanceHistory) {
                    this.performanceHistory = data.performanceHistory;
                }
                
                // Restore current portfolio
                if (data.currentPortfolio) {
                    this.currentPortfolio = data.currentPortfolio;
                }
                
                console.log("✅ Portfolio data loaded from storage");
            }
        } catch (error) {
            console.error("Error loading portfolio data:", error);
        }
    }
    
    // Format currency values
    formatCurrency(amount) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }
    
    // Format percentage
    formatPercent(percent) {
        const sign = percent >= 0 ? "+" : "";
        return `${sign}${percent.toFixed(2)}%`;
    }
}

// Export for use in other modules
window.PortfolioManager = PortfolioManager;
