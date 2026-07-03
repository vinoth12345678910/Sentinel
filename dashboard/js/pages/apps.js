(function () {
  'use strict';

  function esc(str) {
    if (str == null) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
  }

  window.SentinelPages = window.SentinelPages || {};

  window.SentinelPages.AppsPage = function () {};

  window.SentinelPages.AppsPage.prototype.render = function () {
    var importBtn = SentinelUI.button('Import from GitHub', 'primary', '', {
      icon: SentinelUI.icon ? undefined : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    });
    var header = SentinelUI.pageHeader('Apps', 'Manage all your deployed applications', importBtn);

    var searchHtml =
      '<div class="filter-bar" style="margin-bottom:var(--space-4)">' +
        '<div class="search-box">' +
          SentinelUI.icon ? SentinelUI.icon : '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
          '<input type="text" id="app-search" class="form-input" placeholder="Search apps..." style="padding-left:32px" />' +
        '</div>' +
        '<select id="status-filter" class="form-select">' +
          '<option value="">All Statuses</option>' +
          '<option value="running">Running</option>' +
          '<option value="deploying">Deploying</option>' +
          '<option value="failed">Failed</option>' +
          '<option value="pending">Pending</option>' +
        '</select>' +
      '</div>';

    var listHtml = '<div id="apps-list" class="app-list">' + SentinelUI.loadingState() + '</div>';

    return header + searchHtml + listHtml;
  };

  window.SentinelPages.AppsPage.prototype.onMount = function () {
    var self = this;
    this._apps = [];

    var container = document.getElementById('apps-list');

    SentinelAPI.listApps()
      .then(function (apps) {
        self._apps = Array.isArray(apps) ? apps : [];
        self._renderApps(self._apps);
      })
      .catch(function (err) {
        container.innerHTML = SentinelUI.emptyState(
          'No Apps Found',
          err.message || 'Could not load apps. Make sure you have created some applications.'
        );
      });

    var searchInput = document.getElementById('app-search');
    var statusFilter = document.getElementById('status-filter');

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        self._filterApps();
      });
    }

    if (statusFilter) {
      statusFilter.addEventListener('change', function () {
        self._filterApps();
      });
    }

    var importBtn = document.querySelector('.page-header .btn-primary');
    if (importBtn) {
      importBtn.addEventListener('click', function () {
        SentinelRouter.navigate('/create');
      });
    }
  };

  window.SentinelPages.AppsPage.prototype._filterApps = function () {
    var searchVal = (document.getElementById('app-search') && document.getElementById('app-search').value.toLowerCase()) || '';
    var statusVal = (document.getElementById('status-filter') && document.getElementById('status-filter').value) || '';

    var filtered = this._apps.filter(function (app) {
      var name = (app.name || app.app_name || '').toLowerCase();
      var matchesSearch = !searchVal || name.indexOf(searchVal) !== -1;
      var matchesStatus = !statusVal || (app.status || '') === statusVal;
      return matchesSearch && matchesStatus;
    });

    this._renderApps(filtered);
  };

  window.SentinelPages.AppsPage.prototype._renderApps = function (apps) {
    var container = document.getElementById('apps-list');
    if (!container) return;

    if (!apps || apps.length === 0) {
      container.innerHTML = SentinelUI.emptyState(
        'No Apps',
        'No applications found. Import a repository from GitHub to get started.'
      );
      return;
    }

    var html = '';
    for (var i = 0; i < apps.length; i++) {
      var app = apps[i];
      var cardHtml = SentinelUI.appCard(app);

      var wrapperId = 'app-card-' + (app.name || app.app_name || i);
      html += '<div id="' + esc(wrapperId) + '" class="app-card-wrapper" data-app-name="' + esc(app.name || app.app_name || '') + '">' + cardHtml + '</div>';
    }

    container.innerHTML = html;

    container.querySelectorAll('.app-card-wrapper').forEach(function (wrapper) {
      wrapper.addEventListener('click', function (e) {
        var link = wrapper.querySelector('.app-card');
        if (link) {
          e.preventDefault();
          var appName = wrapper.getAttribute('data-app-name');
          if (appName) {
            SentinelRouter.navigate('/apps/' + encodeURIComponent(appName));
          }
        }
      });
    });
  };
})();
