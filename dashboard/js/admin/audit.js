(function () {
  'use strict';

  function esc(str) {
    if (str == null) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
  }

  window.SentinelPages = window.SentinelPages || {};

  window.SentinelPages.AdminAuditPage = function () {
    this._page = 1;
    this._limit = 20;
    this._filters = {};
    this._totalPages = 1;
  };

  window.SentinelPages.AdminAuditPage.prototype.render = function () {
    var icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:var(--space-2)"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';

    var header =
      '<div class="admin-section-title" style="display:flex;align-items:center;margin-bottom:var(--space-5)">' +
        icon +
        '<h2 style="margin:0">Audit Log</h2>' +
      '</div>';

    var statsHtml = '<div id="audit-stats" style="margin-bottom:var(--space-4)"></div>';

    var filterHtml =
      '<div class="filter-bar" id="audit-filters" style="margin-bottom:var(--space-4)">' +
        '<div class="search-box">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>' +
          '</svg>' +
          '<input type="text" id="audit-search" class="form-input" placeholder="Search actions..." style="padding-left:32px" />' +
        '</div>' +
        '<select id="audit-action-filter" class="form-select">' +
          '<option value="">All Actions</option>' +
          '<option value="create">Create</option>' +
          '<option value="update">Update</option>' +
          '<option value="delete">Delete</option>' +
          '<option value="login">Login</option>' +
          '<option value="logout">Logout</option>' +
          '<option value="deploy">Deploy</option>' +
          '<option value="rollback">Rollback</option>' +
        '</select>' +
        '<input type="date" id="audit-date-from" class="form-input" style="max-width:160px" placeholder="From date" />' +
        '<input type="date" id="audit-date-to" class="form-input" style="max-width:160px" placeholder="To date" />' +
      '</div>';

    var tableHtml = '<div id="audit-table-container">' + SentinelUI.loadingState() + '</div>';
    var paginationHtml = '<div id="audit-pagination" style="margin-top:var(--space-3)"></div>';

    return header + statsHtml + filterHtml + tableHtml + paginationHtml;
  };

  window.SentinelPages.AdminAuditPage.prototype.onMount = function () {
    var self = this;

    SentinelAPI.getAuditLogStats()
      .then(function (stats) {
        self._renderStats(stats);
      })
      .catch(function () {});

    self._fetchLogs();

    var searchInput = document.getElementById('audit-search');
    var actionFilter = document.getElementById('audit-action-filter');
    var dateFrom = document.getElementById('audit-date-from');
    var dateTo = document.getElementById('audit-date-to');

    var debounceTimer;

    function onFilterChange() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        self._filters = {};
        if (searchInput && searchInput.value) self._filters.search = searchInput.value;
        if (actionFilter && actionFilter.value) self._filters.action = actionFilter.value;
        if (dateFrom && dateFrom.value) self._filters.date_from = dateFrom.value;
        if (dateTo && dateTo.value) self._filters.date_to = dateTo.value;
        self._page = 1;
        self._fetchLogs();
      }, 300);
    }

    if (searchInput) searchInput.addEventListener('input', onFilterChange);
    if (actionFilter) actionFilter.addEventListener('change', onFilterChange);
    if (dateFrom) dateFrom.addEventListener('change', onFilterChange);
    if (dateTo) dateTo.addEventListener('change', onFilterChange);
  };

  window.SentinelPages.AdminAuditPage.prototype._fetchLogs = function () {
    var self = this;
    var container = document.getElementById('audit-table-container');
    if (!container) return;

    container.innerHTML = SentinelUI.loadingState();

    var params = {
      limit: self._limit,
      offset: (self._page - 1) * self._limit
    };
    if (self._filters.search) params.search = self._filters.search;
    if (self._filters.action) params.action = self._filters.action;
    if (self._filters.date_from) params.date_from = self._filters.date_from;
    if (self._filters.date_to) params.date_to = self._filters.date_to;

    SentinelAPI.listAuditLog(params)
      .then(function (data) {
        var entries = Array.isArray(data) ? data : (data.entries || data.data || data.results || []);
        var total = data.total || data.count || entries.length;
        self._totalPages = Math.max(1, Math.ceil(total / self._limit));

        self._renderTable(entries);
        self._renderPagination();
      })
      .catch(function (err) {
        container.innerHTML = SentinelUI.emptyState('Error', err.message || 'Failed to load audit log.');
      });
  };

  window.SentinelPages.AdminAuditPage.prototype._renderStats = function (stats) {
    var container = document.getElementById('audit-stats');
    if (!container || !stats) return;

    var totalEntries = stats.total || stats.count || '—';
    var uniqueUsers = stats.unique_users || stats.users || '—';
    var dateRange = stats.date_range || '';

    var html =
      '<div style="display:flex;gap:var(--space-4);flex-wrap:wrap">' +
        '<div class="metric-card" style="flex:1;min-width:120px">' +
          '<div class="metric-label">Total Entries</div>' +
          '<div class="metric-value">' + esc(String(totalEntries)) + '</div>' +
        '</div>' +
        '<div class="metric-card" style="flex:1;min-width:120px">' +
          '<div class="metric-label">Unique Users</div>' +
          '<div class="metric-value">' + esc(String(uniqueUsers)) + '</div>' +
        '</div>' +
        (dateRange
          ? '<div class="metric-card" style="flex:2;min-width:200px">' +
              '<div class="metric-label">Date Range</div>' +
              '<div class="metric-value" style="font-size:var(--text-sm)">' + esc(dateRange) + '</div>' +
            '</div>'
          : '') +
      '</div>';

    container.innerHTML = html;
  };

  window.SentinelPages.AdminAuditPage.prototype._renderTable = function (entries) {
    var container = document.getElementById('audit-table-container');
    if (!container) return;

    if (!entries || entries.length === 0) {
      container.innerHTML = SentinelUI.emptyState('No Entries', 'No audit log entries match your filters.');
      return;
    }

    var headers = ['Action', 'User', 'Resource', 'Details', 'IP Address', 'Timestamp'];
    var rows = entries.map(function (e) {
      var actionBadge = SentinelUI.badge(
        e.action ? e.action.charAt(0).toUpperCase() + e.action.slice(1) : '—',
        e.action === 'delete' ? 'error' : e.action === 'create' ? 'success' : e.action === 'login' ? 'info' : 'neutral'
      );
      return [
        actionBadge,
        esc(e.user || e.username || e.user_id || '—'),
        esc(e.resource || e.resource_type || e.resource_id || '—'),
        esc(e.details || e.description || e.message || '—'),
        esc(e.ip || e.ip_address || '—'),
        esc(Sentinel.formatDate(e.timestamp || e.created_at) || '—')
      ];
    });

    container.innerHTML = SentinelUI.dataTable(headers, rows, { emptyText: 'No audit log entries found.' });
  };

  window.SentinelPages.AdminAuditPage.prototype._renderPagination = function () {
    var container = document.getElementById('audit-pagination');
    if (!container) return;

    var self = this;
    var onChange = function (page) {
      self._page = page;
      self._fetchLogs();
    }.bind(this);

    container.innerHTML = SentinelUI.pagination(this._page, this._totalPages, onChange);
  };
})();
