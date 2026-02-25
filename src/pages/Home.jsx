import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineBolt, HiOutlineTrophy, HiOutlineClock, HiOutlineUsers, HiOutlineArrowRight, HiOutlineSparkles, HiOutlineExclamationTriangle, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2'
import { IoGameControllerOutline } from 'react-icons/io5'
import Layout from '../components/Layout'
import Navbar from '../components/Navbar'

const features = [
  {
    icon: HiOutlineBolt,
    title: 'Real-Time Competition',
    desc: 'All players see questions simultaneously. Every millisecond counts!',
    color: 'text-neon-cyan',
    gradient: 'from-cyan-500/15 to-cyan-600/5',
    borderColor: 'hover:border-cyan-400/40',
    glowColor: 'rgba(0,245,255,0.15)',
  },
  {
    icon: HiOutlineClock,
    title: 'Speed Scoring',
    desc: 'Faster correct answers earn more points. Think quick, answer quicker.',
    color: 'text-neon-purple',
    gradient: 'from-purple-500/15 to-purple-600/5',
    borderColor: 'hover:border-purple-400/40',
    glowColor: 'rgba(191,0,255,0.15)',
  },
  {
    icon: HiOutlineTrophy,
    title: 'Live Leaderboard',
    desc: 'Watch rankings update in real-time after every question.',
    color: 'text-neon-yellow',
    gradient: 'from-amber-500/15 to-amber-600/5',
    borderColor: 'hover:border-amber-400/40',
    glowColor: 'rgba(255,214,10,0.15)',
  },
  {
    icon: HiOutlineUsers,
    title: 'Multiplayer',
    desc: 'Compete against dozens of players in the same room.',
    color: 'text-neon-green',
    gradient: 'from-emerald-500/15 to-emerald-600/5',
    borderColor: 'hover:border-emerald-400/40',
    glowColor: 'rgba(57,255,20,0.15)',
  },
]

/* Animated hero brain icon */
function HeroBrainIcon() {
  return (
    <motion.div
      className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-8"
      style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(0,245,255,0.15))',
        border: '1px solid rgba(124,58,237,0.4)',
      }}
      animate={{
        y: [0, -12, 0],
        boxShadow: [
          '0 0 30px rgba(124,58,237,0.2), 0 0 60px rgba(124,58,237,0.1)',
          '0 0 50px rgba(124,58,237,0.4), 0 0 100px rgba(124,58,237,0.15)',
          '0 0 30px rgba(124,58,237,0.2), 0 0 60px rgba(124,58,237,0.1)',
        ],
      }}
      transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
    >
      {/* Rotating ring */}
      <motion.div
        className="absolute inset-[-6px] rounded-3xl"
        style={{
          border: '2px solid transparent',
          borderTopColor: 'rgba(0,245,255,0.4)',
          borderRightColor: 'rgba(124,58,237,0.2)',
        }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
      />

      {/* Counter-rotating ring */}
      <motion.div
        className="absolute inset-[-12px] rounded-3xl"
        style={{
          border: '1px solid transparent',
          borderBottomColor: 'rgba(191,0,255,0.25)',
          borderLeftColor: 'rgba(0,245,255,0.15)',
        }}
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
      />

      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
      >
        <IoGameControllerOutline className="text-5xl text-white drop-shadow-lg" />
      </motion.div>

      {/* Sparkle particles */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: i % 2 === 0 ? '#00f5ff' : '#bf00ff',
            boxShadow: `0 0 6px ${i % 2 === 0 ? 'rgba(0,245,255,0.8)' : 'rgba(191,0,255,0.8)'}`,
          }}
          animate={{
            x: [0, Math.cos(i * Math.PI / 2) * 40, 0],
            y: [0, Math.sin(i * Math.PI / 2) * 40, 0],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            delay: i * 0.75,
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.div>
  )
}

/* Animated text with stagger reveal */
function AnimatedTitle() {
  return (
    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black tracking-tight mb-4">
      <motion.span
        className="text-white inline-block"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        MIND
      </motion.span>{' '}
      <motion.span
        className="text-gradient inline-block"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        MATRIX
      </motion.span>
    </h1>
  )
}

/* ─── Event Countdown Timer ──────────────────────────────── */
const EVENT_DATE = new Date('2026-03-01T10:00:00+05:30') // March 1st 2026, 10 AM IST

function EventCountdown() {
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining())

  function getTimeRemaining() {
    const now = new Date()
    const diff = EVENT_DATE.getTime() - now.getTime()
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      expired: false,
    }
  }

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeRemaining()), 1000)
    return () => clearInterval(interval)
  }, [])

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ]

  if (timeLeft.expired) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl p-6 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.08))',
          border: '1px solid rgba(16,185,129,0.4)',
          boxShadow: '0 0 30px rgba(16,185,129,0.15)',
        }}
      >
        <span className="text-2xl font-display font-bold text-neon-green">🎮 Event is LIVE!</span>
        <p className="text-gray-400 text-sm mt-2">Join now and start competing!</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-2xl p-6 sm:p-8 mb-10"
      style={{
        background: 'linear-gradient(135deg, rgba(30,30,46,0.9), rgba(20,20,35,0.95))',
        border: '1px solid rgba(124,58,237,0.3)',
        boxShadow: '0 0 40px rgba(124,58,237,0.1), 0 20px 60px rgba(0,0,0,0.3)',
      }}
    >
      <div className="text-center mb-5">
        <p className="text-xs uppercase tracking-[0.2em] text-matrix-400 font-semibold mb-1">Event Starts In</p>
        <p className="text-sm text-gray-500">March 1st, 2026 · 10:00 AM IST</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {units.map((unit, idx) => (
          <motion.div
            key={unit.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + idx * 0.1 }}
            className="text-center"
          >
            <div
              className="rounded-xl p-2.5 sm:p-4 mb-1.5 sm:mb-2"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(0,245,255,0.05))',
                border: '1px solid rgba(124,58,237,0.25)',
                boxShadow: '0 0 15px rgba(124,58,237,0.08)',
              }}
            >
              <motion.span
                key={unit.value}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl sm:text-4xl font-display font-black text-white tabular-nums"
              >
                {String(unit.value).padStart(2, '0')}
              </motion.span>
            </div>
            <span className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-500 font-medium">{unit.label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

/* ─── Quiz Rules Section ─────────────────────────────────── */
function QuizRules() {
  const rules = [
    { icon: HiOutlineCheckCircle, text: 'Each quiz consists of 10 AI-generated multiple choice questions.', color: 'text-neon-green' },
    { icon: HiOutlineClock, text: 'You have 30 seconds to answer each question. Faster answers earn more points.', color: 'text-neon-cyan' },
    { icon: HiOutlineTrophy, text: 'Scoring: Up to 10 points per question based on speed. Minimum 1 point for correct answers.', color: 'text-neon-yellow' },
    { icon: HiOutlineUsers, text: 'All participants receive questions simultaneously. No going back to previous questions.', color: 'text-neon-purple' },
    { icon: HiOutlineExclamationTriangle, text: 'Wrong answers score 0 points. Unanswered questions (timeout) also score 0.', color: 'text-red-400' },
    { icon: HiOutlineXCircle, text: 'Each Player ID can only be used once per event. No duplicate entries allowed.', color: 'text-orange-400' },
    { icon: HiOutlineBolt, text: 'Live leaderboard updates after each question. Final rankings shown at the end.', color: 'text-matrix-300' },
    { icon: IoGameControllerOutline, text: 'Keep your browser open and stable. Do not refresh during the quiz.', color: 'text-amber-400' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0 }}
      className="rounded-2xl p-8 sm:p-10 mb-16 overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, rgba(30,30,46,0.9), rgba(20,20,35,0.95))',
        border: '1px solid rgba(245,158,11,0.25)',
        boxShadow: '0 0 30px rgba(245,158,11,0.06), 0 20px 60px rgba(0,0,0,0.3)',
      }}
    >
      {/* Subtle glow */}
      <div className="absolute -top-20 right-10 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <h2 className="text-2xl font-display font-bold text-white mb-6 text-center flex items-center justify-center gap-3">
        <HiOutlineExclamationTriangle className="text-neon-yellow" />
        Quiz Rules
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rules.map((rule, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.1 + idx * 0.08 }}
            className="flex items-start gap-3 p-4 rounded-xl"
            style={{
              background: 'rgba(20,20,30,0.5)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <rule.icon className={`text-lg mt-0.5 shrink-0 ${rule.color}`} />
            <p className="text-sm text-gray-400 leading-relaxed">{rule.text}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default function Home() {
  const navigate = useNavigate()

  return (
    <Layout>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <HeroBrainIcon />
          <AnimatedTitle />

          <motion.p
            className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            A high-energy competitive quiz where <span className="text-white font-medium">speed meets knowledge</span>.
            Answer fast, score big, dominate the leaderboard.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(124,58,237,0.4)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/join')}
              className="btn-primary text-lg flex items-center gap-2 px-10 relative overflow-hidden"
            >
              {/* Animated shimmer */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              />
              <span className="relative flex items-center gap-2">
                <HiOutlineSparkles />
                Join Game
                <HiOutlineArrowRight />
              </span>
            </motion.button>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/admin" className="btn-secondary flex items-center gap-2">
                Admin Dashboard
                <HiOutlineBolt className="text-matrix-400" />
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Event Countdown */}
        <EventCountdown />

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16"
        >
          {features.map((feat, idx) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + idx * 0.12, type: 'spring', stiffness: 200 }}
              whileHover={{
                scale: 1.04,
                y: -4,
                boxShadow: `0 20px 40px rgba(0,0,0,0.3), 0 0 30px ${feat.glowColor}`,
              }}
              className={`group relative rounded-2xl p-6 transition-all duration-500 cursor-default overflow-hidden ${feat.borderColor}`}
              style={{
                background: 'linear-gradient(135deg, rgba(30,30,46,0.7), rgba(20,20,35,0.8))',
                border: '1px solid rgba(124,58,237,0.15)',
              }}
            >
              {/* Hover glow background */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(circle at 50% 30%, ${feat.glowColor}, transparent 70%)`,
                }}
              />

              <div className="relative">
                <motion.div
                  className="mb-3"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <feat.icon className={`text-3xl ${feat.color} group-hover:scale-110 transition-transform duration-300`} />
                </motion.div>
                <h3 className="font-semibold text-white mb-1">{feat.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quiz Rules */}
        <QuizRules />

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="relative rounded-2xl p-8 sm:p-12 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(30,30,46,0.9), rgba(20,20,35,0.95))',
            border: '1px solid rgba(124,58,237,0.3)',
            boxShadow: '0 0 40px rgba(124,58,237,0.08), 0 30px 80px rgba(0,0,0,0.3)',
          }}
        >
          {/* Animated border glow */}
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            animate={{
              boxShadow: [
                'inset 0 0 30px rgba(124,58,237,0.05)',
                'inset 0 0 50px rgba(124,58,237,0.1)',
                'inset 0 0 30px rgba(124,58,237,0.05)',
              ],
            }}
            transition={{ repeat: Infinity, duration: 4 }}
          />

          <h2 className="text-2xl font-display font-bold text-white mb-8 text-center relative">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden sm:block absolute top-8 left-[20%] right-[20%] h-[2px]">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, rgba(124,58,237,0.3), rgba(0,245,255,0.3), rgba(124,58,237,0.3))',
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.5, duration: 0.8 }}
              />
            </div>

            {[
              { step: '01', title: 'Join', desc: 'Enter the event code, your name, and your assigned Player ID.', icon: '🎮' },
              { step: '02', title: 'Compete', desc: '10 rapid-fire questions. Faster answers = more points.', icon: '⚡' },
              { step: '03', title: 'Win', desc: 'Highest total score after all rounds wins!', icon: '🏆' },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                className="text-center relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 + idx * 0.2 }}
              >
                <motion.div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white font-display font-bold text-lg mb-4 relative"
                  style={{
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(0,245,255,0.15))',
                    border: '1px solid rgba(124,58,237,0.4)',
                    boxShadow: '0 0 20px rgba(124,58,237,0.15)',
                  }}
                  whileHover={{
                    scale: 1.1,
                    boxShadow: '0 0 40px rgba(124,58,237,0.3)',
                  }}
                >
                  <span className="text-2xl">{item.icon}</span>
                </motion.div>
                <h3 className="font-semibold text-white text-lg mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="mt-16 text-center text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          <p className="text-gray-600">
            Mind Matrix — Where Speed Meets Knowledge
          </p>
        </motion.div>
      </div>
    </Layout>
  )
}
