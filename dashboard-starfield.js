// dashboard-starfield.js
// Modern animated starfield for #starfield-canvas

document.addEventListener('DOMContentLoaded', function () {
  const canvas = document.getElementById('starfield-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = window.innerWidth;
  let height = window.innerHeight;

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Star config
  let STAR_COUNT = Math.floor((width * height) / 3500);
  let stars = [];
  function createStars() {
    stars = [];
    STAR_COUNT = Math.floor((width * height) / 3500);
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.2 + 0.3,
        speed: Math.random() * 0.15 + 0.05,
        twinkle: Math.random() * Math.PI * 2,
        color: `rgba(255,255,255,${0.7 + Math.random() * 0.3})`,
      });
    }
  }
  createStars();

  window.addEventListener('resize', () => {
    resizeCanvas();
    createStars();
  });

  function drawStars() {
    ctx.clearRect(0, 0, width, height);
    for (const star of stars) {
      const twinkle = 0.7 + 0.3 * Math.sin(star.twinkle);
      ctx.save();
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r * twinkle, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 8 * twinkle;
      ctx.fill();
      ctx.closePath();
      ctx.restore();
      star.twinkle += star.speed * 0.05;
    }
  }

  function animate() {
    drawStars();
    requestAnimationFrame(animate);
  }

  animate();
});
