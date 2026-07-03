(function () {
  'use strict';

  function esc(str) {
    if (str == null) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
  }

  window.SentinelPages = window.SentinelPages || {};

  window.SentinelPages.CreateProjectPage = function () {
    this.currentStep = 0;
    this.githubRepos = [];
    this.repoName = '';
    this.repoUrl = '';
    this.healthCheckPath = '/health';
    this.containerPort = '3000';
    this.hostPort = '';
    this.projectId = '';
    this.projects = [];
    this.deploying = false;
    this.deployResult = null;
  };

  window.SentinelPages.CreateProjectPage.prototype.render = function () {
    var steps = [
      { label: 'Connect' },
      { label: 'Configure' },
      { label: 'Deploy' }
    ];

    var header = SentinelUI.pageHeader('Create New App',
      'Import a repository from GitHub or configure manually');

    var stepsHtml = SentinelUI.wizardSteps(steps, this.currentStep);

    var step1Html = this._renderStep1();
    var step2Html = this._renderStep2();
    var step3Html = this._renderStep3();

    var backHtml = this.currentStep > 0
      ? '<button class="btn btn-ghost" data-nav="back">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><polyline points="15 18 9 12 15 6"/></svg>' +
        'Back</button>'
      : '<div></div>';

    var nextText = this.currentStep === 2 ? 'Deploy' : 'Next';
    var nextHtml = '<button class="btn btn-primary" data-nav="next"' +
      (this.deploying ? ' disabled' : '') + '>' + esc(nextText) + '</button>';

    var navHtml = '<div class="step-nav" style="display:flex;justify-content:space-between;align-items:center;margin-top:var(--space-6);padding-top:var(--space-4);border-top:1px solid var(--border)">' +
      backHtml +
      nextHtml +
      '</div>';

    return '<div id="create-app-page">' +
      header +
      '<div style="margin-top:var(--space-6)">' + stepsHtml + '</div>' +
      '<div class="step-body" style="margin-top:var(--space-6)">' +
        '<div class="step-panel" data-step="0"' + (this.currentStep !== 0 ? ' style="display:none"' : '') + '>' + step1Html + '</div>' +
        '<div class="step-panel" data-step="1"' + (this.currentStep !== 1 ? ' style="display:none"' : '') + '>' + step2Html + '</div>' +
        '<div class="step-panel" data-step="2"' + (this.currentStep !== 2 ? ' style="display:none"' : '') + '>' + step3Html + '</div>' +
      '</div>' +
      navHtml +
      '</div>';
  };

  window.SentinelPages.CreateProjectPage.prototype._renderStep1 = function () {
    var repoListHtml = '';
    if (this.githubRepos.length > 0) {
      repoListHtml = '<div id="github-repos-list" class="github-repos-list">' + this._renderGithubRepos() + '</div>';
    } else {
      repoListHtml = '<div id="github-repos-list"></div>';
    }

    var connectBtn = SentinelUI.button('Connect GitHub', 'outline', '', {
      className: 'github-connect-btn',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>',
    });

    var githubSection = SentinelUI.card('Import from GitHub',
      '<p class="text-sm text-muted" style="margin-bottom:var(--space-3)">Connect to GitHub to browse your repositories.</p>' +
      '<div id="github-connect-area">' +
        connectBtn +
        repoListHtml +
      '</div>'
    );

    var nameInput = SentinelUI.input('Repository Name', 'repo-name', 'text', this.repoName,
      'e.g. my-awesome-app', { hint: 'Name of your application', required: true });

    var urlInput = SentinelUI.input('Repository URL', 'repo-url', 'url', this.repoUrl,
      'e.g. https://github.com/user/repo.git', { hint: 'Full URL to the Git repository', required: true });

    var manualSection = SentinelUI.card('Or Configure Manually',
      nameInput + urlInput
    );

    return githubSection + manualSection;
  };

  window.SentinelPages.CreateProjectPage.prototype._renderGithubRepos = function () {
    var self = this;
    if (!this.githubRepos || this.githubRepos.length === 0) return '';

    var html = '<p class="text-sm text-muted" style="margin-bottom:var(--space-2)">Select a repository to import:</p>' +
      '<div class="github-repos" style="display:flex;flex-direction:column;gap:var(--space-2);max-height:300px;overflow-y:auto">';

    for (var i = 0; i < this.githubRepos.length; i++) {
      var repo = this.githubRepos[i];
      var name = repo.name || '';
      var description = repo.description || '';
      var language = repo.language || '';
      var url = repo.url || repo.clone_url || repo.html_url || '';
      var langBadge = language
        ? SentinelUI.badge(language, 'neutral')
        : '';

      html += '<div class="github-repo-item" data-repo-name="' + esc(name) + '" data-repo-url="' + esc(url) + '"' +
        ' style="padding:var(--space-2) var(--space-3);border:1px solid var(--border);border-radius:var(--radius);cursor:pointer;transition:border-color .15s" ' +
        ' onmouseover="this.style.borderColor=\'var(--accent)\'" onmouseout="this.style.borderColor=\'var(--border)\'">' +
        '<div style="display:flex;align-items:center;justify-content:space-between">' +
        '<div>' +
        '<div style="font-weight:500;font-size:var(--text-sm)">' + esc(name) + '</div>' +
        (description ? '<div class="text-xs text-muted" style="margin-top:2px">' + esc(description) + '</div>' : '') +
        '</div>' +
        (langBadge ? '<div>' + langBadge + '</div>' : '') +
        '</div>' +
        '</div>';
    }

    html += '</div>';
    return html;
  };

  window.SentinelPages.CreateProjectPage.prototype._renderStep2 = function () {
    var healthInput = SentinelUI.input('Health Check Path', 'health-check-path', 'text',
      this.healthCheckPath, '/health', { hint: 'Path used for health monitoring' });

    var containerInput = SentinelUI.input('Container Port', 'container-port', 'number',
      this.containerPort, '3000', { hint: 'Port your application listens on inside the container' });

    var hostInput = SentinelUI.input('Host Port', 'host-port', 'number',
      this.hostPort, '', { hint: 'Leave empty for auto-assignment' });

    var projectOpts = [{ value: '', label: 'No project' }];
    for (var i = 0; i < this.projects.length; i++) {
      var p = this.projects[i];
      projectOpts.push({ value: p.id || p._id || '', label: p.name || 'Unnamed' });
    }
    var projectSelect = SentinelUI.select('Project Association', 'project-select',
      projectOpts, this.projectId);

    return SentinelUI.card('Configuration',
      '<p class="text-sm text-muted" style="margin-bottom:var(--space-4)">Configure your application deployment settings.</p>' +
      healthInput +
      '<div class="form-row">' + containerInput + hostInput + '</div>' +
      projectSelect
    );
  };

  window.SentinelPages.CreateProjectPage.prototype._renderStep3 = function () {
    var projectName = '';
    for (var i = 0; i < this.projects.length; i++) {
      if ((this.projects[i].id || this.projects[i]._id || '') === this.projectId) {
        projectName = this.projects[i].name || '';
        break;
      }
    }

    var hostPortDisplay = this.hostPort || 'Auto-assigned';

    var summaryRows = [
      '<tr><td style="padding:var(--space-1) var(--space-2);font-weight:500;white-space:nowrap;color:var(--text-secondary)">Repository</td><td style="padding:var(--space-1) var(--space-2)">' + esc(this.repoName) + '</td></tr>',
      '<tr><td style="padding:var(--space-1) var(--space-2);font-weight:500;white-space:nowrap;color:var(--text-secondary)">Repository URL</td><td style="padding:var(--space-1) var(--space-2);font-family:var(--font-mono);font-size:var(--text-xs)">' + esc(this.repoUrl) + '</td></tr>',
      '<tr><td style="padding:var(--space-1) var(--space-2);font-weight:500;white-space:nowrap;color:var(--text-secondary)">Health Check</td><td style="padding:var(--space-1) var(--space-2)">' + esc(this.healthCheckPath) + '</td></tr>',
      '<tr><td style="padding:var(--space-1) var(--space-2);font-weight:500;white-space:nowrap;color:var(--text-secondary)">Container Port</td><td style="padding:var(--space-1) var(--space-2)">' + esc(this.containerPort) + '</td></tr>',
      '<tr><td style="padding:var(--space-1) var(--space-2);font-weight:500;white-space:nowrap;color:var(--text-secondary)">Host Port</td><td style="padding:var(--space-1) var(--space-2)">' + esc(hostPortDisplay) + '</td></tr>',
      '<tr><td style="padding:var(--space-1) var(--space-2);font-weight:500;white-space:nowrap;color:var(--text-secondary)">Project</td><td style="padding:var(--space-1) var(--space-2)">' + esc(projectName || 'None') + '</td></tr>',
    ];

    var summaryHtml = '<div id="deploy-summary-section">' +
      SentinelUI.card('Deployment Summary',
        '<p class="text-sm text-muted" style="margin-bottom:var(--space-3)">Review your configuration before deploying.</p>' +
        '<table style="width:100%;border-collapse:collapse">' +
        summaryRows.join('') +
        '</table>'
      ) +
      '</div>';

    var terminalHtml = '<div id="deploy-terminal" style="margin-top:var(--space-4);' +
      (this.deployResult ? '' : 'display:none') + '">' +
      SentinelUI.terminal(this._getTerminalLines(), { title: 'Deployment Output' }) +
      '</div>';

    return summaryHtml + terminalHtml;
  };

  window.SentinelPages.CreateProjectPage.prototype._getTerminalLines = function () {
    var lines = [];
    if (this.deployResult === null) return [];

    if (this.deployResult === 'deploying') {
      lines.push({ text: 'Starting deployment...', type: 'info' });
      lines.push({ text: 'Cloning repository...', type: 'info' });
      lines.push({ text: 'Building application...', type: 'info' });
      return lines;
    }

    if (this.deployResult && this.deployResult.success) {
      lines.push({ text: 'Repository cloned successfully', type: 'success' });
      lines.push({ text: 'Application built and deployed', type: 'success' });
      lines.push({ text: 'Deployment complete!', type: 'success' });
      var appName = this.deployResult.app && (this.deployResult.app.name || this.deployResult.app.app_name);
      if (appName) {
        lines.push({ text: 'App URL: /apps/' + appName, type: 'info' });
      }
    } else if (this.deployResult && this.deployResult.error) {
      lines.push({ text: 'Deployment failed: ' + (this.deployResult.error.message || this.deployResult.error), type: 'error' });
    }

    return lines;
  };

  window.SentinelPages.CreateProjectPage.prototype.onMount = function () {
    var self = this;
    this._loadProjects();

    var page = document.getElementById('create-app-page');
    if (!page) return;

    page.addEventListener('click', function (e) {
      var navBtn = e.target.closest('[data-nav]');
      if (navBtn) {
        var action = navBtn.getAttribute('data-nav');
        if (action === 'back') self._goBack();
        else if (action === 'next') self._goNext();
        return;
      }

      var connectBtn = e.target.closest('.github-connect-btn');
      if (connectBtn) {
        self._connectGithub();
        return;
      }

      var repoItem = e.target.closest('.github-repo-item');
      if (repoItem) {
        self._selectRepo(repoItem);
        return;
      }
    });

    var repoNameInput = document.querySelector('[name="repo-name"]');
    var repoUrlInput = document.querySelector('[name="repo-url"]');
    if (repoNameInput) {
      repoNameInput.addEventListener('input', function () {
        self.repoName = this.value;
      });
    }
    if (repoUrlInput) {
      repoUrlInput.addEventListener('input', function () {
        self.repoUrl = this.value;
      });
    }

    var healthInput = document.querySelector('[name="health-check-path"]');
    var containerInput = document.querySelector('[name="container-port"]');
    var hostInput = document.querySelector('[name="host-port"]');
    var projectSelect = document.querySelector('[name="project-select"]');

    if (healthInput) {
      healthInput.addEventListener('input', function () {
        self.healthCheckPath = this.value;
      });
    }
    if (containerInput) {
      containerInput.addEventListener('input', function () {
        self.containerPort = this.value;
      });
    }
    if (hostInput) {
      hostInput.addEventListener('input', function () {
        self.hostPort = this.value;
      });
    }
    if (projectSelect) {
      projectSelect.addEventListener('change', function () {
        self.projectId = this.value;
      });
    }
  };

  window.SentinelPages.CreateProjectPage.prototype._loadProjects = function () {
    var self = this;
    SentinelAPI.listProjects()
      .then(function (projects) {
        self.projects = Array.isArray(projects) ? projects : [];
        var projectSelect = document.querySelector('[name="project-select"]');
        if (projectSelect) {
          var html = '<option value="">No project</option>';
          for (var i = 0; i < self.projects.length; i++) {
            var p = self.projects[i];
            var pid = p.id || p._id || '';
            var selected = pid === self.projectId ? ' selected' : '';
            html += '<option value="' + esc(pid) + '"' + selected + '>' + esc(p.name || 'Unnamed') + '</option>';
          }
          projectSelect.innerHTML = html;
        }
      })
      .catch(function () {
        // Silently fail - projects are optional
      });
  };

  window.SentinelPages.CreateProjectPage.prototype._connectGithub = function () {
    var self = this;
    var connectArea = document.getElementById('github-connect-area');
    if (!connectArea) return;

    connectArea.innerHTML = SentinelUI.loadingState();

    SentinelAPI.listGithubRepos()
      .then(function (repos) {
        self.githubRepos = Array.isArray(repos) ? repos : [];
        var html = '<div id="github-repos-list" class="github-repos-list">' + self._renderGithubRepos() + '</div>';
        connectArea.innerHTML = html;
      })
      .catch(function (err) {
        connectArea.innerHTML =
          '<div class="error-state" style="padding:var(--space-3)">' +
          '<p class="text-sm">' + esc(err.message || 'Failed to fetch GitHub repositories. Make sure GitHub is connected in your settings.') + '</p>' +
          '<button class="btn btn-outline btn-sm github-connect-btn" style="margin-top:var(--space-2)">Try Again</button>' +
          '</div>';
      });
  };

  window.SentinelPages.CreateProjectPage.prototype._selectRepo = function (element) {
    var name = element.getAttribute('data-repo-name') || '';
    var url = element.getAttribute('data-repo-url') || '';

    this.repoName = name;
    this.repoUrl = url;

    var repoItems = document.querySelectorAll('.github-repo-item');
    for (var i = 0; i < repoItems.length; i++) {
      repoItems[i].style.borderColor = 'var(--border)';
      repoItems[i].style.backgroundColor = '';
    }
    element.style.borderColor = 'var(--accent)';
    element.style.backgroundColor = 'var(--accent-bg, rgba(59,130,246,0.08))';

    var nameInput = document.querySelector('[name="repo-name"]');
    var urlInput = document.querySelector('[name="repo-url"]');
    if (nameInput) {
      nameInput.value = name;
      nameInput.dispatchEvent(new Event('input'));
    }
    if (urlInput) {
      urlInput.value = url;
      urlInput.dispatchEvent(new Event('input'));
    }
  };

  window.SentinelPages.CreateProjectPage.prototype._goNext = function () {
    if (this.currentStep === 0) {
      var nameInput = document.querySelector('[name="repo-name"]');
      var urlInput = document.querySelector('[name="repo-url"]');
      var name = nameInput ? nameInput.value : this.repoName;
      var url = urlInput ? urlInput.value : this.repoUrl;

      if (!name || !name.trim()) {
        SentinelToast.show('Please enter a repository name.', 'warning');
        if (nameInput) nameInput.focus();
        return;
      }
      if (!url || !url.trim()) {
        SentinelToast.show('Please enter a repository URL.', 'warning');
        if (urlInput) urlInput.focus();
        return;
      }
      this.repoName = name.trim();
      this.repoUrl = url.trim();
    }

    if (this.currentStep === 1) {
      var healthInput = document.querySelector('[name="health-check-path"]');
      var containerInput = document.querySelector('[name="container-port"]');
      var hostInput = document.querySelector('[name="host-port"]');
      var projectSelect = document.querySelector('[name="project-select"]');

      this.healthCheckPath = (healthInput ? healthInput.value : '/health') || '/health';
      this.containerPort = (containerInput ? containerInput.value : '3000') || '3000';
      this.hostPort = hostInput ? hostInput.value : '';
      this.projectId = projectSelect ? projectSelect.value : '';

      if (!this.containerPort || isNaN(parseInt(this.containerPort, 10))) {
        SentinelToast.show('Please enter a valid container port number.', 'warning');
        if (containerInput) containerInput.focus();
        return;
      }
    }

    if (this.currentStep === 2) {
      this._deploy();
      return;
    }

    this.currentStep++;
    this._refreshView();
  };

  window.SentinelPages.CreateProjectPage.prototype._goBack = function () {
    if (this.currentStep <= 0) return;
    this.currentStep--;
    this._refreshView();
  };

  window.SentinelPages.CreateProjectPage.prototype._refreshView = function () {
    var stepPanels = document.querySelectorAll('.step-panel');
    for (var i = 0; i < stepPanels.length; i++) {
      var panel = stepPanels[i];
      var step = parseInt(panel.getAttribute('data-step'), 10);
      panel.style.display = step === this.currentStep ? '' : 'none';
    }

    var stepsContainer = document.querySelector('.steps');
    if (stepsContainer) {
      var steps = [
        { label: 'Connect' },
        { label: 'Configure' },
        { label: 'Deploy' }
      ];
      stepsContainer.outerHTML = SentinelUI.wizardSteps(steps, this.currentStep);
    }

    var stepNav = document.querySelector('.step-nav');
    if (stepNav) {
      var backBtn = stepNav.querySelector('[data-nav="back"]');
      if (backBtn) {
        backBtn.style.display = this.currentStep === 0 ? 'none' : '';
      }

      var nextBtn = stepNav.querySelector('[data-nav="next"]');
      if (nextBtn) {
        var text = this.currentStep === 2 ? 'Deploy' : 'Next';
        nextBtn.textContent = text;
        nextBtn.disabled = this.deploying;
      }
    }
  };

  window.SentinelPages.CreateProjectPage.prototype._deploy = function () {
    var self = this;
    if (this.deploying) return;

    this.deploying = true;
    this.deployResult = 'deploying';

    var terminalContainer = document.getElementById('deploy-terminal');
    if (terminalContainer) {
      terminalContainer.style.display = '';
      terminalContainer.innerHTML = SentinelUI.terminal(this._getTerminalLines(), { title: 'Deployment Output' });
    }

    var nextBtn = document.querySelector('[data-nav="next"]');
    if (nextBtn) {
      nextBtn.disabled = true;
      nextBtn.textContent = 'Deploying...';
    }

    var projectId = this.projectId || undefined;

    SentinelAPI.importApp(this.repoName, this.repoUrl, projectId)
      .then(function (result) {
        self.deploying = false;
        self.deployResult = { success: true, app: result && result.app ? result.app : result, data: result };
        self._updateTerminal();
        SentinelToast.show('App deployed successfully!', 'success');

        var appName = result && (result.name || result.app_name || (result.app && (result.app.name || result.app.app_name)));
        if (appName) {
          setTimeout(function () {
            SentinelRouter.navigate('/apps/' + encodeURIComponent(appName));
          }, 1500);
        }
      })
      .catch(function (err) {
        self.deploying = false;
        self.deployResult = { success: false, error: err.message || 'Deployment failed' };
        self._updateTerminal();
        SentinelToast.show(err.message || 'Deployment failed.', 'error');

        var nextBtn2 = document.querySelector('[data-nav="next"]');
        if (nextBtn2) {
          nextBtn2.disabled = false;
          nextBtn2.textContent = 'Deploy';
        }
      });
  };

  window.SentinelPages.CreateProjectPage.prototype._updateTerminal = function () {
    var terminalContainer = document.getElementById('deploy-terminal');
    if (terminalContainer) {
      terminalContainer.innerHTML = SentinelUI.terminal(this._getTerminalLines(), { title: 'Deployment Output' });
    }

    var nextBtn = document.querySelector('[data-nav="next"]');
    if (nextBtn && !this.deploying) {
      nextBtn.disabled = false;
      nextBtn.textContent = 'Deploy';
    }
  };
})();
