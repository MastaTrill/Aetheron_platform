// Simplified Analytics Dashboard Test
class SimpleAnalyticsDashboard {
  constructor() {
    console.log('SimpleAnalyticsDashboard constructor called');
    this.init();
  }

  async init() {
    console.log('Initializing Simple Analytics Dashboard...');
    try {
      await this.loadDependencies();
      console.log('Dependencies loaded');
      this.renderBasicContent();
      console.log('Basic content rendered');
    } catch (error) {
      console.error('Error initializing dashboard:', error);
    }
  }

  async loadDependencies() {
    return new Promise((resolve) => {
      if (typeof Chart !== 'undefined') {
        console.log('Chart.js already loaded');
        resolve();
      } else {
        console.log('Waiting for Chart.js to load...');
        const checkChart = setInterval(() => {
          if (typeof Chart !== 'undefined') {
            clearInterval(checkChart);
            console.log('Chart.js loaded successfully');
            resolve();
          }
        }, 100);
      }
    });
  }

  renderBasicContent() {
    // Update status
    const statusElement = document.getElementById('status');
    if (statusElement) {
      statusElement.innerHTML = '✅ Analytics Dashboard Loaded Successfully!<br>Chart.js: ' + (typeof Chart !== 'undefined' ? 'Loaded' : 'Not Loaded');
    }

    // Test chart creation
    this.createTestChart();
  }

  createTestChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) {
      console.error('Performance chart canvas not found');
      return;
    }

    try {
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
          datasets: [{
            label: 'Portfolio Value',
            data: [10000, 12000, 11500, 13000, 12500],
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: true
            }
          }
        }
      });
      console.log('Test chart created successfully');
    } catch (error) {
      console.error('Error creating test chart:', error);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded - Initializing Analytics Dashboard');
  window.simpleAnalytics = new SimpleAnalyticsDashboard();
});