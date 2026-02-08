// 📊 Aetheron Platform - Advanced Charts & Analytics System
// Provides real-time interactive charts for price, volume, TVL, and staking metrics

console.log('📊 Charts.js loading...');

// Chart instances
let priceChart = null;
let volumeChart = null;
let stakingChart = null;
let tvlChart = null;

// Historical data storage
const chartData = {
    timestamps: [],
    prices: [],
    volumes: [],
    tvl: [],
    stakingMetrics: {
        totalStaked: [],
        rewardBalance: [],
        stakingPercentage: []
    }
};

// Chart configuration
const chartConfig = {
    maxDataPoints: 100, // Maximum number of points to display
    updateInterval: 30000, // Update every 30 seconds
    timeframes: {
        '1H': 60, // 60 minutes
        '24H': 1440, // 24 hours in minutes
        '7D': 10080, // 7 days in minutes
        '30D': 43200 // 30 days in minutes
    },
    currentTimeframe: '24H'
};

// Common chart styling
const chartStyles = {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 1)',
    pointBackgroundColor: 'rgba(139, 92, 246, 1)',
    pointBorderColor: '#fff',
    borderWidth: 2,
    pointRadius: 3,
    pointHoverRadius: 5,
    tension: 0.4,
    fill: true
};

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        intersect: false,
        mode: 'index'
    },
    plugins: {
        legend: {
            display: true,
            labels: {
                color: '#fff',
                font: {
                    size: 12,
                    family: "'Inter', sans-serif"
                }
            }
        },
        tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(139, 92, 246, 1)',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
                label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.y !== null) {
                        label += context.parsed.y.toLocaleString();
                    }
                    return label;
                }
            }
        }
    },
    scales: {
        x: {
            display: true,
            grid: {
                color: 'rgba(255, 255, 255, 0.1)',
                drawBorder: false
            },
            ticks: {
                color: '#999',
                maxRotation: 0,
                autoSkipPadding: 20
            }
        },
        y: {
            display: true,
            grid: {
                color: 'rgba(255, 255, 255, 0.1)',
                drawBorder: false
            },
            ticks: {
                color: '#999',
                callback: function(value) {
                    return value.toLocaleString();
                }
            }
        }
    }
};

// 📈 Initialize Price Chart
function initPriceChart() {
    const ctx = document.getElementById('priceChart');
    if (!ctx) {
        console.warn('⚠️ Price chart canvas not found');
        return;
    }

    console.log('📈 Initializing price chart...');
    
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.timestamps,
            datasets: [{
                label: 'AETH Price (USD)',
                data: chartData.prices,
                ...chartStyles
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'AETH Price History',
                    color: '#fff',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                ...chartOptions.scales,
                y: {
                    ...chartOptions.scales.y,
                    ticks: {
                        ...chartOptions.scales.y.ticks,
                        callback: function(value) {
                            return '$' + value.toFixed(6);
                        }
                    }
                }
            }
        }
    });

    console.log('✅ Price chart initialized');
}

// 📊 Initialize Volume Chart
function initVolumeChart() {
    const ctx = document.getElementById('volumeChart');
    if (!ctx) {
        console.warn('⚠️ Volume chart canvas not found');
        return;
    }

    console.log('📊 Initializing volume chart...');
    
    volumeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.timestamps,
            datasets: [{
                label: '24h Volume (USD)',
                data: chartData.volumes,
                backgroundColor: 'rgba(34, 197, 94, 0.6)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 1
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Trading Volume',
                    color: '#fff',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                ...chartOptions.scales,
                y: {
                    ...chartOptions.scales.y,
                    ticks: {
                        ...chartOptions.scales.y.ticks,
                        callback: function(value) {
                            if (value >= 1000000) return '$' + (value / 1000000).toFixed(2) + 'M';
                            if (value >= 1000) return '$' + (value / 1000).toFixed(2) + 'K';
                            return '$' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });

    console.log('✅ Volume chart initialized');
}

// 💰 Initialize TVL Chart
function initTVLChart() {
    const ctx = document.getElementById('tvlChart');
    if (!ctx) {
        console.warn('⚠️ TVL chart canvas not found');
        return;
    }

    console.log('💰 Initializing TVL chart...');
    
    tvlChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.timestamps,
            datasets: [{
                label: 'Total Value Locked (USD)',
                data: chartData.tvl,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderColor: 'rgba(59, 130, 246, 1)',
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointBorderColor: '#fff',
                borderWidth: 2,
                pointRadius: 3,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Total Value Locked',
                    color: '#fff',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                ...chartOptions.scales,
                y: {
                    ...chartOptions.scales.y,
                    ticks: {
                        ...chartOptions.scales.y.ticks,
                        callback: function(value) {
                            if (value >= 1000000) return '$' + (value / 1000000).toFixed(2) + 'M';
                            if (value >= 1000) return '$' + (value / 1000).toFixed(2) + 'K';
                            return '$' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });

    console.log('✅ TVL chart initialized');
}

// 🎯 Initialize Staking Chart
function initStakingChart() {
    const ctx = document.getElementById('stakingChart');
    if (!ctx) {
        console.warn('⚠️ Staking chart canvas not found');
        return;
    }

    console.log('🎯 Initializing staking chart...');
    
    stakingChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.timestamps,
            datasets: [
                {
                    label: 'Total Staked (AETH)',
                    data: chartData.stakingMetrics.totalStaked,
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    borderColor: 'rgba(168, 85, 247, 1)',
                    pointBackgroundColor: 'rgba(168, 85, 247, 1)',
                    borderWidth: 2,
                    pointRadius: 3,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Staking %',
                    data: chartData.stakingMetrics.stakingPercentage,
                    backgroundColor: 'rgba(234, 179, 8, 0.1)',
                    borderColor: 'rgba(234, 179, 8, 1)',
                    pointBackgroundColor: 'rgba(234, 179, 8, 1)',
                    borderWidth: 2,
                    pointRadius: 3,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Staking Metrics',
                    color: '#fff',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                x: {
                    ...chartOptions.scales.x
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#999',
                        callback: function(value) {
                            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                            if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
                            return value.toFixed(0);
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: '#999',
                        callback: function(value) {
                            return value.toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });

    console.log('✅ Staking chart initialized');
}

// 🔄 Update chart data from live sources
async function updateChartData() {
    try {
        console.log('🔄 Updating chart data...');
        
        const timestamp = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Get price data from DexScreener
        let price = 0;
        let volume = 0;
        let liquidity = 0;

        try {
            const response = await fetch('https://api.dexscreener.com/latest/dex/pairs/polygon/0xd57c5E33ebDC1b565F99d06809debbf86142705D');
            const data = await response.json();
            
            if (data.pair) {
                price = parseFloat(data.pair.priceUsd) || 0;
                volume = parseFloat(data.pair.volume?.h24) || 0;
                liquidity = parseFloat(data.pair.liquidity?.usd) || 0;
            }
        } catch (error) {
            console.error('❌ Error fetching market data:', error);
        }

        // Get staking data
        let totalStaked = 0;
        let stakingPercentage = 0;

        if (window.readOnlyAethContract && window.readOnlyStakingContract) {
            try {
                const totalSupply = await window.readOnlyAethContract.totalSupply();
                const stakedBalance = await window.readOnlyStakingContract.totalStaked();
                
                totalStaked = parseFloat(ethers.utils.formatEther(stakedBalance));
                stakingPercentage = (totalStaked / parseFloat(ethers.utils.formatEther(totalSupply))) * 100;
            } catch (error) {
                console.error('❌ Error fetching staking data:', error);
            }
        }

        // Add new data points
        chartData.timestamps.push(timestamp);
        chartData.prices.push(price);
        chartData.volumes.push(volume);
        chartData.tvl.push(liquidity);
        chartData.stakingMetrics.totalStaked.push(totalStaked);
        chartData.stakingMetrics.stakingPercentage.push(stakingPercentage);

        // Keep only last maxDataPoints
        const maxPoints = chartConfig.maxDataPoints;
        if (chartData.timestamps.length > maxPoints) {
            chartData.timestamps = chartData.timestamps.slice(-maxPoints);
            chartData.prices = chartData.prices.slice(-maxPoints);
            chartData.volumes = chartData.volumes.slice(-maxPoints);
            chartData.tvl = chartData.tvl.slice(-maxPoints);
            chartData.stakingMetrics.totalStaked = chartData.stakingMetrics.totalStaked.slice(-maxPoints);
            chartData.stakingMetrics.stakingPercentage = chartData.stakingMetrics.stakingPercentage.slice(-maxPoints);
        }

        // Update charts
        updateAllCharts();

        console.log('✅ Chart data updated:', {
            price: price.toFixed(6),
            volume: volume.toFixed(2),
            tvl: liquidity.toFixed(2),
            totalStaked: totalStaked.toFixed(0),
            stakingPercentage: stakingPercentage.toFixed(2) + '%'
        });

    } catch (error) {
        console.error('❌ Error updating chart data:', error);
    }
}

// 🔄 Update all chart instances
function updateAllCharts() {
    if (priceChart) {
        priceChart.data.labels = chartData.timestamps;
        priceChart.data.datasets[0].data = chartData.prices;
        priceChart.update('none'); // 'none' mode for better performance
    }

    if (volumeChart) {
        volumeChart.data.labels = chartData.timestamps;
        volumeChart.data.datasets[0].data = chartData.volumes;
        volumeChart.update('none');
    }

    if (tvlChart) {
        tvlChart.data.labels = chartData.timestamps;
        tvlChart.data.datasets[0].data = chartData.tvl;
        tvlChart.update('none');
    }

    if (stakingChart) {
        stakingChart.data.labels = chartData.timestamps;
        stakingChart.data.datasets[0].data = chartData.stakingMetrics.totalStaked;
        stakingChart.data.datasets[1].data = chartData.stakingMetrics.stakingPercentage;
        stakingChart.update('none');
    }
}

// 🎯 Initialize all charts
function initializeCharts() {
    console.log('🎯 Initializing all charts...');
    
    initPriceChart();
    initVolumeChart();
    initTVLChart();
    initStakingChart();
    
    // Initial data fetch
    updateChartData();
    
    // Set up auto-update
    setInterval(updateChartData, chartConfig.updateInterval);
    
    console.log('✅ All charts initialized and auto-update started');
}

// 📁 Initialize charts when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCharts);
} else {
    // DOM already loaded
    initializeCharts();
}

// Export for external use
window.AetheronCharts = {
    init: initializeCharts,
    update: updateChartData,
    data: chartData,
    config: chartConfig
};

console.log('✅ Charts.js loaded successfully');
