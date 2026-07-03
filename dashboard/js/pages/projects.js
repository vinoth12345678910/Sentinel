(function () {
  'use strict';

  window.SentinelPages = window.SentinelPages || {};

  window.SentinelPages.ProjectsPage = function () {
    var mounted = false;
    var projects = [];

    function render() {
      var newProjectBtn = '<button class="btn btn-primary" onclick="SentinelRouter.navigate(\'/create\')">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
        'New Project</button>';

      var headerHtml = SentinelUI.pageHeader('Projects', '', newProjectBtn);

      var listHtml;
      if (!projects || projects.length === 0) {
        listHtml = SentinelUI.emptyState('No projects', 'Create your first project to get started.');
      } else {
        listHtml = '<div class="app-cards-grid">';
        for (var i = 0; i < projects.length; i++) {
          listHtml += SentinelUI.projectCard(projects[i]);
        }
        listHtml += '</div>';
      }

      return headerHtml + listHtml;
    }

    function onMount() {
      mounted = true;

      Sentinel.delegateEvent('click', '.app-card', function (event, el) {
        event.preventDefault();
        var href = el.getAttribute('href');
        if (href) {
          SentinelRouter.navigate(href);
        }
      });

      SentinelAPI.listProjects()
        .then(function (data) {
          if (!mounted) return;
          projects = Array.isArray(data) ? data : [];
          SentinelStore.setState('projects', projects);
          var container = document.getElementById('app-content');
          if (container) container.innerHTML = render();
        })
        .catch(function () {
          if (!mounted) return;
          projects = [];
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
