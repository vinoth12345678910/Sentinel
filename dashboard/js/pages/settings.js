(function () {
  'use strict';

  function esc(str) {
    if (str == null) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
  }

  window.SentinelPages = window.SentinelPages || {};

  window.SentinelPages.SettingsPage = function () {
    this.user = null;
  };

  window.SentinelPages.SettingsPage.prototype.render = function () {
    var header = SentinelUI.pageHeader('Settings', 'Manage your account and preferences');

    var profileSection = SentinelUI.card('Profile',
      '<div id="settings-profile">' + SentinelUI.loadingState() + '</div>'
    );

    var apiKeysSection = SentinelUI.card('API Keys',
      '<div id="settings-api-keys">' + this._renderApiKeys() + '</div>'
    );

    var githubSection = SentinelUI.card('GitHub Connection',
      '<div id="settings-github">' + SentinelUI.loadingState() + '</div>'
    );

    var prefsSection = SentinelUI.card('Preferences',
      '<div id="settings-preferences">' + this._renderPreferences() + '</div>'
    );

    return header +
      '<div style="display:flex;flex-direction:column;gap:var(--space-4);margin-top:var(--space-6)">' +
      profileSection +
      apiKeysSection +
      githubSection +
      prefsSection +
      '</div>';
  };

  window.SentinelPages.SettingsPage.prototype._renderApiKeys = function () {
    var token = SentinelStore.getState('token') || '';
    var masked = token ? token.slice(0, 8) + '••••••••' + token.slice(-4) : 'No API key available';

    return '<div style="display:flex;flex-direction:column;gap:var(--space-3)">' +
      '<p class="text-sm text-muted">Your personal API key for authenticating with the Sentinel API.</p>' +
      '<div style="display:flex;align-items:center;gap:var(--space-2)">' +
      '<code id="api-key-display" style="flex:1;padding:var(--space-2) var(--space-3);background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius);font-size:var(--text-sm);user-select:all">' +
      esc(masked) +
      '</code>' +
      '<button id="copy-api-key" class="btn btn-outline" data-tooltip="Copy API key">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
      'Copy</button>' +
      '</div>' +
      '<p class="text-xs text-muted">Keep your API key secret. Do not share it publicly.</p>' +
      '</div>';
  };

  window.SentinelPages.SettingsPage.prototype._renderPreferences = function () {
    return '<div style="display:flex;flex-direction:column;gap:var(--space-3)">' +
      '<div style="display:flex;align-items:center;justify-content:space-between">' +
      '<div>' +
      '<div style="font-size:var(--text-sm);font-weight:500">Theme</div>' +
      '<div class="text-xs text-muted">Dark mode is the default theme for Sentinel.</div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:var(--space-2)">' +
      '<span class="badge badge-info" style="opacity:0.7">Dark</span>' +
      '<label class="checkbox-label" style="opacity:0.5">' +
      '<input type="checkbox" checked disabled />' +
      'Dark Mode</label>' +
      '</div>' +
      '</div>' +
      '</div>';
  };

  window.SentinelPages.SettingsPage.prototype.onMount = function () {
    var self = this;

    var copyBtn = document.getElementById('copy-api-key');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var token = SentinelStore.getState('token') || '';
        if (!token) {
          SentinelToast.show('No API key to copy.', 'warning');
          return;
        }
        navigator.clipboard.writeText(token).then(function () {
          copyBtn.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><polyline points="20 6 9 17 4 12"/></svg>' +
            'Copied!';
          SentinelToast.show('API key copied to clipboard.', 'success');
          setTimeout(function () {
            copyBtn.innerHTML =
              '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
              'Copy';
          }, 2000);
        }).catch(function () {
          SentinelToast.show('Failed to copy to clipboard.', 'error');
        });
      });
    }

    SentinelAPI.getMe()
      .then(function (user) {
        self.user = user;
        self._renderProfile();
        self._renderGitHub();
      })
      .catch(function (err) {
        var profileContainer = document.getElementById('settings-profile');
        if (profileContainer) {
          profileContainer.innerHTML =
            '<div class="error-state" style="padding:var(--space-2)">' +
            '<p class="text-sm">' + esc(err.message || 'Failed to load profile.') + '</p>' +
            '</div>';
        }
      });
  };

  window.SentinelPages.SettingsPage.prototype._renderProfile = function () {
    var container = document.getElementById('settings-profile');
    if (!container) return;

    var user = this.user || {};
    var username = user.username || user.name || '—';
    var email = user.email || '—';
    var role = user.role || 'member';
    var createdAt = Sentinel.formatDate(user.created_at) || '—';

    var roleBadge = SentinelUI.badge(
      role.charAt(0).toUpperCase() + role.slice(1),
      role === 'admin' ? 'purple' : 'info'
    );

    var avatarHtml = SentinelUI.avatar(username, 48);

    container.innerHTML =
      '<div style="display:flex;align-items:center;gap:var(--space-4)">' +
      avatarHtml +
      '<div>' +
      '<div style="font-size:var(--text-base);font-weight:600">' + esc(username) + '</div>' +
      '<div class="text-sm text-muted">' + esc(email) + '</div>' +
      '<div style="margin-top:var(--space-1)">' + roleBadge + '</div>' +
      '</div>' +
      '</div>' +
      '<div style="margin-top:var(--space-3);padding-top:var(--space-3);border-top:1px solid var(--border);display:grid;grid-template-columns:1fr 1fr;gap:var(--space-2)">' +
      '<div>' +
      '<div class="text-xs text-muted">Username</div>' +
      '<div class="text-sm">' + esc(username) + '</div>' +
      '</div>' +
      '<div>' +
      '<div class="text-xs text-muted">Email</div>' +
      '<div class="text-sm">' + esc(email) + '</div>' +
      '</div>' +
      '<div>' +
      '<div class="text-xs text-muted">Role</div>' +
      '<div class="text-sm">' + roleBadge + '</div>' +
      '</div>' +
      '<div>' +
      '<div class="text-xs text-muted">Member Since</div>' +
      '<div class="text-sm">' + esc(createdAt) + '</div>' +
      '</div>' +
      '</div>';
  };

  window.SentinelPages.SettingsPage.prototype._renderGitHub = function () {
    var container = document.getElementById('settings-github');
    if (!container) return;

    var user = this.user || {};
    var githubLogin = user.github_login || user.github_id || '';

    if (githubLogin) {
      container.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:space-between">' +
        '<div style="display:flex;align-items:center;gap:var(--space-3)">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-secondary)"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>' +
        '<div>' +
        '<div style="font-weight:500;font-size:var(--text-sm)">GitHub Connected</div>' +
        '<div class="text-xs text-muted">' + esc(githubLogin) + '</div>' +
        '</div>' +
        '</div>' +
        '<span class="badge badge-success"><span class="badge-dot"></span>Connected</span>' +
        '</div>' +
        '<p class="text-xs text-muted" style="margin-top:var(--space-2)">Your GitHub account is linked to Sentinel. You can import repositories from GitHub.</p>';
    } else {
      container.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:space-between">' +
        '<div>' +
        '<div style="font-weight:500;font-size:var(--text-sm)">Not Connected</div>' +
        '<p class="text-xs text-muted" style="margin-top:2px">Connect your GitHub account to import repositories.</p>' +
        '</div>' +
        '<a href="/auth/github" class="btn btn-outline">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>' +
        'Connect GitHub' +
        '</a>' +
        '</div>';
    }
  };
})();
