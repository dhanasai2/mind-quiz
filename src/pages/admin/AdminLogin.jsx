import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { HiOutlineLockClosed } from 'react-icons/hi2'
import Layout from '../../components/Layout'
import Navbar from '../../components/Navbar'

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'
    if (password === adminPassword) {
      onLogin(true)
      toast.success('Welcome, Admin!')
    } else {
      toast.error('Incorrect password')
    }
  }

  return (
    <Layout>
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-2xl p-8 neon-border text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-matrix-500/20 mb-6">
            <HiOutlineLockClosed className="text-3xl text-matrix-400" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white mb-2">Admin Access</h1>
          <p className="text-gray-400 text-sm mb-6">Enter the admin password to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="input-field text-center"
              autoFocus
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="btn-primary w-full"
            >
              Unlock Dashboard
            </motion.button>
          </form>

          <p className="mt-4 text-xs text-gray-600">
            Default password: admin123
          </p>
        </motion.div>
      </div>
    </Layout>
  )
}
