(function () {
  'use strict';

  window.SentinelPages = window.SentinelPages || {};

  var esc = Sentinel.escapeHtml;

  function formatUptime(seconds) {
    if (seconds == null) return '\u2014';
    seconds = Math.floor(seconds);
    var days = Math.floor(seconds / 86400);
    var hours = Math.floor((seconds % 86400) / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var parts = [];
    if (days > 0) parts.push(days + 'd');
    if (hours > 0) parts.push(hours + 'h');
    if (minutes > 0) parts.push(minutes + 'm');
    if (parts.length === 0) parts.push('<1m');
    return parts.join(' ');
  }

  window.SentinelPages.MonitoringPage = {
    _intervalId: null,
    _autoRefresh: true,

    render: function () {
      var refreshIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>';

      var header = SentinelUI.pageHeader('Monitoring', 'System health and metrics',
        '<button class="btn btn-sm btn-primary" id="auto-refresh-btn" onclick="window.SentinelPages.MonitoringPage.toggleAutoRefresh()">' +
        refreshIcon + ' <span id="refresh-label">Auto-refresh: ON</span>' +
        '</button>'
      );

      var systemMetrics = SentinelUI.card('System Metrics',
        '<div class="metrics-grid">' +
          '<div class="metric-card">' +
            '<div class="metric-label">CPU Usage</div>' +
            '<div class="metric-value" id="cpu-value">' + SentinelUI.skeleton('text') + '</div>' +
            '<div id="cpu-bar" style="margin-top:8px">' + SentinelUI.skeleton('text') + '</div>' +
          '</div>' +
          '<div class="metric-card">' +
            '<div class="metric-label">Memory Usage</div>' +
            '<div class="metric-value" id="memory-value">' + SentinelUI.skeleton('text') + '</div>' +
            '<div id="memory-bar" style="margin-top:8px">' + SentinelUI.skeleton('text') + '</div>' +
          '</div>' +
          '<div class="metric-card">' +
            '<div class="metric-label">Disk Usage</div>' +
            '<div class="metric-value" id="disk-value">' + SentinelUI.skeleton('text') + '</div>' +
            '<div id="disk-bar" style="margin-top:8px">' + SentinelUI.skeleton('text') + '</div>' +
          '</div>' +
          '<div class="metric-card">' +
            '<div class="metric-label">Uptime</div>' +
            '<div class="metric-value" id="uptime-value">' + SentinelUI.skeleton('text') + '</div>' +
          '</div>' +
        '</div>'
      );

      var containerTable = SentinelUI.card('Container Metrics',
        '<div id="container-table-wrap">' +
          '<div class="loading-state"><div class="spinner spinner-lg"></div></div>' +
        '</div>'
      );

      var deployStats = SentinelUI.card('Deployments',
        '<div class="metrics-grid" id="deployment-stats">' +
          '<div class="metric-card"><div class="metric-label">Total</div><div class="metric-value" id="deploy-total">' + SentinelUI.skeleton('text') + '</div></div>' +
          '<div class="metric-card"><div class="metric-label">Success</div><div class="metric-value" id="deploy-success">' + SentinelUI.skeleton('text') + '</div></div>' +
          '<div class="metric-card"><div class="metric-label">Failed</div><div class="metric-value" id="deploy-failed">' + SentinelUI.skeleton('text') + '</div></div>' +
          '<div class="metric-card"><div class="metric-label">Running</div><div class="metric-value" id="deploy-running">' + SentinelUI.skeleton('text') + '</div></div>' +
        '</div>'
      );

      var appHealth = SentinelUI.card('App Health',
        '<div class="metrics-grid" id="app-health-grid">' +
          '<div class="metric-card"><div class="metric-label">Total Apps</div><div class="metric-value" id="apps-total">' + SentinelUI.skeleton('text') + '</div></div>' +
          '<div class="metric-card"><div class="metric-label">Healthy</div><div class="metric-value" id="apps-healthy">' + SentinelUI.skeleton('text') + '</div></div>' +
          '<div class="metric-card"><div class="metric-label">Unhealthy</div><div class="metric-value" id="apps-unhealthy">' + SentinelUI.skeleton('text') + '</div></div>' +
        '</div>'
      );

      return '<div id="monitoring-page">' +
        header +
        systemMetrics +
        containerTable +
        deployStats +
        appHealth +
        '</div>';
    },

    onMount: function () {
      var self = this;
      this._doRefresh();
      if (this._autoRefresh) {
        this._intervalId = setInterval(function () { self._doRefresh(); }, 30000);
      }
    },

    onUnmount: function () {
      if (this._intervalId) {
        clearInterval(this._intervalId);
        this._intervalId = null;
      }
    },

    toggleAutoRefresh: function () {
      this._autoRefresh = !this._autoRefresh;
      var label = document.getElementById('refresh-label');
      var btn = document.getElementById('auto-refresh-btn');
      if (label) {
        label.textContent = 'Auto-refresh: ' + (this._autoRefresh ? 'ON' : 'OFF');
      }
      if (btn) {
        if (this._autoRefresh) {
          btn.classList.remove('btn-ghost');
          btn.classList.add('btn-primary');
        } else {
          btn.classList.remove('btn-primary');
          btn.classList.add('btn-ghost');
        }
      }
      if (this._autoRefresh) {
        var self = this;
        if (!this._intervalId) {
          this._intervalId = setInterval(function () { self._doRefresh(); }, 30000);
        }
      } else {
        if (this._intervalId) {
          clearInterval(this._intervalId);
          this._intervalId = null;
        }
      }
    },

    _doRefresh: function () {
      var self = this;
      SentinelAPI.getMonitoringHealth()
        .then(function (data) { self._updateUI(data); })
        .catch(function (err) {
          console.error('Monitoring refresh failed:', err);
        });
    },

    _updateUI: function (data) {
      if (!data) return;

      var system = data.system || {};
      var cpuVal = document.getElementById('cpu-value');
      var cpuBar = document.getElementById('cpu-bar');
      var memVal = document.getElementById('memory-value');
      var memBar = document.getElementById('memory-bar');
      var diskVal = document.getElementById('disk-value');
      var diskBar = document.getElementById('disk-bar');
      var uptimeVal = document.getElementById('uptime-value');

      if (cpuVal) cpuVal.textContent = (system.cpu != null ? system.cpu.toFixed(1) : '0') + '%';
      if (cpuBar) cpuBar.innerHTML = SentinelUI.progressBar(system.cpu || 0);

      if (memVal) memVal.textContent = (system.memory != null ? system.memory.toFixed(1) : '0') + '%';
      if (memBar) memBar.innerHTML = SentinelUI.progressBar(system.memory || 0);

      var disk = data.disk || {};
      var diskPercent = disk.percent != null ? disk.percent : 0;
      if (diskVal) diskVal.textContent = diskPercent + '%';
      if (diskBar) diskBar.innerHTML = SentinelUI.progressBar(diskPercent);

      if (uptimeVal) uptimeVal.textContent = formatUptime(system.uptime);

      var containers = data.containers || [];
      var containerWrap = document.getElementById('container-table-wrap');
      if (containerWrap) {
        var headers = ['Container ID', 'App', 'Status', 'Port', 'CPU', 'Memory'];
        var rows = containers.map(function (c) {
          return [
            '<code style="font-size:var(--text-xs)">' + esc(c.id ? c.id.slice(0, 12) : '—') + '</code>',
            esc(c.app || '—'),
            SentinelUI.statusBadge(c.status || 'unknown'),
            esc(c.port != null ? String(c.port) : '—'),
            esc(c.cpu != null ? c.cpu.toFixed(1) + '%' : '—'),
            esc(c.memory != null ? c.memory + 'MB' : '—')
          ];
        });
        containerWrap.innerHTML = SentinelUI.dataTable(headers, rows, { emptyText: 'No containers running' });
      }

      var deployments = data.deployments || {};
      var deployTotal = document.getElementById('deploy-total');
      var deploySuccess = document.getElementById('deploy-success');
      var deployFailed = document.getElementById('deploy-failed');
      var deployRunning = document.getElementById('deploy-running');
      if (deployTotal) deployTotal.textContent = deployments.total != null ? String(deployments.total) : '0';
      if (deploySuccess) {
        deploySuccess.textContent = deployments.success != null ? String(deployments.success) : '0';
        deploySuccess.style.color = 'var(--green)';
      }
      if (deployFailed) {
        deployFailed.textContent = deployments.failed != null ? String(deployments.failed) : '0';
        deployFailed.style.color = 'var(--red)';
      }
      if (deployRunning) {
        deployRunning.textContent = deployments.running != null ? String(deployments.running) : '0';
        deployRunning.style.color = 'var(--accent)';
      }

      var apps = data.apps || {};
      var appsTotal = document.getElementById('apps-total');
      var appsHealthy = document.getElementById('apps-healthy');
      var appsUnhealthy = document.getElementById('apps-unhealthy');
      if (appsTotal) appsTotal.textContent = apps.total != null ? String(apps.total) : '0';
      if (appsHealthy) {
        appsHealthy.textContent = apps.healthy != null ? String(apps.healthy) : '0';
        appsHealthy.style.color = 'var(--green)';
      }
      if (appsUnhealthy) {
        appsUnhealthy.textContent = apps.unhealthy != null ? String(apps.unhealthy) : '0';
        appsUnhealthy.style.color = 'var(--red)';
      }
    }
  };
})();
