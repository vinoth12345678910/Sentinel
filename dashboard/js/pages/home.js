(function () {
  'use strict';

  window.SentinelPages = window.SentinelPages || {};

  window.SentinelPages.HomePage = function () {
    var mounted = false;
    var metrics = [
      { label: 'Apps', value: null },
      { label: 'Deployments', value: null },
      { label: 'Projects', value: null },
      { label: 'Uptime', value: null }
    ];
    var recentDeployments = [];

    function render() {
      var headerHtml = SentinelUI.pageHeader('Dashboard', 'Overview of your deployment platform');

      var metricsHtml = '<div class="metrics-grid">';
      for (var i = 0; i < metrics.length; i++) {
        var m = metrics[i];
        metricsHtml += '<div class="metric-card">' +
          '<div class="metric-label">' + Sentinel.escapeHtml(m.label) + '</div>' +
          '<div class="metric-value">';
        if (m.value === null) {
          metricsHtml += SentinelUI.skeleton('text');
        } else {
          metricsHtml += Sentinel.escapeHtml(String(m.value));
        }
        metricsHtml += '</div></div>';
      }
      metricsHtml += '</div>';

      var deploymentsHtml = renderDeploymentsTable();

      var quickActionsHtml = '<div style="display:flex;gap:var(--space-2);flex-wrap:wrap">' +
        '<button class="btn btn-primary" onclick="SentinelRouter.navigate(\'/projects/new\')">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
        'New Project</button>' +
        '<button class="btn btn-default" onclick="SentinelRouter.navigate(\'/github/import\')">Import from GitHub</button>' +
        '<button class="btn btn-ghost" onclick="SentinelRouter.navigate(\'/apps\')">View Apps</button>' +
        '</div>';

      return headerHtml +
        metricsHtml +
        SentinelUI.card('Recent Deployments', deploymentsHtml) +
        SentinelUI.card('Quick Actions', quickActionsHtml);
    }

    function renderDeploymentsTable() {
      var headers = ['App', 'Branch', 'Commit', 'Status', 'Time'];
      if (!recentDeployments || recentDeployments.length === 0) {
        return SentinelUI.table(headers, [], 'No recent deployments');
      }
      var rows = recentDeployments.map(function (d) {
        var commitStr = d.commit_hash || d.commit || '';
        var timeStr = d.created_at
          ? (Sentinel.formatDate(d.created_at) || Sentinel.timeAgo(d.created_at))
          : '';
        return [
          Sentinel.escapeHtml(d.app_name || ''),
          '<span class="text-mono">' + Sentinel.escapeHtml(d.branch || '') + '</span>',
          '<span class="text-mono">' + Sentinel.escapeHtml(commitStr.slice(0, 7)) + '</span>',
          SentinelUI.statusBadge(d.status || 'pending'),
          timeStr
        ];
      });
      return SentinelUI.table(headers, rows);
    }

    function onMount() {
      mounted = true;

      Promise.all([
        SentinelAPI.listApps().catch(function () { return []; }),
        SentinelAPI.listDeployments().catch(function () { return []; }),
        SentinelAPI.listProjects().catch(function () { return []; }),
        SentinelAPI.getHealth().catch(function () { return {}; })
      ]).then(function (results) {
        if (!mounted) return;

        var apps = results[0];
        var deployments = results[1];
        var projects = results[2];
        var health = results[3];

        metrics[0].value = Array.isArray(apps) ? String(apps.length) : '0';
        metrics[1].value = Array.isArray(deployments) ? String(deployments.length) : '0';
        metrics[2].value = Array.isArray(projects) ? String(projects.length) : '0';

        var uptimeVal = '-';
        if (health && health.uptime) {
          var hours = Math.floor(Number(health.uptime) / 3600);
          uptimeVal = hours + 'h';
        } else if (health && health.status === 'healthy') {
          uptimeVal = 'Healthy';
        }
        metrics[3].value = uptimeVal;

        if (Array.isArray(apps)) SentinelStore.setState('apps', apps);
        if (Array.isArray(deployments)) SentinelStore.setState('deployments', deployments);

        recentDeployments = Array.isArray(deployments) ? deployments.slice(0, 5) : [];

        var container = document.getElementById('app-content');
        if (container) container.innerHTML = render();
      });
    }

    function onUnmount() {
      mounted = false;
    }

    return {
      render: render,
      onMount: onMount,
      onUnmount: onUnmount
    };
  };
})();
