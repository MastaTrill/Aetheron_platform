// Start Tour button
// Requires window.dashboard.startTour to be defined

document.addEventListener('DOMContentLoaded', function () {
  // Start Tour button
  const tourBtn = document.getElementById('startTourBtn');
  if (
    tourBtn &&
    window.dashboard &&
    typeof window.dashboard.startTour === 'function'
  ) {
    tourBtn.addEventListener('click', function () {
      window.dashboard.startTour();
    });
  }
  // Help Center modal logic
  const helpBtn = document.getElementById('openHelpCenterBtn');
  const helpModal = document.getElementById('helpCenterModal');
  const closeHelp = document.getElementById('closeHelpCenterModal');
  if (helpBtn && helpModal) {
    helpBtn.addEventListener('click', function () {
      helpModal.style.display = 'block';
    });
  }
  if (closeHelp && helpModal) {
    closeHelp.addEventListener('click', function () {
      helpModal.style.display = 'none';
    });
  }
  window.addEventListener('click', function (event) {
    if (event.target === helpModal) {
      helpModal.style.display = 'none';
    }
  });
});
