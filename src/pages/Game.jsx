import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import QuestionCard from '../components/QuestionCard'
import Leaderboard from '../components/Leaderboard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useGame } from '../context/GameContext'
import { formatScore } from '../lib/scoring'
import { HiOutlineTrophy, HiOutlineSignal, HiChevronUp, HiChevronDown, HiOutlineClock } from 'react-icons/hi2'
import Confetti from 'react-confetti'

function WaitingScreen({ event, participant, leaderboard, participantId }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-lg mx-auto text-center py-16 px-4"
    >
      {/* Animated pulse ring */}
      <div className="relative inline-flex items-center justify-center mb-8">
        <motion.div
          animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="absolute w-20 h-20 rounded-2xl bg-matrix-500/30"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2.5, delay: 0.3 }}
          className="absolute w-20 h-20 rounded-2xl bg-neon-cyan/20"
        />
        <motion.div
          className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(0,245,255,0.2))',
            border: '1px solid rgba(124,58,237,0.4)',
            boxShadow: '0 0 30px rgba(124,58,237,0.2)',
          }}
        >
          <HiOutlineSignal className="text-3xl text-matrix-300" />
        </motion.div>
      </div>

      <h2 className="text-3xl font-display font-bold text-white mb-3">
        Ready to Play
      </h2>
      <p className="text-gray-400 mb-1">
        Connected as <span className="text-white font-semibold">{participant?.name}</span>
      </p>
      <p className="text-gray-500 text-sm mb-8">
        Event: <span className="text-matrix-300 font-mono font-bold">{event?.code}</span>
      </p>

      <div className="rounded-2xl p-6 text-left" style={{
        background: 'linear-gradient(135deg, rgba(30,30,46,0.8), rgba(20,20,35,0.9))',
        border: '1px solid rgba(124,58,237,0.2)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-neon-green" />
            <motion.div
              animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 w-3 h-3 rounded-full bg-neon-green"
            />
          </div>
          <span className="text-sm text-neon-green font-semibold">Connected & Ready</span>
        </div>
        <p className="text-gray-500 text-sm leading-relaxed">
          The quiz will begin once the host starts the event. Sit tight!
        </p>
      </div>

      {leaderboard.length > 0 && (
        <div className="mt-8">
          <Leaderboard entries={leaderboard} currentParticipantId={participantId} compact />
        </div>
      )}
    </motion.div>
  )
}

function FinishedScreen() {
  const navigate = useNavigate()
  const { totalScore, leaderboard, participantId, myAnswers } = useGame()
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 6000)
    return () => clearTimeout(timer)
  }, [])

  const sorted = [...leaderboard].map(e => ({ ...e, score: Number(e.score) || 0 })).sort((a, b) => b.score - a.score)
  const myRank = sorted.findIndex(e => e.id === participantId) + 1
  const correctCount = myAnswers.filter(a => a.isCorrect).length
  const totalQuestions = myAnswers.length || 10

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto py-6 sm:py-8 px-4"
    >
      {showConfetti && myRank <= 3 && <Confetti numberOfPieces={250} recycle={false} gravity={0.15} />}

      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            boxShadow: '0 0 40px rgba(245,158,11,0.3), 0 0 80px rgba(245,158,11,0.1)',
          }}
        >
          <HiOutlineTrophy className="text-5xl text-black" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl sm:text-4xl font-display font-black text-white mb-2"
        >
          Game Over!
        </motion.h2>
        <p className="text-gray-400 text-lg">Here's how you did</p>
      </div>

      {/* Stats cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-3 gap-2 sm:gap-4 mb-10"
      >
        <div className="rounded-2xl p-3 sm:p-5 text-center" style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(0,245,255,0.05))',
          border: '1px solid rgba(124,58,237,0.3)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        }}>
          <p className="text-2xl sm:text-3xl font-display font-black text-gradient">{formatScore(totalScore)}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2 font-medium uppercase tracking-wider">Total Score</p>
        </div>
        <div className="rounded-2xl p-3 sm:p-5 text-center" style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.05))',
          border: '1px solid rgba(245,158,11,0.3)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        }}>
          <p className="text-2xl sm:text-3xl font-display font-black text-white">#{myRank || '—'}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2 font-medium uppercase tracking-wider">Final Rank</p>
        </div>
        <div className="rounded-2xl p-3 sm:p-5 text-center" style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05))',
          border: '1px solid rgba(16,185,129,0.3)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        }}>
          <p className="text-2xl sm:text-3xl font-display font-black text-neon-green">{correctCount}<span className="text-base sm:text-lg text-gray-500">/{totalQuestions}</span></p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2 font-medium uppercase tracking-wider">Correct</p>
        </div>
      </motion.div>

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <HiOutlineTrophy className="text-neon-yellow" />
          Final Standings
        </h3>
        <Leaderboard entries={leaderboard} currentParticipantId={participantId} />
      </motion.div>

      <div className="mt-10 text-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="btn-secondary"
        >
          Back to Home
        </motion.button>
      </div>
    </motion.div>
  )
}

export default function Game() {
  const navigate = useNavigate()
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const {
    event, participant, status, currentQuestion, currentQuestionIndex,
    questions, timeLeft, selectedAnswer, answerSubmitted, roundScore,
    totalScore, leaderboard, participantId, nextQuestionCountdown, dispatch, submitAnswer,
  } = useGame()

  useEffect(() => {
    if (!event || !participant) {
      navigate('/join')
    }
  }, [event, participant, navigate])

  if (!event || !participant) return null

  return (
    <Layout>
      {/* Top bar */}
      <div className="sticky top-0 z-50" style={{
        background: 'linear-gradient(180deg, rgba(10,10,15,0.95), rgba(10,10,15,0.85))',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(124,58,237,0.15)',
      }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-sm text-white">MIND<span className="text-gradient"> MATRIX</span></span>
            <span className="text-gray-700">|</span>
            <span className="text-xs text-gray-500 font-mono">{event.code}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 hidden sm:block">{participant.name}</span>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full" style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(0,245,255,0.1))',
              border: '1px solid rgba(124,58,237,0.3)',
            }}>
              <span className="text-matrix-300 font-mono font-bold text-sm">{formatScore(totalScore)}</span>
              <span className="text-gray-500 text-xs">pts</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {status === 'waiting' && (
            <WaitingScreen
              key="waiting"
              event={event}
              participant={participant}
              leaderboard={leaderboard}
              participantId={participantId}
            />
          )}

          {(status === 'active' || status === 'review') && currentQuestion && (
            <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Next-question countdown overlay */}
              {nextQuestionCountdown > 0 && answerSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-3xl mx-auto mb-6"
                >
                  <div
                    className="rounded-2xl p-6 text-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(0,245,255,0.08))',
                      border: '1px solid rgba(124,58,237,0.35)',
                      boxShadow: '0 0 30px rgba(124,58,237,0.12)',
                    }}
                  >
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <HiOutlineClock className="text-neon-cyan text-xl" />
                      <span className="text-sm uppercase tracking-wider text-gray-400 font-semibold">Next Question In</span>
                    </div>
                    <motion.span
                      key={nextQuestionCountdown}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-4xl font-display font-black text-white tabular-nums"
                    >
                      {nextQuestionCountdown}s
                    </motion.span>
                    {/* Progress bar */}
                    <div className="mt-3 h-1.5 bg-dark-300/60 rounded-full overflow-hidden max-w-xs mx-auto">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-matrix-500 to-neon-cyan"
                        initial={{ width: '100%' }}
                        animate={{ width: `${(nextQuestionCountdown / 60) * 100}%` }}
                        transition={{ duration: 0.5 }}
                        style={{ boxShadow: '0 0 10px rgba(124,58,237,0.5)' }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Get ready for the next question!</p>
                  </div>
                </motion.div>
              )}

              {/* Question area — centered, full width */}
              <QuestionCard
                question={currentQuestion}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={questions.length}
                timeLeft={timeLeft}
                timePerQuestion={event.time_per_question || 30}
                selectedAnswer={selectedAnswer}
                answerSubmitted={answerSubmitted}
                onSelectAnswer={(idx) => dispatch({ type: 'SELECT_ANSWER', payload: idx })}
                onSubmit={() => submitAnswer(selectedAnswer)}
                roundScore={roundScore}
              />

              {/* Bottom leaderboard toggle */}
              <div className="mt-8 max-w-3xl mx-auto">
                <motion.button
                  onClick={() => setShowLeaderboard(!showLeaderboard)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, rgba(30,30,46,0.7), rgba(20,20,35,0.8))',
                    border: '1px solid rgba(124,58,237,0.2)',
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <HiOutlineTrophy className="text-neon-yellow" />
                  <span className="text-gray-300">Leaderboard</span>
                  <span className="text-xs text-gray-500">({leaderboard.length} players)</span>
                  {showLeaderboard ? (
                    <HiChevronDown className="text-gray-500" />
                  ) : (
                    <HiChevronUp className="text-gray-500" />
                  )}
                </motion.button>

                <AnimatePresence>
                  {showLeaderboard && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4">
                        <div className="rounded-2xl p-4" style={{
                          background: 'linear-gradient(135deg, rgba(30,30,46,0.6), rgba(20,20,35,0.7))',
                          border: '1px solid rgba(124,58,237,0.15)',
                        }}>
                          <Leaderboard entries={leaderboard} currentParticipantId={participantId} compact />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {status === 'finished' && <FinishedScreen key="finished" />}
        </AnimatePresence>
      </div>
    </Layout>
  )
}
