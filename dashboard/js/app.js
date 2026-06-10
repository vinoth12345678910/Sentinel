(function () {
  const $app = document.getElementById('app');

  function $(sel, parent) { return (parent || document).querySelector(sel); }

  function $$(sel, parent) { return Array.from((parent || document).querySelectorAll(sel)); }

  function html(strings, ...vals) {
    return strings.reduce((acc, str, i) => acc + str + (vals[i] !== undefined ? vals[i] : ''), '');
  }

  function escape(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function formatTime(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString();
  }

  function timeAgo(iso) {
    if (!iso) return '-';
    const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const days = Math.floor(hr / 24);
    return `${days}d ago`;
  }

  function stateBadge(state) {
    const s = (state || 'unknown').toLowerCase();
    let cls = 'badge-info';
    if (['success', 'healthy', 'deployed', 'built', 'cloned', 'started'].includes(s)) cls = 'badge-success';
    else if (['failed', 'failed_at_clone', 'failed_at_build', 'failed_at_deploy', 'failed_at_verify'].includes(s)) cls = 'badge-failed';
    else if (['rolled_back', 'rolling_back', 'rollback_started'].includes(s)) cls = 'badge-rolled_back';
    else if (s === 'pending') cls = 'badge-pending';
    else if (s === 'verifying') cls = 'badge-warning';
    return `<span class="badge ${cls}">${escape(state)}</span>`;
  }

  function showError(msg) {
    $app.innerHTML = html`<div class="empty-state"><h3>Error</h3><p>${escape(msg)}</p></div>`;
  }

  function showLoading() {
    $app.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  }

  function promptApiKey() {
    const key = localStorage.getItem('sentinel_token');
    if (key) return Promise.resolve(key);
    const entered = prompt('Enter your Sentinel API key:');
    if (entered) {
      localStorage.setItem('sentinel_token', entered);
      return Promise.resolve(entered);
    }
    return Promise.reject(new Error('API key required'));
  }

  async function renderHome() {
    showLoading();
    try {
      await promptApiKey();
      const [health, apps, deployments] = await Promise.all([
        API.getHealth(),
        API.listApps().catch(() => []),
        API.listDeployments().catch(() => []),
      ]);

      const status = health.status === 'ok' ? 'Online' : 'Unknown';
      const lastDeploy = deployments.length > 0 ? timeAgo(deployments[0].updated_at) : 'None';
      const successCount = deployments.filter(d => d.state === 'SUCCESS').length;

      $app.innerHTML = html`
        <div class="page-header">
          <h1>Dashboard</h1>
          <p>Sentinel deployment platform — ${escape(health.environment || 'production')}</p>
        </div>
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-label">Status</div>
            <div class="stat-value" style="color:var(--green)">${escape(status)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Apps</div>
            <div class="stat-value">${apps.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Deployments</div>
            <div class="stat-value">${deployments.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Successful</div>
            <div class="stat-value" style="color:var(--green)">${successCount}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Uptime</div>
            <div class="stat-value" style="font-size:20px">${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Last Deploy</div>
            <div class="stat-value" style="font-size:20px">${escape(lastDeploy)}</div>
          </div>
        </div>
        <div class="card">
          <div class="card-title">Applications</div>
          ${apps.length === 0
            ? '<div class="empty-state"><p>No apps registered yet. Push to a GitHub repo to trigger a deployment.</p></div>'
            : apps.map(a => html`
              <a href="#/app/${escape(a.repo_name)}" class="app-card">
                <div class="app-card-left">
                  <div>
                    <div class="app-card-name">${escape(a.repo_name)}</div>
                    <div class="app-card-repo">${escape(a.repo_url || '')}</div>
                  </div>
                </div>
                <div class="app-card-right">
                  <span>Port ${a.host_port || '-'}</span>
                  <span class="timestamp">${timeAgo(a.updated_at)}</span>
                </div>
              </a>
            `).join('')}
        </div>
      `;
    } catch (err) {
      showError(err.message);
    }
  }

  async function renderApp(repoName) {
    showLoading();
    try {
      await promptApiKey();
      const [app, deployments] = await Promise.all([
        API.getApp(repoName),
        API.listDeployments(),
      ]);

      const appDeployments = deployments.filter(d => d.repo_name === repoName);

      $app.innerHTML = html`
        <div class="page-header">
          <a href="#/" class="btn btn-sm" style="margin-bottom:12px;display:inline-flex">&larr; Back</a>
          <h1>${escape(app.repo_name)}</h1>
          <p>${escape(app.repo_url || '')}</p>
        </div>
        <div class="detail-grid">
          <div class="detail-item">
            <div class="detail-label">Health Path</div>
            <div class="detail-value">${escape(app.health_path)}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Container Port</div>
            <div class="detail-value">${app.container_port || 'N/A'}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Host Port</div>
            <div class="detail-value">${app.host_port || 'N/A'}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Registered</div>
            <div class="detail-value timestamp">${formatTime(app.registered_at)}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:24px">
          <button class="btn btn-danger btn-sm" onclick="APP.rollback('${escape(repoName)}')">Rollback</button>
        </div>
        <div class="card">
          <div class="card-title">Deployments (${appDeployments.length})</div>
          ${appDeployments.length === 0
            ? '<div class="empty-state"><p>No deployments yet.</p></div>'
            : html`
              <div class="table-wrap">
                <table>
                  <thead><tr>
                    <th>ID</th>
                    <th>State</th>
                    <th>Commit</th>
                    <th>Updated</th>
                    <th>Logs</th>
                  </tr></thead>
                  <tbody>
                    ${appDeployments.map(d => html`
                      <tr>
                        <td style="font-family:monospace;font-size:12px">${escape(d.deployment_id)}</td>
                        <td>${stateBadge(d.state)}${d.failure_reason ? html`<div class="failure-reason">${escape(d.failure_reason)}</div>` : ''}</td>
                        <td>${d.commit_hash ? html`<span class="commit-hash">${escape(d.commit_hash.substring(0, 8))}</span>` : '-'}</td>
                        <td class="timestamp">${timeAgo(d.updated_at)}</td>
                        <td><a href="#/logs/${escape(d.deployment_id)}" class="btn btn-sm">View</a></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
        </div>
      `;
    } catch (err) {
      showError(err.message);
    }
  }

  async function renderDeployments() {
    showLoading();
    try {
      await promptApiKey();
      const deployments = await API.listDeployments();

      $app.innerHTML = html`
        <div class="page-header">
          <h1>All Deployments</h1>
          <p>${deployments.length} total</p>
        </div>
        <div class="card">
          ${deployments.length === 0
            ? '<div class="empty-state"><p>No deployments yet.</p></div>'
            : html`
              <div class="table-wrap">
                <table>
                  <thead><tr>
                    <th>App</th>
                    <th>ID</th>
                    <th>State</th>
                    <th>Commit</th>
                    <th>Updated</th>
                    <th>Logs</th>
                  </tr></thead>
                  <tbody>
                    ${deployments.map(d => html`
                      <tr>
                        <td><a href="#/app/${escape(d.repo_name)}" style="color:var(--accent);text-decoration:none">${escape(d.repo_name || '?')}</a></td>
                        <td style="font-family:monospace;font-size:12px">${escape(d.deployment_id)}</td>
                        <td>${stateBadge(d.state)}${d.failure_reason ? html`<div class="failure-reason">${escape(d.failure_reason)}</div>` : ''}</td>
                        <td>${d.commit_hash ? html`<span class="commit-hash">${escape(d.commit_hash.substring(0, 8))}</span>` : '-'}</td>
                        <td class="timestamp">${timeAgo(d.updated_at)}</td>
                        <td><a href="#/logs/${escape(d.deployment_id)}" class="btn btn-sm">View</a></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
        </div>
      `;
    } catch (err) {
      showError(err.message);
    }
  }

  async function renderLogs(deploymentId) {
    showLoading();
    try {
      await promptApiKey();
      const [deployment, logs] = await Promise.all([
        API.getDeployment(deploymentId).catch(() => null),
        API.getDeploymentLogs(deploymentId).catch(() => { throw new Error('Logs not available for this deployment'); }),
      ]);

      const logLines = logs.logs || [];
      const logHtml = logLines.length === 0
        ? '<div class="empty-state"><p>No log entries yet.</p></div>'
        : logLines.map(line => {
            const match = line.match(/\[(INFO|WARN|ERROR|WARNING)\]/);
            const level = match ? match[1] : 'INFO';
            return html`<div class="log-line log-${escape(level)}">${escape(line)}</div>`;
          }).join('');

      $app.innerHTML = html`
        <div class="page-header">
          <a href="#/deployments" class="btn btn-sm" style="margin-bottom:12px;display:inline-flex">&larr; Back</a>
          <h1>Deployment Logs</h1>
          <p>${escape(deploymentId)} ${deployment ? stateBadge(deployment.state) : ''}</p>
        </div>
        <div class="log-viewer">${logHtml}</div>
      `;

      const viewer = $('.log-viewer');
      if (viewer) viewer.scrollTop = viewer.scrollHeight;
    } catch (err) {
      showError(err.message);
    }
  }

  async function router() {
    const hash = location.hash.slice(1) || '/';
    if (hash.startsWith('/app/')) {
      const name = hash.slice(5);
      renderApp(decodeURIComponent(name));
    } else if (hash.startsWith('/logs/')) {
      const id = hash.slice(6);
      renderLogs(decodeURIComponent(id));
    } else if (hash.startsWith('/deployments')) {
      renderDeployments();
    } else {
      renderHome();
    }

    $$('[data-nav]').forEach(el => {
      el.classList.toggle('active', el.getAttribute('href') === location.hash);
    });
  }

  window.addEventListener('hashchange', router);
  window.addEventListener('load', router);

  window.APP = {
    async rollback(repoName) {
      if (!confirm(`Rollback ${repoName} to the previous deployment?`)) return;
      try {
        await promptApiKey();
        const result = await API.rollbackApp(repoName);
        alert(`Rollback initiated: ${result.deployment_id}`);
        router();
      } catch (err) {
        alert(`Rollback failed: ${err.message}`);
      }
    },
  };
})();
