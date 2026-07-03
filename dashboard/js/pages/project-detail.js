(function () {
  'use strict';

  window.SentinelPages = window.SentinelPages || {};

  window.SentinelPages.ProjectDetailPage = function () {
    var mounted = false;
    var project = null;
    var apps = [];
    var activeTab = 'apps';

    function render() {
      if (!project) {
        return SentinelUI.loadingState();
      }

      var breadcrumbHtml = SentinelUI.breadcrumb([
        { label: 'Projects', href: '/projects' },
        { label: project.name || 'Project' }
      ]);

      var headerHtml = SentinelUI.pageHeader(
        project.name || 'Untitled Project',
        project.description || ''
      );

      var tabDefs = [
        { id: 'apps', label: 'Apps' },
        { id: 'overview', label: 'Overview' },
        { id: 'settings', label: 'Settings' }
      ];

      var tabsHtml = SentinelUI.tabs(tabDefs, activeTab);

      var appsContent = SentinelUI.tabContent('apps', activeTab, renderAppsTab());
      var overviewContent = SentinelUI.tabContent('overview', activeTab, renderOverviewTab());
      var settingsContent = SentinelUI.tabContent('settings', activeTab, renderSettingsTab());

      return breadcrumbHtml + headerHtml + tabsHtml +
        appsContent + overviewContent + settingsContent;
    }

    function renderAppsTab() {
      if (!apps || apps.length === 0) {
        return SentinelUI.emptyState('No apps', 'This project has no apps yet.');
      }
      var html = '<div class="app-cards-grid">';
      for (var i = 0; i < apps.length; i++) {
        html += SentinelUI.appCard(apps[i]);
      }
      html += '</div>';
      return html;
    }

    function renderOverviewTab() {
      if (!project) return '';

      var fields = [
        { label: 'ID', value: project.id || '' },
        { label: 'Name', value: project.name || '' },
        { label: 'Description', value: project.description || 'No description' },
        { label: 'Created', value: project.created_at ? Sentinel.formatDate(project.created_at) : '-' },
        { label: 'Apps', value: String(apps.length) }
      ];

      var detailsHtml = '';
      for (var i = 0; i < fields.length; i++) {
        detailsHtml += '<div class="detail-group" style="padding:var(--space-2) 0;border-bottom:1px solid var(--border);display:flex;gap:var(--space-4)">' +
          '<div class="detail-label" style="min-width:120px;font-weight:500;color:var(--text-secondary);font-size:var(--text-sm)">' +
          Sentinel.escapeHtml(fields[i].label) +
          '</div>' +
          '<div class="detail-value" style="color:var(--text);font-size:var(--text-sm)">' +
          Sentinel.escapeHtml(fields[i].value) +
          '</div>' +
          '</div>';
      }

      return SentinelUI.card('Project Details', detailsHtml);
    }

    function renderSettingsTab() {
      return SentinelUI.card('Settings',
        '<p class="text-muted" style="color:var(--text-secondary);font-size:var(--text-sm)">Project settings will be available here.</p>'
      );
    }

    function onMount() {
      mounted = true;

      Sentinel.delegateEvent('click', '.tab', function (event, el) {
        var tabId = el.getAttribute('data-tab');
        if (tabId && tabId !== activeTab) {
          activeTab = tabId;
          var container = document.getElementById('app-content');
          if (container) container.innerHTML = render();
        }
      });

      var projectId = SentinelRouter.getParam('id');
      if (!projectId) {
        SentinelRouter.navigate('/projects');
        return;
      }

      Promise.all([
        SentinelAPI.getProject(projectId).catch(function () { return null; }),
        SentinelAPI.listApps().catch(function () { return []; })
      ]).then(function (results) {
        if (!mounted) return;

        project = results[0];
        var allApps = results[1];

        if (project && project.apps && Array.isArray(project.apps)) {
          apps = project.apps;
        } else if (Array.isArray(allApps)) {
          apps = allApps.filter(function (a) {
            return a.project_id === projectId;
          });
        } else {
          apps = [];
        }

        if (!project) {
          var container = document.getElementById('app-content');
          if (container) {
            container.innerHTML = SentinelUI.errorState('Project not found or could not be loaded.');
          }
          return;
        }

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
