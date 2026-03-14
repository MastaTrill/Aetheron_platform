// Whitepaper expand/collapse and section navigation logic
document.addEventListener('DOMContentLoaded', function () {
  const toggleBtn = document.getElementById('whitepaperToggleBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      const content = document.getElementById('whitepaperContent');
      const expanded = this.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        content.style.display = 'none';
        this.textContent = 'Expand';
        this.setAttribute('aria-expanded', 'false');
      } else {
        content.style.display = '';
        this.textContent = 'Collapse';
        this.setAttribute('aria-expanded', 'true');
      }
    });
  }
});
// Section Navigation
document.addEventListener('DOMContentLoaded', function () {
  window.showWhitepaperSection = function (section) {
    const sections = [
      'summary',
      'tokenomics',
      'staking',
      'security',
      'roadmap',
    ];
    sections.forEach((s) => {
      document.getElementById('whitepaper-' + s).style.display =
        s === section ? '' : 'none';
    });
  };
});
