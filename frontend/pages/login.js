import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../lib/AuthContext'
import I from '../components/Icons'

export default function LoginPage() {
  const [tab, setTab] = useState('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!username || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    try {
      const ok = await login(username, password)
      if (ok) router.push('/dashboard')
      else setError('Invalid credentials.')
    } catch (err) {
      setError(err.message || 'Login failed.')
    } finally { setLoading(false) }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (!username || !email || !password || !confirm) { setError('Please fill in all fields.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      const ok = await register(username, email, password)
      if (ok) router.push('/dashboard')
      else setError('Registration failed.')
    } catch (err) {
      setError(err.message || 'Registration failed.')
    } finally { setLoading(false) }
  }

  const style = {
    loginPage: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: 'var(--space-4)' },
    card: { width: '100%', maxWidth: 400 },
    btn: { width: '100%', justifyContent: 'center', padding: 'var(--space-3)' },
    footer: { textAlign: 'center', marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)' },
  }

  return (
    <div style={style.loginPage}>
      <div className="card" style={style.card}>
        <div className="card-body">
          <div className="login-logo" style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'inline-flex', padding: 'var(--space-3)', borderRadius: 'var(--radius)', background: 'var(--bg-secondary)' }}>{I.rocket}</div>
            <h2 style={{ marginTop: 'var(--space-2)' }}>Sentinel</h2>
          </div>
          {error && <div className="login-error" style={{ display: 'block' }}>{error}</div>}
          <div className="login-tabs">
            <button className={`login-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
            <button className={`login-tab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>Create Account</button>
          </div>
          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input type="text" className="form-input" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" style={style.btn} disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input type="text" className="form-input" placeholder="Choose a username" value={username} onChange={e => setUsername(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input type="password" className="form-input" placeholder="Confirm your password" value={confirm} onChange={e => setConfirm(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" style={style.btn} disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
          <div style={style.footer}>
            <Link href="/" style={{ color: 'var(--text-muted)' }}>Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
