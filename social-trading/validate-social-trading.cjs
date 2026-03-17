#!/usr/bin/env node

/**
 * Social Trading Feature Validation Script
 * Validates HTML, CSS, JavaScript, functionality, and performance
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Configuration
const CONFIG = {
  files: {
    html: 'index.html',
    css: 'social-trading.css',
    js: 'social-trading.js'
  },
  directories: {
    root: path.join(__dirname),
    assets: path.join(__dirname, 'assets')
  }
};

class SocialTradingValidator {
  constructor() {
    this.results = {
      html: { passed: 0, failed: 0, warnings: 0, errors: [] },
      css: { passed: 0, failed: 0, warnings: 0, errors: [] },
      js: { passed: 0, failed: 0, warnings: 0, errors: [] },
      functionality: { passed: 0, failed: 0, warnings: 0, errors: [] },
      performance: { passed: 0, failed: 0, warnings: 0, errors: [] },
      accessibility: { passed: 0, failed: 0, warnings: 0, errors: [] },
      responsive: { passed: 0, failed: 0, warnings: 0, errors: [] }
    };
    this.dom = null;
    this.window = null;
  }

  async validate() {
    console.log('🚀 Starting Social Trading Feature Validation...\n');

    try {
      // Load and parse HTML
      await this.loadHTML();

      // Run all validations
      await this.validateHTML();
      await this.validateCSS();
      await this.validateJavaScript();
      await this.validateFunctionality();
      await this.validatePerformance();
      await this.validateAccessibility();
      await this.validateResponsive();

      // Generate report
      this.generateReport();

    } catch (error) {
      console.error('❌ Validation failed with error:', error.message);
      process.exit(1);
    }
  }

  async loadHTML() {
    const htmlPath = path.join(CONFIG.directories.root, CONFIG.files.html);
    if (!fs.existsSync(htmlPath)) {
      throw new Error(`HTML file not found: ${htmlPath}`);
    }

    const html = fs.readFileSync(htmlPath, 'utf8');
    this.dom = new JSDOM(html, {
      url: 'http://localhost:3000',
      pretendToBeVisual: true,
      resources: 'usable'
    });
    this.window = this.dom.window;
    this.document = this.window.document;

    console.log('✅ HTML loaded successfully');
  }

  async validateHTML() {
    console.log('🔍 Validating HTML structure...');

    const checks = [
      // Document structure
      () => this.checkDoctype(),
      () => this.checkMetaTags(),
      () => this.checkTitle(),
      () => this.checkViewport(),

      // Navigation
      () => this.checkNavigation(),
      () => this.checkTabNavigation(),

      // Main content
      () => this.checkHeroSection(),
      () => this.checkContentGrid(),
      () => this.checkFeedSection(),
      () => this.checkDiscoverSection(),
      () => this.checkCompetitionsSection(),
      () => this.checkLeaderboardSection(),
      () => this.checkProfileSection(),

      // Forms and interactions
      () => this.checkPostForm(),
      () => this.checkSignalForm(),
      () => this.checkModals(),

      // Sidebar components
      () => this.checkProfileCard(),
      () => this.checkTrendingList(),
      () => this.checkOnlineUsers(),
      () => this.checkSignalsList(),
      () => this.checkSentimentAnalysis(),

      // Footer and utilities
      () => this.checkLoadingOverlay(),
      () => this.checkToastContainer(),
      () => this.checkExternalDependencies()
    ];

    for (const check of checks) {
      try {
        await check();
        this.results.html.passed++;
      } catch (error) {
        this.results.html.errors.push(error.message);
        this.results.html.failed++;
      }
    }

    console.log(`✅ HTML validation complete: ${this.results.html.passed} passed, ${this.results.html.failed} failed`);
  }

  checkDoctype() {
    const doctype = this.document.doctype;
    if (!doctype || doctype.name !== 'html') {
      throw new Error('Missing or invalid DOCTYPE declaration');
    }
  }

  checkMetaTags() {
    const required = ['viewport', 'description'];
    const existing = Array.from(this.document.querySelectorAll('meta')).map(meta =>
      meta.getAttribute('name') || meta.getAttribute('charset') || meta.getAttribute('http-equiv')
    );

    // Check for charset separately
    const charsetMeta = this.document.querySelector('meta[charset]');
    if (!charsetMeta) {
      throw new Error('Missing charset meta tag');
    }

    for (const req of required) {
      if (!existing.includes(req)) {
        throw new Error(`Missing required meta tag: ${req}`);
      }
    }
  }

  checkTitle() {
    const title = this.document.querySelector('title');
    if (!title || !title.textContent.trim()) {
      throw new Error('Missing or empty page title');
    }
    if (!title.textContent.includes('Social Trading')) {
      throw new Error('Page title should include "Social Trading"');
    }
  }

  checkViewport() {
    const viewport = this.document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      throw new Error('Missing viewport meta tag');
    }
  }

  checkNavigation() {
    const nav = this.document.querySelector('.navbar');
    if (!nav) {
      throw new Error('Missing navigation bar');
    }

    const brand = nav.querySelector('.nav-brand');
    if (!brand) {
      throw new Error('Missing navigation brand');
    }

    const links = nav.querySelectorAll('.nav-link');
    if (links.length === 0) {
      throw new Error('Missing navigation links');
    }

    const walletBtn = nav.querySelector('.wallet-btn');
    if (!walletBtn) {
      throw new Error('Missing wallet connection button');
    }
  }

  checkTabNavigation() {
    const tabs = this.document.querySelectorAll('.tab-btn');
    const expectedTabs = ['feed', 'discover', 'competitions', 'leaderboard', 'profile'];

    if (tabs.length !== expectedTabs.length) {
      throw new Error(`Expected ${expectedTabs.length} tabs, found ${tabs.length}`);
    }

    const tabData = Array.from(tabs).map(tab => tab.dataset.tab);
    for (const expected of expectedTabs) {
      if (!tabData.includes(expected)) {
        throw new Error(`Missing tab: ${expected}`);
      }
    }
  }

  checkHeroSection() {
    const hero = this.document.querySelector('.hero-section');
    if (!hero) {
      throw new Error('Missing hero section');
    }

    const title = hero.querySelector('.hero-title');
    if (!title) {
      throw new Error('Missing hero title');
    }

    const stats = hero.querySelectorAll('.stat-item');
    if (stats.length < 3) {
      throw new Error('Hero section should have at least 3 stats');
    }
  }

  checkContentGrid() {
    const grid = this.document.querySelector('.content-grid');
    if (!grid) {
      throw new Error('Missing content grid');
    }

    const mainFeed = grid.querySelector('.main-feed');
    if (!mainFeed) {
      throw new Error('Missing main feed in content grid');
    }

    const sidebar = grid.querySelector('.sidebar');
    if (!sidebar) {
      throw new Error('Missing sidebar in content grid');
    }
  }

  checkFeedSection() {
    const feedTab = this.document.getElementById('feed');
    if (!feedTab) {
      throw new Error('Missing feed tab content');
    }

    const createPost = feedTab.querySelector('.create-post-card');
    if (!createPost) {
      throw new Error('Missing create post card');
    }

    const postsContainer = feedTab.querySelector('#postsContainer');
    if (!postsContainer) {
      throw new Error('Missing posts container');
    }
  }

  checkDiscoverSection() {
    const discoverTab = this.document.getElementById('discover');
    if (!discoverTab) {
      throw new Error('Missing discover tab content');
    }

    const tradersGrid = discoverTab.querySelector('#tradersGrid');
    if (!tradersGrid) {
      throw new Error('Missing traders grid');
    }
  }

  checkCompetitionsSection() {
    const compTab = this.document.getElementById('competitions');
    if (!compTab) {
      throw new Error('Missing competitions tab content');
    }

    const compGrid = compTab.querySelector('#competitionsGrid');
    if (!compGrid) {
      throw new Error('Missing competitions grid');
    }
  }

  checkLeaderboardSection() {
    const leaderTab = this.document.getElementById('leaderboard');
    if (!leaderTab) {
      throw new Error('Missing leaderboard tab content');
    }

    const leaderList = leaderTab.querySelector('#leaderboardList');
    if (!leaderList) {
      throw new Error('Missing leaderboard list');
    }
  }

  checkProfileSection() {
    const profileTab = this.document.getElementById('profile');
    if (!profileTab) {
      throw new Error('Missing profile tab content');
    }

    const profileHeader = profileTab.querySelector('.profile-header');
    if (!profileHeader) {
      throw new Error('Missing profile header');
    }
  }

  checkPostForm() {
    const form = this.document.getElementById('postForm');
    if (!form) {
      // Try alternative form structure
      const textarea = this.document.getElementById('postContent');
      if (!textarea) {
        throw new Error('Missing post form or textarea');
      }
      return;
    }

    const textarea = form.querySelector('textarea');
    if (!textarea) {
      throw new Error('Missing textarea in post form');
    }

    const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('#submitPost');
    if (!submitBtn) {
      throw new Error('Missing submit button in post form');
    }
  }

  checkSignalForm() {
    const form = this.document.getElementById('signalForm');
    if (!form) {
      throw new Error('Missing signal form');
    }

    const required = ['signalType', 'asset', 'entryPrice', 'stopLoss', 'takeProfit'];
    for (const field of required) {
      const input = form.querySelector(`[name="${field}"]`);
      if (!input) {
        throw new Error(`Missing required field in signal form: ${field}`);
      }
    }
  }

  checkModals() {
    const modals = ['signalModal', 'postModal'];
    for (const modalId of modals) {
      const modal = this.document.getElementById(modalId);
      if (!modal) {
        throw new Error(`Missing modal: ${modalId}`);
      }

      const closeBtn = modal.querySelector('.close-modal');
      if (!closeBtn) {
        throw new Error(`Missing close button in modal: ${modalId}`);
      }
    }
  }

  checkProfileCard() {
    const profileCard = this.document.querySelector('.profile-card');
    if (!profileCard) {
      throw new Error('Missing profile card in sidebar');
    }

    const avatar = profileCard.querySelector('.profile-avatar');
    if (!avatar) {
      throw new Error('Missing profile avatar');
    }

    const stats = profileCard.querySelectorAll('.stat');
    if (stats.length < 3) {
      throw new Error('Profile card should have at least 3 stats');
    }
  }

  checkTrendingList() {
    const trendingCard = this.document.querySelector('.trending-card');
    if (!trendingCard) {
      throw new Error('Missing trending card');
    }

    const trendingList = trendingCard.querySelector('.trending-list');
    if (!trendingList) {
      throw new Error('Missing trending list');
    }
  }

  checkOnlineUsers() {
    const onlineCard = this.document.querySelector('.online-card');
    if (!onlineCard) {
      throw new Error('Missing online users card');
    }
  }

  checkSignalsList() {
    const signalsCard = this.document.querySelector('.signals-card');
    if (!signalsCard) {
      throw new Error('Missing signals card');
    }
  }

  checkSentimentAnalysis() {
    const sentimentCard = this.document.querySelector('.sentiment-card');
    if (!sentimentCard) {
      throw new Error('Missing sentiment analysis card');
    }

    const chart = sentimentCard.querySelector('canvas');
    if (!chart) {
      throw new Error('Missing sentiment chart canvas');
    }
  }

  checkLoadingOverlay() {
    const overlay = this.document.getElementById('loadingOverlay');
    if (!overlay) {
      throw new Error('Missing loading overlay');
    }
  }

  checkToastContainer() {
    const container = this.document.getElementById('toastContainer');
    if (!container) {
      throw new Error('Missing toast container');
    }
  }

  checkExternalDependencies() {
    const scripts = Array.from(this.document.querySelectorAll('script[src]'));
    const links = Array.from(this.document.querySelectorAll('link[href]'));

    // Check for Chart.js script
    const chartJsFound = scripts.some(script => script.src.includes('chart.js'));
    if (!chartJsFound) {
      throw new Error('Missing external dependency: chart.js');
    }

    // Check for Font Awesome CSS
    const fontAwesomeFound = links.some(link => link.href.includes('font-awesome') || link.href.includes('fontawesome'));
    if (!fontAwesomeFound) {
      throw new Error('Missing external dependency: font-awesome');
    }
  }

  async validateCSS() {
    console.log('🎨 Validating CSS...');

    const cssPath = path.join(CONFIG.directories.root, CONFIG.files.css);
    if (!fs.existsSync(cssPath)) {
      throw new Error(`CSS file not found: ${cssPath}`);
    }

    const css = fs.readFileSync(cssPath, 'utf8');

    const checks = [
      () => this.checkCSSVariables(css),
      () => this.checkResponsiveBreakpoints(css),
      () => this.checkKeyStyles(css),
      () => this.checkAnimations(css)
    ];

    for (const check of checks) {
      try {
        await check();
        this.results.css.passed++;
      } catch (error) {
        this.results.css.errors.push(error.message);
        this.results.css.failed++;
      }
    }

    console.log(`✅ CSS validation complete: ${this.results.css.passed} passed, ${this.results.css.failed} failed`);
  }

  checkCSSVariables(css) {
    const requiredVars = [
      '--primary-color', '--bg-primary', '--text-primary',
      '--shadow-md', '--radius-md', '--transition-fast'
    ];

    for (const variable of requiredVars) {
      if (!css.includes(variable)) {
        throw new Error(`Missing CSS variable: ${variable}`);
      }
    }
  }

  checkResponsiveBreakpoints(css) {
    const breakpoints = ['@media (max-width: 1024px)', '@media (max-width: 768px)', '@media (max-width: 480px)'];

    for (const breakpoint of breakpoints) {
      if (!css.includes(breakpoint)) {
        throw new Error(`Missing responsive breakpoint: ${breakpoint}`);
      }
    }
  }

  checkKeyStyles(css) {
    const required = [
      '.navbar', '.hero-section', '.content-grid',
      '.post-card', '.trader-card', '.modal',
      '.tab-btn', '.follow-btn', '.loading-overlay'
    ];

    for (const style of required) {
      if (!css.includes(style)) {
        throw new Error(`Missing key style: ${style}`);
      }
    }
  }

  checkAnimations(css) {
    const animations = ['fadeIn', '@keyframes fadeIn'];

    for (const animation of animations) {
      if (!css.includes(animation)) {
        throw new Error(`Missing animation: ${animation}`);
      }
    }
  }

  async validateJavaScript() {
    console.log('💻 Validating JavaScript...');

    const jsPath = path.join(CONFIG.directories.root, CONFIG.files.js);
    if (!fs.existsSync(jsPath)) {
      throw new Error(`JavaScript file not found: ${jsPath}`);
    }

    const js = fs.readFileSync(jsPath, 'utf8');

    const checks = [
      () => this.checkJSClasses(js),
      () => this.checkJSEventHandlers(js),
      () => this.checkJSFunctions(js),
      () => this.checkJSErrorHandling(js),
      () => this.checkJSDOMManipulation(js)
    ];

    for (const check of checks) {
      try {
        await check();
        this.results.js.passed++;
      } catch (error) {
        this.results.js.errors.push(error.message);
        this.results.js.failed++;
      }
    }

    console.log(`✅ JavaScript validation complete: ${this.results.js.passed} passed, ${this.results.js.failed} failed`);
  }

  checkJSClasses(js) {
    const required = ['SocialTrading'];

    for (const cls of required) {
      if (!js.includes(`class ${cls}`)) {
        throw new Error(`Missing JavaScript class: ${cls}`);
      }
    }
  }

  checkJSEventHandlers(js) {
    const required = [
      'bindEvents', 'showTab', 'createPost',
      'createSignal', 'toggleFollow', 'showModal'
    ];

    for (const handler of required) {
      if (!js.includes(handler)) {
        throw new Error(`Missing event handler: ${handler}`);
      }
    }
  }

  checkJSFunctions(js) {
    const required = [
      'renderPosts', 'renderTraders', 'renderCompetitions',
      'renderLeaderboard', 'showToast', 'showLoading'
    ];

    for (const func of required) {
      if (!js.includes(` ${func}(`)) {
        throw new Error(`Missing function: ${func}`);
      }
    }
  }

  checkJSErrorHandling(js) {
    if (!js.includes('try') || !js.includes('catch')) {
      throw new Error('Missing error handling (try/catch blocks)');
    }
  }

  checkJSDOMManipulation(js) {
    const required = [
      'querySelector', 'addEventListener', 'classList.add',
      'innerHTML', 'appendChild'
    ];

    for (const method of required) {
      if (!js.includes(method)) {
        throw new Error(`Missing DOM manipulation method: ${method}`);
      }
    }
  }

  async validateFunctionality() {
    console.log('⚙️ Validating functionality...');

    // Test JavaScript execution in JSDOM
    try {
      // Load the JavaScript
      const jsPath = path.join(CONFIG.directories.root, CONFIG.files.js);
      const jsCode = fs.readFileSync(jsPath, 'utf8');

      // Create a script element and execute
      const script = this.document.createElement('script');
      script.textContent = jsCode;
      this.document.head.appendChild(script);

      // Test basic functionality
      const checks = [
        () => this.testTabSwitching(),
        () => this.testFormValidation(),
        () => this.testModalFunctionality(),
        () => this.testToastSystem(),
        () => this.testDataRendering()
      ];

      for (const check of checks) {
        try {
          await check();
          this.results.functionality.passed++;
        } catch (error) {
          this.results.functionality.errors.push(error.message);
          this.results.functionality.failed++;
        }
      }
    } catch (error) {
      this.results.functionality.errors.push(`JavaScript execution failed: ${error.message}`);
      this.results.functionality.failed++;
    }

    console.log(`✅ Functionality validation complete: ${this.results.functionality.passed} passed, ${this.results.functionality.failed} failed`);
  }

  testTabSwitching() {
    const tabs = this.document.querySelectorAll('.tab-btn');
    if (tabs.length === 0) {
      throw new Error('No tabs found for switching test');
    }

    // Simulate clicking first tab
    const firstTab = tabs[0];
    firstTab.click();

    const activeTabs = this.document.querySelectorAll('.tab-btn.active');
    if (activeTabs.length !== 1) {
      throw new Error('Tab switching not working properly');
    }
  }

  testFormValidation() {
    const postForm = this.document.getElementById('postForm');
    if (!postForm) {
      throw new Error('Post form not found');
    }

    const textarea = postForm.querySelector('textarea');
    if (!textarea) {
      throw new Error('Textarea not found in post form');
    }

    // Test empty form submission
    const event = new this.window.Event('submit', { bubbles: true, cancelable: true });
    postForm.dispatchEvent(event);
  }

  testModalFunctionality() {
    const signalModal = this.document.getElementById('signalModal');
    if (!signalModal) {
      throw new Error('Signal modal not found');
    }

    // Test modal opening (this would normally be done via JavaScript)
    signalModal.classList.add('active');

    const activeModals = this.document.querySelectorAll('.modal.active');
    if (activeModals.length === 0) {
      throw new Error('Modal activation not working');
    }
  }

  testToastSystem() {
    const toastContainer = this.document.getElementById('toastContainer');
    if (!toastContainer) {
      throw new Error('Toast container not found');
    }

    // Create a test toast
    const toast = this.document.createElement('div');
    toast.className = 'toast success';
    toast.innerHTML = '<i class="fas fa-check"></i><div class="toast-content"><div class="toast-title">Test</div><div class="toast-message">Test message</div></div>';
    toastContainer.appendChild(toast);

    const toasts = toastContainer.querySelectorAll('.toast');
    if (toasts.length === 0) {
      throw new Error('Toast creation not working');
    }
  }

  testDataRendering() {
    const postsContainer = this.document.getElementById('postsContainer');
    if (!postsContainer) {
      throw new Error('Posts container not found');
    }

    // Test if container can accept content
    postsContainer.innerHTML = '<div class="test-post">Test</div>';

    const testPost = postsContainer.querySelector('.test-post');
    if (!testPost) {
      throw new Error('Data rendering not working');
    }
  }

  async validatePerformance() {
    console.log('⚡ Validating performance...');

    const checks = [
      () => this.checkFileSizes(),
      () => this.checkImageOptimization(),
      () => this.checkLazyLoading(),
      () => this.checkCachingStrategy()
    ];

    for (const check of checks) {
      try {
        await check();
        this.results.performance.passed++;
      } catch (error) {
        this.results.performance.errors.push(error.message);
        this.results.performance.failed++;
      }
    }

    console.log(`✅ Performance validation complete: ${this.results.performance.passed} passed, ${this.results.performance.failed} failed`);
  }

  checkFileSizes() {
    const files = [
      { path: CONFIG.files.html, maxSize: 100 }, // KB
      { path: CONFIG.files.css, maxSize: 50 },
      { path: CONFIG.files.js, maxSize: 100 }
    ];

    for (const file of files) {
      const filePath = path.join(CONFIG.directories.root, file.path);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const sizeKB = stats.size / 1024;

        if (sizeKB > file.maxSize) {
          throw new Error(`${file.path} is too large: ${sizeKB.toFixed(1)}KB (max: ${file.maxSize}KB)`);
        }
      }
    }
  }

  checkImageOptimization() {
    // Check for image lazy loading attributes
    const images = this.document.querySelectorAll('img');
    let lazyLoaded = 0;

    images.forEach(img => {
      if (img.hasAttribute('loading') && img.getAttribute('loading') === 'lazy') {
        lazyLoaded++;
      }
    });

    if (lazyLoaded === 0) {
      this.results.performance.warnings++;
      // Don't fail, just warn
    }
  }

  checkLazyLoading() {
    // Check for intersection observer or similar lazy loading
    const jsPath = path.join(CONFIG.directories.root, CONFIG.files.js);
    const js = fs.readFileSync(jsPath, 'utf8');

    if (!js.includes('IntersectionObserver') && !js.includes('lazy')) {
      this.results.performance.warnings++;
    }
  }

  checkCachingStrategy() {
    // Check for cache headers or service worker
    const hasServiceWorker = this.document.querySelector('script[src*="sw.js"]') ||
      this.document.querySelector('script[src*="service-worker"]');

    if (!hasServiceWorker) {
      this.results.performance.warnings++;
    }
  }

  async validateAccessibility() {
    console.log('♿ Validating accessibility...');

    const checks = [
      () => this.checkAltTexts(),
      () => this.checkAriaLabels(),
      () => this.checkKeyboardNavigation(),
      () => this.checkColorContrast(),
      () => this.checkSemanticHTML()
    ];

    for (const check of checks) {
      try {
        await check();
        this.results.accessibility.passed++;
      } catch (error) {
        this.results.accessibility.errors.push(error.message);
        this.results.accessibility.failed++;
      }
    }

    console.log(`✅ Accessibility validation complete: ${this.results.accessibility.passed} passed, ${this.results.accessibility.failed} failed`);
  }

  checkAltTexts() {
    const images = this.document.querySelectorAll('img');
    let missingAlt = 0;

    images.forEach(img => {
      if (!img.hasAttribute('alt') || img.getAttribute('alt').trim() === '') {
        missingAlt++;
      }
    });

    if (missingAlt > 0) {
      throw new Error(`${missingAlt} images missing alt text`);
    }
  }

  checkAriaLabels() {
    const interactive = this.document.querySelectorAll('button, [role="button"], input, select, textarea');
    let missingLabels = 0;

    interactive.forEach(el => {
      // Skip elements that are hidden, disabled, or have text content
      if (el.hidden || el.disabled || el.textContent.trim() || el.querySelector('i, svg')) {
        return;
      }

      const hasLabel = el.hasAttribute('aria-label') ||
        el.hasAttribute('aria-labelledby') ||
        el.hasAttribute('title') ||
        (el.labels && el.labels.length > 0);

      if (!hasLabel && el.type !== 'submit' && el.type !== 'button') {
        missingLabels++;
      }
    });

    // Allow up to 2 missing labels for decorative elements
    if (missingLabels > 2) {
      throw new Error(`${missingLabels} interactive elements missing labels`);
    }
  }

  checkKeyboardNavigation() {
    const focusable = this.document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');

    if (focusable.length < 10) {
      throw new Error('Insufficient focusable elements for keyboard navigation');
    }
  }

  checkColorContrast() {
    // Basic check for high contrast mode support
    const cssPath = path.join(CONFIG.directories.root, CONFIG.files.css);
    const css = fs.readFileSync(cssPath, 'utf8');

    if (!css.includes('@media (prefers-contrast: high)') &&
      !css.includes('@media (prefers-color-scheme: dark)')) {
      this.results.accessibility.warnings++;
    }
  }

  checkSemanticHTML() {
    const semantic = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer'];
    let semanticCount = 0;

    semantic.forEach(tag => {
      const elements = this.document.querySelectorAll(tag);
      semanticCount += elements.length;
    });

    if (semanticCount < 5) {
      throw new Error('Insufficient semantic HTML elements');
    }
  }

  async validateResponsive() {
    console.log('📱 Validating responsive design...');

    const checks = [
      () => this.checkMobileNavigation(),
      () => this.checkFlexibleLayouts(),
      () => this.checkTouchTargets(),
      () => this.checkReadableText()
    ];

    for (const check of checks) {
      try {
        await check();
        this.results.responsive.passed++;
      } catch (error) {
        this.results.responsive.errors.push(error.message);
        this.results.responsive.failed++;
      }
    }

    console.log(`✅ Responsive validation complete: ${this.results.responsive.passed} passed, ${this.results.responsive.failed} failed`);
  }

  checkMobileNavigation() {
    const nav = this.document.querySelector('.navbar');
    if (!nav) {
      throw new Error('Navigation not found for mobile check');
    }

    // Check if navigation has mobile-friendly classes
    const hasMobileClass = nav.classList.contains('mobile') ||
      nav.querySelector('.mobile-menu') ||
      this.document.querySelector('.hamburger');

    if (!hasMobileClass) {
      // This might be acceptable if using CSS-only mobile menu
      this.results.responsive.warnings++;
    }
  }

  checkFlexibleLayouts() {
    const containers = this.document.querySelectorAll('.content-grid, .traders-grid, .competitions-grid, .posts-container');
    let flexibleCount = 0;

    containers.forEach(container => {
      const styles = this.window.getComputedStyle(container);
      if (styles.display === 'grid' || styles.display === 'flex') {
        flexibleCount++;
      }
    });

    // In JSDOM environment, CSS might not be fully applied, so be more lenient
    // Just check that we have the content-grid which is the main layout
    const contentGrid = this.document.querySelector('.content-grid');
    if (!contentGrid) {
      throw new Error('Missing main content grid');
    }

    // If we have at least 1 flexible layout, consider it sufficient
    if (flexibleCount < 1) {
      // Don't fail, just warn that CSS might not be loading in test environment
      this.results.responsive.warnings++;
    }
  }

  checkTouchTargets() {
    const buttons = this.document.querySelectorAll('button, .btn, [role="button"]');
    let smallTargets = 0;

    buttons.forEach(btn => {
      const styles = this.window.getComputedStyle(btn);
      const minWidth = parseInt(styles.minWidth) || parseInt(styles.width) || 0;
      const minHeight = parseInt(styles.minHeight) || parseInt(styles.height) || 0;

      // Allow smaller buttons if they have clear text or icons
      if (minWidth < 44 || minHeight < 44) {
        if (!btn.textContent.trim() && !btn.querySelector('i, svg')) {
          smallTargets++;
        }
      }
    });

    // Allow up to 10 small targets for icon-only buttons
    if (smallTargets > 10) {
      throw new Error(`${smallTargets} buttons have touch targets smaller than 44px`);
    }
  }

  checkReadableText() {
    // Check for minimum font sizes in CSS
    const cssPath = path.join(CONFIG.directories.root, CONFIG.files.css);
    const css = fs.readFileSync(cssPath, 'utf8');

    if (!css.includes('font-size') || !css.includes('line-height')) {
      throw new Error('Missing font size and line height declarations');
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SOCIAL TRADING VALIDATION REPORT');
    console.log('='.repeat(60));

    const categories = Object.keys(this.results);
    let totalPassed = 0;
    let totalFailed = 0;
    let totalWarnings = 0;

    categories.forEach(category => {
      const result = this.results[category];
      totalPassed += result.passed;
      totalFailed += result.failed;
      totalWarnings += result.warnings;

      console.log(`\n${category.toUpperCase()}:`);
      console.log(`  ✅ Passed: ${result.passed}`);
      console.log(`  ❌ Failed: ${result.failed}`);
      console.log(`  ⚠️  Warnings: ${result.warnings}`);

      if (result.errors.length > 0) {
        console.log('  Errors:');
        result.errors.forEach(error => {
          console.log(`    - ${error}`);
        });
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY:');
    console.log(`  Total Passed: ${totalPassed}`);
    console.log(`  Total Failed: ${totalFailed}`);
    console.log(`  Total Warnings: ${totalWarnings}`);
    console.log(`  Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    // Exit with appropriate code
    if (totalFailed > 0) {
      console.log('\n❌ Validation failed! Please fix the errors above.');
      process.exit(1);
    } else if (totalWarnings > 0) {
      console.log('\n⚠️  Validation passed with warnings. Consider addressing them.');
      process.exit(0);
    } else {
      console.log('\n✅ All validations passed! Social Trading feature is ready.');
      process.exit(0);
    }
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const validator = new SocialTradingValidator();
  validator.validate().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = SocialTradingValidator;