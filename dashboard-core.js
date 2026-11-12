(function initializeAetheronDashboardCore(global) {
  if (global.AetheronDashboardCore) {
    return;
  }

  const readyCallbacks = new Set();

  function onDomReady(key, callback) {
    if (typeof key !== 'string' || !key) {
      throw new TypeError('A DOM-ready callback key is required.');
    }
    if (typeof callback !== 'function') {
      throw new TypeError('A DOM-ready callback must be a function.');
    }
    if (readyCallbacks.has(key)) {
      return;
    }

    readyCallbacks.add(key);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  }

  const cache = Object.freeze({
    set(key, value, ttl = 60000) {
      const item = {
        value,
        expiry: Date.now() + ttl,
      };
      try {
        global.localStorage.setItem(`aeth_cache_${key}`, JSON.stringify(item));
      } catch (error) {
        global.console.warn('Cache storage failed:', error);
      }
    },

    get(key) {
      try {
        const itemString = global.localStorage.getItem(`aeth_cache_${key}`);
        if (!itemString) return null;

        const item = JSON.parse(itemString);
        if (Date.now() > item.expiry) {
          global.localStorage.removeItem(`aeth_cache_${key}`);
          return null;
        }
        return item.value;
      } catch {
        return null;
      }
    },

    clear() {
      Object.keys(global.localStorage).forEach((key) => {
        if (key.startsWith('aeth_cache_')) {
          global.localStorage.removeItem(key);
        }
      });
    },
  });

  global.AetheronDashboardCore = Object.freeze({ cache, onDomReady });
})(window);
