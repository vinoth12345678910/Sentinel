(function () {
  'use strict';

  function esc(str) {
    if (str == null) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
  }

  window.SentinelPages = window.SentinelPages || {};

  window.SentinelPages.DeploymentDetailPage = function () {
    this._appName = null;
    this._deploymentId = null;
    this._deployment = null;
    this._eventSource = null;
  };

  window.SentinelPages.DeploymentDetailPage.prototype.render = function () {
    this._appName = SentinelRouter.getParam('name') || '';
    this._deploymentId = SentinelRouter.getParam('id') || '';

    var breadcrumb = SentinelUI.breadcrumb([
      { label: 'Apps', href: '#/apps' },
      { label: this._appName, href: '#/apps/' + encodeURIComponent(this._appName) },
      { label: 'Deployments' },
      { label: this._deploymentId }
    ]);

    var depHeaderHtml =
      '<div id="deployment-header" style="margin-bottom:var(--space-4)">' +
        '<h1 style="margin-bottom:var(--space-2)">Deployment <span class="text-mono" style="font-size:0.7em;font-weight:400">' + esc(this._deploymentId) + '</span></h1>' +
        '<div id="deployment-meta" style="display:flex;flex-wrap:wrap;align-items:center;gap:var(--space-3);font-size:var(--text-sm)">' +
          '<span>Status: <span id="deployment-status"></span></span>' +
          '<span>Branch: <span id="deployment-branch" class="text-mono"></span></span>' +
          '<span>Commit: <span id="deployment-commit" class="text-mono"></span></span>' +
          '<span>Created: <span id="deployment-created"></span></span>' +
          '<span>Finished: <span id="deployment-finished"></span></span>' +
        '</div>' +
        '<div id="deployment-actions" style="margin-top:var(--space-3)"></div>' +
      '</div>';

    var timelineHtml = '<div id="deployment-timeline" style="margin-bottom:var(--space-4)">' + SentinelUI.loadingState() + '</div>';

    var terminalHtml = SentinelUI.terminal([], { title: 'Deployment Logs - ' + this._deploymentId });

    return breadcrumb + depHeaderHtml + timelineHtml + terminalHtml;
  };

  window.SentinelPages.DeploymentDetailPage.prototype.onMount = function () {
    var self = this;
    this._appName = SentinelRouter.getParam('name');
    this._deploymentId = SentinelRouter.getParam('id');

    if (!this._appName || !this._deploymentId) {
      SentinelRouter.navigate('/apps');
      return;
    }

    this._fetchDeployment();
    this._connectStream();
  };

  window.SentinelPages.DeploymentDetailPage.prototype._fetchDeployment = function () {
    var self = this;

    Promise.all([
      SentinelAPI.getDeployment(this._deploymentId).catch(function () { return null; }),
      SentinelAPI.getDeploymentLogs(this._deploymentId).catch(function () { return []; })
    ]).then(function (results) {
      self._deployment = results[0] || {};
      var logs = Array.isArray(results[1]) ? results[1] : [];

      self._renderInfo();
      self._renderTimeline();
      self._renderExistingLogs(logs);
    }).catch(function () {
      Sentinel.showError('deployment-timeline', 'Failed to load deployment data');
    });
  };

  window.SentinelPages.DeploymentDetailPage.prototype._renderInfo = function () {
    var dep = this._deployment;
    if (!dep) return;

    var statusEl = document.getElementById('deployment-status');
    if (statusEl) {
      statusEl.innerHTML = SentinelUI.statusBadge(dep.status || 'unknown');
    }

    var branchEl = document.getElementById('deployment-branch');
    if (branchEl) branchEl.textContent = dep.branch || '-';

    var commitEl = document.getElementById('deployment-commit');
    if (commitEl) commitEl.textContent = (dep.commit_hash || dep.commit || '-').slice(0, 7);

    var createdEl = document.getElementById('deployment-created');
    if (createdEl) createdEl.textContent = Sentinel.formatDate(dep.created_at) || '-';

    var finishedEl = document.getElementById('deployment-finished');
    if (finishedEl) finishedEl.textContent = Sentinel.formatDate(dep.finished_at) || 'In progress';

    var actionsEl = document.getElementById('deployment-actions');
    if (actionsEl && dep.status === 'success') {
      var rollbackBtn = SentinelUI.button('Rollback to this deployment', 'secondary', '', {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>'
      });
      actionsEl.innerHTML = rollbackBtn;

      actionsEl.querySelector('button').addEventListener('click', function () {
        if (confirm('Rollback the app to this deployment?')) {
          self._rollback();
        }
      });
    }
    var self = this;
  };

  window.SentinelPages.DeploymentDetailPage.prototype._renderTimeline = function () {
    var container = document.getElementById('deployment-timeline');
    if (!container) return;

    var dep = this._deployment;
    if (!dep || !dep.stages) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = SentinelUI.deploymentTimeline(dep.stages);
  };

  window.SentinelPages.DeploymentDetailPage.prototype._renderExistingLogs = function (logs) {
    var terminalBody = document.querySelector('.terminal-body');
    if (!terminalBody) return;

    if (!logs || logs.length === 0) {
      terminalBody.innerHTML = '<div class="terminal-line">Waiting for logs...</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < logs.length; i++) {
      var log = logs[i];
      if (typeof log === 'string') {
        html += '<div class="terminal-line">' + esc(log) + '</div>';
      } else {
        var type = log.type || 'info';
        var text = log.text || log.message || log.line || '';
        html += '<div class="terminal-line ' + esc(type) + '">' + esc(text) + '</div>';
      }
    }
    terminalBody.innerHTML = html;
    this._scrollTerminalBottom();
  };

  window.SentinelPages.DeploymentDetailPage.prototype._connectStream = function () {
    var self = this;
    var url = SentinelAPI.getDeploymentStreamUrl(this._deploymentId);
    if (!url) return;

    this._eventSource = new EventSource(url);

    this._eventSource.onmessage = function (event) {
      var terminalBody = document.querySelector('.terminal-body');
      if (!terminalBody) return;

      var data;
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        data = { text: event.data, type: 'info' };
      }

      var type = data.type || 'info';
      var text = data.text || data.message || data.line || JSON.stringify(data);

      var lineEl = document.createElement('div');
      lineEl.className = 'terminal-line ' + esc(type);
      lineEl.textContent = text;
      terminalBody.appendChild(lineEl);

      self._scrollTerminalBottom();
    };

    this._eventSource.addEventListener('info', function (event) {
      self._appendStreamLine(event.data, 'info');
    });

    this._eventSource.addEventListener('success', function (event) {
      self._appendStreamLine(event.data, 'success');
    });

    this._eventSource.addEventListener('error', function (event) {
      var data = event.data;
      if (event.data) {
        self._appendStreamLine(data, 'error');
      }
    });

    this._eventSource.addEventListener('warn', function (event) {
      self._appendStreamLine(event.data, 'warn');
    });

    this._eventSource.onerror = function () {
      self._appendStreamLine('Connection lost. Retrying...', 'warn');
    };
  };

  window.SentinelPages.DeploymentDetailPage.prototype._appendStreamLine = function (data, type) {
    var terminalBody = document.querySelector('.terminal-body');
    if (!terminalBody) return;

    var text = data;
    try {
      var parsed = JSON.parse(data);
      text = parsed.text || parsed.message || parsed.line || data;
      type = parsed.type || type;
    } catch (e) {}

    var lineEl = document.createElement('div');
    lineEl.className = 'terminal-line ' + esc(type);
    lineEl.textContent = text;
    terminalBody.appendChild(lineEl);

    this._scrollTerminalBottom();
  };

  window.SentinelPages.DeploymentDetailPage.prototype._scrollTerminalBottom = function () {
    var terminal = document.querySelector('.terminal');
    if (terminal) {
      terminal.scrollTop = terminal.scrollHeight;
    }
  };

  window.SentinelPages.DeploymentDetailPage.prototype._rollback = function () {
    var self = this;
    SentinelAPI.rollbackToDeployment(this._appName, this._deploymentId)
      .then(function () {
        SentinelToast.show('Rollback to deployment ' + self._deploymentId + ' initiated', 'success');
        SentinelRouter.navigate('/apps/' + encodeURIComponent(self._appName));
      })
      .catch(function (err) {
        SentinelToast.show('Rollback failed: ' + (err.message || 'Unknown error'), 'error');
      });
  };

  window.SentinelPages.DeploymentDetailPage.prototype.onUnmount = function () {
    if (this._eventSource) {
      this._eventSource.close();
      this._eventSource = null;
    }
  };
})();
