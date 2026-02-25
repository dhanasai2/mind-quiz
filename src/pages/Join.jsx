import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { HiOutlineArrowRight, HiOutlineArrowLeft, HiOutlineIdentification, HiOutlineUser, HiOutlineSparkles } from 'react-icons/hi2'
import { IoGameControllerOutline } from 'react-icons/io5'
import Layout from '../components/Layout'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'
import { useGame } from '../context/GameContext'

/* Floating neural particles for the join page */
function NeuralParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 12,
    }))
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, rgba(124,58,237,0.6), rgba(0,245,255,0.3))`,
            boxShadow: `0 0 ${p.size * 3}px rgba(124,58,237,0.3)`,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-15, 15, -15],
            opacity: [0.2, 0.8, 0.2],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            repeat: Infinity,
            duration: p.duration,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

export default function Join() {
  const navigate = useNavigate()
  const { joinEvent, loading } = useGame()
  const [eventCode, setEventCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [focusedField, setFocusedField] = useState(null)

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!eventCode.trim() || !playerId.trim() || !playerName.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      await joinEvent(eventCode.trim(), playerId.trim(), playerName.trim())
      toast.success('Joined successfully! Get ready to compete! 🧠')
      navigate('/game')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <Layout>
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-12 sm:py-20 relative">
        <NeuralParticles />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm group"
            whileHover={{ x: -4 }}
          >
            <HiOutlineArrowLeft className="group-hover:text-matrix-400 transition-colors" />
            Back to Home
          </motion.button>

          <motion.div
            className="relative rounded-2xl p-5 sm:p-8 md:p-10 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(30,30,46,0.92), rgba(20,20,35,0.96))',
              border: '1px solid rgba(124,58,237,0.35)',
              boxShadow: '0 0 40px rgba(124,58,237,0.12), 0 25px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Animated corner accents */}
            <motion.div
              className="absolute top-0 left-0 w-20 h-20"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.3), transparent)',
                borderRadius: '0 0 100% 0',
              }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 3 }}
            />
            <motion.div
              className="absolute bottom-0 right-0 w-20 h-20"
              style={{
                background: 'linear-gradient(315deg, rgba(0,245,255,0.2), transparent)',
                borderRadius: '100% 0 0 0',
              }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 3, delay: 1.5 }}
            />

            {/* Header */}
            <div className="text-center mb-8 relative">
              <motion.div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 relative"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(0,245,255,0.15))',
                  border: '1px solid rgba(124,58,237,0.4)',
                  boxShadow: '0 0 30px rgba(124,58,237,0.2)',
                }}
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(124,58,237,0.2)',
                    '0 0 40px rgba(124,58,237,0.4)',
                    '0 0 20px rgba(124,58,237,0.2)',
                  ],
                }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                >
                  <IoGameControllerOutline className="text-3xl text-matrix-300" />
                </motion.div>

                {/* Orbiting sparkle */}
                <motion.div
                  className="absolute w-2 h-2 rounded-full bg-neon-cyan"
                  style={{ boxShadow: '0 0 8px rgba(0,245,255,0.6)', position: 'absolute' }}
                  animate={{
                    rotate: 360,
                  }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                >
                  <motion.div
                    className="w-2 h-2 rounded-full bg-neon-cyan"
                    style={{ boxShadow: '0 0 8px rgba(0,245,255,0.6)' }}
                    animate={{
                      x: [0, 28, 0, -28, 0],
                      y: [-28, 0, 28, 0, -28],
                    }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                  />
                </motion.div>
              </motion.div>

              <motion.h1
                className="text-3xl font-display font-bold text-white mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Enter the <span className="text-gradient">Arena</span>
              </motion.h1>
              <motion.p
                className="text-gray-400 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Enter your details to join the Mind Matrix competition
              </motion.p>
            </div>

            <form onSubmit={handleJoin} className="space-y-5 relative">
              {/* Event Code */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
              >
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <HiOutlineSparkles className={`transition-colors duration-300 ${focusedField === 'code' ? 'text-neon-cyan' : 'text-matrix-400'}`} />
                  Event Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={eventCode}
                    onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                    onFocus={() => setFocusedField('code')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="e.g. QUIZ2026"
                    maxLength={10}
                    className="input-field text-center text-2xl font-display tracking-[0.3em] uppercase"
                    autoFocus
                  />
                  <AnimatePresence>
                    {focusedField === 'code' && (
                      <motion.div
                        className="absolute inset-0 rounded-xl pointer-events-none"
                        style={{ border: '1px solid rgba(0,245,255,0.4)', boxShadow: '0 0 20px rgba(0,245,255,0.1)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Player Name */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 }}
              >
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <HiOutlineUser className={`transition-colors duration-300 ${focusedField === 'name' ? 'text-neon-cyan' : 'text-matrix-400'}`} />
                  Your Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your full name"
                    maxLength={50}
                    className="input-field text-lg"
                  />
                  <AnimatePresence>
                    {focusedField === 'name' && (
                      <motion.div
                        className="absolute inset-0 rounded-xl pointer-events-none"
                        style={{ border: '1px solid rgba(0,245,255,0.4)', boxShadow: '0 0 20px rgba(0,245,255,0.1)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Player ID */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 }}
              >
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <HiOutlineIdentification className={`transition-colors duration-300 ${focusedField === 'id' ? 'text-neon-cyan' : 'text-matrix-400'}`} />
                  Your Player ID <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={playerId}
                    onChange={(e) => setPlayerId(e.target.value.toUpperCase())}
                    onFocus={() => setFocusedField('id')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="e.g. MM-A3B7K9"
                    maxLength={12}
                    className="input-field text-center text-xl font-mono tracking-widest uppercase"
                  />
                  <AnimatePresence>
                    {focusedField === 'id' && (
                      <motion.div
                        className="absolute inset-0 rounded-xl pointer-events-none"
                        style={{ border: '1px solid rgba(0,245,255,0.4)', boxShadow: '0 0 20px rgba(0,245,255,0.1)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    )}
                  </AnimatePresence>
                </div>
                <p className="text-xs text-gray-600 mt-1.5">
                  The unique ID assigned to you by the event organizer
                </p>
              </motion.div>

              {/* Submit */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
              >
                {loading ? (
                  <LoadingSpinner text="Joining event..." />
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(124,58,237,0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="btn-primary w-full text-lg flex items-center justify-center gap-2 relative overflow-hidden"
                  >
                    {/* Shimmer effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      animate={{ x: ['-200%', '200%'] }}
                      transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                    />
                    <span className="relative flex items-center gap-2">
                      Enter Arena
                      <HiOutlineArrowRight />
                    </span>
                  </motion.button>
                )}
              </motion.div>
            </form>

            {/* Info banner */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
              className="mt-6 p-4 rounded-xl relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(0,245,255,0.04))',
                border: '1px solid rgba(124,58,237,0.15)',
              }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-matrix-500/5 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
              />
              <div className="relative flex items-start gap-3">
                <span className="text-lg mt-0.5">💡</span>
                <div>
                  <p className="text-xs text-gray-400">
                    Your Player ID was provided by the event organizer. Each ID can only join an event <span className="text-matrix-300 font-semibold">once</span> — no duplicate entries allowed.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  )
}
