(function () {
  'use strict';

  window.SentinelPages = window.SentinelPages || {};

  var esc = Sentinel.escapeHtml;

  var ACTION_OPTIONS = [
    { value: '', label: 'All Actions' },
    { value: 'deploy', label: 'Deploy' },
    { value: 'rollback', label: 'Rollback' },
    { value: 'scale', label: 'Scale' },
    { value: 'restart', label: 'Restart' },
    { value: 'delete', label: 'Delete' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'login', label: 'Login' },
    { value: 'config_change', label: 'Config Change' },
    { value: 'env_update', label: 'Env Update' },
    { value: 'domain_update', label: 'Domain Update' }
  ];

  window.SentinelPages.ActivityPage = {
    _entries: [],
    _currentPage: 1,
    _totalPages: 1,
    _total: 0,
    _filters: {},
    _expandedIndex: null,
    _detailEl: null,

    render: function () {
      var actionOpts = ACTION_OPTIONS.map(function (o) {
        return '<option value="' + esc(o.value) + '">' + esc(o.label) + '</option>';
      }).join('');

      var header = SentinelUI.pageHeader('Activity', 'Audit log of platform actions');

      var filterBar = '<div class="filter-bar" id="activity-filters">' +
        '<select class="form-select" id="filter-action" style="min-width:150px">' +
        actionOpts +
        '</select>' +
        '<input type="text" class="form-input" id="filter-user" placeholder="Filter by user..." style="min-width:180px" />' +
        '<input type="date" class="form-input" id="filter-date-from" style="min-width:140px" />' +
        '<span class="text-muted" style="line-height:36px">to</span>' +
        '<input type="date" class="form-input" id="filter-date-to" style="min-width:140px" />' +
        '</div>';

      var statsSection = SentinelUI.card('Overview',
        '<div class="metrics-grid" id="audit-stats">' +
          '<div class="metric-card"><div class="metric-label">Total Entries</div><div class="metric-value" id="stats-total">' + SentinelUI.skeleton('text') + '</div></div>' +
          '<div class="metric-card" id="stats-by-action"><div class="metric-label">Actions By Type</div><div class="metric-value" id="stats-breakdown" style="font-size:var(--text-xs)">' + SentinelUI.skeleton('text') + '</div></div>' +
        '</div>'
      );

      var logTable = SentinelUI.card('Audit Log',
        '<div id="audit-log-container">' +
          '<div class="loading-state"><div class="spinner spinner-lg"></div></div>' +
        '</div>' +
        '<div id="audit-pagination" style="margin-top:var(--space-4)"></div>' +
        '<div id="audit-detail-panel" style="margin-top:var(--space-4);display:none"></div>'
      );

      return '<div id="activity-page">' +
        header +
        filterBar +
        statsSection +
        logTable +
        '</div>';
    },

    onMount: function () {
      var self = this;

      var user = SentinelStore.getState('user');
      if (user && user.role === 'admin') {
        this._loadData();
      } else if (!user) {
        SentinelAPI.getMe()
          .then(function (me) {
            SentinelStore.setState('user', me);
            if (me && me.role === 'admin') {
              self._loadData();
            } else {
              self._showAdminError();
            }
          })
          .catch(function () {
            self._showAdminError();
          });
      } else {
        this._showAdminError();
        return;
      }

      Sentinel.delegateEvent('change', '#filter-action', function () {
        self._filters.action = this.value;
        self._currentPage = 1;
        self._fetchEntries();
      });

      var debounceTimer = null;
      Sentinel.delegateEvent('input', '#filter-user', function () {
        self._filters.user = this.value;
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          self._currentPage = 1;
          self._fetchEntries();
        }, 400);
      });

      Sentinel.delegateEvent('change', '#filter-date-from', function () {
        self._filters.date_from = this.value;
        self._currentPage = 1;
        self._fetchEntries();
      });

      Sentinel.delegateEvent('change', '#filter-date-to', function () {
        self._filters.date_to = this.value;
        self._currentPage = 1;
        self._fetchEntries();
      });

      Sentinel.delegateEvent('click', '#audit-log-container tbody tr', function () {
        var row = this;
        var index = row.getAttribute('data-index');
        if (index != null) {
          self._toggleDetail(parseInt(index, 10));
        }
      });
    },

    onUnmount: function () {
      this._entries = [];
      this._expandedIndex = null;
      this._detailEl = null;
    },

    _showAdminError: function () {
      var container = document.getElementById('activity-page');
      if (!container) return;
      container.innerHTML =
        '<div class="error-state" style="margin:var(--space-8) auto;max-width:400px">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
        '<h3>Admin Access Required</h3>' +
        '<p>You need admin privileges to view the activity log.</p>' +
        '</div>';
    },

    _loadData: function () {
      var self = this;
      SentinelAPI.getAuditLogStats()
        .then(function (stats) { self._renderStats(stats); })
        .catch(function (err) {
          console.error('Failed to load audit stats:', err);
        });
      this._fetchEntries();
    },

    _fetchEntries: function () {
      var self = this;
      var params = { limit: 50, page: this._currentPage };
      if (this._filters.action) params.action = this._filters.action;
      if (this._filters.user) params.user = this._filters.user;
      if (this._filters.date_from) params.date_from = this._filters.date_from;
      if (this._filters.date_to) params.date_to = this._filters.date_to;

      var container = document.getElementById('audit-log-container');
      if (container) {
        container.innerHTML = '<div class="loading-state"><div class="spinner spinner-lg"></div></div>';
      }

      SentinelAPI.listAuditLog(params)
        .then(function (data) {
          self._entries = data.entries || [];
          self._total = data.total || 0;
          self._totalPages = data.totalPages || 1;
          self._currentPage = data.page || 1;
          self._renderTable();
          self._renderPagination();
        })
        .catch(function (err) {
          console.error('Failed to load audit log:', err);
          if (container) {
            container.innerHTML = SentinelUI.errorState(err.message || 'Failed to load audit log');
          }
        });
    },

    _renderStats: function (stats) {
      if (!stats) return;

      var totalEl = document.getElementById('stats-total');
      if (totalEl) totalEl.textContent = stats.total_entries != null ? String(stats.total_entries) : '0';

      var breakdownEl = document.getElementById('stats-breakdown');
      if (breakdownEl && stats.by_action) {
        var keys = Object.keys(stats.by_action);
        if (keys.length === 0) {
          breakdownEl.textContent = 'No data';
        } else {
          var lines = keys.map(function (k) {
            return '<div style="display:flex;justify-content:space-between;gap:var(--space-4)">' +
              '<span>' + esc(k.replace(/_/g, ' ')) + '</span>' +
              '<strong>' + esc(String(stats.by_action[k])) + '</strong>' +
              '</div>';
          }).join('');
          breakdownEl.innerHTML = lines;
        }
      }
    },

    _renderTable: function () {
      var container = document.getElementById('audit-log-container');
      if (!container) return;

      var headers = ['Timestamp', 'User', 'Action', 'Resource Type', 'Details'];
      var rows = this._entries.map(function (entry, idx) {
        var actionLabel = (entry.action || 'unknown').replace(/_/g, ' ');
        var detailText = entry.details || entry.resource_name || '';
        if (detailText.length > 60) detailText = detailText.slice(0, 60) + '\u2026';
        return [
          '<span style="white-space:nowrap;font-size:var(--text-xs)">' + esc(Sentinel.formatDate(entry.timestamp)) + '</span>' +
          '<br><span class="text-muted" style="font-size:10px">' + esc(Sentinel.timeAgo(entry.timestamp)) + '</span>',
          esc(entry.user || '—'),
          SentinelUI.badge(actionLabel, 'neutral'),
          esc(entry.resource_type || '—'),
          esc(detailText)
        ];
      });

      var tableHtml = SentinelUI.dataTable(headers, rows, { emptyText: 'No audit log entries found' });

      container.innerHTML = tableHtml;

      var tbody = container.querySelector('tbody');
      if (tbody) {
        var trs = tbody.querySelectorAll('tr:not(.table-empty)');
        for (var i = 0; i < trs.length; i++) {
          trs[i].setAttribute('data-index', String(i));
          trs[i].style.cursor = 'pointer';
        }
      }
    },

    _renderPagination: function () {
      var container = document.getElementById('audit-pagination');
      if (!container) return;

      if (this._totalPages <= 1) {
        container.innerHTML = '';
        return;
      }

      var self = this;
      var onChangeSrc = 'window.SentinelPages.ActivityPage.goToPage({page})';
      container.innerHTML = SentinelUI.pagination(this._currentPage, this._totalPages,
        'window.SentinelPages.ActivityPage.goToPage'
      );
    },

    goToPage: function (page) {
      if (page < 1 || page > this._totalPages || page === this._currentPage) return;
      this._currentPage = page;
      this._expandedIndex = null;
      var detailPanel = document.getElementById('audit-detail-panel');
      if (detailPanel) detailPanel.style.display = 'none';
      this._fetchEntries();
    },

    _toggleDetail: function (index) {
      var entry = this._entries[index];
      if (!entry) return;

      var panel = document.getElementById('audit-detail-panel');
      if (!panel) return;

      if (this._expandedIndex === index) {
        panel.style.display = 'none';
        this._expandedIndex = null;
        return;
      }

      this._expandedIndex = index;

      var details = '';
      if (entry.details) {
        details += '<div class="form-row"><div class="form-group" style="flex:1"><label class="form-label">Details</label><div style="font-size:var(--text-sm);padding:var(--space-2) 0">' + esc(entry.details) + '</div></div></div>';
      }
      if (entry.metadata) {
        var metaStr = typeof entry.metadata === 'string' ? entry.metadata : JSON.stringify(entry.metadata, null, 2);
        details += '<div class="form-row"><div class="form-group" style="flex:1"><label class="form-label">Metadata</label>' + SentinelUI.codeBlock(metaStr, 'json') + '</div></div>';
      }
      if (entry.ip_address) {
        details += '<div class="form-row"><div class="form-group" style="flex:1"><label class="form-label">IP Address</label><div style="font-size:var(--text-sm);padding:var(--space-2) 0">' + esc(entry.ip_address) + '</div></div></div>';
      }
      if (entry.user_agent) {
        details += '<div class="form-row"><div class="form-group" style="flex:1"><label class="form-label">User Agent</label><div style="font-size:var(--text-sm);padding:var(--space-2) 0">' + esc(entry.user_agent) + '</div></div></div>';
      }

      if (!details) {
        details = '<p class="text-muted" style="padding:var(--space-3) 0">No additional details available.</p>';
      }

      panel.innerHTML = SentinelUI.card('Entry Details',
        '<div class="form-row">' +
          '<div class="form-group" style="flex:1"><label class="form-label">Timestamp</label><div style="font-size:var(--text-sm);padding:var(--space-2) 0">' + esc(Sentinel.formatDate(entry.timestamp)) + ' (' + esc(Sentinel.timeAgo(entry.timestamp)) + ')</div></div>' +
          '<div class="form-group" style="flex:1"><label class="form-label">User</label><div style="font-size:var(--text-sm);padding:var(--space-2) 0">' + esc(entry.user || '—') + '</div></div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group" style="flex:1"><label class="form-label">Action</label><div style="font-size:var(--text-sm);padding:var(--space-2) 0">' + SentinelUI.badge((entry.action || 'unknown').replace(/_/g, ' ')) + '</div></div>' +
          '<div class="form-group" style="flex:1"><label class="form-label">Resource Type</label><div style="font-size:var(--text-sm);padding:var(--space-2) 0">' + esc(entry.resource_type || '—') + '</div></div>' +
          '<div class="form-group" style="flex:1"><label class="form-label">Resource ID</label><div style="font-size:var(--text-sm);padding:var(--space-2) 0"><code>' + esc(entry.resource_id || '—') + '</code></div></div>' +
        '</div>' +
        details,
        { className: 'detail-card' }
      );

      panel.style.display = 'block';
    }
  };
})();
