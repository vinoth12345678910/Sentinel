(function () {
  'use strict';

  function esc(str) {
    if (str == null) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
  }

  window.SentinelPages = window.SentinelPages || {};

  window.SentinelPages.AdminUsersPage = function () {};

  window.SentinelPages.AdminUsersPage.prototype.render = function () {
    var icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:var(--space-2)"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';

    var header =
      '<div class="admin-section-title" style="display:flex;align-items:center;margin-bottom:var(--space-5)">' +
        icon +
        '<h2 style="margin:0">User Management</h2>' +
      '</div>';

    var tableHtml = '<div id="users-table-container">' + SentinelUI.loadingState() + '</div>';

    return header + tableHtml;
  };

  window.SentinelPages.AdminUsersPage.prototype.onMount = function () {
    var self = this;

    SentinelAPI.listUsers()
      .then(function (users) {
        self._users = Array.isArray(users) ? users : [];
        self._renderTable(self._users);
        self._attachRoleHandlers();
      })
      .catch(function (err) {
        var container = document.getElementById('users-table-container');
        if (container) {
          container.innerHTML = SentinelUI.emptyState('Error', err.message || 'Failed to load users.');
        }
      });
  };

  window.SentinelPages.AdminUsersPage.prototype._renderTable = function (users) {
    var container = document.getElementById('users-table-container');
    if (!container) return;

    if (!users || users.length === 0) {
      container.innerHTML = SentinelUI.emptyState('No Users', 'No users found in the system.');
      return;
    }

    var headers = ['Username', 'Email', 'Role', 'Created', 'Actions'];
    var self = this;
    var rows = users.map(function (u) {
      var roleMap = { admin: 'purple', member: 'info', viewer: 'neutral' };
      var roleBadge = SentinelUI.badge(
        u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'Member',
        roleMap[u.role] || 'info'
      );

      var roleSelect =
        '<select class="form-select role-select" data-user-id="' + esc(u.id || u._id || '') + '" style="font-size:var(--text-xs);padding:2px 6px;height:auto">' +
          '<option value="admin"' + (u.role === 'admin' ? ' selected' : '') + '>Admin</option>' +
          '<option value="member"' + (u.role === 'member' ? ' selected' : '') + '>Member</option>' +
          '<option value="viewer"' + (u.role === 'viewer' ? ' selected' : '') + '>Viewer</option>' +
        '</select>';

      return [
        esc(u.username || u.name || '—'),
        esc(u.email || '—'),
        roleBadge,
        esc(Sentinel.formatDate(u.created_at) || '—'),
        roleSelect
      ];
    });

    container.innerHTML = SentinelUI.dataTable(headers, rows, { emptyText: 'No users found.' });
  };

  window.SentinelPages.AdminUsersPage.prototype._attachRoleHandlers = function () {
    var self = this;
    var selects = document.querySelectorAll('#users-table-container .role-select');

    for (var i = 0; i < selects.length; i++) {
      selects[i].addEventListener('change', function () {
        var userId = this.getAttribute('data-user-id');
        var newRole = this.value;

        if (!userId) return;

        var confirmed = window.confirm('Are you sure you want to change this user\'s role to "' + newRole + '"?');
        if (!confirmed) {
          this.value = this.getAttribute('data-original-role') || '';
          return;
        }

        SentinelAPI.updateUserRole(userId, newRole)
          .then(function () {
            SentinelToast.show('User role updated successfully.', 'success');
          })
          .catch(function (err) {
            SentinelToast.show(err.message || 'Failed to update user role.', 'error');
            self.onMount();
          });
      });

      selects[i].setAttribute('data-original-role', selects[i].value);
    }
  };
})();
