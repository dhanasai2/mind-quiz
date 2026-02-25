import { motion, AnimatePresence } from 'framer-motion'
import Timer from './Timer'
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineLightBulb } from 'react-icons/hi2'
import { formatScore } from '../lib/scoring'

const optionLabels = ['A', 'B', 'C', 'D']
const optionColors = [
  { base: 'from-blue-500/10 to-blue-600/5', active: 'from-blue-500/30 to-blue-600/20 border-blue-400/60 shadow-blue-500/20', badge: 'bg-blue-500' },
  { base: 'from-purple-500/10 to-purple-600/5', active: 'from-purple-500/30 to-purple-600/20 border-purple-400/60 shadow-purple-500/20', badge: 'bg-purple-500' },
  { base: 'from-amber-500/10 to-amber-600/5', active: 'from-amber-500/30 to-amber-600/20 border-amber-400/60 shadow-amber-500/20', badge: 'bg-amber-500' },
  { base: 'from-rose-500/10 to-rose-600/5', active: 'from-rose-500/30 to-rose-600/20 border-rose-400/60 shadow-rose-500/20', badge: 'bg-rose-500' },
]

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  timeLeft,
  timePerQuestion,
  selectedAnswer,
  answerSubmitted,
  onSelectAnswer,
  onSubmit,
  roundScore,
}) {
  if (!question) return null

  const progress = (questionNumber / totalQuestions) * 100

  const getOptionStyle = (idx) => {
    const color = optionColors[idx]
    if (!answerSubmitted) {
      return selectedAnswer === idx
        ? `bg-gradient-to-r ${color.active} ring-2 ring-white/10 shadow-lg`
        : `bg-gradient-to-r ${color.base} hover:shadow-md hover:border-white/20`
    }
    if (idx === question.correct_answer) {
      return 'bg-gradient-to-r from-emerald-500/25 to-emerald-600/15 border-emerald-400/70 shadow-lg shadow-emerald-500/10'
    }
    if (idx === selectedAnswer && idx !== question.correct_answer) {
      return 'bg-gradient-to-r from-red-500/25 to-red-600/15 border-red-400/70 shadow-lg shadow-red-500/10'
    }
    return 'opacity-40 grayscale'
  }

  const getBadgeStyle = (idx) => {
    if (answerSubmitted && idx === question.correct_answer) return 'bg-emerald-500 text-white'
    if (answerSubmitted && idx === selectedAnswer && idx !== question.correct_answer) return 'bg-red-500 text-white'
    if (selectedAnswer === idx) return `${optionColors[idx].badge} text-white`
    return 'bg-dark-300/80 text-gray-400'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto"
    >
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-matrix-600/40 to-neon-cyan/20 border border-matrix-400/30 text-matrix-200 text-sm font-mono font-bold">
              <span className="text-white">{questionNumber}</span>
              <span className="text-gray-500">/</span>
              <span>{totalQuestions}</span>
            </span>
            {question.category && (
              <span className="px-3 py-1.5 rounded-full bg-dark-200/80 border border-white/5 text-gray-400 text-xs font-medium uppercase tracking-wider">
                {question.category}
              </span>
            )}
          </div>
          <Timer timeLeft={timeLeft} total={timePerQuestion} />
        </div>
        <div className="h-1.5 bg-dark-300/60 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-matrix-500 via-neon-cyan to-matrix-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            style={{
              boxShadow: '0 0 10px rgba(124,58,237,0.5), 0 0 20px rgba(0,245,255,0.2)',
            }}
          />
        </div>
      </div>

      {/* Question card */}
      <motion.div
        key={question.id}
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative rounded-2xl p-5 sm:p-8 md:p-10 mb-6 sm:mb-8 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(30,30,46,0.9), rgba(20,20,35,0.95))',
          border: '1px solid rgba(124,58,237,0.3)',
          boxShadow: '0 0 30px rgba(124,58,237,0.1), 0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Decorative glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-matrix-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none" />

        <h2 className="relative text-xl sm:text-2xl lg:text-[1.65rem] font-semibold text-white leading-relaxed tracking-wide">
          {question.question_text}
        </h2>
      </motion.div>

      {/* Options grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {question.options.map((option, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1 + idx * 0.08, type: 'spring', stiffness: 400, damping: 25 }}
            whileHover={!answerSubmitted ? { scale: 1.03, y: -2 } : {}}
            whileTap={!answerSubmitted ? { scale: 0.97 } : {}}
            disabled={answerSubmitted}
            onClick={() => onSelectAnswer(idx)}
            className={`group relative flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl text-left transition-all duration-300 border border-white/10
              ${getOptionStyle(idx)} ${!answerSubmitted ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}`}
          >
            {/* Answer icon on submit */}
            {answerSubmitted && idx === question.correct_answer && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30"
              >
                <HiOutlineCheckCircle className="text-white text-base" />
              </motion.div>
            )}
            {answerSubmitted && idx === selectedAnswer && idx !== question.correct_answer && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30"
              >
                <HiOutlineXCircle className="text-white text-base" />
              </motion.div>
            )}

            <span className={`w-11 h-11 flex items-center justify-center rounded-xl text-sm font-bold shrink-0 transition-all duration-300
              ${getBadgeStyle(idx)}
            `}>
              {optionLabels[idx]}
            </span>
            <span className="text-sm sm:text-base text-gray-200 font-medium leading-snug">{option}</span>
          </motion.button>
        ))}
      </div>

      {/* Submit / Score result */}
      <AnimatePresence mode="wait">
        {!answerSubmitted ? (
          <motion.button
            key="submit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(124,58,237,0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onSubmit}
            disabled={selectedAnswer === null}
            className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all duration-300 relative overflow-hidden
              disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: selectedAnswer !== null
                ? 'linear-gradient(135deg, #7c3aed, #6d28d9, #5b21b6)'
                : 'rgba(30,30,46,0.6)',
              border: '1px solid rgba(124,58,237,0.4)',
              boxShadow: selectedAnswer !== null ? '0 0 20px rgba(124,58,237,0.3), 0 8px 32px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            {selectedAnswer !== null && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              />
            )}
            <span className="relative">Submit Answer</span>
          </motion.button>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="text-center space-y-4"
          >
            {/* Score bubble */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-display font-bold text-3xl
                ${roundScore > 0
                  ? 'bg-gradient-to-r from-emerald-500/20 to-neon-green/10 border border-emerald-400/40 text-neon-green'
                  : 'bg-gradient-to-r from-red-500/20 to-red-600/10 border border-red-400/40 text-red-400'
                }`}
              style={{
                boxShadow: roundScore > 0
                  ? '0 0 30px rgba(0,255,136,0.15), 0 10px 40px rgba(0,0,0,0.2)'
                  : '0 0 30px rgba(239,68,68,0.15), 0 10px 40px rgba(0,0,0,0.2)',
              }}
            >
              {roundScore > 0 ? (
                <>+{formatScore(roundScore)}<span className="text-lg opacity-60">/10</span></>
              ) : (
                <>0<span className="text-lg opacity-60">/10</span></>
              )}
            </motion.div>

            {question.explanation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-dark-200/50 border border-white/5 max-w-lg mx-auto text-left"
              >
                <HiOutlineLightBulb className="text-neon-yellow text-xl shrink-0 mt-0.5" />
                <p className="text-gray-400 text-sm leading-relaxed">{question.explanation}</p>
              </motion.div>
            )}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-matrix-300 text-sm font-medium"
            >
              Next question coming up...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
