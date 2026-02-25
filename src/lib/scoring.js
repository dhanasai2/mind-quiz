/**
 * Mind Matrix Scoring System (out of 10)
 *
 * Formula: Points = BASE_POINTS × max(0, 1 - (responseTime / TIME_LIMIT))
 *
 * - BASE_POINTS: 10 (maximum possible per question)
 * - TIME_LIMIT: 30 seconds (configurable per event)
 * - Incorrect answers always score 0
 * - Minimum score for correct answer: 1 (bonus floor)
 */

const BASE_POINTS = 10
const MIN_POINTS = 1
const DEFAULT_TIME_LIMIT = 30 // seconds

export function calculateScore(responseTimeMs, isCorrect, timeLimit = DEFAULT_TIME_LIMIT) {
  if (!isCorrect) return 0

  const responseTimeSec = responseTimeMs / 1000
  if (responseTimeSec <= 0) return BASE_POINTS

  const timeFactor = Math.max(0, 1 - (responseTimeSec / timeLimit))
  // Use one decimal place for smooth scoring out of 10
  const points = Math.round(BASE_POINTS * timeFactor * 10) / 10

  return Math.max(points, MIN_POINTS)
}

export function getRankSuffix(rank) {
  if (rank % 100 >= 11 && rank % 100 <= 13) return 'th'
  switch (rank % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

export function formatScore(score) {
  const num = Number(score) || 0
  if (Number.isInteger(num)) return num.toString()
  return num.toFixed(1)
}

export function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`
  const seconds = (ms / 1000).toFixed(1)
  return `${seconds}s`
}

export function getScoreColor(score) {
  if (score >= 8) return 'text-neon-green'
  if (score >= 6) return 'text-neon-cyan'
  if (score >= 4) return 'text-neon-yellow'
  if (score >= 2) return 'text-matrix-400'
  return 'text-gray-400'
}

export function getRankColor(rank) {
  if (rank === 1) return 'from-yellow-400 to-amber-500'
  if (rank === 2) return 'from-gray-300 to-gray-400'
  if (rank === 3) return 'from-amber-600 to-amber-700'
  return 'from-matrix-500 to-matrix-600'
}

export function getRankBadgeStyle(rank) {
  if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black'
  if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-400 text-black'
  if (rank === 3) return 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
  return 'bg-dark-300 text-gray-400'
}
