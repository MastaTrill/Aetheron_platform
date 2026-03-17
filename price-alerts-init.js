async function updateCurrentPrice() {
  const e = await priceAlertManager.getCurrentPrice();
  if (e)
    document.getElementById('currentPrice').textContent = `$${e.toFixed(8)}`;
}
function createAlert(e) {
  e.preventDefault();
  const t = parseFloat(document.getElementById('targetPrice').value),
    n = document.getElementById('direction').value,
    r = document.getElementById('notification').value;
  try {
    priceAlertManager.createAlert(t, n, r);
    document.getElementById('alertForm').reset();
    showSuccessMessage('Alert created successfully!');
    displayAlerts();
  } catch (e) {
    alert('Error creating alert: ' + e.message);
  }
}
function displayAlerts() {
  const e = priceAlertManager.getActiveAlerts(),
    t = priceAlertManager.getTriggeredAlerts();
  document.getElementById('activeCount').textContent = e.length;
  document.getElementById('triggeredCount').textContent = t.length;
  const n = document.getElementById('activeAlerts');
  if (e.length === 0) {
    n.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-bell-slash"></i>
        <p>No active alerts. Create one above to get started!</p>
      </div>
    `;
  } else {
    n.innerHTML = e
      .map(
        (e) => `
          <div class="alert-item">
            <div class="alert-info">
              <div class="alert-price">$${e.targetPrice.toFixed(8)}</div>
              <div class="alert-direction">
                Alert when price is <strong>${e.direction}</strong> target
                <span style="margin-left: 10px; color: var(--text-muted);">
                  <i class="fas fa-clock"></i> ${new Date(e.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
            <div class="alert-actions">
              <button class="alert-delete-btn" onclick="deleteAlert(${e.id})">
                <i class="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
        `,
      )
      .join('');
  }
  const r = document.getElementById('triggeredSection');
  if (t.length > 0) {
    r.style.display = 'block';
    document.getElementById('triggeredAlerts').innerHTML = t
      .map(
        (e) => `
          <div class="alert-item triggered">
            <div class="alert-info">
              <div class="alert-price">$${e.targetPrice.toFixed(8)}</div>
              <div class="alert-direction">
                <i class="fas fa-check-circle" style="color: var(--accent-green);"></i>
                Triggered at $${e.triggeredPrice?.toFixed(8) || 'N/A'}
                <span style="margin-left: 10px; color: var(--text-muted);">
                  <i class="fas fa-clock"></i> ${new Date(e.triggeredAt).toLocaleString()}
                </span>
              </div>
            </div>
            <div class="alert-actions">
              <button class="alert-delete-btn" onclick="deleteAlert(${e.id})">
                <i class="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
        `,
      )
      .join('');
  } else {
    r.style.display = 'none';
  }
}
function deleteAlert(e) {
  if (confirm('Delete this alert?')) {
    priceAlertManager.deleteAlert(e);
    displayAlerts();
    showSuccessMessage('Alert deleted');
  }
}
async function requestNotifications() {
  const e = await priceAlertManager.requestNotificationPermission();
  if (e === 'granted') showSuccessMessage('Notifications enabled!');
  else if (e === 'denied')
    alert(
      'Notifications are blocked. Please enable them in your browser settings.',
    );
}
function clearTriggeredAlerts() {
  if (confirm('Clear all triggered alerts?')) {
    priceAlertManager.clearTriggeredAlerts();
    displayAlerts();
    showSuccessMessage('Triggered alerts cleared');
  }
}
function showSuccessMessage(e) {
  const t = document.createElement('div');
  t.className = 'price-alert-notification';
  t.innerHTML = `
    <div class="alert-icon">✅</div>
    <div class="alert-content">
      <div class="alert-title">Success</div>
      <div class="alert-message">${e}</div>
    </div>
    <button class="alert-close" onclick="this.parentElement.remove()">×</button>
  `;
  document.body.appendChild(t);
  setTimeout(() => {
    t.classList.add('alert-fade-out');
    setTimeout(() => t.remove(), 300);
  }, 3e3);
}
updateCurrentPrice();
displayAlerts();
setInterval(updateCurrentPrice, 3e4);
setInterval(displayAlerts, 5e3);
