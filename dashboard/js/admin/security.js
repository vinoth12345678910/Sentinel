(function () {
  'use strict';

  function esc(str) {
    if (str == null) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
  }

  window.SentinelPages = window.SentinelPages || {};

  window.SentinelPages.AdminSecurityPage = function () {};

  window.SentinelPages.AdminSecurityPage.prototype.render = function () {
    var header =
      '<div class="admin-section-title" style="display:flex;align-items:center;margin-bottom:var(--space-5)">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:var(--space-2)">' +
          '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>' +
        '</svg>' +
        '<h2 style="margin:0">Security</h2>' +
      '</div>';

    var apiKeyCard = SentinelUI.card('API Key',
      '<div id="security-api-key">' + SentinelUI.loadingState() + '</div>'
    );

    var webhookCard = SentinelUI.card('Webhook Status',
      '<div id="security-webhook">' + SentinelUI.loadingState() + '</div>'
    );

    var authCard = SentinelUI.card('Authentication Methods',
      '<div id="security-auth">' + SentinelUI.loadingState() + '</div>'
    );

    var activityCard = SentinelUI.card('Recent Authentication Activity',
      '<div id="security-activity">' + SentinelUI.loadingState() + '</div>'
    );

    return header + apiKeyCard + webhookCard + authCard + activityCard;
  };

  window.SentinelPages.AdminSecurityPage.prototype.onMount = function () {
    var self = this;

    SentinelAPI.getHealth()
      .then(function (health) {
        self._renderApiKey(health);
        self._renderWebhookStatus(health);
        self._renderAuthMethods(health);
        self._renderAuthActivity(health);
      })
      .catch(function () {
        var ids = ['security-api-key', 'security-webhook', 'security-auth', 'security-activity'];
        for (var i = 0; i < ids.length; i++) {
          var el = document.getElementById(ids[i]);
          if (el) {
            el.innerHTML = SentinelUI.emptyState('Unavailable', 'Could not load security information.');
          }
        }
      });
  };

  window.SentinelPages.AdminSecurityPage.prototype._renderApiKey = function (health) {
    var container = document.getElementById('security-api-key');
    if (!container) return;

    var apiKey = health.api_key || health.master_key || health.SENTINEL_API_KEY || 'sntl_••••••••••••••••';
    var masked = apiKey.length > 8
      ? apiKey.slice(0, 4) + '••••••••' + apiKey.slice(-4)
      : 'sntl_••••••••••••••••';

    container.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between">' +
        '<div>' +
          '<div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--space-1)">Master API Key (SENTINEL_API_KEY)</div>' +
          '<code style="font-size:var(--text-sm);background:var(--bg-tertiary);padding:var(--space-1) var(--space-2);border-radius:var(--radius);user-select:all" id="api-key-display">' + esc(masked) + '</code>' +
        '</div>' +
        '<button class="btn btn-ghost btn-sm" id="copy-api-key-btn" data-full-key="' + esc(apiKey) + '">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:var(--space-1)">' +
            '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>' +
          '</svg>' +
          'Copy' +
        '</button>' +
      '</div>';

    var copyBtn = document.getElementById('copy-api-key-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var fullKey = this.getAttribute('data-full-key');
        navigator.clipboard.writeText(fullKey).then(function () {
          copyBtn.innerHTML = 'Copied!';
          setTimeout(function () {
            copyBtn.innerHTML =
              '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:var(--space-1)">' +
                '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>' +
              '</svg>' +
              'Copy';
          }, 2000);
        }).catch(function () {
          SentinelToast.show('Failed to copy API key.', 'error');
        });
      });
    }
  };

  window.SentinelPages.AdminSecurityPage.prototype._renderWebhookStatus = function (health) {
    var container = document.getElementById('security-webhook');
    if (!container) return;

    var webhooks = health.webhooks || health.webhook_status || null;
    var enabled = webhooks && webhooks.enabled;

    var statusBadge = enabled
      ? SentinelUI.badge('Enabled', 'success')
      : SentinelUI.badge('Disabled', 'neutral');

    var webhookUrl = (webhooks && webhooks.url) || 'Not configured';

    container.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:var(--space-3)">' +
        '<div style="display:flex;align-items:center;justify-content:space-between">' +
          '<span style="font-size:var(--text-sm)">Webhooks</span>' +
          statusBadge +
        '</div>' +
        '<div>' +
          '<div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--space-1)">Webhook URL</div>' +
          '<code style="font-size:var(--text-sm);background:var(--bg-tertiary);padding:var(--space-1) var(--space-2);border-radius:var(--radius)">' + esc(webhookUrl) + '</code>' +
        '</div>' +
        (webhooks && webhooks.last_sent
          ? '<div>' +
              '<div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--space-1)">Last Sent</div>' +
              '<div style="font-size:var(--text-sm)">' + esc(Sentinel.formatDate(webhooks.last_sent)) + '</div>' +
            '</div>'
          : '') +
      '</div>';
  };

  window.SentinelPages.AdminSecurityPage.prototype._renderAuthMethods = function (health) {
    var container = document.getElementById('security-auth');
    if (!container) return;

    var methods = health.auth_methods || health.authentication || null;
    var hasLocal = !methods || methods.local !== false;
    var hasOAuth = methods && methods.oauth;
    var hasSso = methods && methods.sso;

    var html = '<div style="display:flex;flex-direction:column;gap:var(--space-2)">';
    html +=
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-2) 0;border-bottom:1px solid var(--border-color, #eee)">' +
        '<span style="font-size:var(--text-sm)">Local (Username/Password)</span>' +
        SentinelUI.badge(hasLocal ? 'Active' : 'Inactive', hasLocal ? 'success' : 'neutral') +
      '</div>';
    html +=
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-2) 0;border-bottom:1px solid var(--border-color, #eee)">' +
        '<span style="font-size:var(--text-sm)">OAuth</span>' +
        SentinelUI.badge(hasOAuth ? 'Active' : 'Inactive', hasOAuth ? 'success' : 'neutral') +
      '</div>';
    html +=
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-2) 0">' +
        '<span style="font-size:var(--text-sm)">SSO / SAML</span>' +
        SentinelUI.badge(hasSso ? 'Active' : 'Inactive', hasSso ? 'success' : 'neutral') +
      '</div>';
    html += '</div>';
    container.innerHTML = html;
  };

  window.SentinelPages.AdminSecurityPage.prototype._renderAuthActivity = function (health) {
    var container = document.getElementById('security-activity');
    if (!container) return;

    var recentLogins = health.recent_logins || health.recent_auth || null;

    if (!recentLogins || !Array.isArray(recentLogins) || recentLogins.length === 0) {
      container.innerHTML = SentinelUI.emptyState('No Activity', 'No recent authentication activity.');
      return;
    }

    var headers = ['User', 'Method', 'IP', 'Time'];
    var rows = recentLogins.map(function (entry) {
      return [
        esc(entry.user || entry.username || '—'),
        esc(entry.method || '—'),
        esc(entry.ip || entry.ip_address || '—'),
        esc(Sentinel.formatDate(entry.timestamp || entry.created_at) || '—')
      ];
    });

    container.innerHTML = SentinelUI.dataTable(headers, rows, { emptyText: 'No recent activity.' });
  };
})();
