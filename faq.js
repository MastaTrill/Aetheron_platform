// faq.js - extracted from inline script in faq.html

document.addEventListener('DOMContentLoaded', function () {
  // FAQ item toggle
  document.querySelectorAll('.faq-item').forEach((e) => {
    const q = e.querySelector('.faq-question');
    if (q) {
      q.addEventListener('click', () => {
        e.classList.toggle('open');
      });
    }
  });

  // Tab switching
  document.querySelectorAll('.tab').forEach((e) => {
    e.addEventListener('click', () => {
      const t = e.dataset.category;
      document
        .querySelectorAll('.tab')
        .forEach((e) => e.classList.remove('active'));
      e.classList.add('active');
      document.querySelectorAll('.faq-section').forEach((e) => {
        e.classList.remove('active');
        if (e.dataset.category === t) e.classList.add('active');
      });
    });
  });

  // FAQ search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const t = e.target.value.toLowerCase();
      document.querySelectorAll('.faq-item').forEach((e) => {
        const r =
          e.querySelector('.faq-question')?.textContent.toLowerCase() || '';
        const o =
          e.querySelector('.faq-answer')?.textContent.toLowerCase() || '';
        e.style.display = r.includes(t) || o.includes(t) ? 'block' : 'none';
      });
    });
  }

  // Service worker registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((e) => console.log('ServiceWorker registered:', e.scope))
        .catch((e) => console.log('ServiceWorker registration failed:', e));
    });
  }
});
