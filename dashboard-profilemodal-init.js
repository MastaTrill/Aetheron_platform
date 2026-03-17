// Profile modal close button logic
document.addEventListener('DOMContentLoaded', function () {
  var modal = document.getElementById('profileModal');
  var closeBtn = modal?.querySelector('.close-modal-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      modal.hidden = true;
    });
  }
});
