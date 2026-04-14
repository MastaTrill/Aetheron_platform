import { clear, el, button, append } from './safe-dom.js';

export function renderNotifications(container, notifications = []) {
  if (!container) return;
  clear(container);
  notifications.forEach((n) => {
    const card = el('div', { className: `notification ${n.type || 'info'}` });
    const header = el('div', { className: 'notification-header' });
    const title = el('div', { className: 'notification-title', text: n.title || '' });
    const close = button('×', { className: 'notification-close' });
    append(header, title, close);
    append(card, header, el('div', { className: 'notification-message', text: n.message || '' }));
    container.appendChild(card);
  });
}

export function renderSearchResults(container, results = [], onSelect) {
  if (!container) return;
  clear(container);
  if (!results.length) {
    container.appendChild(el('div', { className: 'search-result-item', text: 'No results found' }));
    return;
  }
  results.forEach((result) => {
    const item = el('div', { className: 'search-result-item' });
    item.addEventListener('click', () => onSelect?.(result));
    append(item,
      el('strong', { text: result.title || '' }),
      el('small', { text: result.type || '', attrs: { style: 'color: var(--text-muted);' } })
    );
    container.appendChild(item);
  });
}

export function renderBreadcrumbs(container, breadcrumbs = [], onNavigate) {
  if (!container) return;
  clear(container);
  breadcrumbs.forEach((crumb, index) => {
    const item = el('span', { className: `breadcrumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}`, text: crumb.label || '' });
    if (index < breadcrumbs.length - 1) item.addEventListener('click', () => onNavigate?.(crumb));
    container.appendChild(item);
    if (index < breadcrumbs.length - 1) {
      container.appendChild(el('span', { className: 'breadcrumb-separator', text: '/' }));
    }
  });
}

export function renderFavorites(container, favorites = [], onOpen, onRemove) {
  if (!container) return;
  clear(container);
  favorites.forEach((fav) => {
    const item = el('div', { className: 'favorite-item' });
    item.addEventListener('click', () => onOpen?.(fav));
    const removeBtn = button('', { className: 'btn-icon', title: 'Remove from favorites' });
    removeBtn.appendChild(el('i', { className: 'fas fa-times' }));
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onRemove?.(fav);
    });
    append(item,
      el('span', { className: 'favorite-icon', text: fav.icon || '⭐' }),
      el('span', { className: 'favorite-label', text: fav.label || '' }),
      removeBtn
    );
    container.appendChild(item);
  });
}

export function renderCommandResults(container, commands = [], onSelect) {
  if (!container) return;
  clear(container);
  commands.forEach((cmd, index) => {
    const item = el('div', { className: `command-item ${index === 0 ? 'selected' : ''}`, attrs: { 'data-command': cmd.id || '' } });
    item.addEventListener('click', () => onSelect?.(cmd, index));
    append(item,
      el('span', { className: 'command-icon', text: cmd.icon || '' }),
      el('span', { className: 'command-label', text: cmd.label || '' })
    );
    container.appendChild(item);
  });
}

export function renderChatMessage(container, sender, message, timeText) {
  if (!container) return;
  const msg = el('div', { className: `chat-message ${sender}` });
  append(msg,
    el('div', { className: 'message-content', text: message || '' }),
    el('div', { className: 'message-time', text: timeText || '' })
  );
  container.appendChild(msg);
}
