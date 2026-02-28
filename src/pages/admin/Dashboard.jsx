import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  HiOutlinePlus, HiOutlinePlay, HiOutlineStop, HiOutlineForward,
  HiOutlineSparkles, HiOutlineTrash, HiOutlineClipboard, HiOutlineUsers,
  HiOutlineTrophy, HiOutlineArrowPath, HiOutlineCog6Tooth, HiOutlineEye,
  HiOutlineCheck, HiOutlineXMark, HiOutlineBolt, HiOutlineClock,
  HiOutlineArrowDownTray,
} from 'react-icons/hi2'
import Layout from '../../components/Layout'
import Navbar from '../../components/Navbar'
import Leaderboard from '../../components/Leaderboard'
import LoadingSpinner from '../../components/LoadingSpinner'
import { supabase } from '../../lib/supabase'
import { generateQuestions } from '../../lib/groq'
import { formatScore } from '../../lib/scoring'

// ─── Event Creation Panel ───────────────────────────────────
function CreateEventPanel({ onEventCreated }) {
  const [eventName, setEventName] = useState('')
  const [selectedTopics, setSelectedTopics] = useState(['General Knowledge'])
  const [customTopic, setCustomTopic] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [questionCount, setQuestionCount] = useState(10)
  const [timePerQuestion, setTimePerQuestion] = useState(30)
  const [generating, setGenerating] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState([])
  const [step, setStep] = useState(1) // 1: config, 2: review questions, 3: created

  const toggleTopic = (t) => {
    setSelectedTopics(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    )
  }

  const addCustomTopic = () => {
    const trimmed = customTopic.trim()
    if (trimmed && !selectedTopics.includes(trimmed)) {
      setSelectedTopics(prev => [...prev, trimmed])
      setCustomTopic('')
    }
  }

  const handleGenerateQuestions = async () => {
    if (selectedTopics.length === 0) return toast.error('Select at least one topic')
    setGenerating(true)
    const topicString = selectedTopics.join(', ')
    try {
      const questions = await generateQuestions(topicString, questionCount, difficulty)
      setGeneratedQuestions(questions)
      setStep(2)
      toast.success(`Generated ${questions.length} questions!`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleCreateEvent = async () => {
    if (!eventName.trim()) return toast.error('Enter an event name')
    if (generatedQuestions.length === 0) return toast.error('Generate questions first')

    // Timeout wrapper — ensures we never hang forever
    const withTimeout = (promise, ms = 15000, label = 'Operation') =>
      Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s. Check your Supabase project status.`)), ms)
        ),
      ])

    // Retry wrapper for transient network failures
    const retryFetch = async (fn, retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          const result = await fn()
          return result
        } catch (err) {
          if (i === retries - 1) throw err
          console.warn(`[Retry ${i + 1}/${retries}] ${err.message}`)
          await new Promise(r => setTimeout(r, 1000 * (i + 1)))
        }
      }
    }

    try {
      toast.loading('Creating event...', { id: 'create-event' })

      // Quick health check — verify Supabase is reachable before doing real work
      try {
        await withTimeout(
          supabase.from('events').select('id').limit(1),
          10000,
          'Supabase connection check'
        )
      } catch (healthErr) {
        throw new Error(
          'Cannot reach Supabase. Your project may be paused (free tier pauses after 7 days of inactivity). ' +
          'Go to supabase.com/dashboard, unpause your project, then try again.'
        )
      }

      // Generate unique code
      const code = eventName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() +
        Math.random().toString(36).substring(2, 6).toUpperCase()

      // Create event with retry + timeout
      const event = await retryFetch(async () => {
        const { data, error } = await withTimeout(
          supabase
            .from('events')
            .insert({
              name: eventName,
              code,
              topic: selectedTopics.join(', '),
              difficulty,
              question_count: generatedQuestions.length,
              time_per_question: timePerQuestion,
              status: 'waiting',
            })
            .select()
            .single(),
          15000,
          'Event insert'
        )
        if (error) throw new Error(error.message || 'Failed to insert event')
        if (!data) throw new Error('No data returned from event insert')
        console.log('[CreateEventPanel] Event created:', { id: data.id, name: data.name, code: data.code })
        return data
      })

      // Insert questions in batches of 5 for reliability
      const questionsToInsert = generatedQuestions.map((q, idx) => ({
        event_id: event.id,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        category: q.category,
        order_index: idx,
      }))

      console.log(`[CreateEventPanel] Inserting ${questionsToInsert.length} questions for event ${event.id}`)

      const batchSize = 5
      for (let i = 0; i < questionsToInsert.length; i += batchSize) {
        const batch = questionsToInsert.slice(i, i + batchSize)
        const batchNum = Math.floor(i / batchSize) + 1
        console.log(`[CreateEventPanel] Inserting batch ${batchNum}/${Math.ceil(questionsToInsert.length / batchSize)} (${batch.length} questions)`)
        
        try {
          const { data: insertedData, error } = await withTimeout(
            supabase.from('questions').insert(batch),
            15000,
            `Question batch ${batchNum}`
          )
          
          if (error) {
            console.error(`[CreateEventPanel] Error inserting batch ${batchNum}:`, error)
            throw new Error(`${error.message || 'Failed to insert questions'} (batch ${batchNum})`)
          }
          
          console.log(`[CreateEventPanel] Batch ${batchNum} inserted successfully`, {
            insertedCount: batch.length,
            insertedData
          })
        } catch (batchError) {
          console.error(`[CreateEventPanel] Batch ${batchNum} failed:`, batchError.message)
          throw batchError
        }
      }

      console.log(`[CreateEventPanel] All ${questionsToInsert.length} questions inserted successfully`)

      toast.success('Event created!', { id: 'create-event' })
      onEventCreated(event)
    } catch (err) {
      console.error('Create event error:', err)
      toast.error('Failed to create event: ' + err.message, { id: 'create-event' })
    }
  }

  const removeQuestion = (idx) => {
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== idx))
  }

  const regenerateOne = async (idx) => {
    try {
      const topicString = selectedTopics.join(', ')
      const questions = await generateQuestions(topicString, 1, difficulty)
      if (questions.length > 0) {
        setGeneratedQuestions(prev => {
          const next = [...prev]
          next[idx] = questions[0]
          return next
        })
        toast.success('Question regenerated!')
      }
    } catch (err) {
      toast.error('Failed to regenerate')
    }
  }

  const topics = [
    'General Knowledge', 'Science & Technology', 'History', 'Geography',
    'Sports', 'Movies & Entertainment', 'Literature', 'Mathematics',
    'Current Affairs', 'Computer Science', 'Space & Astronomy', 'Music',
  ]

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Event Name</label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. Friday Quiz Night"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Topics <span className="text-matrix-400">({selectedTopics.length} selected)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {topics.map(t => (
                  <button
                    key={t}
                    onClick={() => toggleTopic(t)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5
                      ${selectedTopics.includes(t)
                        ? 'bg-matrix-500/25 text-matrix-300 border border-matrix-500/50'
                        : 'bg-dark-300 text-gray-400 hover:bg-dark-400 border border-transparent'
                      }`}
                  >
                    {selectedTopics.includes(t) && <HiOutlineCheck className="text-neon-green text-xs" />}
                    {t}
                  </button>
                ))}
              </div>
              {/* Selected tags */}
              {selectedTopics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedTopics.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-matrix-500/15 text-matrix-300 text-xs border border-matrix-500/30">
                      {t}
                      <button onClick={() => toggleTopic(t)} className="hover:text-red-400 transition-colors ml-0.5">
                        <HiOutlineXMark className="text-xs" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTopic())}
                  placeholder="Add a custom topic..."
                  className="input-field text-sm flex-1"
                />
                <button
                  onClick={addCustomTopic}
                  disabled={!customTopic.trim()}
                  className="btn-secondary px-4 py-2 text-sm disabled:opacity-30"
                >
                  <HiOutlinePlus />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Questions</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="input-field text-sm"
                >
                  {[5, 10, 15, 20].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Time/Q (sec)</label>
                <select
                  value={timePerQuestion}
                  onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                  className="input-field text-sm"
                >
                  {[15, 20, 30, 45, 60].map(n => (
                    <option key={n} value={n}>{n}s</option>
                  ))}
                </select>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerateQuestions}
              disabled={generating}
              className="btn-primary w-full flex items-center justify-center gap-2 text-lg"
            >
              {generating ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                    <HiOutlineSparkles />
                  </motion.div>
                  AI is generating questions...
                </>
              ) : (
                <>
                  <HiOutlineSparkles />
                  Generate Questions with AI
                </>
              )}
            </motion.button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Review Questions ({generatedQuestions.length})</h3>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="btn-secondary text-xs px-3 py-1">
                  Back
                </button>
                <button
                  onClick={handleGenerateQuestions}
                  disabled={generating}
                  className="btn-secondary text-xs px-3 py-1 flex items-center gap-1"
                >
                  <HiOutlineArrowPath className={generating ? 'animate-spin' : ''} />
                  Regenerate All
                </button>
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
              {generatedQuestions.map((q, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-matrix-500/20 text-matrix-300 text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-white font-medium">{q.question_text}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => regenerateOne(idx)}
                        className="p-1.5 rounded-lg hover:bg-dark-300 text-gray-400 hover:text-white transition-colors"
                        title="Regenerate this question"
                      >
                        <HiOutlineArrowPath className="text-sm" />
                      </button>
                      <button
                        onClick={() => removeQuestion(idx)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                        title="Remove"
                      >
                        <HiOutlineTrash className="text-sm" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 ml-10">
                    {q.options.map((opt, optIdx) => (
                      <div
                        key={optIdx}
                        className={`px-3 py-1.5 rounded-lg text-xs ${
                          optIdx === q.correct_answer
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-dark-300/50 text-gray-400'
                        }`}
                      >
                        {optIdx === q.correct_answer && <HiOutlineCheck className="inline mr-1" />}
                        {opt}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateEvent}
              className="btn-primary w-full text-lg flex items-center justify-center gap-2"
            >
              <HiOutlinePlus />
              Create Event
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Event Control Panel ────────────────────────────────────
function EventControlPanel({ event, onEventUpdate }) {
  const [participants, setParticipants] = useState([])
  const [questions, setQuestions] = useState([])
  const [currentQIndex, _setCurrentQIndex] = useState(-1)
  const currentQIndexRef = useRef(-1)
  const setCurrentQIndex = (val) => { currentQIndexRef.current = val; _setCurrentQIndex(val) }
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const adminChannelRef = useRef(null)
  const broadcastChannelRef = useRef(null)
  const fetchTimerRef = useRef(null)
  const isFetchingRef = useRef(false)

  useEffect(() => {
    fetchData()
    setupRealtimeSubscription()
    setupBroadcastChannel()
    return () => {
      if (adminChannelRef.current && typeof adminChannelRef.current === 'function') {
        adminChannelRef.current()
      }
      if (broadcastChannelRef.current) {
        supabase.removeChannel(broadcastChannelRef.current)
      }
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
    }
  }, [event.id])

  // Debounced fetch to handle 100+ participants without hammering the DB
  const debouncedFetch = useCallback(() => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
    fetchTimerRef.current = setTimeout(() => {
      if (!isFetchingRef.current) fetchData()
    }, 500)
  }, [event.id])

  const fetchData = async () => {
    isFetchingRef.current = true
    setLoading(prev => participants.length === 0 ? true : prev)
    try {
      const [{ data: freshEvent }, { data: parts }, { data: qs }, { data: ans }] = await Promise.all([
        supabase.from('events').select('*').eq('id', event.id).single(),
        supabase.from('participants').select('*').eq('event_id', event.id).order('score', { ascending: false }),
        supabase.from('questions').select('*').eq('event_id', event.id).order('order_index'),
        supabase.from('answers').select('*').eq('event_id', event.id),
      ])
      
      console.log(`[EventControlPanel] Fetched data for event ${event.id}:`, {
        event: freshEvent,
        participantCount: parts?.length || 0,
        questionCount: qs?.length || 0,
        answerCount: ans?.length || 0,
      })

      setParticipants((parts || []).map(p => ({ ...p, score: Number(p.score) || 0 })))
      setQuestions(qs || [])
      setAnswers((ans || []).map(a => ({ ...a, score: Number(a.score) || 0 })))
      const dbIndex = freshEvent?.current_question_index ?? event.current_question_index ?? -1
      setCurrentQIndex(dbIndex)
      if (freshEvent) onEventUpdate(freshEvent)
    } catch (error) {
      console.error('[EventControlPanel] Error fetching data:', error)
    }
    setLoading(false)
    isFetchingRef.current = false
  }

  const setupRealtimeSubscription = () => {
    console.log(`[EventControlPanel] Setting up real-time listener for event ${event.id}`)
    
    // Clean up old listeners
    if (adminChannelRef.current) {
      if (typeof adminChannelRef.current === 'function') {
        console.log(`[EventControlPanel] Unsubscribing from previous listener`)
        adminChannelRef.current()
      }
    }

    // Set up Firebase real-time listener for participants changes
    const unsubscribe = supabase.onQueryChange(
      'participants',
      [{ field: 'event_id', operator: '==', value: event.id }],
      ({ data, error }) => {
        if (error) {
          console.error(`[EventControlPanel] Real-time listener error:`, error)
          return
        }
        console.log(`[EventControlPanel] Real-time update: ${data?.length || 0} participants`)
        debouncedFetch()
      }
    )

    adminChannelRef.current = unsubscribe
    console.log(`[EventControlPanel] Real-time listener set up successfully`)
  }

  // Broadcast channel for sending events to players (uses Firestore doc under the hood)
  const setupBroadcastChannel = () => {
    if (broadcastChannelRef.current) supabase.removeChannel(broadcastChannelRef.current)
    const channel = supabase.channel(`event-${event.id}`)
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Admin] Broadcast channel ready for event', event.id)
      }
    })
    broadcastChannelRef.current = channel
  }

  const broadcastToEvent = async (eventType, payload) => {
    const channel = broadcastChannelRef.current
    if (!channel) {
      console.error('[Admin] Broadcast channel not ready')
      return
    }
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await channel.send({ type: 'broadcast', event: eventType, payload })
      if (result === 'ok') return
      console.warn(`[Admin] Broadcast attempt ${attempt + 1} failed for ${eventType}, retrying...`)
      await new Promise(r => setTimeout(r, 200 * (attempt + 1)))
    }
    console.error(`[Admin] Failed to broadcast ${eventType} after 3 attempts`)
  }

  const handleStartEvent = async () => {
    await supabase.from('events').update({ status: 'active', current_question_index: 0 }).eq('id', event.id)
    setCurrentQIndex(0)
    await broadcastToEvent('question_reveal', { questionIndex: 0 })
    await broadcastToEvent('event_update', { status: 'active' })
    onEventUpdate({ ...event, status: 'active', current_question_index: 0 })
    toast.success('Event started! Question 1 revealed.')
  }

  // Helper: fetch latest participant scores from DB before broadcasting
  const getFreshLeaderboard = async () => {
    const { data } = await supabase
      .from('participants')
      .select('*')
      .eq('event_id', event.id)
      .order('score', { ascending: false })
    const fresh = (data || []).map(p => ({ ...p, score: Number(p.score) || 0 }))
    setParticipants(fresh)
    return fresh
  }

  const handleNextQuestion = async () => {
    const nextIdx = currentQIndexRef.current + 1
    if (nextIdx >= questions.length) {
      return handleEndEvent()
    }

    // Fetch FRESH scores from DB before broadcasting (prevents stale score: 0)
    const freshParticipants = await getFreshLeaderboard()
    await broadcastToEvent('leaderboard_update', { leaderboard: freshParticipants })
    // Broadcast 60-second countdown to all players
    await broadcastToEvent('next_question_countdown', { seconds: 60 })
    toast.success('60s countdown started! Next question will be sent when you click "Send Question Now".')
  }

  const handleSendQuestionNow = async () => {
    const nextIdx = currentQIndexRef.current + 1
    if (nextIdx >= questions.length) {
      return handleEndEvent()
    }
    // Reveal the question immediately (clears countdown on player side)
    await supabase.from('events').update({ current_question_index: nextIdx }).eq('id', event.id)
    setCurrentQIndex(nextIdx)
    onEventUpdate({ ...event, current_question_index: nextIdx })
    await broadcastToEvent('question_reveal', { questionIndex: nextIdx })
    toast.success(`Question ${nextIdx + 1} revealed!`)
  }

  const handleShowReview = async () => {
    const freshParticipants = await getFreshLeaderboard()
    await broadcastToEvent('round_review', {})
    await broadcastToEvent('leaderboard_update', { leaderboard: freshParticipants })
    toast.success('Showing answer review to participants')
  }

  const handleEndEvent = async () => {
    await supabase.from('events').update({ status: 'finished' }).eq('id', event.id)
    const freshParticipants = await getFreshLeaderboard()
    await broadcastToEvent('leaderboard_update', { leaderboard: freshParticipants })
    await broadcastToEvent('game_end', {})
    onEventUpdate({ ...event, status: 'finished' })
    toast.success('Event finished!')
  }

  const copyCode = () => {
    navigator.clipboard.writeText(event.code)
    toast.success('Event code copied!')
  }

  const downloadResultsCSV = () => {
    if (participants.length === 0) {
      toast.error('No participants to export')
      return
    }
    const sorted = [...participants].sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))
    const headers = ['Rank', 'Name', 'Player ID', 'Score', 'Correct Answers', 'Total Questions']
    const rows = sorted.map((p, idx) => {
      const playerAnswers = answers.filter(a => a.participant_id === p.id)
      const correctAnswers = playerAnswers.filter(a => a.is_correct).length
      return [
        idx + 1,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        p.player_id || '',
        Number(p.score) || 0,
        correctAnswers,
        questions.length,
      ].join(',')
    })
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${event.name.replace(/[^a-z0-9]/gi, '_')}_results.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('CSV downloaded!')
  }

  if (loading) return <LoadingSpinner text="Loading event data..." />

  const currentQ = questions[currentQIndex]
  const answersForCurrentQ = currentQ
    ? answers.filter(a => a.question_id === currentQ.id)
    : []
  const correctCount = answersForCurrentQ.filter(a => a.is_correct).length
  const answeredCount = answersForCurrentQ.length

  return (
    <div className="space-y-6">
      {/* Event Header */}
      <div className="glass-strong rounded-2xl p-6 neon-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">{event.name}</h2>
            <p className="text-sm text-gray-400">
              {event.topic} · {event.difficulty} · {questions.length} questions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={copyCode} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-300 hover:bg-dark-400 transition-colors">
              <span className="font-mono font-bold text-lg text-neon-cyan tracking-wider">{event.code}</span>
              <HiOutlineClipboard className="text-gray-400" />
            </button>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold
              ${event.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-300' :
                event.status === 'active' ? 'bg-neon-green/20 text-neon-green' :
                'bg-gray-500/20 text-gray-400'}`}>
              {event.status?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4">
          <div className="text-center p-3 rounded-xl bg-dark-300/50">
            <p className="text-xl sm:text-2xl font-bold text-white">{participants.length}</p>
            <p className="text-xs text-gray-500">Players</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-dark-300/50">
            <p className="text-xl sm:text-2xl font-bold text-matrix-300">{currentQIndex + 1}/{questions.length}</p>
            <p className="text-xs text-gray-500">Question</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-dark-300/50">
            <p className="text-xl sm:text-2xl font-bold text-neon-green">{answeredCount}</p>
            <p className="text-xs text-gray-500">Answered</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-dark-300/50">
            <p className="text-xl sm:text-2xl font-bold text-neon-cyan">{correctCount}</p>
            <p className="text-xs text-gray-500">Correct</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        {event.status === 'waiting' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartEvent}
            disabled={participants.length === 0}
            className="btn-primary flex items-center gap-2"
          >
            <HiOutlinePlay />
            Start Event
          </motion.button>
        )}
        {event.status === 'active' && (
          <>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShowReview}
              className="btn-secondary flex items-center gap-2"
            >
              <HiOutlineEye />
              Show Answer
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNextQuestion}
              className="btn-primary flex items-center gap-2"
            >
              <HiOutlineClock />
              {currentQIndex + 1 >= questions.length ? 'End Event' : 'Next (60s countdown)'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSendQuestionNow}
              className="btn-primary flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
            >
              <HiOutlineForward />
              Send Question Now
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleEndEvent}
              className="btn-danger flex items-center gap-2"
            >
              <HiOutlineStop />
              End Now
            </motion.button>
          </>
        )}
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2 text-sm">
          <HiOutlineArrowPath />
          Refresh
        </button>
        <button onClick={downloadResultsCSV} className="btn-secondary flex items-center gap-2 text-sm">
          <HiOutlineArrowDownTray />
          Export CSV
        </button>
      </div>

      {/* Current Question Preview */}
      {currentQ && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-1 rounded-lg bg-matrix-500/20 text-matrix-300 text-xs font-mono">
              Q{currentQIndex + 1}
            </span>
            <span className="text-xs text-gray-500">{currentQ.category}</span>
          </div>
          <p className="text-white font-medium mb-4">{currentQ.question_text}</p>
          <div className="grid grid-cols-2 gap-2">
            {currentQ.options.map((opt, idx) => (
              <div
                key={idx}
                className={`px-3 py-2 rounded-lg text-sm ${
                  idx === currentQ.correct_answer
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-dark-300/50 text-gray-400'
                }`}
              >
                <span className="font-bold mr-2">{['A', 'B', 'C', 'D'][idx]}.</span>
                {opt}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <HiOutlineTrophy className="text-neon-yellow" />
          Live Leaderboard ({participants.length} players)
        </h3>
        {participants.length > 0 ? (
          <Leaderboard entries={participants} />
        ) : (
          <p className="text-gray-500 text-sm text-center py-4">
            No participants yet. Share the event code!
          </p>
        )}
      </div>

      {/* All Questions */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <HiOutlineBolt className="text-matrix-400" />
          All Questions
        </h3>
        <div className="space-y-2">
          {questions.map((q, idx) => {
            const qAnswers = answers.filter(a => a.question_id === q.id)
            const isActive = idx === currentQIndex
            const isRevealed = idx <= currentQIndex
            return (
              <div
                key={q.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  isActive ? 'bg-matrix-500/15 border border-matrix-500/30' :
                  isRevealed ? 'bg-dark-300/30' : 'bg-dark-300/10'
                }`}
              >
                <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold
                  ${isActive ? 'bg-matrix-500 text-white' :
                    isRevealed ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-dark-300 text-gray-500'}`}>
                  {isRevealed ? <HiOutlineCheck /> : idx + 1}
                </span>
                <p className={`flex-1 text-sm truncate ${isRevealed ? 'text-gray-300' : 'text-gray-500'}`}>
                  {q.question_text}
                </p>
                {qAnswers.length > 0 && (
                  <span className="text-xs text-gray-500 font-mono">
                    {qAnswers.filter(a => a.is_correct).length}/{qAnswers.length}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ─────────────────────────────────────────
export default function Dashboard() {
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [view, setView] = useState('list') // list | create | control
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Set up real-time listener for events
    const unsubscribe = supabase.onQueryChange(
      'events',
      [],
      ({ data, error }) => {
        if (error) {
          console.error('Error fetching events:', error)
          setLoading(false)
          return
        }
        // Sort by created_at descending (newest first)
        const sorted = data?.sort((a, b) => {
          const timeA = a.created_at instanceof Date ? a.created_at.getTime() : 0
          const timeB = b.created_at instanceof Date ? b.created_at.getTime() : 0
          return timeB - timeA
        }) || []
        setEvents(sorted)
        setLoading(false)
      }
    )

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const fetchEvents = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    setEvents(data || [])
    setLoading(false)
  }

  const handleEventCreated = (event) => {
    setSelectedEvent(event)
    setView('control')
    fetchEvents()
  }

  const handleSelectEvent = (event) => {
    setSelectedEvent(event)
    setView('control')
  }

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Delete this event and all its data?')) return
    await supabase.from('answers').delete().eq('event_id', eventId)
    await supabase.from('questions').delete().eq('event_id', eventId)
    await supabase.from('participants').delete().eq('event_id', eventId)
    await supabase.from('events').delete().eq('id', eventId)
    toast.success('Event deleted')
    fetchEvents()
    if (selectedEvent?.id === eventId) {
      setSelectedEvent(null)
      setView('list')
    }
  }

  return (
    <Layout>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">
              Admin <span className="text-gradient">Dashboard</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage events, generate questions, control the game</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setView('list'); setSelectedEvent(null) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${view === 'list' ? 'bg-matrix-500/20 text-white' : 'text-gray-400 hover:text-white hover:bg-dark-300'}`}
            >
              Events
            </button>
            <button
              onClick={() => setView('create')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1
                ${view === 'create' ? 'bg-matrix-500/20 text-white' : 'text-gray-400 hover:text-white hover:bg-dark-300'}`}
            >
              <HiOutlinePlus /> New Event
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Event List */}
          {view === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {loading ? (
                <LoadingSpinner text="Loading events..." />
              ) : events.length === 0 ? (
                <div className="text-center py-16">
                  <HiOutlineBolt className="text-5xl text-matrix-500/30 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No events yet</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setView('create')}
                    className="btn-primary"
                  >
                    Create Your First Event
                  </motion.button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {events.map((evt) => (
                    <motion.div
                      key={evt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-matrix-500/30 transition-colors cursor-pointer"
                      onClick={() => handleSelectEvent(evt)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-white truncate">{evt.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                            ${evt.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-300' :
                              evt.status === 'active' ? 'bg-neon-green/20 text-neon-green' :
                              'bg-gray-500/20 text-gray-400'}`}>
                            {evt.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {evt.topic} · {evt.question_count} questions · Code: <span className="text-matrix-300 font-mono">{evt.code}</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSelectEvent(evt) }}
                          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                        >
                          <HiOutlineCog6Tooth /> Manage
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteEvent(evt.id) }}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <HiOutlineTrash />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Create Event */}
          {view === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto"
            >
              <div className="glass-strong rounded-2xl p-6 sm:p-8 neon-border">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <HiOutlineSparkles className="text-neon-cyan" />
                  Create New Event
                </h2>
                <CreateEventPanel onEventCreated={handleEventCreated} />
              </div>
            </motion.div>
          )}

          {/* Event Control */}
          {view === 'control' && selectedEvent && (
            <motion.div
              key="control"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button
                onClick={() => { setView('list'); setSelectedEvent(null) }}
                className="text-sm text-gray-400 hover:text-white transition-colors mb-4 flex items-center gap-1"
              >
                ← Back to Events
              </button>
              <EventControlPanel
                event={selectedEvent}
                onEventUpdate={(updated) => setSelectedEvent(updated)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  )
}
