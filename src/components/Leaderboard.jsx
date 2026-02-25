import { motion, AnimatePresence } from 'framer-motion'
import { getRankBadgeStyle, formatScore, getRankSuffix } from '../lib/scoring'
import { HiTrophy } from 'react-icons/hi2'
import { FaCrown } from 'react-icons/fa6'

export default function Leaderboard({ entries = [], currentParticipantId, compact = false }) {
  // Ensure scores are numbers (Supabase NUMERIC comes as strings)
  const sorted = [...entries]
    .map(e => ({ ...e, score: Number(e.score) || 0 }))
    .sort((a, b) => b.score - a.score)

  if (compact) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
          <HiTrophy className="text-neon-yellow" />
          Live Rankings
        </h3>
        {sorted.slice(0, 5).map((entry, idx) => (
          <motion.div
            key={entry.id}
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300
              ${entry.id === currentParticipantId
                ? 'border border-matrix-500/40'
                : 'border border-transparent'
              }`}
            style={{
              background: entry.id === currentParticipantId
                ? 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(0,245,255,0.05))'
                : idx === 0 ? 'linear-gradient(135deg, rgba(245,158,11,0.08), transparent)' : 'rgba(20,20,30,0.3)',
            }}
          >
            <span className={`rank-badge text-xs ${getRankBadgeStyle(idx + 1)}`}>
              {idx === 0 ? <FaCrown className="text-xs" /> : idx + 1}
            </span>
            <span className={`text-sm flex-1 truncate ${entry.id === currentParticipantId ? 'text-white font-semibold' : 'text-gray-300'}`}>
              {entry.name}
              {entry.id === currentParticipantId && <span className="text-matrix-400 text-xs ml-1">(You)</span>}
            </span>
            <span className="text-sm font-mono font-bold text-white">{formatScore(entry.score)}</span>
          </motion.div>
        ))}
        {sorted.length > 5 && (
          <p className="text-xs text-gray-500 text-center pt-1">+{sorted.length - 5} more players</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {sorted.map((entry, idx) => {
          const rank = idx + 1
          const isMe = entry.id === currentParticipantId
          return (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: idx * 0.05, type: 'spring', stiffness: 200 }}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 border ${isMe ? 'border-matrix-500/40' : 'border-transparent'}`}
              style={{
                background: isMe
                  ? 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(0,245,255,0.05))'
                  : rank <= 3
                    ? `linear-gradient(135deg, ${rank === 1 ? 'rgba(245,158,11,0.08)' : rank === 2 ? 'rgba(156,163,175,0.06)' : 'rgba(180,83,9,0.06)'}, transparent)`
                    : 'rgba(20,20,30,0.4)',
                boxShadow: rank <= 3 || isMe ? '0 4px 20px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              <span className={`rank-badge ${getRankBadgeStyle(rank)}`}>
                {rank === 1 ? <FaCrown className="text-sm" /> : rank}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${isMe ? 'text-white' : 'text-gray-300'}`}>
                  {entry.name}
                  {isMe && <span className="text-matrix-400 text-xs ml-2">(You)</span>}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-lg text-white">
                  {formatScore(entry.score)}
                </p>
                <p className="text-xs text-gray-500">
                  {rank}{getRankSuffix(rank)} place
                </p>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
