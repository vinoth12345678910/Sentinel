import Link from 'next/link'
import I from './Icons'

export function Sidebar({ sections, activePath, user }) {
  return (
    <>
      <div className="sidebar-header">
        <Link href="/dashboard" className="sidebar-logo">
          {I.rocket}
          <span>Sentinel</span>
        </Link>
      </div>
      <nav className="sidebar-nav">
        {sections.map((sec, si) => {
          const secActive = sec.items.some(item => item.href && activePath?.startsWith(item.href))
          return (
            <div className={`sidebar-section${secActive ? ' active' : ''}`} key={si}>
              <div className="sidebar-section-title">{sec.title}</div>
              {sec.items.map((item, ii) => {
                const active = item.href && (activePath === item.href || activePath?.startsWith(item.href))
                return (
                  <Link
                    key={ii}
                    href={item.href || '#'}
                    className={`nav-item${active ? ' active' : ''}`}
                  >
                    {I[item.icon] && <span className="nav-icon">{I[item.icon]}</span>}
                    <span>{item.label}</span>
                    {item.badge && <span className={`badge badge-${item.badgeType || 'info'}`}>{item.badge}</span>}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>
      <div className="sidebar-footer">
        <Link href="/dashboard/settings" className="nav-item">
          <span className="navbar-avatar" style={{ width: 26, height: 26, fontSize: 10, margin: 0 }}>
            {user?.name ? user.name.split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2) : 'U'}
          </span>
          <span style={{ fontSize: 'var(--text-sm)' }}>{user?.name || 'User'}</span>
        </Link>
      </div>
    </>
  )
}

export function Navbar({ title, user, onMenuClick }) {
  const initials = user?.name
    ? user.name.split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2)
    : 'U'
  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="sidebar-toggle" onClick={onMenuClick}>{I.menu}</button>
        <h4>{title}</h4>
      </div>
      <div className="navbar-right">
        <div className="navbar-search search-desktop">
          {I.search}
          <input type="text" placeholder="Search..." />
        </div>
        <button className="navbar-icon-btn">
          {I.bell}
          <span className="dot" />
        </button>
        <div className="navbar-avatar" title={user?.name || 'User'}>{initials}</div>
      </div>
    </header>
  )
}
