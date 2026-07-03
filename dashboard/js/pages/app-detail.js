(function () {
  'use strict';

  function esc(str) {
    if (str == null) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
  }

  window.SentinelPages = window.SentinelPages || {};

  var TAB_IDS = ['overview', 'deployments', 'env-vars', 'domains', 'settings'];
  var TAB_LABELS = ['Overview', 'Deployments', 'Environment Variables', 'Domains', 'Settings'];

  window.SentinelPages.AppDetailPage = function () {
    this._appName = null;
    this._app = null;
    this._deployments = [];
    this._envVars = [];
    this._domains = [];
    this._activeTab = 'overview';
    this._envVarFormOpen = false;
    this._domainFormOpen = false;
  };

  window.SentinelPages.AppDetailPage.prototype.render = function () {
    var appName = SentinelRouter.getParam('name') || '';
    this._appName = appName;

    var breadcrumb = SentinelUI.breadcrumb([
      { label: 'Apps', href: '#/apps' },
      { label: appName }
    ]);

    var appHeaderHtml =
      '<div id="app-detail-header" class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between">' +
        '<div>' +
          '<h1 id="app-name-display">' + esc(appName) + '</h1>' +
          '<div id="app-header-meta" style="display:flex;align-items:center;gap:var(--space-3);margin-top:var(--space-1)">' +
            '<span id="app-status-badge"></span>' +
            '<a id="app-domain-link" href="#" target="_blank" style="display:none" class="text-sm text-muted"></a>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:var(--space-2)">' +
          SentinelUI.button('Rollback', 'secondary', 'sm') +
          SentinelUI.button('Delete', 'danger', 'sm') +
        '</div>' +
      '</div>';

    var tabsDefs = [];
    for (var i = 0; i < TAB_IDS.length; i++) {
      tabsDefs.push({ id: TAB_IDS[i], label: TAB_LABELS[i] });
    }
    var tabsHtml = SentinelUI.tabs(tabsDefs, this._activeTab);

    var tabContentsHtml = '';
    for (var j = 0; j < TAB_IDS.length; j++) {
      var tabId = TAB_IDS[j];
      var content = SentinelUI.loadingState();
      tabContentsHtml += SentinelUI.tabContent(tabId, this._activeTab, content);
    }

    return breadcrumb + appHeaderHtml + tabsHtml + '<div id="tab-contents" style="margin-top:var(--space-4)">' + tabContentsHtml + '</div>';
  };

  window.SentinelPages.AppDetailPage.prototype.onMount = function () {
    var self = this;
    this._appName = SentinelRouter.getParam('name');
    if (!this._appName) {
      SentinelRouter.navigate('/apps');
      return;
    }

    var deleteBtn = document.querySelector('.btn-danger');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function () {
        self._confirmDelete();
      });
    }

    var rollbackBtn = document.querySelectorAll('.page-header .btn-secondary');
    if (rollbackBtn.length) {
      rollbackBtn[0].addEventListener('click', function () {
        self._rollbackLatest();
      });
    }

    this._setupTabSwitching();

    this._fetchAllData();
  };

  window.SentinelPages.AppDetailPage.prototype._setupTabSwitching = function () {
    var self = this;
    document.addEventListener('click', function (e) {
      var tab = e.target.closest('.tab');
      if (!tab) return;
      var tabId = tab.getAttribute('data-tab');
      if (!tabId || TAB_IDS.indexOf(tabId) === -1) return;

      self._activeTab = tabId;

      document.querySelectorAll('.tab').forEach(function (t) {
        t.classList.toggle('active', t.getAttribute('data-tab') === tabId);
      });
      document.querySelectorAll('.tab-content').forEach(function (tc) {
        tc.classList.toggle('active', tc.getAttribute('data-tab-content') === tabId);
      });
    });
  };

  window.SentinelPages.AppDetailPage.prototype._fetchAllData = function () {
    var self = this;
    var name = this._appName;

    Promise.all([
      SentinelAPI.getApp(name).catch(function () { return null; }),
      SentinelAPI.listAppDeployments(name).catch(function () { return []; }),
      SentinelAPI.listEnvVars(name).catch(function () { return []; }),
      SentinelAPI.listCustomDomains(name).catch(function () { return []; })
    ]).then(function (results) {
      self._app = results[0] || {};
      self._deployments = Array.isArray(results[1]) ? results[1] : [];
      self._envVars = Array.isArray(results[2]) ? results[2] : [];
      self._domains = Array.isArray(results[3]) ? results[3] : [];

      self._renderHeader();
      self._renderOverview();
      self._renderDeployments();
      self._renderEnvVars();
      self._renderDomains();
      self._renderSettings();
    }).catch(function () {
      Sentinel.showError('tab-contents', 'Failed to load application data');
    });
  };

  window.SentinelPages.AppDetailPage.prototype._renderHeader = function () {
    var app = this._app;
    if (!app) return;

    var nameEl = document.getElementById('app-name-display');
    if (nameEl) nameEl.textContent = app.name || app.app_name || this._appName;

    var badgeEl = document.getElementById('app-status-badge');
    if (badgeEl) {
      badgeEl.innerHTML = SentinelUI.statusBadge(app.status || 'unknown');
    }

    var domainLink = document.getElementById('app-domain-link');
    if (domainLink && app.domain) {
      domainLink.href = 'https://' + app.domain;
      domainLink.textContent = app.domain;
      domainLink.style.display = 'inline';
    }
  };

  window.SentinelPages.AppDetailPage.prototype._renderOverview = function () {
    var app = this._app;
    var container = document.querySelector('.tab-content[data-tab-content="overview"]');
    if (!container) return;

    if (!app || Object.keys(app).length === 0) {
      container.innerHTML = SentinelUI.emptyState('No Data', 'No application data available.');
      return;
    }

    var statsHtml = '';
    var deployments = this._deployments || [];
    var latestDeploy = deployments.length > 0 ? deployments[0] : null;

    var successCount = deployments.filter(function (d) { return d.status === 'success'; }).length;
    var totalCount = deployments.length;

    var config = app.config || {};

    var stats = [
      { label: 'Deployments', value: totalCount },
      { label: 'Successful', value: successCount },
      { label: 'Host Port', value: config.host_port || config.hostPort || '-' },
      { label: 'Container Port', value: config.container_port || config.containerPort || '-' }
    ];
    statsHtml = SentinelUI.metricsGrid(stats);

    var detailRows = [
      '<tr><td class="text-muted" style="width:160px;padding:8px 0">Repository URL</td><td style="padding:8px 0">' + esc(app.repo_url || app.repoUrl || '-') + '</td></tr>',
      '<tr><td class="text-muted" style="width:160px;padding:8px 0">Host Port</td><td style="padding:8px 0">' + esc(String(config.host_port || config.hostPort || '-')) + '</td></tr>',
      '<tr><td class="text-muted" style="width:160px;padding:8px 0">Container Port</td><td style="padding:8px 0">' + esc(String(config.container_port || config.containerPort || '-')) + '</td></tr>',
      '<tr><td class="text-muted" style="width:160px;padding:8px 0">Health Path</td><td style="padding:8px 0">' + esc(config.health_path || config.healthPath || '-') + '</td></tr>',
      '<tr><td class="text-muted" style="width:160px;padding:8px 0">Domain</td><td style="padding:8px 0">' + esc(app.domain || '-') + '</td></tr>',
    ];

    if (latestDeploy) {
      detailRows.push(
        '<tr><td class="text-muted" style="width:160px;padding:8px 0">Last Deployed</td><td style="padding:8px 0">' + esc(Sentinel.formatDate(latestDeploy.created_at)) + '</td></tr>'
      );
    }

    var configHtml = SentinelUI.card('Configuration', '<table style="width:100%">' + detailRows.join('') + '</table>');

    container.innerHTML = statsHtml + configHtml;
  };

  window.SentinelPages.AppDetailPage.prototype._renderDeployments = function () {
    var self = this;
    var container = document.querySelector('.tab-content[data-tab-content="deployments"]');
    if (!container) return;

    var deployments = this._deployments;

    if (!deployments || deployments.length === 0) {
      container.innerHTML = SentinelUI.emptyState('No Deployments', 'This app has no deployments yet.');
      return;
    }

    var headers = ['Commit', 'Branch', 'Status', 'Timestamp', ''];
    var rows = deployments.map(function (d) {
      var commitHash = (d.commit_hash || d.commit || '').slice(0, 7);
      var branch = d.branch || '-';
      var statusBadge = SentinelUI.statusBadge(d.status || 'pending');
      var timestamp = Sentinel.formatDate(d.created_at) || '-';
      var deployId = d.id || d.deployment_id || '';
      var viewLink = '<a href="#/apps/' + encodeURIComponent(self._appName) + '/deployments/' + encodeURIComponent(deployId) + '" class="text-sm">View</a>';
      return [
        '<span class="text-mono">' + esc(commitHash) + '</span>',
        esc(branch),
        statusBadge,
        esc(timestamp),
        viewLink
      ];
    });

    container.innerHTML = SentinelUI.dataTable(headers, rows, { emptyText: 'No deployments found.' });

    container.querySelectorAll('a[href^="#/apps/"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        SentinelRouter.navigate(link.getAttribute('href').slice(1));
      });
    });
  };

  window.SentinelPages.AppDetailPage.prototype._renderEnvVars = function () {
    var self = this;
    var container = document.querySelector('.tab-content[data-tab-content="env-vars"]');
    if (!container) return;

    var envVars = this._envVars;
    var addBtn = SentinelUI.button('Add Variable', 'primary', 'sm', { icon: SentinelUI.icon || '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' });

    var content = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-3)">' +
      '<h3 style="margin:0">Environment Variables</h3>' +
      addBtn +
      '</div>';

    content += '<div id="env-add-form" style="display:none;margin-bottom:var(--space-3)"></div>';

    if (envVars && envVars.length > 0) {
      var headers = ['Key', 'Value', ''];
      var rows = envVars.map(function (ev) {
        var key = ev.key || ev.name || '';
        var val = ev.value || '';
        var masked = val ? val.slice(0, 3) + '****' + val.slice(-1) : '****';
        var deleteBtn = '<button class="btn btn-ghost btn-sm env-delete-btn" data-key="' + esc(key) + '">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
          '</button>';
        return [
          '<span class="text-mono">' + esc(key) + '</span>',
          '<span class="text-muted">' + esc(masked) + '</span>',
          deleteBtn
        ];
      });
      content += SentinelUI.dataTable(headers, rows, { emptyText: 'No environment variables.' });
    } else {
      content += SentinelUI.emptyState('No Variables', 'No environment variables configured for this app.');
    }

    container.innerHTML = content;

    var addVarBtn = container.querySelector('.btn-primary');
    if (addVarBtn) {
      addVarBtn.addEventListener('click', function () {
        self._toggleEnvVarForm();
      });
    }

    container.querySelectorAll('.env-delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-key');
        if (key && confirm('Delete environment variable "' + key + '"?')) {
          self._deleteEnvVar(key);
        }
      });
    });
  };

  window.SentinelPages.AppDetailPage.prototype._toggleEnvVarForm = function () {
    var formContainer = document.getElementById('env-add-form');
    if (!formContainer) return;

    if (this._envVarFormOpen) {
      formContainer.style.display = 'none';
      this._envVarFormOpen = false;
      return;
    }

    var self = this;
    this._envVarFormOpen = true;

    var formHtml =
      '<div class="card" style="padding:var(--space-4)">' +
        '<div class="form-row">' +
          SentinelUI.input('Key', 'env-key', 'text', '', 'e.g. DATABASE_URL') +
        '</div>' +
        '<div class="form-row">' +
          SentinelUI.input('Value', 'env-value', 'text', '', 'e.g. postgres://...') +
        '</div>' +
        '<div style="display:flex;gap:var(--space-2);margin-top:var(--space-3)">' +
          SentinelUI.button('Save', 'primary', '') +
          SentinelUI.button('Cancel', 'ghost', '') +
        '</div>' +
      '</div>';

    formContainer.innerHTML = formHtml;
    formContainer.style.display = 'block';

    var saveBtn = formContainer.querySelector('.btn-primary');
    var cancelBtn = formContainer.querySelector('.btn-ghost');

    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var keyInput = document.getElementById('env-key');
        var valInput = document.getElementById('env-value');
        if (keyInput && valInput && keyInput.value.trim()) {
          self._addEnvVar(keyInput.value.trim(), valInput.value);
        }
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        self._envVarFormOpen = false;
        formContainer.style.display = 'none';
      });
    }
  };

  window.SentinelPages.AppDetailPage.prototype._addEnvVar = function (key, value) {
    var self = this;
    SentinelAPI.setEnvVar(this._appName, key, value)
      .then(function () {
        return SentinelAPI.listEnvVars(self._appName);
      })
      .then(function (envVars) {
        self._envVars = Array.isArray(envVars) ? envVars : [];
        self._envVarFormOpen = false;
        self._renderEnvVars();
      })
      .catch(function (err) {
        alert('Failed to add environment variable: ' + (err.message || 'Unknown error'));
      });
  };

  window.SentinelPages.AppDetailPage.prototype._deleteEnvVar = function (key) {
    var self = this;
    SentinelAPI.deleteEnvVar(this._appName, key)
      .then(function () {
        return SentinelAPI.listEnvVars(self._appName);
      })
      .then(function (envVars) {
        self._envVars = Array.isArray(envVars) ? envVars : [];
        self._renderEnvVars();
      })
      .catch(function (err) {
        alert('Failed to delete environment variable: ' + (err.message || 'Unknown error'));
      });
  };

  window.SentinelPages.AppDetailPage.prototype._renderDomains = function () {
    var self = this;
    var container = document.querySelector('.tab-content[data-tab-content="domains"]');
    if (!container) return;

    var domains = this._domains;
    var addBtn = SentinelUI.button('Add Domain', 'primary', 'sm');

    var content = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-3)">' +
      '<h3 style="margin:0">Custom Domains</h3>' +
      addBtn +
      '</div>';

    content += '<div id="domain-add-form" style="display:none;margin-bottom:var(--space-3)"></div>';

    if (domains && domains.length > 0) {
      var headers = ['Domain', 'Verification', 'SSL', ''];
      var rows = domains.map(function (d) {
        var domainName = d.domain || d.name || '';
        var verified = d.verified ? SentinelUI.badge('Verified', 'success') : SentinelUI.badge('Pending', 'warning');
        var sslStatus = d.ssl_status || d.ssl;
        var sslBadge = sslStatus === 'active' || sslStatus === true
          ? SentinelUI.badge('Active', 'success')
          : SentinelUI.badge('Inactive', 'neutral');
        var removeBtn = '<button class="btn btn-ghost btn-sm domain-remove-btn" data-domain="' + esc(domainName) + '">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
          '</button>';
        return [
          esc(domainName),
          verified,
          sslBadge,
          removeBtn
        ];
      });
      content += SentinelUI.dataTable(headers, rows, { emptyText: 'No custom domains.' });
    } else {
      content += SentinelUI.emptyState('No Domains', 'No custom domains configured for this app.');
    }

    container.innerHTML = content;

    var addDomainBtn = container.querySelector('.btn-primary');
    if (addDomainBtn) {
      addDomainBtn.addEventListener('click', function () {
        self._toggleDomainForm();
      });
    }

    container.querySelectorAll('.domain-remove-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var domain = btn.getAttribute('data-domain');
        if (domain && confirm('Remove domain "' + domain + '"?')) {
          self._removeDomain(domain);
        }
      });
    });
  };

  window.SentinelPages.AppDetailPage.prototype._toggleDomainForm = function () {
    var formContainer = document.getElementById('domain-add-form');
    if (!formContainer) return;

    if (this._domainFormOpen) {
      formContainer.style.display = 'none';
      this._domainFormOpen = false;
      return;
    }

    var self = this;
    this._domainFormOpen = true;

    var formHtml =
      '<div class="card" style="padding:var(--space-4)">' +
        '<div class="form-row">' +
          SentinelUI.input('Domain', 'domain-name', 'text', '', 'e.g. app.example.com') +
        '</div>' +
        '<div style="display:flex;gap:var(--space-2);margin-top:var(--space-3)">' +
          SentinelUI.button('Add', 'primary', '') +
          SentinelUI.button('Cancel', 'ghost', '') +
        '</div>' +
      '</div>';

    formContainer.innerHTML = formHtml;
    formContainer.style.display = 'block';

    var saveBtn = formContainer.querySelector('.btn-primary');
    var cancelBtn = formContainer.querySelector('.btn-ghost');

    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var input = document.getElementById('domain-name');
        if (input && input.value.trim()) {
          self._addDomain(input.value.trim());
        }
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        self._domainFormOpen = false;
        formContainer.style.display = 'none';
      });
    }
  };

  window.SentinelPages.AppDetailPage.prototype._addDomain = function (domain) {
    var self = this;
    SentinelAPI.addCustomDomain(this._appName, domain)
      .then(function () {
        return SentinelAPI.listCustomDomains(self._appName);
      })
      .then(function (domains) {
        self._domains = Array.isArray(domains) ? domains : [];
        self._domainFormOpen = false;
        self._renderDomains();
      })
      .catch(function (err) {
        alert('Failed to add domain: ' + (err.message || 'Unknown error'));
      });
  };

  window.SentinelPages.AppDetailPage.prototype._removeDomain = function (domain) {
    var self = this;
    SentinelAPI.removeCustomDomain(this._appName, domain)
      .then(function () {
        return SentinelAPI.listCustomDomains(self._appName);
      })
      .then(function (domains) {
        self._domains = Array.isArray(domains) ? domains : [];
        self._renderDomains();
      })
      .catch(function (err) {
        alert('Failed to remove domain: ' + (err.message || 'Unknown error'));
      });
  };

  window.SentinelPages.AppDetailPage.prototype._renderSettings = function () {
    var self = this;
    var container = document.querySelector('.tab-content[data-tab-content="settings"]');
    if (!container) return;

    var app = this._app;
    var config = (app && app.config) || {};

    var formHtml =
      '<div id="settings-form">' +
        '<div class="form-row">' +
          SentinelUI.input('Health Path', 'health-path', 'text', config.health_path || config.healthPath || '', '/health', { hint: 'Path used for health checks' }) +
        '</div>' +
        '<div class="form-row">' +
          SentinelUI.input('Container Port', 'container-port', 'number', String(config.container_port || config.containerPort || ''), '8080', { hint: 'Port your application listens on' }) +
        '</div>' +
        '<div class="form-row">' +
          SentinelUI.input('Host Port', 'host-port', 'number', String(config.host_port || config.hostPort || ''), '3000', { hint: 'Port exposed on the host' }) +
        '</div>' +
        '<div style="margin-top:var(--space-4)">' +
          SentinelUI.button('Save Changes', 'primary', '') +
        '</div>' +
      '</div>';

    container.innerHTML = SentinelUI.card('Application Settings', formHtml);

    var saveBtn = container.querySelector('.btn-primary');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        self._saveSettings();
      });
    }
  };

  window.SentinelPages.AppDetailPage.prototype._saveSettings = function () {
    var self = this;
    var healthPath = document.getElementById('health-path');
    var containerPort = document.getElementById('container-port');
    var hostPort = document.getElementById('host-port');

    var data = {};
    if (healthPath) data.health_path = healthPath.value;
    if (containerPort) data.container_port = parseInt(containerPort.value, 10) || 0;
    if (hostPort) data.host_port = parseInt(hostPort.value, 10) || 0;

    SentinelAPI.updateAppConfig(this._appName, data)
      .then(function () {
        return SentinelAPI.getApp(self._appName);
      })
      .then(function (app) {
        self._app = app || {};
        SentinelToast.show('Settings saved successfully', 'success');
      })
      .catch(function (err) {
        SentinelToast.show('Failed to save settings: ' + (err.message || 'Unknown error'), 'error');
      });
  };

  window.SentinelPages.AppDetailPage.prototype._rollbackLatest = function () {
    if (!confirm('Rollback to the previous deployment?')) return;
    var self = this;
    SentinelAPI.rollbackApp(this._appName)
      .then(function () {
        SentinelToast.show('Rollback initiated', 'success');
        return SentinelAPI.listAppDeployments(self._appName);
      })
      .then(function (deployments) {
        self._deployments = Array.isArray(deployments) ? deployments : [];
        self._renderDeployments();
      })
      .catch(function (err) {
        SentinelToast.show('Rollback failed: ' + (err.message || 'Unknown error'), 'error');
      });
  };

  window.SentinelPages.AppDetailPage.prototype._confirmDelete = function () {
    var self = this;
    var msg = 'Are you sure you want to delete "' + this._appName + '"? This action cannot be undone.';
    var modalHtml = SentinelUI.confirmModal(msg, 'Delete', 'Cancel');
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    var confirmBtn = document.getElementById('confirm-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        var overlay = confirmBtn.closest('.modal-overlay');
        if (overlay) overlay.remove();
        self._deleteApp();
      });
    }
  };

  window.SentinelPages.AppDetailPage.prototype._deleteApp = function () {
    var self = this;
    SentinelAPI.deleteApp(this._appName)
      .then(function () {
        SentinelToast.show('App deleted successfully', 'success');
        SentinelRouter.navigate('/apps');
      })
      .catch(function (err) {
        SentinelToast.show('Failed to delete app: ' + (err.message || 'Unknown error'), 'error');
      });
  };
})();
