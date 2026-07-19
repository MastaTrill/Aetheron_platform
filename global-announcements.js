function enforceDashboardBranding() {
  const styleId = 'aetheron-dark-navbar-fix';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .navbar,
      [data-theme="light"] .navbar {
        background: linear-gradient(180deg, rgba(3, 9, 22, 0.97), rgba(7, 14, 30, 0.94)) !important;
        border-bottom: 1px solid rgba(110, 231, 255, 0.16) !important;
        color: #d9fdff !important;
        box-shadow: 0 14px 34px rgba(0, 0, 0, 0.3), inset 0 -1px 0 rgba(255, 255, 255, 0.04) !important;
      }
      .navbar .logo,
      .navbar .logo-text,
      [data-theme="light"] .navbar .logo,
      [data-theme="light"] .navbar .logo-text { color: #d9fdff !important; }
      .navbar .logo-caption,
      [data-theme="light"] .navbar .logo-caption { color: rgba(188, 247, 255, 0.7) !important; }
      .navbar .nav-link,
      [data-theme="light"] .navbar .nav-link { color: rgba(225, 251, 255, 0.78) !important; }
      .navbar .nav-link i,
      [data-theme="light"] .navbar .nav-link i { color: rgba(110, 231, 255, 0.92) !important; }
    `;
    document.head.appendChild(style);
  }

  document.querySelectorAll('.logo-caption').forEach((caption) => {
    if (/polygon/i.test(caption.textContent)) caption.textContent = 'Base DeFi Command';
  });
}

enforceDashboardBranding();

function initGlobalAnnouncements() {
  const ANNOUNCEMENT_STORAGE_KEY = 'aethAnnouncementDismissed';
  const OFFLINE_TOAST_KEY = 'aethOfflineReadyShown';

  const scriptElement = document.currentScript || document.querySelector('script[src*="global-announcements.js"]');
  const scriptUrl = new URL(scriptElement?.src || 'global-announcements.js', document.baseURI);
  const basePath = scriptUrl.pathname.slice(0, scriptUrl.pathname.lastIndexOf('/') + 1);
  const announcementsUrl = `${basePath}announcements.json`;
  const dashboardUrl = `${basePath}dashboard.html`;
  const serviceWorkerUrl = `${basePath}service-worker.js`;

  const banner = document.createElement('div');
  banner.className = 'global-announcement';
  banner.innerHTML = `
    <div class="global-announcement-content">
      <div class="global-announcement-title" id="globalAnnouncementTitle">Aetheron Updates</div>
      <div class="global-announcement-text" id="globalAnnouncementText">Latest platform updates will appear here.</div>
    </div>
    <div class="global-announcement-actions">
      <a class="btn" id="globalAnnouncementLink" href="${dashboardUrl}">View Dashboard</a>
      <button class="btn global-announcement-dismiss" id="globalAnnouncementDismiss" type="button">Dismiss</button>
    </div>
  `;

  const pwaBanner = document.createElement('div');
  pwaBanner.className = 'pwa-install-banner';
  pwaBanner.innerHTML = `
    <div>
      <div class="pwa-install-title">Install Aetheron</div>
      <div class="pwa-install-text">Add the app for fast access and offline-ready browsing.</div>
    </div>
    <div class="pwa-install-actions">
      <button class="btn" id="pwaInstallButton" type="button">Install</button>
      <button class="btn btn-outline" id="pwaInstallDismiss" type="button">Later</button>
    </div>
  `;

  const toastContainer = document.createElement('div');
  toastContainer.className = 'global-toast-container';
  let deferredInstallPrompt = null;

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'global-toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 10);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function applyAnnouncement(data) {
    if (!data || !Array.isArray(data.announcements) || data.announcements.length === 0) return;
    const announcement = data.announcements[0];
    const title = banner.querySelector('#globalAnnouncementTitle');
    const text = banner.querySelector('#globalAnnouncementText');
    const link = banner.querySelector('#globalAnnouncementLink');
    const rawHref = announcement.linkHref || dashboardUrl;
    const resolvedHref = rawHref.startsWith('http') || rawHref.startsWith('/') ? rawHref : `${basePath}${rawHref}`;
    title.textContent = announcement.title || 'Aetheron Updates';
    text.textContent = announcement.text || 'Latest platform updates will appear here.';
    link.textContent = announcement.linkText || 'View Dashboard';
    link.setAttribute('href', resolvedHref);
  }

  function hydrateAnnouncements() {
    fetch(announcementsUrl).then((response) => response.ok ? response.json() : null).then(applyAnnouncement).catch(() => {});
  }

  function registerAnnouncementDismiss() {
    banner.querySelector('#globalAnnouncementDismiss').addEventListener('click', () => {
      localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, 'true');
      banner.remove();
    });
    if (localStorage.getItem(ANNOUNCEMENT_STORAGE_KEY) === 'true') banner.remove();
  }

  function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      document.body.appendChild(pwaBanner);
    });
    pwaBanner.querySelector('#pwaInstallButton').addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      pwaBanner.remove();
    });
    pwaBanner.querySelector('#pwaInstallDismiss').addEventListener('click', () => pwaBanner.remove());
  }

  function setupServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    const swSetting = document.querySelector('meta[name="aetheron-sw"]')?.getAttribute('content');
    if (swSetting === 'off') return;
    navigator.serviceWorker.register(serviceWorkerUrl).catch(() => {});
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'CACHE_READY' && localStorage.getItem(OFFLINE_TOAST_KEY) !== 'true') {
        localStorage.setItem(OFFLINE_TOAST_KEY, 'true');
        showToast('Offline ready. Content cached for fast reloads.');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    enforceDashboardBranding();
    document.body.prepend(banner);
    document.body.appendChild(toastContainer);
    registerAnnouncementDismiss();
    hydrateAnnouncements();
    setupInstallPrompt();
    setupServiceWorker();
  });
}

initGlobalAnnouncements();
