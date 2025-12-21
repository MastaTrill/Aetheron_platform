let currentSize = 256;

document.addEventListener('DOMContentLoaded', function() {
    // Attach event listeners to size buttons
    const sizeButtons = document.querySelectorAll('.size-buttons button');
    const sizes = [200, 256, 512];
    sizeButtons.forEach((btn, idx) => {
        btn.addEventListener('click', () => generateLogo(sizes[idx]));
    });
    // Attach event listeners to download buttons
    document.getElementById('downloadLogoBtn').addEventListener('click', downloadLogo);
    document.getElementById('downloadBannerBtn').addEventListener('click', downloadBanner);
    // Generate default logo
    generateLogo(256);
});

function generateLogo(size) {
    currentSize = size;
    const canvas = document.getElementById('logoCanvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Clear canvas with dark background
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, size, size);

    const centerX = size / 2;
    const centerY = size / 2;
    const gold = '#D4AF37';
    const goldGradient = ctx.createLinearGradient(0, 0, 0, size);
    goldGradient.addColorStop(0, '#FFD700');
    goldGradient.addColorStop(0.5, '#D4AF37');
    goldGradient.addColorStop(1, '#B8860B');

    // Add starfield background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const starSize = Math.random() * 2;
        ctx.beginPath();
        ctx.arc(x, y, starSize, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw orbital rings
    const orbitRadius1 = size * 0.35;
    const orbitRadius2 = size * 0.28;
    ctx.strokeStyle = gold;
    ctx.lineWidth = size * 0.012;
    // Outer elliptical orbit (tilted)
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(Math.PI / 8);
    ctx.beginPath();
    ctx.ellipse(0, 0, orbitRadius1, orbitRadius1 * 0.3, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // Inner elliptical orbit (opposite tilt)
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-Math.PI / 8);
    ctx.beginPath();
    ctx.ellipse(0, 0, orbitRadius2, orbitRadius2 * 0.3, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Draw orbital dots/planets
    ctx.fillStyle = gold;
    // Top right dot
    ctx.beginPath();
    ctx.arc(centerX + orbitRadius1 * 0.8, centerY - orbitRadius1 * 0.25, size * 0.025, 0, Math.PI * 2);
    ctx.fill();
    // Bottom left dot
    ctx.beginPath();
    ctx.arc(centerX - orbitRadius1 * 0.7, centerY + orbitRadius1 * 0.22, size * 0.025, 0, Math.PI * 2);
    ctx.fill();

    // Draw main upward arrow/triangle
    const arrowHeight = size * 0.25;
    const arrowWidth = size * 0.15;
    ctx.fillStyle = goldGradient;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - arrowHeight * 0.8); // Top point
    ctx.lineTo(centerX - arrowWidth / 2, centerY); // Bottom left
    ctx.lineTo(centerX + arrowWidth / 2, centerY); // Bottom right
    ctx.closePath();
    ctx.fill();

    // Draw downward inner arrow (mirrored)
    const innerArrowHeight = size * 0.18;
    const innerArrowWidth = size * 0.1;
    ctx.fillStyle = '#0a0e1a'; // Dark fill to create cutout effect
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + innerArrowHeight * 0.8); // Bottom point
    ctx.lineTo(centerX - innerArrowWidth / 2, centerY - innerArrowHeight * 0.2); // Top left
    ctx.lineTo(centerX + innerArrowWidth / 2, centerY - innerArrowHeight * 0.2); // Top right
    ctx.closePath();
    ctx.fill();
    // Add gold outline to inner arrow
    ctx.strokeStyle = gold;
    ctx.lineWidth = size * 0.008;
    ctx.stroke();

    // Draw additional decorative triangles
    ctx.fillStyle = goldGradient;
    // Top small triangle
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - arrowHeight * 1.1);
    ctx.lineTo(centerX - arrowWidth * 0.25, centerY - arrowHeight * 0.85);
    ctx.lineTo(centerX + arrowWidth * 0.25, centerY - arrowHeight * 0.85);
    ctx.closePath();
    ctx.fill();
    // Bottom decorative element
    const bottomY = centerY + arrowHeight * 0.85;
    ctx.beginPath();
    ctx.moveTo(centerX, bottomY + size * 0.08);
    ctx.lineTo(centerX - size * 0.035, bottomY);
    ctx.lineTo(centerX + size * 0.035, bottomY);
    ctx.closePath();
    ctx.fill();

    document.querySelector('.logo-container').style.width = size + 'px';
    document.querySelector('.logo-container').style.height = size + 'px';
    document.querySelector('.logo-container').style.background = '#0a0e1a';
}

function downloadLogo() {
    const canvas = document.getElementById('logoCanvas');
    const link = document.createElement('a');
    link.download = `aetheron-logo-${currentSize}x${currentSize}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function downloadBanner() {
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 1500;
    bannerCanvas.height = 500;
    const ctx = bannerCanvas.getContext('2d');
    // Dark starry background
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, 1500, 500);
    // Add starfield
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * 1500;
        const y = Math.random() * 500;
        const starSize = Math.random() * 2;
        ctx.beginPath();
        ctx.arc(x, y, starSize, 0, Math.PI * 2);
        ctx.fill();
    }
    // Add gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, 1500, 500);
    gradient.addColorStop(0, 'rgba(10, 14, 26, 0)');
    gradient.addColorStop(1, 'rgba(212, 175, 55, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1500, 500);
    // Draw main text in gold
    const goldGradient = ctx.createLinearGradient(0, 200, 0, 300);
    goldGradient.addColorStop(0, '#FFD700');
    goldGradient.addColorStop(0.5, '#D4AF37');
    goldGradient.addColorStop(1, '#B8860B');
    ctx.fillStyle = goldGradient;
    ctx.font = 'bold 140px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('AETHERON', 750, 250);
    // Draw subtitle
    ctx.fillStyle = '#D4AF37';
    ctx.font = '42px Arial';
    ctx.fillText('DeFi Staking Platform on Polygon', 750, 320);
    // Draw features
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = 'rgba(212, 175, 55, 0.9)';
    ctx.textAlign = 'left';
    ctx.fillText('⬢ Up to 25% APY', 220, 420);
    ctx.fillText('⬢ Live Dashboard', 580, 420);
    ctx.fillText('⬢ Low Fees', 940, 420);
    // Download
    const link = document.createElement('a');
    link.download = 'aetheron-twitter-banner-1500x500.png';
    link.href = bannerCanvas.toDataURL('image/png');
    link.click();
}
