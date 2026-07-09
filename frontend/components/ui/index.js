import I from '../Icons'

export function Card({ title, children, actions, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {title && (
        <div className="card-header">
          <h3 className="card-title">{title}</h3>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  )
}

export function Badge({ variant = 'default', children }) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}

export function StatusBadge({ status }) {
  const s = (status || 'unknown').toLowerCase()
  const map = {
    healthy: 'success',
    running: 'success',
    active: 'success',
    deployed: 'success',
    success: 'success',
    ssl_provisioning: 'info',
    provisioning: 'info',
    pending: 'warning',
    deploying: 'warning',
    building: 'warning',
    failed: 'danger',
    error: 'danger',
    crashed: 'danger',
    stopped: 'secondary',
    unknown: 'default',
  }
  return <Badge variant={map[s] || 'default'}>{status || 'Unknown'}</Badge>
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        {description && <p className="text-muted text-sm">{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  )
}

export function MetricsGrid({ metrics }) {
  return (
    <div className="metrics-grid">
      {metrics.map((m, i) => (
        <div className="metric-card" key={i}>
          <div className="metric-label">{m.label}</div>
          <div className="metric-value">{m.value ?? '-'}</div>
          {m.sub && <div className="metric-sub text-muted text-xs">{m.sub}</div>}
        </div>
      ))}
    </div>
  )
}

export function Table({ headers, rows, emptyText = 'No data' }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="empty-state">
        <p className="text-muted">{emptyText}</p>
      </div>
    )
  }
  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>{I.x}</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`tab ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function Skeleton({ type = 'text' }) {
  return <div className={`skeleton skeleton-${type}`} />
}

export function LoadingState() {
  return (
    <div className="loading-state">
      <div className="spinner" />
    </div>
  )
}

export function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <h3>{title || 'No data'}</h3>
      {description && <p className="text-muted">{description}</p>}
    </div>
  )
}

export function AppCard({ app, href }) {
  const name = app.name || app.app_name || 'Unnamed'
  const desc = app.description || ''
  const domain = app.domain || app.domains?.[0] || ''
  const status = app.status || 'unknown'
  return (
    <a href={href} className="app-card">
      <div className="app-card-left">
        <div className="app-card-avatar">{I.terminal}</div>
        <div className="app-card-info">
          <div className="app-card-name">{name}</div>
          {desc && <div className="app-card-desc">{desc}</div>}
        </div>
      </div>
      <div className="app-card-right">
        {domain && <span className="text-xs text-muted">{domain}</span>}
        <StatusBadge status={status} />
      </div>
    </a>
  )
}

export function ProjectCard({ project, href }) {
  const name = project.name || 'Unnamed'
  const desc = project.description || ''
  const count = project.app_count ?? project.apps?.length ?? 0
  return (
    <a href={href} className="app-card">
      <div className="app-card-left">
        <div className="app-card-avatar">{I.folder}</div>
        <div className="app-card-info">
          <div className="app-card-name">{name}</div>
          {desc && <div className="app-card-desc">{desc}</div>}
        </div>
      </div>
      <div className="app-card-right">
        <span className="text-xs text-muted">{count} app{count !== 1 ? 's' : ''}</span>
      </div>
    </a>
  )
}

export function Terminal({ lines, id }) {
  return (
    <div className="terminal" id={id}>
      {(!lines || lines.length === 0) ? (
        <div className="terminal-line terminal-prompt">Waiting for output...</div>
      ) : (
        lines.map((line, i) => (
          <div key={i} className={`terminal-line ${line.startsWith('[') ? 'terminal-prompt' : ''}`}>
            {line}
          </div>
        ))
      )}
    </div>
  )
}

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.variant || 'info'}`}>
          <span>{t.message}</span>
          <button className="toast-close" onClick={() => onDismiss(t.id)}>{I.x}</button>
        </div>
      ))}
    </div>
  )
}
