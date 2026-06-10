(function () {
  const $app = document.getElementById('app');
  const $navLinks = document.querySelector('.nav-links');

  function $(sel, parent) { return (parent || document).querySelector(sel); }
  function $$(sel, parent) { return (parent || document).querySelectorAll(sel); }

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
    return new Date(iso).toLocaleString();
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

  function updateNav() {
    const token = API.getToken();
    if (token) {
      $navLinks.innerHTML = html`
        <a href="#/" class="nav-link" data-nav>Apps</a>
        <a href="#/projects" class="nav-link" data-nav>Projects</a>
        <a href="#/deployments" class="nav-link" data-nav>Deployments</a>
        <a href="#/monitoring" class="nav-link" data-nav>Monitoring</a>
        <a href="#/teams" class="nav-link" data-nav>Teams</a>
        <a href="#/audit-log" class="nav-link" data-nav>Audit Log</a>
        <a href="#/settings" class="nav-link" data-nav>Settings</a>
        <a href="#/login" class="nav-link" onclick="APP.logout()" style="margin-left:auto;color:var(--red)">Logout</a>
      `;
    } else {
      $navLinks.innerHTML = html`
        <a href="#/login" class="nav-link" data-nav style="margin-left:auto">Login</a>
      `;
    }
    $$('[data-nav]').forEach(el => {
      el.classList.toggle('active', el.getAttribute('href') === location.hash);
    });
  }

  async function checkAuth() {
    if (API.getToken()) return true;
    try {
      const ok = await API.refresh();
      return ok;
    } catch { return false; }
  }

  async function renderLogin() {
    $app.innerHTML = html`
      <div style="max-width:400px;margin:64px auto">
        <div class="card">
          <div class="card-title" style="text-align:center;font-size:18px;text-transform:none">Sentinel Login</div>
          <form id="login-form">
            <div class="form-group">
              <label>Username or Email</label>
              <input type="text" id="login-username" class="form-input" required autocomplete="username">
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" id="login-password" class="form-input" required autocomplete="current-password">
            </div>
            <div id="login-error" style="color:var(--red);font-size:14px;margin-bottom:12px;display:none"></div>
            <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">Sign In</button>
          </form>
          <p style="text-align:center;margin-top:16px;font-size:14px;color:var(--text-secondary)">
            No account? <a href="#/register" style="color:var(--accent)">Register</a>
          </p>
        </div>
      </div>
    `;
    $('#login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = $('#login-error');
      errEl.style.display = 'none';
      const btn = e.target.querySelector('button');
      btn.disabled = true;
      btn.textContent = 'Signing in...';
      try {
        const data = await API.login($('#login-username').value, $('#login-password').value);
        API.setToken(data.accessToken);
        updateNav();
        router();
      } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    });
  }

  async function renderRegister() {
    $app.innerHTML = html`
      <div style="max-width:400px;margin:64px auto">
        <div class="card">
          <div class="card-title" style="text-align:center;font-size:18px;text-transform:none">Create Account</div>
          <form id="register-form">
            <div class="form-group">
              <label>Username</label>
              <input type="text" id="reg-username" class="form-input" required autocomplete="username">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="reg-email" class="form-input" required autocomplete="email">
            </div>
            <div class="form-group">
              <label>Password (min 8 chars)</label>
              <input type="password" id="reg-password" class="form-input" required minlength="8" autocomplete="new-password">
            </div>
            <div id="reg-error" style="color:var(--red);font-size:14px;margin-bottom:12px;display:none"></div>
            <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">Create Account</button>
          </form>
          <p style="text-align:center;margin-top:16px;font-size:14px;color:var(--text-secondary)">
            Already have an account? <a href="#/login" style="color:var(--accent)">Sign in</a>
          </p>
        </div>
      </div>
    `;
    $('#register-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = $('#reg-error');
      errEl.style.display = 'none';
      const btn = e.target.querySelector('button');
      btn.disabled = true;
      btn.textContent = 'Creating...';
      try {
        const data = await API.register(
          $('#reg-username').value,
          $('#reg-email').value,
          $('#reg-password').value
        );
        API.setToken(data.accessToken);
        updateNav();
        router();
      } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }
    });
  }

  async function renderHome() {
    showLoading();
    try {
      if (!(await checkAuth())) { renderLogin(); return; }
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
      if (err.message.includes('Authentication')) { renderLogin(); return; }
      showError(err.message);
    }
  }

  async function renderProjects() {
    showLoading();
    try {
      if (!(await checkAuth())) { renderLogin(); return; }
      const projects = await API.listProjects();

      $app.innerHTML = html`
        <div class="page-header">
          <h1>Projects</h1>
          <p>Organize your applications into projects</p>
        </div>
        <div class="card">
          <div class="card-title">New Project</div>
          <form id="create-project-form" style="display:flex;gap:8px;align-items:flex-end">
            <div class="form-group" style="flex:1;margin-bottom:0">
              <label>Project Name</label>
              <input type="text" id="project-name-input" class="form-input" required placeholder="my-project">
            </div>
            <button type="submit" class="btn btn-primary">Create</button>
          </form>
        </div>
        <div class="card">
          <div class="card-title">All Projects (${projects.length})</div>
          ${projects.length === 0
            ? '<div class="empty-state"><p>No projects yet. Create one above.</p></div>'
            : projects.map(p => html`
              <a href="#/project/${escape(p.id)}" class="app-card">
                <div class="app-card-left">
                  <div>
                    <div class="app-card-name">${escape(p.name)}</div>
                    <div class="app-card-repo">${escape(p.description || '')} · ${p.app_count} app(s)</div>
                  </div>
                </div>
                <div class="app-card-right">
                  <span class="timestamp">${timeAgo(p.created_at)}</span>
                </div>
              </a>
            `).join('')}
        </div>
      `;

      $('#create-project-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = $('#project-name-input').value.trim();
        if (!name) return;
        try {
          await API.createProject(name);
          $('#project-name-input').value = '';
          renderProjects();
        } catch (err) {
          alert('Failed to create project: ' + err.message);
        }
      });
    } catch (err) {
      if (err.message.includes('Authentication')) { renderLogin(); return; }
      showError(err.message);
    }
  }

  async function renderProject(id) {
    showLoading();
    try {
      if (!(await checkAuth())) { renderLogin(); return; }
      const project = await API.getProject(id);
      const apps = project.apps || [];

      $app.innerHTML = html`
        <div class="page-header">
          <a href="#/projects" class="btn btn-sm" style="margin-bottom:12px;display:inline-flex">&larr; Back</a>
          <h1>${escape(project.name)}</h1>
          <p>${escape(project.description || 'No description')}</p>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:24px">
          <button class="btn btn-danger btn-sm" onclick="APP.deleteProject('${escape(project.id)}')">Delete Project</button>
        </div>
        <div class="card">
          <div class="card-title">Apps (${apps.length})</div>
          ${apps.length === 0
            ? '<div class="empty-state"><p>No apps in this project. Assign apps from their detail page.</p></div>'
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
                </div>
              </a>
            `).join('')}
        </div>
      `;
    } catch (err) {
      if (err.message.includes('Authentication')) { renderLogin(); return; }
      showError(err.message);
    }
  }

  async function renderApp(repoName) {
    showLoading();
    try {
      if (!(await checkAuth())) { renderLogin(); return; }
      const [app, appDeployments, envVars, projects, domains] = await Promise.all([
        API.getApp(repoName),
        API.listAppDeployments(repoName).catch(() => []),
        API.getEnvVars(repoName).catch(() => []),
        API.listProjects().catch(() => []),
        API.listDomains(repoName).catch(() => []),
      ]);

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
            <div class="detail-label">Domain</div>
            <div class="detail-value">${app.domain ? html`<a href="https://${escape(app.domain)}" target="_blank" style="color:var(--accent);text-decoration:none">${escape(app.domain)}</a>` : 'Not configured'}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">SSL</div>
            <div class="detail-value">${app.ssl ? html`<span class="badge badge-success">Active</span>` : html`<span class="badge badge-info">Pending</span>`}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Registered</div>
            <div class="detail-value timestamp">${formatTime(app.registered_at)}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Project</div>
            <div class="detail-value">
              <select id="project-select" class="form-input" style="width:auto" onchange="APP.setAppProject('${escape(repoName)}', this.value)">
                <option value="">No project</option>
                ${projects.map(p => html`
                  <option value="${escape(p.id)}" ${app.project_id == p.id ? 'selected' : ''}>${escape(p.name)}</option>
                `).join('')}
              </select>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:24px">
          <button class="btn btn-danger btn-sm" onclick="APP.rollback('${escape(repoName)}')">Rollback</button>
          <button class="btn btn-danger btn-sm" onclick="APP.deleteApp('${escape(repoName)}')">Delete App</button>
        </div>
        <div class="card">
          <div class="card-title">Environment Variables</div>
          <div id="env-vars-area">
            ${envVars.length === 0
              ? '<div class="empty-state"><p>No environment variables set.</p></div>'
              : html`
                <div class="table-wrap">
                  <table>
                    <thead><tr><th>Key</th><th>Value</th><th>Updated</th><th></th></tr></thead>
                    <tbody>
                      ${envVars.map(v => html`
                        <tr>
                          <td style="font-family:monospace">${escape(v.key)}</td>
                          <td style="font-family:monospace">${escape(v.value)}</td>
                          <td class="timestamp">${timeAgo(v.updated_at)}</td>
                          <td><button class="btn btn-danger btn-sm" onclick="APP.deleteEnvVar('${escape(repoName)}','${escape(v.key)}')">Delete</button></td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              `}
            <form id="env-var-form" style="display:flex;gap:8px;margin-top:12px;align-items:flex-end">
              <div class="form-group" style="flex:1;margin-bottom:0">
                <label>Key</label>
                <input type="text" class="form-input" id="env-key" placeholder="MY_VAR" style="font-family:monospace">
              </div>
              <div class="form-group" style="flex:2;margin-bottom:0">
                <label>Value</label>
                <input type="text" class="form-input" id="env-value" placeholder="value" style="font-family:monospace">
              </div>
              <button type="submit" class="btn btn-primary">Add</button>
            </form>
          </div>
        </div>
        <div class="card">
          <div class="card-title">Custom Domains</div>
          <div id="domains-area">
            ${domains.length === 0
              ? '<div class="empty-state"><p>No custom domains configured.</p></div>'
              : html`
                <div class="table-wrap">
                  <table>
                    <thead><tr><th>Domain</th><th>SSL</th><th>SSL Provisioned</th><th></th></tr></thead>
                    <tbody>
                      ${domains.map(d => html`
                        <tr>
                          <td><a href="https://${escape(d.domain)}" target="_blank" style="color:var(--accent);text-decoration:none">${escape(d.domain)}</a></td>
                          <td>${d.ssl_enabled ? html`<span class="badge badge-success">Enabled</span>` : html`<span class="badge badge-info">Pending</span>`}</td>
                          <td class="timestamp">${d.verified ? 'DNS Verified' : 'Pending'}</td>
                          <td><button class="btn btn-danger btn-sm" onclick="APP.deleteDomain('${escape(repoName)}','${escape(d.id)}','${escape(d.domain)}')">Remove</button></td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              `}
            <form id="domain-form" style="display:flex;gap:8px;margin-top:12px;align-items:flex-end">
              <div class="form-group" style="flex:1;margin-bottom:0">
                <label>Domain</label>
                <input type="text" class="form-input" id="domain-input" placeholder="app.example.com">
              </div>
              <button type="submit" class="btn btn-primary">Add Domain</button>
            </form>
          </div>
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
                          <td><a href="#/logs/${escape(d.deployment_id)}" class="btn btn-sm">Logs</a></td>
                          <td>${d.state === 'SUCCESS' ? html`<button class="btn btn-sm btn-danger" onclick="APP.rollbackToDeployment('${escape(repoName)}','${escape(d.deployment_id)}')">Rollback</button>` : ''}</td>
                        </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
        </div>
      `;

      $('#env-var-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const key = $('#env-key').value.trim();
        const value = $('#env-value').value.trim();
        if (!key) return;
        try {
          await API.setEnvVar(repoName, key, value);
          $('#env-key').value = '';
          $('#env-value').value = '';
          renderApp(repoName);
        } catch (err) {
          alert('Failed to set env var: ' + err.message);
        }
      });

      const domainForm = $('#domain-form');
      if (domainForm) {
        domainForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const domain = $('#domain-input').value.trim();
          if (!domain) return;
          try {
            await API.addDomain(repoName, domain);
            $('#domain-input').value = '';
            renderApp(repoName);
          } catch (err) {
            alert('Failed to add domain: ' + err.message);
          }
        });
      }
    } catch (err) {
      if (err.message.includes('Authentication')) { renderLogin(); return; }
      showError(err.message);
    }
  }

  async function renderDeployments() {
    showLoading();
    try {
      if (!(await checkAuth())) { renderLogin(); return; }
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
      if (err.message.includes('Authentication')) { renderLogin(); return; }
      showError(err.message);
    }
  }

  async function renderLogs(deploymentId) {
    showLoading();
    try {
      if (!(await checkAuth())) { renderLogin(); return; }
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
          <p>${escape(deploymentId)} ${deployment ? stateBadge(deployment.state) : ''} <span id="live-indicator" style="display:none;margin-left:8px;font-size:12px;color:var(--green)">● LIVE</span></p>
        </div>
        <div class="log-viewer" id="log-viewer">${logHtml}</div>
      `;

      const viewer = $('#log-viewer');
      if (viewer) viewer.scrollTop = viewer.scrollHeight;

      const token = API.getToken();
      const eventSource = new EventSource(`/deployments/${encodeURIComponent(deploymentId)}/logs/stream?token=${encodeURIComponent(token)}`);

      const liveIndicator = $('#live-indicator');
      if (liveIndicator) liveIndicator.style.display = 'inline';

      eventSource.addEventListener('message', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'connected') return;
          if (data.line) {
            const match = data.line.match(/\[(INFO|WARN|ERROR|WARNING)\]/);
            const level = match ? match[1] : 'INFO';
            const lineHtml = html`<div class="log-line log-${escape(level)}">${escape(data.line)}</div>`;
            const viewerEl = $('#log-viewer');
            if (viewerEl) {
              const emptyState = viewerEl.querySelector('.empty-state');
              if (emptyState) emptyState.remove();
              viewerEl.insertAdjacentHTML('beforeend', lineHtml);
              viewerEl.scrollTop = viewerEl.scrollHeight;
            }
          }
        } catch {}
      });

      eventSource.addEventListener('error', () => {
        if (liveIndicator) liveIndicator.style.display = 'none';
        eventSource.close();
      });

      const origRouter = router;
      window.addEventListener('hashchange', () => {
        eventSource.close();
      }, { once: true });
    } catch (err) {
      if (err.message.includes('Authentication')) { renderLogin(); return; }
      showError(err.message);
    }
  }

  async function renderTeams() {
    showLoading();
    try {
      if (!(await checkAuth())) { renderLogin(); return; }
      const teams = await API.listTeams().catch(() => { throw new Error('Admin access required'); });

      $app.innerHTML = html`
        <div class="page-header">
          <h1>Teams</h1>
          <p>Manage teams and members</p>
        </div>
        <div class="card">
          <div class="card-title">New Team</div>
          <form id="create-team-form" style="display:flex;gap:8px;align-items:flex-end">
            <div class="form-group" style="flex:1;margin-bottom:0">
              <label>Team Name</label>
              <input type="text" id="team-name-input" class="form-input" required placeholder="my-team">
            </div>
            <button type="submit" class="btn btn-primary">Create</button>
          </form>
        </div>
        <div class="card">
          <div class="card-title">All Teams (${teams.length})</div>
          ${teams.length === 0
            ? '<div class="empty-state"><p>No teams yet.</p></div>'
            : teams.map(t => html`
              <div class="app-card" style="cursor:default">
                <div class="app-card-left">
                  <div>
                    <div class="app-card-name">${escape(t.name)}</div>
                    <div class="app-card-repo">${t.member_count} member(s) · ${escape(t.description || '')}</div>
                  </div>
                </div>
                <div class="app-card-right">
                  <button class="btn btn-danger btn-sm" onclick="APP.deleteTeam('${escape(t.id)}','${escape(t.name)}')">Delete</button>
                </div>
              </div>
            `).join('')}
        </div>
      `;

      const form = $('#create-team-form');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const name = $('#team-name-input').value.trim();
          if (!name) return;
          try {
            await API.createTeam(name);
            $('#team-name-input').value = '';
            renderTeams();
          } catch (err) {
            alert('Failed: ' + err.message);
          }
        });
      }
    } catch (err) {
      if (err.message.includes('Authentication')) { renderLogin(); return; }
      showError(err.message);
    }
  }

  async function renderAuditLog() {
    showLoading();
    try {
      if (!(await checkAuth())) { renderLogin(); return; }
      const [entries, stats] = await Promise.all([
        API.getAuditLog().catch(() => { throw new Error('Admin access required'); }),
        API.getAuditLogStats().catch(() => ({ total: 0, last24h: 0, actions: [] })),
      ]);

      $app.innerHTML = html`
        <div class="page-header">
          <h1>Audit Log</h1>
          <p>${stats.total} total entries · ${stats.last24h} in last 24h</p>
        </div>
        <div class="card">
          <div class="card-title">Recent Activity</div>
          ${entries.length === 0
            ? '<div class="empty-state"><p>No audit log entries.</p></div>'
            : html`
              <div class="table-wrap">
                <table>
                  <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Resource</th><th>Details</th></tr></thead>
                  <tbody>
                    ${entries.map(e => html`
                      <tr>
                        <td class="timestamp">${timeAgo(e.created_at)}</td>
                        <td>${escape(e.username)}</td>
                        <td><span class="badge badge-info">${escape(e.action)}</span></td>
                        <td>${escape(e.resource_type || '')} ${e.resource_id ? escape('#' + e.resource_id) : ''}</td>
                        <td style="font-size:12px;color:var(--text-secondary);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.details ? escape(JSON.stringify(e.details)) : ''}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
        </div>
      `;
    } catch (err) {
      if (err.message.includes('Authentication')) { renderLogin(); return; }
      showError(err.message);
    }
  }

  async function renderSettings() {
    showLoading();
    try {
      if (!(await checkAuth())) { renderLogin(); return; }

      $app.innerHTML = html`
        <div class="page-header">
          <h1>Settings</h1>
          <p>GitHub integration and account settings</p>
        </div>
        <div class="card">
          <div class="card-title">GitHub Integration</div>
          <p style="color:var(--text-secondary);font-size:14px;margin-bottom:16px">
            Connect your GitHub account to import repositories and auto-register webhooks.
          </p>
          <a href="/auth/github" class="btn btn-primary">Connect GitHub Account</a>
        </div>
        <div class="card">
          <div class="card-title">Import App from GitHub</div>
          <p style="color:var(--text-secondary);font-size:14px;margin-bottom:16px">
            Select a repository to import into Sentinel.
          </p>
          <a href="#/import" class="btn">Browse Repositories</a>
        </div>
      `;
    } catch (err) {
      if (err.message.includes('Authentication')) { renderLogin(); return; }
      showError(err.message);
    }
  }

  async function renderMonitoring() {
    showLoading();
    try {
      if (!(await checkAuth())) { renderLogin(); return; }
      const data = await API.getMonitoringHealth();

      const mem = data.system.memory;
      const cpu = data.system.cpu;
      const disk = data.disk;
      const containers = data.containers || [];

      $app.innerHTML = html`
        <div class="page-header">
          <h1>Monitoring</h1>
          <p>System health and container metrics</p>
        </div>
        <div class="card">
          <div class="card-title">System</div>
          <div class="stat-grid">
            <div class="stat-card">
              <div class="stat-label">Memory</div>
              <div class="stat-value" style="font-size:20px">${mem.usage_percent}%</div>
              <div style="font-size:12px;color:var(--text-secondary)">${Math.round(mem.used / 1024 / 1024)}MB / ${Math.round(mem.total / 1024 / 1024)}MB</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">CPU</div>
              <div class="stat-value" style="font-size:20px">${cpu.usage_percent}%</div>
              <div style="font-size:12px;color:var(--text-secondary)">Load: ${data.system.load.join(', ')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Disk</div>
              <div class="stat-value" style="font-size:20px;color:${disk.use_percent > 80 ? 'var(--red)' : 'var(--green)'}">${disk.use_percent}%</div>
              <div style="font-size:12px;color:var(--text-secondary)">${Math.round(disk.used_kb / 1024 / 1024)}GB / ${Math.round(disk.total_kb / 1024 / 1024)}GB</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Uptime</div>
              <div class="stat-value" style="font-size:20px">${Math.floor(data.system.uptime / 86400)}d ${Math.floor((data.system.uptime % 86400) / 3600)}h</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Deployments</div>
              <div class="stat-value" style="font-size:20px">${data.deployments.total}</div>
              <div style="font-size:12px;color:var(--text-secondary)">${data.deployments.success} ok · ${data.deployments.failed} failed · ${data.deployments.running} running</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Apps</div>
              <div class="stat-value" style="font-size:20px">${data.apps.total}</div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-title">Containers (${containers.length})</div>
          ${containers.length === 0
            ? '<div class="empty-state"><p>No containers running or Docker not available.</p></div>'
            : html`
              <div class="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>CPU</th><th>Memory</th></tr></thead>
                  <tbody>
                    ${containers.map(c => html`
                      <tr>
                        <td style="font-family:monospace">${escape(c.name)}</td>
                        <td>${c.cpu_percent}%</td>
                        <td>${escape(c.mem_usage)} (${c.mem_percent}%)</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
        </div>
        <div style="text-align:center;margin-top:24px;font-size:13px;color:var(--text-secondary)">
          <a href="/metrics" target="_blank" style="color:var(--accent)">Prometheus Metrics</a>
        </div>
      `;
    } catch (err) {
      if (err.message.includes('Authentication')) { renderLogin(); return; }
      showError(err.message);
    }
  }

  async function renderImport() {
    showLoading();
    try {
      if (!(await checkAuth())) { renderLogin(); return; }
      const [repos, projects] = await Promise.all([
        API.listGitHubRepos(),
        API.listProjects().catch(() => []),
      ]);

      const unregistered = repos.filter(r => !r.registered);
      const registered = repos.filter(r => r.registered);

      $app.innerHTML = html`
        <div class="page-header">
          <a href="#/settings" class="btn btn-sm" style="margin-bottom:12px;display:inline-flex">&larr; Back</a>
          <h1>Import from GitHub</h1>
          <p>${repos.length} repositories found</p>
        </div>
        <div class="card">
          <div class="card-title">Available (${unregistered.length})</div>
          ${unregistered.length === 0
            ? '<div class="empty-state"><p>All repos are already registered.</p></div>'
            : unregistered.map(r => html`
              <div class="app-card" style="cursor:default">
                <div class="app-card-left">
                  <div>
                    <div class="app-card-name">${escape(r.name)}</div>
                    <div class="app-card-repo">${escape(r.language || '')} ${r.private ? html`<span class="badge badge-warning">Private</span>` : ''}</div>
                    <div style="font-size:13px;color:var(--text-secondary);margin-top:4px">
                      Project:
                      <select class="import-project-select" data-name="${escape(r.name)}" data-url="${escape(r.url)}" style="font-size:13px;padding:2px 4px">
                        <option value="">None</option>
                        ${projects.map(p => html`<option value="${escape(p.id)}">${escape(p.name)}</option>`).join('')}
                      </select>
                    </div>
                  </div>
                </div>
                <div class="app-card-right">
                  <button class="btn btn-primary btn-sm" onclick="APP.importRepo('${escape(r.name)}','${escape(r.url)}')">Import</button>
                </div>
              </div>
            `).join('')}
        </div>
        ${registered.length > 0 ? html`
          <div class="card">
            <div class="card-title">Already Registered (${registered.length})</div>
            ${registered.map(r => html`
              <a href="#/app/${escape(r.name)}" class="app-card">
                <div class="app-card-left">
                  <div>
                    <div class="app-card-name">${escape(r.name)}</div>
                  </div>
                </div>
                <div class="app-card-right">
                  <span class="badge badge-success">Registered</span>
                </div>
              </a>
            `).join('')}
          </div>
        ` : ''}
      `;
    } catch (err) {
      if (err.message.includes('Authentication')) { renderLogin(); return; }
      showError(err.message);
    }
  }

  async function router() {
    const hash = location.hash.slice(1) || '/';
    if (hash === '/login') { renderLogin(); }
    else if (hash === '/register') { renderRegister(); }
    else if (hash === '/projects') { renderProjects(); }
    else if (hash.startsWith('/project/')) { renderProject(hash.slice(9)); }
    else if (hash === '/monitoring') { renderMonitoring(); }
    else if (hash === '/teams') { renderTeams(); }
    else if (hash === '/audit-log') { renderAuditLog(); }
    else if (hash === '/settings') { renderSettings(); }
    else if (hash === '/import') { renderImport(); }
    else if (hash.startsWith('/app/')) { renderApp(decodeURIComponent(hash.slice(5))); }
    else if (hash.startsWith('/logs/')) { renderLogs(decodeURIComponent(hash.slice(6))); }
    else if (hash.startsWith('/deployments')) { renderDeployments(); }
    else { renderHome(); }
    updateNav();
  }

  window.addEventListener('hashchange', router);
  window.addEventListener('load', router);

  window.APP = {
    async logout() {
      try { await API.logout(); } catch {}
      API.setToken(null);
      updateNav();
      router();
    },
    async rollback(repoName) {
      if (!confirm(`Rollback ${repoName} to the previous deployment?`)) return;
      try {
        const result = await API.rollbackApp(repoName);
        alert(`Rollback initiated: ${result.deployment_id}`);
        router();
      } catch (err) {
        alert(`Rollback failed: ${err.message}`);
      }
    },
    async deleteApp(repoName) {
      if (!confirm(`Permanently delete ${repoName} and all its deployments?`)) return;
      if (!confirm(`Are you sure? This cannot be undone.`)) return;
      try {
        await API.deleteApp(repoName);
        alert(`App "${repoName}" deleted.`);
        router();
      } catch (err) {
        alert(`Delete failed: ${err.message}`);
      }
    },
    async deleteProject(id) {
      if (!confirm('Delete this project? Apps will not be deleted.')) return;
      try {
        await API.deleteProject(id);
        router();
      } catch (err) {
        alert('Delete failed: ' + err.message);
      }
    },
    async setAppProject(repoName, projectId) {
      try {
        await API.setAppProject(repoName, projectId || null);
      } catch (err) {
        alert('Failed to update project: ' + err.message);
      }
    },
    async deleteEnvVar(repoName, key) {
      if (!confirm(`Delete env var ${key}?`)) return;
      try {
        await API.deleteEnvVar(repoName, key);
        renderApp(repoName);
      } catch (err) {
        alert('Failed to delete env var: ' + err.message);
      }
    },
    async loadRepos() {
      const el = document.getElementById('repo-list');
      if (!el) return;
      el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
      try {
        const repos = await API.listGitHubRepos();
        if (repos.length === 0) {
          el.innerHTML = '<div class="empty-state"><p>No repositories found. Make sure your GitHub account has repos.</p></div>';
          return;
        }
        const unregistered = repos.filter(r => !r.registered);
        el.innerHTML = unregistered.map(r => html`
          <div class="app-card" style="cursor:default">
            <div class="app-card-left">
              <div>
                <div class="app-card-name">${escape(r.name)}</div>
                <div class="app-card-repo">${escape(r.language || '')}</div>
              </div>
            </div>
            <div class="app-card-right">
              <button class="btn btn-primary btn-sm" onclick="APP.importRepo('${escape(r.name)}','${escape(r.url)}')">Import</button>
            </div>
          </div>
        `).join('');
      } catch (err) {
        el.innerHTML = `<div class="empty-state"><p>${escape(err.message)}</p></div>`;
      }
    },
    async importRepo(name, url) {
      const projSelect = document.querySelector(`.import-project-select[data-name="${escape(name)}"]`);
      const projectId = projSelect ? projSelect.value : '';
      if (!confirm(`Import ${name} into Sentinel?`)) return;
      try {
        const result = await API.importApp(name, url, projectId || undefined);
        alert(`App "${name}" imported successfully!`);
        router();
      } catch (err) {
        alert(`Import failed: ${err.message}`);
      }
    },
    async deleteDomain(repoName, id, domain) {
      if (!confirm(`Remove domain ${domain}?`)) return;
      try {
        await API.deleteDomain(repoName, id);
        renderApp(repoName);
      } catch (err) {
        alert('Failed to remove domain: ' + err.message);
      }
    },
    async rollbackToDeployment(repoName, deploymentId) {
      if (!confirm(`Rollback ${repoName} to deployment ${deploymentId}?`)) return;
      try {
        const result = await API.request('POST', `/apps/${repoName}/deployments/${deploymentId}/rollback`);
        alert(`Rollback initiated: ${result.deployment_id}`);
        router();
      } catch (err) {
        alert(`Rollback failed: ${err.message}`);
      }
    },
    async deleteTeam(id, name) {
      if (!confirm(`Delete team "${name}"?`)) return;
      try {
        await API.deleteTeam(id);
        renderTeams();
      } catch (err) {
        alert('Failed: ' + err.message);
      }
    },
  };
})();