// Show skip link on focus for accessibility
document.addEventListener('DOMContentLoaded', function () {
  var skipLink = document.querySelector('.skip-link');
  skipLink.addEventListener('focus', function () {
    skipLink.style.left = '16px';
  });
  skipLink.addEventListener('blur', function () {
    skipLink.style.left = '-999px';
  });
});
