import { motion } from 'framer-motion'

export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-10 h-10 border-3 border-matrix-500/30 border-t-matrix-400 rounded-full"
        style={{ borderWidth: '3px' }}
      />
      <p className="text-gray-400 text-sm animate-pulse">{text}</p>
    </div>
  )
}
