(function () {
  'use strict';

  /* ---- SVG Icons ---- */
  var ICONS = {
    home: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    folder: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    terminal: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
    plus: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    'git-branch': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>',
    settings: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    users: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    activity: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    monitor: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    lock: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    search: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    bell: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    'x': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    'chevron-down': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    'chevron-left': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    'chevron-right': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    'menu': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    'rocket': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
    'alert-circle': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    'inbox': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
    'copy': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    'check': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    'app': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    'refresh-cw': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
    'trash': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    'loader': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spinner"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>',
  };

  function esc(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function initials(name) {
    if (!name) return '?';
    var parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function timeAgo(dateStr) {
    var now = Date.now();
    var then = new Date(dateStr).getTime();
    var diff = Math.max(0, now - then);
    var seconds = Math.floor(diff / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);

    if (days > 0) return days + 'd ago';
    if (hours > 0) return hours + 'h ago';
    if (minutes > 0) return minutes + 'm ago';
    return 'just now';
  }

  function isActive(sectionItems, activePath) {
    return sectionItems.some(function (item) {
      return item.href && activePath && activePath.startsWith(item.href);
    });
  }

  var SentinelUI = {
    /* ============ LAYOUT ============ */

    sidebar: function (sections, activePath) {
      activePath = activePath || '';
      var html = '<div class="sidebar-header">' +
        '<a href="#/" class="sidebar-logo">' +
        ICONS.rocket +
        '<span>Sentinel</span>' +
        '</a>' +
        '</div>' +
        '<nav class="sidebar-nav">';

      for (var s = 0; s < sections.length; s++) {
        var section = sections[s];
        var secActive = isActive(section.items || [], activePath);
        html += '<div class="sidebar-section">' +
          '<div class="sidebar-section-title">' + esc(section.title) + '</div>';

        var items = section.items || [];
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var active = item.href && activePath === item.href
            ? ' active'
            : (item.href && activePath.startsWith(item.href) ? ' active' : '');
          var badgeHtml = '';
          if (item.badge) {
            var badgeType = item.badgeType || 'info';
            badgeHtml = '<span class="badge badge-' + badgeType + '">' + esc(item.badge) + '</span>';
          }
          var iconHtml = ICONS[item.icon] || '';
          html += '<a href="#' + esc(item.href || '') + '" class="nav-item' + active + '">' +
            iconHtml +
            '<span>' + esc(item.label) + '</span>' +
            badgeHtml +
            '</a>';
        }
        html += '</div>';
      }

      html += '</nav>';

      var user = sections._user || {};
      var userInitials = initials(user.name || 'User');
      var username = user.name || 'User';

      html += '<div class="sidebar-footer">' +
        '<a href="#/settings" class="nav-item">' +
        '<span class="navbar-avatar" style="width:26px;height:26px;font-size:10px;margin:0">' + esc(userInitials) + '</span>' +
        '<span style="font-size:var(--text-sm)">' + esc(username) + '</span>' +
        '</a>' +
        '</div>';

      return html;
    },

    navbar: function (title, user) {
      var userInitials = initials(user && user.name);
      var displayName = user && user.name ? user.name : 'User';
      return '<header class="navbar">' +
        '<div class="navbar-left">' +
        '<button class="sidebar-toggle" onclick="document.querySelector(\'.sidebar\').classList.toggle(\'open\');document.querySelector(\'.sidebar-overlay\').classList.toggle(\'open\')">' +
        ICONS.menu +
        '</button>' +
        '<h4>' + esc(title) + '</h4>' +
        '</div>' +
        '<div class="navbar-right">' +
        '<div class="navbar-search search-desktop">' +
        ICONS.search +
        '<input type="text" placeholder="Search..." />' +
        '</div>' +
        '<button class="navbar-icon-btn">' +
        ICONS.bell +
        '<span class="dot"></span>' +
        '</button>' +
        '<div class="navbar-avatar" title="' + esc(displayName) + '">' + esc(userInitials) + '</div>' +
        '</div>' +
        '</header>';
    },

    pageHeader: function (title, subtitle, actionsHtml) {
      var actions = actionsHtml
        ? '<div style="display:flex;gap:var(--space-2);align-items:center">' + actionsHtml + '</div>'
        : '';
      return '<div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between">' +
        '<div>' +
        '<h1>' + esc(title) + '</h1>' +
        (subtitle ? '<p>' + esc(subtitle) + '</p>' : '') +
        '</div>' +
        actions +
        '</div>';
    },

    breadcrumb: function (items) {
      if (!items || !items.length) return '';
      var html = '<div class="breadcrumb">';
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (i > 0) {
          html += '<span class="breadcrumb-sep">/</span>';
        }
        if (item.href) {
          html += '<a href="' + esc(item.href) + '">' + esc(item.label) + '</a>';
        } else {
          html += '<span>' + esc(item.label) + '</span>';
        }
      }
      html += '</div>';
      return html;
    },

    metricsGrid: function (metrics) {
      if (!metrics || !metrics.length) return '';
      var html = '<div class="metrics-grid">';
      for (var i = 0; i < metrics.length; i++) {
        var m = metrics[i];
        var changeHtml = '';
        if (m.change !== undefined && m.change !== null) {
          var cls = 'metric-change' + (m.change > 0 ? ' up' : (m.change < 0 ? ' down' : ''));
          var prefix = m.change > 0 ? '+' : '';
          changeHtml = '<div class="' + cls + '">' + prefix + esc(String(m.change)) + '</div>';
        }
        html += '<div class="metric-card">' +
          '<div class="metric-label">' + esc(m.label) + '</div>' +
          '<div class="metric-value">' + esc(String(m.value)) + '</div>' +
          changeHtml +
          '</div>';
      }
      html += '</div>';
      return html;
    },

    /* ============ CARD ============ */

    card: function (title, bodyHtml, options) {
      options = options || {};
      var header = title
        ? '<div class="card-header">' +
          '<span class="card-title">' + esc(title) + '</span>' +
          (options.actions || '') +
          '</div>'
        : '';
      var cls = 'card' + (options.className ? ' ' + options.className : '');
      return '<div class="' + cls + '">' + header + '<div class="card-body">' + bodyHtml + '</div></div>';
    },

    appCard: function (app) {
      var status = app.status || 'unknown';
      var statusBadge = SentinelUI.statusBadge(status);
      var domain = app.domain || app.domains || '';
      var domainHtml = '';
      if (domain) {
        domainHtml = '<span class="text-xs text-muted">' + esc(typeof domain === 'string' ? domain : domain[0] || '') + '</span>';
      }
      var name = app.name || app.app_name || 'Unnamed';
      var description = app.description || '';
      var icon = app.icon || 'terminal';
      return '<a href="#/apps/' + encodeURIComponent(name) + '" class="app-card">' +
        '<div class="app-card-left">' +
        '<div class="app-card-avatar">' + (ICONS[icon] || ICONS.terminal) + '</div>' +
        '<div class="app-card-info">' +
        '<div class="app-card-name">' + esc(name) + '</div>' +
        (description ? '<div class="app-card-desc">' + esc(description) + '</div>' : '') +
        '</div>' +
        '</div>' +
        '<div class="app-card-right">' +
        domainHtml +
        statusBadge +
        '</div>' +
        '</a>';
    },

    projectCard: function (project) {
      var name = project.name || 'Unnamed';
      var description = project.description || '';
      var appCount = project.app_count !== undefined ? project.app_count : (project.apps ? project.apps.length : 0);
      var icon = project.icon || 'folder';
      return '<a href="#/projects/' + encodeURIComponent(project.id || project.name) + '" class="app-card">' +
        '<div class="app-card-left">' +
        '<div class="app-card-avatar">' + (ICONS[icon] || ICONS.folder) + '</div>' +
        '<div class="app-card-info">' +
        '<div class="app-card-name">' + esc(name) + '</div>' +
        (description ? '<div class="app-card-desc">' + esc(description) + '</div>' : '') +
        '</div>' +
        '</div>' +
        '<div class="app-card-right">' +
        '<span class="text-xs text-muted">' + appCount + ' app' + (appCount !== 1 ? 's' : '') + '</span>' +
        '</div>' +
        '</a>';
    },

    deploymentCard: function (deployment) {
      var status = deployment.status || 'pending';
      var badge = SentinelUI.statusBadge(status);
      var branch = deployment.branch || '';
      var commitHash = deployment.commit_hash || deployment.commit || '';
      var timeAgoStr = deployment.created_at ? timeAgo(deployment.created_at) : '';
      var appName = deployment.app_name || '';
      return '<div class="app-card">' +
        '<div class="app-card-left">' +
        '<div class="app-card-avatar">' + ICONS['git-branch'] + '</div>' +
        '<div class="app-card-info">' +
        '<div class="app-card-name" style="font-size:var(--text-sm)">' +
        (appName ? esc(appName) + ' / ' : '') +
        '<span class="text-muted">' + esc(branch) + '</span>' +
        '</div>' +
        '<div class="app-card-desc">' +
        (commitHash ? '<span class="text-mono">' + esc(commitHash.slice(0, 7)) + '</span>' : '') +
        (timeAgoStr ? ' \u00b7 ' + esc(timeAgoStr) : '') +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="app-card-right">' +
        badge +
        '</div>' +
        '</div>';
    },

    /* ============ TABLES ============ */

    table: function (headers, rows, emptyText) {
      if (!rows || rows.length === 0) {
        emptyText = emptyText || 'No data available';
        return '<div class="table-wrap"><table><thead><tr>' +
          headers.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') +
          '</tr></thead><tbody><tr class="table-empty"><td colspan="' + headers.length + '">' + esc(emptyText) + '</td></tr></tbody></table></div>';
      }
      return '<div class="table-wrap"><table><thead><tr>' +
        headers.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') +
        '</tr></thead><tbody>' +
        rows.map(function (row) {
          return '<tr>' + row.map(function (cell) {
            return '<td>' + cell + '</td>';
          }).join('') + '</tr>';
        }).join('') +
        '</tbody></table></div>';
    },

    dataTable: function (headers, rows, options) {
      options = options || {};
      var sortable = options.sortable || [];
      var html = '<div class="table-wrap"><table><thead><tr>';
      for (var i = 0; i < headers.length; i++) {
        var h = headers[i];
        var sortClass = '';
        var sortIcon = '';
        if (sortable.indexOf(i) !== -1) {
          sortClass = ' sortable';
          sortIcon = ' <span style="display:inline-flex;flex-direction:column;vertical-align:middle;margin-left:4px;font-size:9px;line-height:1">\u25b2<br>\u25bc</span>';
        }
        html += '<th class="' + sortClass + '" data-index="' + i + '">' + esc(h) + sortIcon + '</th>';
      }
      html += '</tr></thead><tbody>';
      if (!rows || rows.length === 0) {
        html += '<tr class="table-empty"><td colspan="' + headers.length + '">' + esc(options.emptyText || 'No data available') + '</td></tr>';
      } else {
        for (var r = 0; r < rows.length; r++) {
          html += '<tr>' + rows[r].map(function (cell) {
            return '<td>' + cell + '</td>';
          }).join('') + '</tr>';
        }
      }
      html += '</tbody></table></div>';
      return html;
    },

    /* ============ BADGES ============ */

    badge: function (text, type) {
      type = type || 'neutral';
      return '<span class="badge badge-' + type + '">' +
        '<span class="badge-dot"></span>' +
        esc(text) +
        '</span>';
    },

    statusBadge: function (status) {
      var map = {
        running: 'info',
        deploying: 'info',
        success: 'success',
        healthy: 'success',
        active: 'success',
        failed: 'error',
        unhealthy: 'error',
        error: 'error',
        pending: 'warning',
        queued: 'warning',
        cancelled: 'neutral',
        cancel: 'neutral',
        unknown: 'neutral',
      };
      var type = map[status] || 'neutral';
      return SentinelUI.badge(status.charAt(0).toUpperCase() + status.slice(1), type);
    },

    statusChip: function (status) {
      return '<span class="status-chip ' + esc(status) + '">' + esc(status.charAt(0).toUpperCase() + status.slice(1)) + '</span>';
    },

    /* ============ FORM ELEMENTS ============ */

    input: function (label, name, type, value, placeholder, options) {
      options = options || {};
      type = type || 'text';
      value = value || '';
      var hintHtml = options.hint
        ? '<div class="form-hint">' + esc(options.hint) + '</div>'
        : '';
      var errorHtml = options.error
        ? '<div class="form-error">' + esc(options.error) + '</div>'
        : '';
      var errorClass = options.error ? ' error' : '';
      var disabledAttr = options.disabled ? ' disabled' : '';
      var requiredAttr = options.required ? ' required' : '';
      return '<div class="form-group">' +
        '<label class="form-label" for="' + esc(name) + '">' + esc(label) + '</label>' +
        '<input type="' + esc(type) + '" name="' + esc(name) + '" id="' + esc(name) + '" ' +
        'class="form-input' + errorClass + '" ' +
        'value="' + esc(value) + '" ' +
        (placeholder ? 'placeholder="' + esc(placeholder) + '" ' : '') +
        disabledAttr + requiredAttr + ' />' +
        hintHtml + errorHtml +
        '</div>';
    },

    select: function (label, name, options, value) {
      options = options || [];
      value = value || '';
      var opts = options.map(function (opt) {
        var val = typeof opt === 'string' ? opt : opt.value;
        var text = typeof opt === 'string' ? opt : opt.label;
        var selected = val === value ? ' selected' : '';
        return '<option value="' + esc(val) + '"' + selected + '>' + esc(text) + '</option>';
      }).join('');
      return '<div class="form-group">' +
        '<label class="form-label" for="' + esc(name) + '">' + esc(label) + '</label>' +
        '<select name="' + esc(name) + '" id="' + esc(name) + '" class="form-select">' +
        opts +
        '</select>' +
        '</div>';
    },

    textarea: function (label, name, value, placeholder) {
      value = value || '';
      return '<div class="form-group">' +
        '<label class="form-label" for="' + esc(name) + '">' + esc(label) + '</label>' +
        '<textarea name="' + esc(name) + '" id="' + esc(name) + '" class="form-textarea" ' +
        (placeholder ? 'placeholder="' + esc(placeholder) + '" ' : '') +
        '>' + esc(value) + '</textarea>' +
        '</div>';
    },

    checkbox: function (label, name, checked) {
      var checkAttr = checked ? ' checked' : '';
      return '<label class="checkbox-label">' +
        '<input type="checkbox" name="' + esc(name) + '"' + checkAttr + ' />' +
        esc(label) +
        '</label>';
    },

    formRow: function () {
      var children = Array.prototype.slice.call(arguments);
      return '<div class="form-row">' + children.join('') + '</div>';
    },

    /* ============ BUTTONS ============ */

    button: function (text, type, size, options) {
      options = options || {};
      type = type || 'default';
      size = size || '';
      var cls = 'btn';
      if (type !== 'default') cls += ' btn-' + type;
      if (size) cls += ' btn-' + size;
      if (options.className) cls += ' ' + options.className;
      if (options.fullWidth) cls += ' flex-1';
      var disabledAttr = options.disabled ? ' disabled' : '';
      var iconHtml = options.icon || '';
      return '<button class="' + cls + '"' + disabledAttr + '>' +
        iconHtml +
        esc(text) +
        '</button>';
    },

    buttonGroup: function () {
      var buttons = Array.prototype.slice.call(arguments);
      return '<div class="btn-group">' + buttons.join('') + '</div>';
    },

    iconButton: function (iconSvg, label, options) {
      options = options || {};
      var cls = 'btn btn-icon' + (options.className ? ' ' + options.className : '');
      var disabledAttr = options.disabled ? ' disabled' : '';
      return '<button class="' + cls + '" data-tooltip="' + esc(label) + '"' + disabledAttr + '>' +
        iconSvg +
        '</button>';
    },

    /* ============ MODALS ============ */

    modal: function (title, bodyHtml, footerHtml) {
      return '<div class="modal-overlay">' +
        '<div class="modal">' +
        '<div class="modal-header">' +
        '<h3 class="modal-title">' + esc(title) + '</h3>' +
        '<button class="modal-close" onclick="this.closest(\'.modal-overlay\').remove()">' +
        ICONS.x +
        '</button>' +
        '</div>' +
        '<div class="modal-body">' + bodyHtml + '</div>' +
        (footerHtml ? '<div class="modal-footer">' + footerHtml + '</div>' : '') +
        '</div>' +
        '</div>';
    },

    confirmModal: function (message, confirmText, cancelText) {
      confirmText = confirmText || 'Confirm';
      cancelText = cancelText || 'Cancel';
      var body = '<p style="color:var(--text-secondary);font-size:var(--text-sm)">' + esc(message) + '</p>';
      var footer = '<button class="btn btn-ghost" onclick="this.closest(\'.modal-overlay\').remove()">' +
        esc(cancelText) +
        '</button>' +
        '<button class="btn btn-primary" id="confirm-btn">' +
        esc(confirmText) +
        '</button>';
      return SentinelUI.modal('Confirm', body, footer);
    },

    /* ============ TABS ============ */

    tabs: function (tabDefs, activeTab) {
      if (!tabDefs || !tabDefs.length) return '';
      activeTab = activeTab || (tabDefs[0] ? tabDefs[0].id : '');
      var html = '<div class="tabs">';
      for (var i = 0; i < tabDefs.length; i++) {
        var tab = tabDefs[i];
        var active = tab.id === activeTab ? ' active' : '';
        html += '<button class="tab' + active + '" data-tab="' + esc(tab.id) + '">' +
          esc(tab.label) +
          '</button>';
      }
      html += '</div>';
      return html;
    },

    tabContent: function (id, activeTab, content) {
      var active = id === activeTab ? ' active' : '';
      return '<div class="tab-content' + active + '" data-tab-content="' + esc(id) + '">' +
        content +
        '</div>';
    },

    /* ============ TERMINAL ============ */

    terminal: function (lines, options) {
      options = options || {};
      var title = options.title || 'Terminal';
      var html = '<div class="terminal">' +
        '<div class="terminal-header">' +
        '<span class="terminal-dot red"></span>' +
        '<span class="terminal-dot yellow"></span>' +
        '<span class="terminal-dot green"></span>' +
        '<span class="terminal-title">' + esc(title) + '</span>' +
        '</div>' +
        '<div class="terminal-body">';

      if (lines && lines.length) {
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i];
          if (typeof line === 'string') {
            html += '<div class="terminal-line">' + esc(line) + '</div>';
          } else {
            var type = line.type || 'info';
            html += '<div class="terminal-line ' + esc(type) + '">' + esc(line.text || '') + '</div>';
          }
        }
      }

      html += '</div></div>';
      return html;
    },

    /* ============ PROGRESS ============ */

    progressBar: function (percent, type) {
      type = type || '';
      var fillCls = 'progress-bar-fill' + (type ? ' ' + type : '');
      return '<div class="progress-bar">' +
        '<div class="' + fillCls + '" style="width:' + Math.min(100, Math.max(0, percent)) + '%"></div>' +
        '</div>';
    },

    /* ============ DEPLOYMENT STAGES ============ */

    deployStage: function (name, detail, status) {
      status = status || 'pending';
      var iconMap = {
        pending: ICONS.loader,
        running: ICONS.loader,
        success: ICONS.check,
        failed: ICONS.x,
      };
      var icon = iconMap[status] || ICONS.loader;
      var badgeTypeMap = {
        pending: 'warning',
        running: 'info',
        success: 'success',
        failed: 'error',
      };
      var badgeType = badgeTypeMap[status] || 'neutral';
      return '<div class="deploy-stage">' +
        '<div class="deploy-stage-icon" style="color:var(--' + (status === 'success' ? 'green' : status === 'failed' ? 'red' : status === 'running' ? 'accent' : 'text-muted') + ')">' +
        icon +
        '</div>' +
        '<div class="deploy-stage-info">' +
        '<div class="deploy-stage-name">' + esc(name) + '</div>' +
        (detail ? '<div class="deploy-stage-detail">' + esc(detail) + '</div>' : '') +
        '</div>' +
        '<div class="deploy-stage-status">' +
        SentinelUI.badge(status.charAt(0).toUpperCase() + status.slice(1), badgeType) +
        '</div>' +
        '</div>';
    },

    deploymentTimeline: function (stages) {
      if (!stages || !stages.length) return '';
      var html = '<div class="timeline">';
      for (var i = 0; i < stages.length; i++) {
        var stage = stages[i];
        var status = stage.status || 'pending';
        html += '<div class="timeline-item">' +
          '<div class="timeline-dot ' + esc(status) + '"></div>' +
          '<div class="timeline-header">' +
          '<span class="timeline-title">' + esc(stage.name) + '</span>' +
          SentinelUI.badge(status.charAt(0).toUpperCase() + status.slice(1), status) +
          '</div>' +
          (stage.detail ? '<div class="timeline-body">' + esc(stage.detail) + '</div>' : '') +
          (stage.meta ? '<div class="timeline-meta">' + esc(stage.meta) + '</div>' : '') +
          '</div>';
      }
      html += '</div>';
      return html;
    },

    /* ============ WIZARD STEPS ============ */

    wizardSteps: function (steps, currentStep) {
      if (!steps || !steps.length) return '';
      var html = '<div class="steps">';
      for (var i = 0; i < steps.length; i++) {
        var step = steps[i];
        var cls = '';
        if (i < currentStep) cls = ' completed';
        else if (i === currentStep) cls = ' active';
        html += '<div class="step' + cls + '">';
        if (i < currentStep) {
          html += ICONS.check;
        }
        html += '<span>' + esc(step.label) + '</span></div>';
        if (i < steps.length - 1) {
          var connCls = i < currentStep ? ' completed' : '';
          html += '<div class="step-connector' + connCls + '"></div>';
        }
      }
      html += '</div>';
      return html;
    },

    /* ============ STATES ============ */

    emptyState: function (title, message, icon) {
      icon = icon || ICONS.inbox;
      return '<div class="empty-state">' +
        icon +
        '<h3>' + esc(title) + '</h3>' +
        '<p>' + esc(message) + '</p>' +
        '</div>';
    },

    loadingState: function () {
      return '<div class="loading-state">' +
        '<div class="spinner spinner-lg"></div>' +
        '</div>';
    },

    errorState: function (message, onRetry) {
      var retryBtn = onRetry
        ? '<button class="btn btn-primary" onclick="(' + onRetry + ')()">Try Again</button>'
        : '';
      return '<div class="error-state">' +
        ICONS['alert-circle'] +
        '<h3>Something went wrong</h3>' +
        '<p>' + esc(message) + '</p>' +
        retryBtn +
        '</div>';
    },

    /* ============ UTILITY ============ */

    dropdown: function (triggerHtml, items) {
      var html = '<div class="dropdown">' + triggerHtml + '<div class="dropdown-menu">';
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item.divider) {
          html += '<div class="dropdown-divider"></div>';
        } else {
          var clickHandler = item.onClick
            ? ' onclick="(' + item.onClick + ')(event)"'
            : '';
          var iconHtml = item.icon || '';
          html += '<button class="dropdown-item"' + clickHandler + '>' +
            iconHtml +
            esc(item.label) +
            '</button>';
        }
      }
      html += '</div></div>';
      return html;
    },

    pagination: function (current, total, onChange) {
      if (total <= 1) return '';
      var html = '<div class="pagination">';
      var prevDisabled = current <= 1 ? ' disabled' : '';
      html += '<button class="pagination-btn"' + prevDisabled +
        ' onclick="(' + onChange + ')(' + (current - 1) + ')">' +
        ICONS['chevron-left'] +
        '</button>';

      var start = Math.max(1, current - 2);
      var end = Math.min(total, current + 2);
      if (start > 1) {
        html += '<button class="pagination-btn" onclick="(' + onChange + ')(1)">1</button>';
        if (start > 2) html += '<span style="color:var(--text-muted);padding:0 4px;font-size:var(--text-xs)">...</span>';
      }
      for (var i = start; i <= end; i++) {
        var active = i === current ? ' active' : '';
        html += '<button class="pagination-btn' + active + '" onclick="(' + onChange + ')(' + i + ')">' + i + '</button>';
      }
      if (end < total) {
        if (end < total - 1) html += '<span style="color:var(--text-muted);padding:0 4px;font-size:var(--text-xs)">...</span>';
        html += '<button class="pagination-btn" onclick="(' + onChange + ')(' + total + ')">' + total + '</button>';
      }

      var nextDisabled = current >= total ? ' disabled' : '';
      html += '<button class="pagination-btn"' + nextDisabled +
        ' onclick="(' + onChange + ')(' + (current + 1) + ')">' +
        ICONS['chevron-right'] +
        '</button>';
      html += '</div>';
      return html;
    },

    codeBlock: function (code, language) {
      language = language || '';
      var langAttr = language ? ' data-language="' + esc(language) + '"' : '';
      var codeEscaped = esc(code);
      return '<div class="code-block-wrapper"' + langAttr + '>' +
        '<button class="copy-btn" onclick="navigator.clipboard.writeText(this.parentElement.querySelector(\'code\').textContent);this.textContent=\'Copied!\';setTimeout(()=>this.textContent=\'Copy\',2000)">Copy</button>' +
        '<pre class="code-block"><code>' + codeEscaped + '</code></pre>' +
        '</div>';
    },

    skeleton: function (type, count) {
      count = count || 1;
      var cls = 'skeleton';
      switch (type) {
        case 'text': cls += ' skeleton-text'; break;
        case 'title': cls += ' skeleton-title'; break;
        case 'avatar': cls += ' skeleton-avatar'; break;
        case 'card': cls += ' skeleton-card'; break;
        default: cls += ' skeleton-text';
      }
      var html = '';
      for (var i = 0; i < count; i++) {
        html += '<div class="' + cls + '"></div>';
      }
      return html;
    },

    filterBar: function (filters) {
      if (!filters || !filters.length) return '';
      var html = '<div class="filter-bar">';
      for (var i = 0; i < filters.length; i++) {
        var f = filters[i];
        if (f.type === 'search') {
          html += '<div class="search-box">' +
            ICONS.search +
            '<input type="text" name="' + esc(f.name) + '" placeholder="' + esc(f.placeholder || 'Search...') + '" />' +
            '</div>';
        } else if (f.type === 'select') {
          var opts = (f.options || []).map(function (o) {
            var val = typeof o === 'string' ? o : o.value;
            var text = typeof o === 'string' ? o : o.label;
            return '<option value="' + esc(val) + '">' + esc(text) + '</option>';
          }).join('');
          html += '<select name="' + esc(f.name) + '" class="form-select">' + opts + '</select>';
        }
      }
      html += '</div>';
      return html;
    },

    avatar: function (name, size) {
      size = size || 30;
      var initial = initials(name);
      var px = size + 'px';
      return '<div class="navbar-avatar" style="width:' + px + ';height:' + px + ';font-size:' + (size / 2.5) + 'px">' +
        esc(initial) +
        '</div>';
    },

    tooltip: function (text, content) {
      return '<span data-tooltip="' + esc(text) + '">' + content + '</span>';
    },
  };

  window.SentinelUI = SentinelUI;
})();
