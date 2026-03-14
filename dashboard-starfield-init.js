// Starfield animation for dashboard background
(function () {
  const canvas = document.getElementById('starfield-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 1 + Math.random() * 2,
        speed: 0.2 + Math.random() * 0.5,
      });
    }
  }
  window.addEventListener('resize', resize);
  resize();
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let star of stars) {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, 2 * Math.PI);
      ctx.fillStyle = 'white';
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;
      star.y += star.speed;
      if (star.y > canvas.height) {
        star.x = Math.random() * canvas.width;
        star.y = 0;
        star.r = 1 + Math.random() * 2;
        star.speed = 0.2 + Math.random() * 0.5;
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
})();
