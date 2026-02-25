import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { GameProvider } from './context/GameContext'
import { isSupabaseConfigured } from './lib/supabase'
import Home from './pages/Home'
import Join from './pages/Join'
import Game from './pages/Game'
import AdminLogin from './pages/admin/AdminLogin'
import Dashboard from './pages/admin/Dashboard'

function AdminGuard() {
  const [auth, setAuth] = useState(false)

  if (!auth) return <AdminLogin onLogin={setAuth} />
  return <Dashboard />
}

function SetupBanner() {
  if (isSupabaseConfigured) return null
  return (
    <div className="fixed top-16 left-0 right-0 z-[60] flex justify-center px-4 animate-slide-down">
      <div className="glass-strong rounded-xl px-6 py-3 neon-border flex items-center gap-3 max-w-xl">
        <span className="text-neon-yellow text-lg">⚠</span>
        <div>
          <p className="text-sm text-white font-medium">Supabase not configured</p>
          <p className="text-xs text-gray-400">
            Add your <code className="text-matrix-300">VITE_SUPABASE_URL</code> and <code className="text-matrix-300">VITE_SUPABASE_ANON_KEY</code> to the <code className="text-matrix-300">.env</code> file, then restart the dev server.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <GameProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e1e2e',
            color: '#e0e0ff',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#39ff14', secondary: '#1e1e2e' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#1e1e2e' },
          },
        }}
      />
      <SetupBanner />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join" element={<Join />} />
        <Route path="/game" element={<Game />} />
        <Route path="/admin" element={<AdminGuard />} />
      </Routes>
    </GameProvider>
  )
}
