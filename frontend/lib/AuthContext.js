import { useState, useEffect, createContext, useContext } from 'react'
import { useRouter } from 'next/router'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = api.token
    if (token) {
      api.getMe()
        .then(data => { if (data) setUser(data) })
        .catch(() => api.refreshToken().then(ok => {
          if (ok) return api.getMe().then(d => { if (d) setUser(d) })
        }))
        .finally(() => setLoading(false))
    } else {
      api.refreshToken().then(ok => {
        if (ok) return api.getMe().then(d => { if (d) setUser(d) })
      }).finally(() => setLoading(false))
    }
  }, [])

  const login = async (username, password) => {
    const data = await api.login(username, password)
    if (data?.accessToken) {
      api.setToken(data.accessToken)
      setUser(data.user || { username, name: username })
      return true
    }
    return false
  }

  const register = async (username, email, password) => {
    const data = await api.register(username, email, password)
    if (data?.accessToken) {
      api.setToken(data.accessToken)
      setUser(data.user || { username, name: username, email })
      return true
    }
    return false
  }

  const logout = async () => {
    try { await api.logout() } catch (e) {}
    api.clearToken()
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function useGuard() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user && router.pathname !== '/login') {
      router.push('/login')
    }
  }, [user, loading, router])

  return { user, loading }
}
