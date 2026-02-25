import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineHome, HiOutlineCog6Tooth } from 'react-icons/hi2'
import { IoGameControllerOutline } from 'react-icons/io5'

export default function Navbar() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 glass-strong"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-matrix-500 to-neon-cyan flex items-center justify-center
                            group-hover:shadow-lg group-hover:shadow-matrix-500/30 transition-all duration-300">
              <IoGameControllerOutline className="text-white text-lg" />
            </div>
            <span className="font-display font-bold text-lg tracking-wider text-white">
              MIND<span className="text-gradient"> MATRIX</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                location.pathname === '/'
                  ? 'bg-matrix-500/20 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-dark-300'
              }`}
            >
              <HiOutlineHome className="text-lg" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              to="/admin"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                isAdmin
                  ? 'bg-matrix-500/20 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-dark-300'
              }`}
            >
              <HiOutlineCog6Tooth className="text-lg" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
