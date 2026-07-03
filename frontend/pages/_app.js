import { useState } from 'react'
import { AuthProvider } from '../lib/AuthContext'

let toasts = []
let toastId = 0
let toastListeners = []

function emitToasts() {
  toastListeners.forEach(fn => fn(toasts))
}

export function showToast(message, variant = 'info') {
  const id = ++toastId
  toasts = [...toasts, { id, message, variant }]
  emitToasts()
  setTimeout(() => dismissToast(id), 4000)
}

export function dismissToast(id) {
  toasts = toasts.filter(t => t.id !== id)
  emitToasts()
}

function ToastContainer() {
  const [items, setItems] = useState([])
  useState(() => {
    toastListeners.push(setItems)
    return () => { toastListeners = toastListeners.filter(fn => fn !== setItems) }
  })
  if (items.length === 0) return null
  return (
    <div className="toast-container">
      {items.map(t => (
        <div key={t.id} className={`toast toast-${t.variant || 'info'}`}>
          <span>{t.message}</span>
          <button className="toast-close" onClick={() => dismissToast(t.id)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      ))}
    </div>
  )
}

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
      <ToastContainer />
    </AuthProvider>
  )
}
