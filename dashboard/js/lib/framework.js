(function () {
  'use strict';

  // ================================================================
  // Helpers
  // ================================================================

  function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function timeAgo(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const now = Date.now();
    const diffMs = now - d.getTime();
    const absDiff = Math.abs(diffMs);
    const seconds = Math.floor(absDiff / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return seconds + 's ago';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + 'm ago';
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + 'h ago';
    const days = Math.floor(hours / 24);
    if (days < 30) return days + 'd ago';
    const months = Math.floor(days / 30);
    if (months < 12) return months + 'mo ago';
    const years = Math.floor(months / 12);
    return years + 'y ago';
  }

  function formatBytes(bytes) {
    if (bytes == null || isNaN(bytes) || bytes < 0) return '0 B';
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + units[i];
  }

  function truncate(str, len) {
    if (!str) return '';
    if (str.length <= len) return str;
    return str.slice(0, len) + '\u2026';
  }

  // ================================================================
  // Observable Store
  // ================================================================

  const INITIAL_STATE = {
    user: null,
    token: null,
    apps: [],
    projects: [],
    deployments: [],
    loading: false,
    error: null
  };

  class Store {
    constructor(initial) {
      this._state = {};
      this._subs = {};
      this._clearAndSet(initial);
    }

    _clearAndSet(initial) {
      this._state = {};
      this._subs = {};
      if (initial) {
        Object.keys(initial).forEach(function (k) {
          this._state[k] = initial[k];
        }, this);
      }
    }

    getState(key) {
      return this._state[key];
    }

    setState(key, value) {
      this._state[key] = value;
      var cbs = this._subs[key];
      if (cbs) {
        for (var i = 0; i < cbs.length; i++) {
          cbs[i](value);
        }
      }
    }

    subscribe(key, callback) {
      if (!this._subs[key]) {
        this._subs[key] = [];
      }
      this._subs[key].push(callback);
      var self = this;
      return function () {
        var cbs = self._subs[key];
        if (cbs) {
          self._subs[key] = cbs.filter(function (cb) { return cb !== callback; });
        }
      };
    }

    clear() {
      this._clearAndSet(null);
    }
  }

  var store = new Store(INITIAL_STATE);

  // ================================================================
  // Toast System
  // ================================================================

  var toastIcons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  };

  var toast = {
    _getContainer: function () {
      var el = document.getElementById('toast-container');
      if (!el) {
        el = document.createElement('div');
        el.id = 'toast-container';
        el.className = 'toast-container';
        document.body.appendChild(el);
      }
      return el;
    },

    show: function (message, type) {
      type = type || 'info';
      var container = this._getContainer();
      var toastEl = document.createElement('div');
      toastEl.className = 'toast toast-' + type;

      var icon = toastIcons[type] || toastIcons.info;

      toastEl.innerHTML =
        icon +
        '<span class="toast-message">' + escapeHtml(message) + '</span>' +
        '<button class="toast-close" aria-label="Close">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">' +
            '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
          '</svg>' +
        '</button>';

      container.appendChild(toastEl);

      var closeBtn = toastEl.querySelector('.toast-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          if (toastEl.parentElement) toastEl.remove();
        });
      }

      var dismissId = setTimeout(function () {
        if (!toastEl.parentElement) return;
        toastEl.style.transition = 'opacity 200ms ease, transform 200ms ease';
        toastEl.style.opacity = '0';
        toastEl.style.transform = 'translateX(20px)';
        setTimeout(function () {
          if (toastEl.parentElement) toastEl.remove();
        }, 200);
      }, 4000);

      toastEl._dismissId = dismissId;
    }
  };

  // ================================================================
  // Component System
  // ================================================================

  var currentComponent = null;
  var currentContainer = null;
  var delegatedEvents = [];

  function removeDelegatedEvents() {
    for (var i = 0; i < delegatedEvents.length; i++) {
      var entry = delegatedEvents[i];
      document.removeEventListener(entry.eventType, entry.handler);
    }
    delegatedEvents = [];
  }

  function cleanup() {
    if (currentComponent && typeof currentComponent.onUnmount === 'function') {
      currentComponent.onUnmount();
    }
    currentComponent = null;
    currentContainer = null;
    removeDelegatedEvents();
  }

  var Sentinel = {

    // ── Rendering ──

    render: function (containerId, html) {
      var container = document.getElementById(containerId);
      if (!container) {
        console.warn('Sentinel.render: container #' + containerId + ' not found');
        return;
      }
      container.innerHTML = html;
    },

    mount: function (component, containerId) {
      cleanup();
      var container = document.getElementById(containerId);
      if (!container) {
        console.warn('Sentinel.mount: container #' + containerId + ' not found');
        return;
      }
      var html = typeof component.render === 'function' ? component.render() : '';
      container.innerHTML = html;
      currentComponent = component;
      currentContainer = container;
      if (typeof component.onMount === 'function') {
        component.onMount();
      }
    },

    // ── Event Delegation ──

    delegateEvent: function (eventType, selector, handler) {
      var delegatedHandler = function (event) {
        var target = event.target.closest(selector);
        if (target) {
          handler.call(target, event, target);
        }
      };
      document.addEventListener(eventType, delegatedHandler);
      delegatedEvents.push({
        eventType: eventType,
        handler: delegatedHandler
      });
    },

    // ── Loading State ──

    showLoading: function (containerId) {
      var container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML =
        '<div class="loading-state">' +
          '<div class="spinner"></div>' +
        '</div>';
    },

    hideLoading: function (containerId) {
      var container = document.getElementById(containerId);
      if (!container) return;
      var loading = container.querySelector('.loading-state');
      if (loading) loading.remove();
    },

    // ── Error Display ──

    showError: function (containerId, message) {
      var container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML =
        '<div class="error-state">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<circle cx="12" cy="12" r="10"/>' +
            '<line x1="12" y1="8" x2="12" y2="12"/>' +
            '<line x1="12" y1="16" x2="12.01" y2="16"/>' +
          '</svg>' +
          '<h3>Something went wrong</h3>' +
          '<p>' + escapeHtml(message) + '</p>' +
          '<button class="btn btn-primary" data-retry>Try Again</button>' +
        '</div>';
      var retryBtn = container.querySelector('[data-retry]');
      if (retryBtn) {
        retryBtn.addEventListener('click', function () {
          window.location.reload();
        });
      }
    },

    // ── Helper Exports ──

    escapeHtml: escapeHtml,
    formatDate: formatDate,
    timeAgo: timeAgo,
    formatBytes: formatBytes,
    truncate: truncate
  };

  // Expose cleanup for router integration
  Sentinel._cleanup = cleanup;

  // ================================================================
  // Router
  // ================================================================

  function parseRoutePattern(pattern) {
    var paramNames = [];
    var regexSrc = pattern.replace(/:([^/]+)/g, function (_, name) {
      paramNames.push(name);
      return '([^/]+)';
    });
    return {
      pattern: pattern,
      paramNames: paramNames,
      regex: new RegExp('^' + regexSrc + '$')
    };
  }

  var router = {
    _entries: [],
    _currentRoute: null,
    _containerId: 'app-content',

    init: function (routes, containerId) {
      if (containerId) this._containerId = containerId;
      var self = this;
      this._entries = Object.keys(routes).map(function (pattern) {
        var entry = parseRoutePattern(pattern);
        entry.Component = routes[pattern];
        return entry;
      });

      window.addEventListener('hashchange', function () {
        self._handleRoute();
      });

      if (!window.location.hash || window.location.hash === '#') {
        this.navigate('/');
      } else {
        this._handleRoute();
      }
    },

    _handleRoute: function () {
      var hash = window.location.hash;
      var path = hash ? hash.slice(1) : '/';
      if (path.charAt(0) !== '/') path = '/' + path;

      for (var i = 0; i < this._entries.length; i++) {
        var entry = this._entries[i];
        var match = path.match(entry.regex);
        if (match) {
          var params = {};
          for (var j = 0; j < entry.paramNames.length; j++) {
            params[entry.paramNames[j]] = decodeURIComponent(match[j + 1]);
          }
          this._currentRoute = {
            path: path,
            pattern: entry.pattern,
            params: params,
            Component: entry.Component
          };
          var component = new entry.Component();
          Sentinel.mount(component, this._containerId);
          return;
        }
      }

      // No match — redirect home
      this.navigate('/');
    },

    navigate: function (path) {
      if (path.charAt(0) !== '/') path = '/' + path;
      window.location.hash = '#' + path;
    },

    getCurrentRoute: function () {
      return this._currentRoute
        ? {
            path: this._currentRoute.path,
            pattern: this._currentRoute.pattern,
            params: Object.assign({}, this._currentRoute.params),
            Component: this._currentRoute.Component
          }
        : null;
    },

    getParam: function (name) {
      return this._currentRoute && this._currentRoute.params
        ? this._currentRoute.params[name] || null
        : null;
    }
  };

  // ================================================================
  // Public API
  // ================================================================

  window.Sentinel = Sentinel;
  window.SentinelStore = store;
  window.SentinelToast = toast;
  window.SentinelRouter = router;

})();
