(function () {
  'use strict';

  function esc(str) {
    if (str == null) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
  }

  window.SentinelPages = window.SentinelPages || {};

  window.SentinelPages.TeamsPage = function () {
    this.teams = [];
    this.selectedTeam = null;
    this.user = SentinelStore.getState('user') || {};
  };

  window.SentinelPages.TeamsPage.prototype.render = function () {
    var isAdmin = this.user.role === 'admin';
    var createBtn = isAdmin
      ? SentinelUI.button('Create Team', 'primary', '', {
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
          className: 'create-team-btn',
        })
      : '';

    var header = SentinelUI.pageHeader('Teams', 'Manage teams and their members', createBtn);

    var contentHtml = '<div id="teams-content">' +
      (this.selectedTeam
        ? this._renderTeamDetail()
        : this._renderTeamsListHtml()) +
      '</div>';

    return header + '<div style="margin-top:var(--space-6)">' + contentHtml + '</div>';
  };

  window.SentinelPages.TeamsPage.prototype._renderTeamsListHtml = function () {
    if (!this.teams || this.teams.length === 0) {
      return SentinelUI.emptyState('No Teams',
        'No teams have been created yet. Teams allow you to group users and manage permissions.',
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
      );
    }

    var html = '<div class="teams-list" style="display:flex;flex-direction:column;gap:var(--space-3)">';
    for (var i = 0; i < this.teams.length; i++) {
      var team = this.teams[i];
      var name = team.name || 'Unnamed Team';
      var description = team.description || '';
      var memberCount = team.member_count || (team.members ? team.members.length : 0);

      html +=
        '<div class="team-card" data-team-id="' + esc(team.id || team._id || '') + '"' +
        ' style="padding:var(--space-3);border:1px solid var(--border);border-radius:var(--radius);cursor:pointer;transition:border-color .15s,box-shadow .15s"' +
        ' onmouseover="this.style.borderColor=\'var(--accent)\';this.style.boxShadow=\'0 1px 4px rgba(0,0,0,0.06)\'"' +
        ' onmouseout="this.style.borderColor=\'var(--border)\';this.style.boxShadow=\'none\'">' +
        '<div style="display:flex;align-items:center;justify-content:space-between">' +
        '<div style="display:flex;align-items:center;gap:var(--space-3)">' +
        '<div style="width:40px;height:40px;border-radius:var(--radius);background:var(--bg-secondary);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:var(--text-sm);color:var(--text-secondary)">' +
        esc(name.charAt(0).toUpperCase()) +
        '</div>' +
        '<div>' +
        '<div style="font-weight:500;font-size:var(--text-sm)">' + esc(name) + '</div>' +
        (description ? '<div class="text-xs text-muted" style="margin-top:2px">' + esc(description) + '</div>' : '') +
        '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:var(--space-3)">' +
        '<span class="text-xs text-muted">' + memberCount + ' member' + (memberCount !== 1 ? 's' : '') + '</span>' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-muted)"><polyline points="9 18 15 12 9 6"/></svg>' +
        '</div>' +
        '</div>' +
        '</div>';
    }
    html += '</div>';
    return html;
  };

  window.SentinelPages.TeamsPage.prototype._renderTeamDetail = function () {
    var team = this.selectedTeam;
    if (!team) return '';

    var name = team.name || 'Unnamed Team';
    var description = team.description || '';
    var isAdmin = this.user.role === 'admin';

    var backBtn = SentinelUI.button('Back to Teams', 'ghost', 'sm', {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><polyline points="15 18 9 12 15 6"/></svg>',
      className: 'back-to-teams-btn',
    });

    var deleteBtn = isAdmin
      ? SentinelUI.button('Delete Team', 'danger', 'sm', {
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
          className: 'delete-team-btn',
        })
      : '';

    var membersHtml = SentinelUI.card('Members',
      '<div id="team-members-content">' +
        (team.members && team.members.length > 0
          ? this._renderMembersList(team.members, isAdmin)
          : SentinelUI.emptyState('No Members', 'This team has no members yet.')) +
      '</div>' +
      (isAdmin
        ? '<div style="margin-top:var(--space-3);padding-top:var(--space-3);border-top:1px solid var(--border)">' +
          '<div style="font-size:var(--text-sm);font-weight:500;margin-bottom:var(--space-2)">Add Member</div>' +
          '<div class="form-row" style="display:flex;gap:var(--space-2);align-items:flex-end">' +
          '<div class="form-group" style="flex:1;margin-bottom:0">' +
          '<label class="form-label" for="add-member-user-id">User ID</label>' +
          '<input type="text" id="add-member-user-id" class="form-input" placeholder="Enter user ID" />' +
          '</div>' +
          '<div class="form-group" style="margin-bottom:0">' +
          '<label class="form-label" for="add-member-role">Role</label>' +
          '<select id="add-member-role" class="form-select">' +
          '<option value="member">Member</option>' +
          '<option value="admin">Admin</option>' +
          '<option value="viewer">Viewer</option>' +
          '</select>' +
          '</div>' +
          '<button class="btn btn-primary add-member-btn" style="white-space:nowrap">Add</button>' +
          '</div>' +
          '</div>'
        : '')
    );

    var projectsHtml = SentinelUI.card('Projects',
      '<div id="team-projects-content">' +
        (team.projects && team.projects.length > 0
          ? this._renderProjectsList(team.projects, isAdmin)
          : SentinelUI.emptyState('No Projects', 'This team has no associated projects.')) +
      '</div>' +
      (isAdmin
        ? '<div style="margin-top:var(--space-3);padding-top:var(--space-3);border-top:1px solid var(--border)">' +
          '<div style="font-size:var(--text-sm);font-weight:500;margin-bottom:var(--space-2)">Add Project</div>' +
          '<div class="form-row" style="display:flex;gap:var(--space-2);align-items:flex-end">' +
          '<div class="form-group" style="flex:1;margin-bottom:0">' +
          '<label class="form-label" for="add-project-id">Project ID</label>' +
          '<input type="text" id="add-project-id" class="form-input" placeholder="Enter project ID" />' +
          '</div>' +
          '<button class="btn btn-primary add-project-btn" style="white-space:nowrap">Add</button>' +
          '</div>' +
          '</div>'
        : '')
    );

    return '<div class="team-detail">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4)">' +
      '<div>' +
      backBtn +
      '</div>' +
      deleteBtn +
      '</div>' +
      SentinelUI.card('Team Details',
        '<div style="display:flex;flex-direction:column;gap:var(--space-1)">' +
        '<h3 style="margin:0">' + esc(name) + '</h3>' +
        (description ? '<p class="text-sm text-muted" style="margin:0">' + esc(description) + '</p>' : '') +
        '</div>'
      ) +
      '<div style="margin-top:var(--space-4)">' + membersHtml + '</div>' +
      '<div style="margin-top:var(--space-4)">' + projectsHtml + '</div>' +
      '</div>';
  };

  window.SentinelPages.TeamsPage.prototype._renderMembersList = function (members, isAdmin) {
    var html = '<div style="display:flex;flex-direction:column;gap:var(--space-2)">';
    for (var i = 0; i < members.length; i++) {
      var m = members[i];
      var userId = m.id || m._id || m.user_id || m.userId || '';
      var userName = m.username || m.name || m.user_name || userId || 'Unknown';
      var role = m.role || 'member';
      var roleBadge = SentinelUI.badge(
        role.charAt(0).toUpperCase() + role.slice(1),
        role === 'admin' ? 'purple' : role === 'viewer' ? 'neutral' : 'info'
      );

      html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-1) 0">' +
        '<div style="display:flex;align-items:center;gap:var(--space-2)">' +
        SentinelUI.avatar(userName, 28) +
        '<div>' +
        '<div style="font-size:var(--text-sm);font-weight:500">' + esc(userName) + '</div>' +
        '<div class="text-xs text-muted">' + esc(userId) + '</div>' +
        '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:var(--space-2)">' +
        roleBadge +
        (isAdmin
          ? '<button class="btn btn-icon remove-member-btn" data-user-id="' + esc(userId) + '" data-tooltip="Remove member">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>'
          : '') +
        '</div>' +
        '</div>';
    }
    html += '</div>';
    return html;
  };

  window.SentinelPages.TeamsPage.prototype._renderProjectsList = function (projects, isAdmin) {
    var html = '<div style="display:flex;flex-direction:column;gap:var(--space-2)">';
    for (var i = 0; i < projects.length; i++) {
      var p = projects[i];
      var projectId = p.id || p._id || p.project_id || '';
      var projectName = p.name || p.project_name || projectId || 'Unknown';
      var pDescription = p.description || '';

      html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-1) 0">' +
        '<div>' +
        '<div style="font-size:var(--text-sm);font-weight:500">' + esc(projectName) + '</div>' +
        (pDescription ? '<div class="text-xs text-muted">' + esc(pDescription) + '</div>' : '') +
        '<div class="text-xs text-muted">' + esc(projectId) + '</div>' +
        '</div>' +
        (isAdmin
          ? '<button class="btn btn-icon remove-project-btn" data-project-id="' + esc(projectId) + '" data-tooltip="Remove project">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>'
          : '') +
        '</div>';
    }
    html += '</div>';
    return html;
  };

  window.SentinelPages.TeamsPage.prototype.onMount = function () {
    var self = this;
    this._loadTeams();

    var page = document.getElementById('app-content') || document.body;
    page.addEventListener('click', function (e) {
      var teamCard = e.target.closest('.team-card');
      if (teamCard && !e.target.closest('.btn')) {
        var teamId = teamCard.getAttribute('data-team-id');
        if (teamId) self._selectTeam(teamId);
        return;
      }

      var createBtn = e.target.closest('.create-team-btn');
      if (createBtn) {
        self._showCreateModal();
        return;
      }

      var backBtn = e.target.closest('.back-to-teams-btn');
      if (backBtn) {
        self._backToTeams();
        return;
      }

      var deleteBtn = e.target.closest('.delete-team-btn');
      if (deleteBtn) {
        self._deleteSelectedTeam();
        return;
      }

      var addMemberBtn = e.target.closest('.add-member-btn');
      if (addMemberBtn) {
        self._addMember();
        return;
      }

      var removeMemberBtn = e.target.closest('.remove-member-btn');
      if (removeMemberBtn) {
        var userId = removeMemberBtn.getAttribute('data-user-id');
        if (userId) self._removeMember(userId);
        return;
      }

      var addProjectBtn = e.target.closest('.add-project-btn');
      if (addProjectBtn) {
        self._addProject();
        return;
      }

      var removeProjectBtn = e.target.closest('.remove-project-btn');
      if (removeProjectBtn) {
        var projectId = removeProjectBtn.getAttribute('data-project-id');
        if (projectId) self._removeProject(projectId);
        return;
      }

      var confirmBtn = e.target.closest('#confirm-btn');
      if (confirmBtn) {
        var modalOverlay = confirmBtn.closest('.modal-overlay');
        var action = modalOverlay ? modalOverlay.getAttribute('data-confirm-action') : '';
        if (action === 'delete-team') {
          self._executeDeleteTeam();
        }
        if (modalOverlay) modalOverlay.remove();
        return;
      }
    });
  };

  window.SentinelPages.TeamsPage.prototype._loadTeams = function () {
    var self = this;
    var content = document.getElementById('teams-content');
    if (content) {
      content.innerHTML = SentinelUI.loadingState();
    }

    SentinelAPI.listTeams()
      .then(function (teams) {
        self.teams = Array.isArray(teams) ? teams : [];
        self._renderTeamsList();
      })
      .catch(function (err) {
        var content2 = document.getElementById('teams-content');
        if (content2) {
          content2.innerHTML = SentinelUI.emptyState('Error',
            err.message || 'Failed to load teams. Please try again.');
        }
      });
  };

  window.SentinelPages.TeamsPage.prototype._renderTeamsList = function () {
    var content = document.getElementById('teams-content');
    if (!content) return;

    if (!this.teams || this.teams.length === 0) {
      content.innerHTML = SentinelUI.emptyState('No Teams',
        'No teams have been created yet. Teams allow you to group users and manage permissions.');
      return;
    }

    content.innerHTML = this._renderTeamsListHtml();
  };

  window.SentinelPages.TeamsPage.prototype._selectTeam = function (teamId) {
    var self = this;
    var content = document.getElementById('teams-content');
    if (content) {
      content.innerHTML = SentinelUI.loadingState();
    }

    SentinelAPI.getTeam(teamId)
      .then(function (team) {
        self.selectedTeam = team;
        self._renderTeamView();
      })
      .catch(function (err) {
        var content2 = document.getElementById('teams-content');
        if (content2) {
          content2.innerHTML = SentinelUI.emptyState('Error',
            err.message || 'Failed to load team details.');
        }
      });
  };

  window.SentinelPages.TeamsPage.prototype._renderTeamView = function () {
    var content = document.getElementById('teams-content');
    if (!content) return;
    content.innerHTML = this._renderTeamDetail();
  };

  window.SentinelPages.TeamsPage.prototype._backToTeams = function () {
    this.selectedTeam = null;
    this._renderTeamsList();
  };

  window.SentinelPages.TeamsPage.prototype._showCreateModal = function () {
    var bodyHtml =
      '<div class="form-group">' +
      '<label class="form-label" for="create-team-name">Team Name</label>' +
      '<input type="text" id="create-team-name" class="form-input" placeholder="Enter team name" />' +
      '</div>' +
      '<div class="form-group" style="margin-top:var(--space-3)">' +
      '<label class="form-label" for="create-team-desc">Description</label>' +
      '<textarea id="create-team-desc" class="form-textarea" placeholder="Optional description" rows="3"></textarea>' +
      '</div>';

    var footerHtml =
      '<button class="btn btn-ghost" onclick="this.closest(\'.modal-overlay\').remove()">Cancel</button>' +
      '<button class="btn btn-primary" id="confirm-create-team-btn">Create Team</button>';

    var modalHtml = SentinelUI.modal('Create Team', bodyHtml, footerHtml);
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    var confirmBtn = document.getElementById('confirm-create-team-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        var nameInput = document.getElementById('create-team-name');
        var descInput = document.getElementById('create-team-desc');
        var name = nameInput ? nameInput.value.trim() : '';
        var description = descInput ? descInput.value.trim() : '';

        if (!name) {
          SentinelToast.show('Please enter a team name.', 'warning');
          if (nameInput) nameInput.focus();
          return;
        }

        var self = this;
        SentinelAPI.createTeam(name, description)
          .then(function () {
            var overlay = confirmBtn.closest('.modal-overlay');
            if (overlay) overlay.remove();
            SentinelToast.show('Team created successfully.', 'success');
            self._loadTeams();
          })
          .catch(function (err) {
            SentinelToast.show(err.message || 'Failed to create team.', 'error');
          });
      }.bind(this));
    }
  };

  window.SentinelPages.TeamsPage.prototype._deleteSelectedTeam = function () {
    var team = this.selectedTeam;
    if (!team) return;

    var teamId = team.id || team._id || '';
    var teamName = team.name || 'this team';

    var modalHtml = SentinelUI.confirmModal(
      'Are you sure you want to delete "' + teamName + '"? This action cannot be undone.',
      'Delete', 'Cancel'
    );

    var container = document.createElement('div');
    container.innerHTML = modalHtml;
    var overlay = container.firstElementChild;
    overlay.setAttribute('data-confirm-action', 'delete-team');
    document.body.appendChild(overlay);

    this._pendingDeleteId = teamId;
  };

  window.SentinelPages.TeamsPage.prototype._executeDeleteTeam = function () {
    var self = this;
    var teamId = this._pendingDeleteId;
    if (!teamId) return;

    SentinelAPI.deleteTeam(teamId)
      .then(function () {
        SentinelToast.show('Team deleted successfully.', 'success');
        self.selectedTeam = null;
        self._pendingDeleteId = null;
        self._loadTeams();
      })
      .catch(function (err) {
        SentinelToast.show(err.message || 'Failed to delete team.', 'error');
        self._pendingDeleteId = null;
      });
  };

  window.SentinelPages.TeamsPage.prototype._addMember = function () {
    var team = this.selectedTeam;
    if (!team) return;

    var teamId = team.id || team._id || '';
    var userIdInput = document.getElementById('add-member-user-id');
    var roleSelect = document.getElementById('add-member-role');

    var userId = userIdInput ? userIdInput.value.trim() : '';
    var role = roleSelect ? roleSelect.value : 'member';

    if (!userId) {
      SentinelToast.show('Please enter a user ID.', 'warning');
      if (userIdInput) userIdInput.focus();
      return;
    }

    var self = this;
    SentinelAPI.addTeamMember(teamId, { user_id: userId, role: role })
      .then(function () {
        SentinelToast.show('Member added successfully.', 'success');
        if (userIdInput) userIdInput.value = '';
        self._refreshTeamDetail();
      })
      .catch(function (err) {
        SentinelToast.show(err.message || 'Failed to add member.', 'error');
      });
  };

  window.SentinelPages.TeamsPage.prototype._removeMember = function (userId) {
    var team = this.selectedTeam;
    if (!team) return;

    var confirmed = window.confirm('Remove this member from the team?');
    if (!confirmed) return;

    var teamId = team.id || team._id || '';
    var self = this;

    SentinelAPI.removeTeamMember(teamId, userId)
      .then(function () {
        SentinelToast.show('Member removed successfully.', 'success');
        self._refreshTeamDetail();
      })
      .catch(function (err) {
        SentinelToast.show(err.message || 'Failed to remove member.', 'error');
      });
  };

  window.SentinelPages.TeamsPage.prototype._addProject = function () {
    var team = this.selectedTeam;
    if (!team) return;

    var teamId = team.id || team._id || '';
    var projectIdInput = document.getElementById('add-project-id');
    var projectId = projectIdInput ? projectIdInput.value.trim() : '';

    if (!projectId) {
      SentinelToast.show('Please enter a project ID.', 'warning');
      if (projectIdInput) projectIdInput.focus();
      return;
    }

    var self = this;
    SentinelAPI.addTeamProject(teamId, projectId)
      .then(function () {
        SentinelToast.show('Project added successfully.', 'success');
        if (projectIdInput) projectIdInput.value = '';
        self._refreshTeamDetail();
      })
      .catch(function (err) {
        SentinelToast.show(err.message || 'Failed to add project.', 'error');
      });
  };

  window.SentinelPages.TeamsPage.prototype._removeProject = function (projectId) {
    var team = this.selectedTeam;
    if (!team) return;

    var confirmed = window.confirm('Remove this project from the team?');
    if (!confirmed) return;

    var teamId = team.id || team._id || '';
    var self = this;

    SentinelAPI.removeTeamProject(teamId, projectId)
      .then(function () {
        SentinelToast.show('Project removed successfully.', 'success');
        self._refreshTeamDetail();
      })
      .catch(function (err) {
        SentinelToast.show(err.message || 'Failed to remove project.', 'error');
      });
  };

  window.SentinelPages.TeamsPage.prototype._refreshTeamDetail = function () {
    var team = this.selectedTeam;
    if (!team) return;
    this._selectTeam(team.id || team._id || '');
  };
})();
