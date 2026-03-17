function showWhitepaperSection(section) {
  const sections = ['summary', 'tokenomics', 'staking', 'security', 'roadmap'];

  sections.forEach((key) => {
    const panel = document.getElementById(`whitepaper-${key}`);
    if (!panel) {
      return;
    }

    panel.style.display = key === section ? '' : 'none';
  });
}

function initWhitepaperControls() {
  const toggleBtn = document.getElementById('toggleWhitepaperBtn');
  const content = document.getElementById('whitepaperContent');

  if (toggleBtn && content) {
    toggleBtn.addEventListener('click', () => {
      const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      content.style.display = expanded ? 'none' : '';
      toggleBtn.textContent = expanded ? 'Expand' : 'Collapse';
      toggleBtn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    });
  }

  showWhitepaperSection('summary');
}

window.showWhitepaperSection = showWhitepaperSection;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWhitepaperControls, {
    once: true,
  });
} else {
  initWhitepaperControls();
}
