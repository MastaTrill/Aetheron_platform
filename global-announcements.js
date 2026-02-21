export function initGlobalAnnouncements() {
  const ANNOUNCEMENT_STORAGE_KEY = 'aethAnnouncementDismissed';
  const OFFLINE_TOAST_KEY = 'aethOfflineReadyShown';

  const scriptElement = document.currentScript || document.querySelector('script[src*="global-announcements.js"]');
  const scriptSrc = scriptElement ? scriptElement.getAttribute('src') : 'global-announcements.js';
  const basePath = scriptSrc.replace('global-announcements.js', '');
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
    setTimeout(() => {
      toast.classList.add('visible');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function applyAnnouncement(data) {
    if (!data || !Array.isArray(data.announcements) || data.announcements.length === 0) {
      return;
    }

    const announcement = data.announcements[0];
    const title = banner.querySelector('#globalAnnouncementTitle');
    const text = banner.querySelector('#globalAnnouncementText');
    const link = banner.querySelector('#globalAnnouncementLink');

    const rawHref = announcement.linkHref || dashboardUrl;
    const resolvedHref = rawHref.startsWith('http') || rawHref.startsWith('/')
      ? rawHref
      : `${basePath}${rawHref}`;

    title.textContent = announcement.title || 'Aetheron Updates';
    text.textContent = announcement.text || 'Latest platform updates will appear here.';
    link.textContent = announcement.linkText || 'View Dashboard';
    link.setAttribute('href', resolvedHref);
  }

  function hydrateAnnouncements() {
    fetch(announcementsUrl)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => applyAnnouncement(data))
      .catch(() => {});
  }

  function registerAnnouncementDismiss() {
    const dismissButton = banner.querySelector('#globalAnnouncementDismiss');
    dismissButton.addEventListener('click', () => {
      localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, 'true');
      banner.remove();
    });

    const dismissed = localStorage.getItem(ANNOUNCEMENT_STORAGE_KEY);
    if (dismissed === 'true') {
      banner.remove();
    }
  }

  function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      document.body.appendChild(pwaBanner);
    });

    const installButton = pwaBanner.querySelector('#pwaInstallButton');
    const dismissButton = pwaBanner.querySelector('#pwaInstallDismiss');

    installButton.addEventListener('click', async () => {
      if (!deferredInstallPrompt) {
        return;
      }
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      pwaBanner.remove();
    });

    dismissButton.addEventListener('click', () => {
      pwaBanner.remove();
    });
  }

  function setupServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker.register(serviceWorkerUrl).catch(() => {});

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'CACHE_READY') {
        if (localStorage.getItem(OFFLINE_TOAST_KEY) !== 'true') {
          localStorage.setItem(OFFLINE_TOAST_KEY, 'true');
          showToast('Offline ready. Content cached for fast reloads.');
        }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.body.prepend(banner);
    document.body.appendChild(toastContainer);
    registerAnnouncementDismiss();
    hydrateAnnouncements();
    setupInstallPrompt();
    setupServiceWorker();
  });
}

initGlobalAnnouncements();
