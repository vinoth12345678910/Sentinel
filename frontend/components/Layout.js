import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { Sidebar, Navbar } from './Sidebar'
import { useAuth } from '../lib/AuthContext'

const navSections = [
  {
    title: 'Overview',
    items: [
      { icon: 'home', label: 'Dashboard', href: '/dashboard' },
      { icon: 'activity', label: 'Activity', href: '/dashboard/activity' },
    ]
  },
  {
    title: 'Management',
    items: [
      { icon: 'folder', label: 'Projects', href: '/dashboard/projects' },
      { icon: 'app', label: 'Apps', href: '/dashboard/apps' },
      { icon: 'monitor', label: 'Monitoring', href: '/dashboard/monitoring' },
    ]
  },
  {
    title: 'Settings',
    items: [
      { icon: 'settings', label: 'Settings', href: '/dashboard/settings' },
      { icon: 'users', label: 'Teams', href: '/dashboard/teams' },
    ]
  }
]

const adminNavSections = [
  {
    title: 'Admin',
    items: [
      { icon: 'monitor', label: 'Dashboard', href: '/admin' },
      { icon: 'users', label: 'Users', href: '/admin/users' },
      { icon: 'lock', label: 'Security', href: '/admin/security' },
      { icon: 'activity', label: 'Audit Log', href: '/admin/audit' },
    ]
  }
]

export default function Layout({ children, title = 'Dashboard', admin = false }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const sections = admin ? adminNavSections : navSections
  sections._user = user

  const stripBasePath = (asPath, basePath) =>
    basePath && asPath.startsWith(basePath) ? asPath.slice(basePath.length) || '/' : asPath
  const path = stripBasePath(router.asPath, router.basePath)

  const titleMap = {
    '/dashboard': 'Dashboard',
    '/dashboard/projects': 'Projects',
    '/dashboard/apps': 'Apps',
    '/dashboard/create': 'Create App',
    '/dashboard/settings': 'Settings',
    '/dashboard/teams': 'Teams',
    '/dashboard/monitoring': 'Monitoring',
    '/dashboard/activity': 'Activity',
    '/admin': 'Admin Console',
    '/admin/users': 'Admin - Users',
    '/admin/security': 'Admin - Security',
    '/admin/audit': 'Admin - Audit Log',
  }

  const pageTitle = titleMap[path] || title

  useEffect(() => {
    setSidebarOpen(false)
  }, [path])

  return (
    <>
      <Head>
        <link rel="stylesheet" href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/styles/globals.css`} />
      </Head>
      <div className="app-layout">
      <div
        className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <Sidebar sections={sections} activePath={path} user={user} />
        {admin && (
          <div style={{ padding: 'var(--space-2) var(--space-3)' }}>
            <Link href="/dashboard" className="nav-item" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span>Back to Dashboard</span>
            </Link>
          </div>
        )}
      </aside>
      <div className="main-content">
        <Navbar title={pageTitle} user={user} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-content">
          <div id="page-content">{children}</div>
        </div>
      </div>
    </div>
    </>
  )
}
