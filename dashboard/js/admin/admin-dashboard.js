(function () {
  'use strict';

  function esc(str) {
    if (str == null) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
  }

  window.SentinelPages = window.SentinelPages || {};

  window.SentinelPages.AdminDashboardPage = function () {};

  window.SentinelPages.AdminDashboardPage.prototype.render = function () {
    var header =
      '<div class="page-header" style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-6)">' +
        '<h1 style="margin:0">Admin Console</h1>' +
        '<span class="admin-badge">Admin</span>' +
      '</div>';

    var statsHtml =
      '<div class="metrics-grid" id="admin-stats">' +
        SentinelUI.skeleton('card', 4) +
      '</div>';

    var contentHtml =
      '<div style="display:grid;grid-template-columns:2fr 1fr;gap:var(--space-4);margin-top:var(--space-4)">' +
        '<div>' +
          SentinelUI.card('Recent Audit Log', '<div id="admin-audit-log">' + SentinelUI.loadingState() + '</div>') +
        '</div>' +
        '<div>' +
          SentinelUI.card('Recent Users', '<div id="admin-recent-users">' + SentinelUI.loadingState() + '</div>') +
        '</div>' +
      '</div>' +
      '<div style="margin-top:var(--space-4)">' +
        SentinelUI.card('System Health', '<div id="admin-system-health">' + SentinelUI.loadingState() + '</div>') +
      '</div>';

    return header + statsHtml + contentHtml;
  };

  window.SentinelPages.AdminDashboardPage.prototype.onMount = function () {
    var self = this;

    Promise.all([
      SentinelAPI.listUsers().catch(function () { return []; }),
      SentinelAPI.listApps().catch(function () { return []; }),
      SentinelAPI.listDeployments().catch(function () { return []; }),
      SentinelAPI.listTeams().catch(function () { return []; }),
      SentinelAPI.listAuditLog({ limit: 10 }).catch(function () { return []; }),
      SentinelAPI.getMonitoringHealth().catch(function () { return null; })
    ]).then(function (results) {
      var users = Array.isArray(results[0]) ? results[0] : [];
      var apps = Array.isArray(results[1]) ? results[1] : [];
      var deployments = Array.isArray(results[2]) ? results[2] : [];
      var teams = Array.isArray(results[3]) ? results[3] : [];
      var auditLog = Array.isArray(results[4]) ? results[4] : [];
      var health = results[5];

      self._renderStats(users, apps, deployments, teams);
      self._renderAuditLog(auditLog);
      self._renderRecentUsers(users);
      self._renderHealth(health);
    });
  };

  window.SentinelPages.AdminDashboardPage.prototype._renderStats = function (users, apps, deployments, teams) {
    var container = document.getElementById('admin-stats');
    if (!container) return;

    var metrics = [
      { label: 'Total Users', value: users.length },
      { label: 'Total Apps', value: apps.length },
      { label: 'Total Deployments', value: deployments.length },
      { label: 'Total Teams', value: teams.length }
    ];

    var html = '';
    for (var i = 0; i < metrics.length; i++) {
      html +=
        '<div class="metric-card">' +
          '<div class="metric-label">' + esc(metrics[i].label) + '</div>' +
          '<div class="metric-value">' + esc(String(metrics[i].value)) + '</div>' +
        '</div>';
    }
    container.innerHTML = html;
  };

  window.SentinelPages.AdminDashboardPage.prototype._renderAuditLog = function (log) {
    var container = document.getElementById('admin-audit-log');
    if (!container) return;

    if (!log || log.length === 0) {
      container.innerHTML = SentinelUI.emptyState('No Activity', 'No audit log entries found.');
      return;
    }

    var headers = ['Action', 'User', 'Resource', 'Date'];
    var rows = log.map(function (entry) {
      return [
        esc(entry.action || '—'),
        esc(entry.user || entry.username || '—'),
        esc(entry.resource || entry.resource_type || '—'),
        esc(Sentinel.formatDate(entry.created_at) || '—')
      ];
    });

    container.innerHTML = SentinelUI.dataTable(headers, rows, { emptyText: 'No audit entries found.' });
  };

  window.SentinelPages.AdminDashboardPage.prototype._renderRecentUsers = function (users) {
    var container = document.getElementById('admin-recent-users');
    if (!container) return;

    if (!users || users.length === 0) {
      container.innerHTML = SentinelUI.emptyState('No Users', 'No users registered yet.');
      return;
    }

    var sorted = users.slice().sort(function (a, b) {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    var recent = sorted.slice(0, 5);

    var html = '<div style="display:flex;flex-direction:column;gap:var(--space-2)">';
    for (var i = 0; i < recent.length; i++) {
      var u = recent[i];
      var name = u.username || u.name || u.email || 'Unknown';
      var role = u.role || 'member';
      var roleBadge = SentinelUI.badge(role.charAt(0).toUpperCase() + role.slice(1), role === 'admin' ? 'purple' : 'info');
      html +=
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-1) 0">' +
          '<div style="display:flex;align-items:center;gap:var(--space-2)">' +
            SentinelUI.avatar(name, 28) +
            '<div>' +
              '<div style="font-size:var(--text-sm);font-weight:500">' + esc(name) + '</div>' +
              '<div style="font-size:var(--text-xs);color:var(--text-muted)">' + esc(u.email || '') + '</div>' +
            '</div>' +
          '</div>' +
          roleBadge +
        '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
  };

  window.SentinelPages.AdminDashboardPage.prototype._renderHealth = function (health) {
    var container = document.getElementById('admin-system-health');
    if (!container) return;

    if (!health) {
      container.innerHTML = SentinelUI.emptyState('Unavailable', 'System health data is not available.');
      return;
    }

    var status = health.status || 'unknown';
    var statusBadge = SentinelUI.statusBadge(status);
    var uptime = health.uptime || '—';
    var version = health.version || health.build_version || '—';

    var html =
      '<div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:var(--space-4)">' +
        '<div>' +
          '<div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--space-1)">Status</div>' +
          '<div>' + statusBadge + '</div>' +
        '</div>' +
        '<div>' +
          '<div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--space-1)">Uptime</div>' +
          '<div style="font-size:var(--text-sm);font-weight:500">' + esc(String(uptime)) + '</div>' +
        '</div>' +
        '<div>' +
          '<div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--space-1)">Version</div>' +
          '<div style="font-size:var(--text-sm);font-weight:500">' + esc(String(version)) + '</div>' +
        '</div>' +
      '</div>';

    if (health.checks && Array.isArray(health.checks)) {
      html +=
        '<div style="margin-top:var(--space-4)">' +
          '<div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--space-2)">Health Checks</div>' +
          '<div style="display:flex;flex-direction:column;gap:var(--space-1)">';
      for (var i = 0; i < health.checks.length; i++) {
        var check = health.checks[i];
        var checkStatus = check.status || check.ok ? 'healthy' : 'unhealthy';
        html +=
          '<div style="display:flex;align-items:center;gap:var(--space-2);padding:var(--space-1) 0">' +
            '<span class="status-chip ' + esc(checkStatus) + '"></span>' +
            '<span style="font-size:var(--text-sm)">' + esc(check.name || check.service || 'Check ' + (i + 1)) + '</span>' +
          '</div>';
      }
      html += '</div></div>';
    }

    container.innerHTML = html;
  };
})();
