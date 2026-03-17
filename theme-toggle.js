// Dark/Light Mode Toggle for Aetheron Platform
// Persistent theme selection with smooth transitions

class ThemeManager {
    constructor() {
        this.themes = {
            light: {
                name: 'light',
                icon: '🌙',
                label: 'Dark Mode'
            },
            dark: {
                name: 'dark',
                icon: '☀️',
                label: 'Light Mode'
            }
        };
        
        this.currentTheme = this.loadTheme();
        this.init();
    }

    init() {
        // Apply saved theme immediately to avoid flash
        this.applyTheme(this.currentTheme);
        
        // Create toggle button
        this.createToggleButton();
        
        // Listen for system theme changes
        this.watchSystemTheme();
    }

    loadTheme() {
        // Priority: 1) Saved preference 2) System preference 3) Default to light
        const savedTheme = localStorage.getItem('aetheron-theme');
        if (savedTheme) {
            return savedTheme;
        }

        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        return 'light';
    }

    applyTheme(themeName) {
        const root = document.documentElement;
        
        if (themeName === 'dark') {
            root.style.setProperty('--bg-primary', '#0a0e1a');
            root.style.setProperty('--bg-secondary', '#151b2e');
            root.style.setProperty('--bg-card', '#1a2238');
            root.style.setProperty('--bg-hover', '#232d47');
            
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', '#b8c1ec');
            root.style.setProperty('--text-muted', '#7d8fb3');
            
            root.style.setProperty('--border-color', '#2d3956');
            root.style.setProperty('--input-bg', '#1a2238');
            
            root.style.setProperty('--accent-blue', '#4285f4');
            root.style.setProperty('--accent-green', '#34a853');
            root.style.setProperty('--accent-orange', '#fbbc04');
            root.style.setProperty('--accent-red', '#ea4335');
            
            root.style.setProperty('--shadow-sm', '0 2px 8px rgba(0, 0, 0, 0.4)');
            root.style.setProperty('--shadow-md', '0 4px 16px rgba(0, 0, 0, 0.5)');
            root.style.setProperty('--shadow-lg', '0 8px 32px rgba(0, 0, 0, 0.6)');
            
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
        } else {
            root.style.setProperty('--bg-primary', '#f8f9fa');
            root.style.setProperty('--bg-secondary', '#ffffff');
            root.style.setProperty('--bg-card', '#ffffff');
            root.style.setProperty('--bg-hover', '#f1f3f5');
            
            root.style.setProperty('--text-primary', '#1a1a1a');
            root.style.setProperty('--text-secondary', '#4a4a4a');
            root.style.setProperty('--text-muted', '#767676');
            
            root.style.setProperty('--border-color', '#e1e4e8');
            root.style.setProperty('--input-bg', '#ffffff');
            
            root.style.setProperty('--accent-blue', '#4285f4');
            root.style.setProperty('--accent-green', '#34a853');
            root.style.setProperty('--accent-orange', '#fbbc04');
            root.style.setProperty('--accent-red', '#ea4335');
            
            root.style.setProperty('--shadow-sm', '0 2px 8px rgba(0, 0, 0, 0.1)');
            root.style.setProperty('--shadow-md', '0 4px 16px rgba(0, 0, 0, 0.12)');
            root.style.setProperty('--shadow-lg', '0 8px 32px rgba(0, 0, 0, 0.15)');
            
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
        }

        this.currentTheme = themeName;
        localStorage.setItem('aetheron-theme', themeName);
        
        // Dispatch event for other components to react
        window.dispatchEvent(new CustomEvent('themeChange', { 
            detail: { theme: themeName } 
        }));
    }

    createToggleButton() {
        const button = document.createElement('button');
        button.id = 'theme-toggle';
        button.className = 'theme-toggle-btn';
        button.setAttribute('aria-label', 'Toggle theme');
        button.setAttribute('title', `Switch to ${this.themes[this.currentTheme === 'light' ? 'dark' : 'light'].label}`);
        
        this.updateButtonContent(button);
        
        button.addEventListener('click', () => this.toggleTheme());
        
        // Add to page (after header or at top right)
        const header = document.querySelector('header') || document.querySelector('nav');
        if (header) {
            header.appendChild(button);
        } else {
            document.body.insertBefore(button, document.body.firstChild);
        }
    }

    updateButtonContent(button) {
        const nextTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        button.innerHTML = `
            <span class="theme-icon">${this.themes[nextTheme].icon}</span>
            <span class="theme-label">${this.themes[nextTheme].label}</span>
        `;
        button.setAttribute('title', `Switch to ${this.themes[nextTheme].label}`);
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        
        const button = document.getElementById('theme-toggle');
        if (button) {
            this.updateButtonContent(button);
            
            // Add animation
            button.classList.add('theme-toggle-active');
            setTimeout(() => {
                button.classList.remove('theme-toggle-active');
            }, 300);
        }

        // Analytics tracking (if available)
        if (typeof gtag === 'function') {
            gtag('event', 'theme_toggle', {
                'event_category': 'UI',
                'event_label': newTheme
            });
        }
    }

    watchSystemTheme() {
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            darkModeQuery.addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually set a preference
                const savedTheme = localStorage.getItem('aetheron-theme');
                if (!savedTheme) {
                    const newTheme = e.matches ? 'dark' : 'light';
                    this.applyTheme(newTheme);
                    
                    const button = document.getElementById('theme-toggle');
                    if (button) {
                        this.updateButtonContent(button);
                    }
                }
            });
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    resetTheme() {
        localStorage.removeItem('aetheron-theme');
        this.currentTheme = this.loadTheme();
        this.applyTheme(this.currentTheme);
        
        const button = document.getElementById('theme-toggle');
        if (button) {
            this.updateButtonContent(button);
        }
    }
}

// CSS Styles for theme toggle button
const themeStyles = `
    .theme-toggle-btn {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        
        display: flex;
        align-items: center;
        gap: 8px;
        
        padding: 10px 16px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 24px;
        
        font-family: inherit;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
        
        cursor: pointer;
        transition: all 0.2s ease;
        
        box-shadow: var(--shadow-sm);
    }

    .theme-toggle-btn:hover {
        background: var(--bg-hover);
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
    }

    .theme-toggle-btn:active {
        transform: translateY(0);
    }

    .theme-toggle-btn .theme-icon {
        font-size: 18px;
        line-height: 1;
    }

    .theme-toggle-btn .theme-label {
        display: inline;
    }

    .theme-toggle-active {
        animation: theme-pulse 0.3s ease;
    }

    @keyframes theme-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }

    /* Mobile responsive */
    @media (max-width: 640px) {
        .theme-toggle-btn {
            top: 12px;
            right: 12px;
            padding: 8px 12px;
            font-size: 13px;
        }
        
        .theme-toggle-btn .theme-label {
            display: none; /* Hide text on mobile, show icon only */
        }
    }

    /* Smooth transitions for all themed elements */
    body,
    .card,
    .stat-card,
    .pool-card,
    input,
    button,
    select,
    textarea,
    .nav-link {
        transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
    }

    /* Dark theme specific adjustments */
    .dark-theme .gradient-text {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .dark-theme canvas {
        filter: brightness(0.9);
    }

    .dark-theme .logo {
        filter: brightness(1.2);
    }

    /* Light theme specific adjustments */
    .light-theme .gradient-text {
        background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = themeStyles;
document.head.appendChild(styleSheet);

// Initialize theme manager when DOM is ready
let themeManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        themeManager = new ThemeManager();
    });
} else {
    themeManager = new ThemeManager();
}

// Export for use in other scripts
window.ThemeManager = ThemeManager;
window.themeManager = themeManager;
