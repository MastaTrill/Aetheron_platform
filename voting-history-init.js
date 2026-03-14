// Extracted from voting-history.html for CSP compliance
function filterVotes(type) {
  const cards = document.querySelectorAll('.vote-card');
  document
    .querySelectorAll('.filter-btn')
    .forEach((btn) => btn.classList.remove('active'));
  event.target.classList.add('active');
  cards.forEach((card) => {
    card.style.display =
      type === 'all' || card.dataset.vote === type ? 'block' : 'none';
  });
}
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', function (event) {
      filterVotes(this.getAttribute('data-filter'));
      document
        .querySelectorAll('.filter-btn')
        .forEach((b) => b.classList.remove('active'));
      this.classList.add('active');
    });
  });
  // Default to 'all' on load
  filterVotes('all');
});
if (typeof gtag !== 'undefined') {
  gtag('event', 'page_view', {
    page_title: 'Voting History',
    page_location: window.location.href,
  });
}
