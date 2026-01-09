// Aetheron Dashboard JavaScript
class AetheronDashboard {
	constructor() {
		this.currentSection = 'dashboard';
		this.init();
	}

	init() {
		this.setupEventListeners();
		this.setupSpaceBackground();
		this.loadDashboardData();
		console.log('🌌 Aetheron Dashboard Initialized!');
	}

	setupEventListeners() {
		document.querySelectorAll('.nav-link').forEach(link => {
			link.addEventListener('click', (e) => {
				e.preventDefault();
				const section = e.target.dataset.section;
				this.showSection(section);
			});
		});
	}

	setupSpaceBackground() {
		const canvas = document.getElementById('space-bg');
		const ctx = canvas.getContext('2d');
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		const stars = [];
		for (let i = 0; i < 200; i++) {
			stars.push({
				x: Math.random() * canvas.width,
				y: Math.random() * canvas.height,
				radius: Math.random() * 2,
				opacity: Math.random()
			});
		}

		function animate() {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = '#0a0a0a';
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			stars.forEach(star => {
				ctx.beginPath();
				ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
				ctx.fill();
				
				star.opacity += (Math.random() - 0.5) * 0.02;
				star.opacity = Math.max(0, Math.min(1, star.opacity));
			});

			requestAnimationFrame(animate);
		}
		animate();
	}

	showSection(sectionName) {
		// Hide all sections
		document.querySelectorAll('.content-section').forEach(section => {
			section.classList.remove('active');
		});

		// Show selected section
		const targetSection = document.getElementById(sectionName);
		if (targetSection) {
			targetSection.classList.add('active');
		}

		// Update navigation
		document.querySelectorAll('.nav-link').forEach(link => {
			link.classList.remove('active');
		});
		document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

		this.currentSection = sectionName;
		console.log(`Navigated to ${sectionName}`);
	}

	loadDashboardData() {
		// Simulate loading data
		console.log('Loading dashboard data...');
		
		// You can add API calls here
		// fetch('/api/stats').then(response => response.json()).then(data => { ... });
	}
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	const dashboard = new AetheronDashboard();
	window.dashboard = dashboard; // Make globally available
});

// Add some startup animations
window.addEventListener('load', () => {
	console.log('🚀 Aetheron Platform Loaded Successfully!');
	console.log('🌌 Welcome to the future of space exploration!');
});
