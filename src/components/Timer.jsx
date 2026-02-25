import { motion } from 'framer-motion'

export default function Timer({ timeLeft, total = 30 }) {
  const percentage = (timeLeft / total) * 100
  const isUrgent = timeLeft <= 5
  const isWarning = timeLeft <= 10 && !isUrgent
  const circumference = 2 * Math.PI * 42

  const getColor = () => {
    if (isUrgent) return '#ef4444'
    if (isWarning) return '#f59e0b'
    return '#7c3aed'
  }

  const getGlow = () => {
    if (isUrgent) return '0 0 15px rgba(239,68,68,0.6), 0 0 30px rgba(239,68,68,0.2)'
    if (isWarning) return '0 0 12px rgba(245,158,11,0.4)'
    return '0 0 12px rgba(124,58,237,0.3)'
  }

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
        {/* Outer background */}
        <circle
          cx="50" cy="50" r="46"
          fill="none"
          stroke="rgba(124,58,237,0.06)"
          strokeWidth="2"
        />
        {/* Track */}
        <circle
          cx="50" cy="50" r="42"
          fill="none"
          stroke="rgba(124,58,237,0.1)"
          strokeWidth="5"
        />
        {/* Progress */}
        <motion.circle
          cx="50" cy="50" r="42"
          fill="none"
          stroke={getColor()}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (percentage / 100) * circumference}
          transition={{ duration: 0.5 }}
          style={{ filter: `drop-shadow(${getGlow()})` }}
        />
      </svg>
      {/* Center fill */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(10,10,15,0.8)',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
          }}
        >
          <motion.span
            key={timeLeft}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`font-display font-bold text-xl ${
              isUrgent ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-white'
            }`}
          >
            {timeLeft}
          </motion.span>
        </div>
      </div>
      {isUrgent && (
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ repeat: Infinity, duration: 0.6 }}
          className="absolute inset-0 rounded-full border-2 border-red-500/40"
        />
      )}
    </div>
  )
}
