import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { calculateScore } from '../lib/scoring'

const GameContext = createContext(null)

const initialState = {
  // Event
  event: null,
  eventId: null,
  status: 'idle', // idle | waiting | active | review | finished
  // Participant
  participant: null,
  participantId: null,
  // Questions
  questions: [],
  currentQuestionIndex: -1,
  currentQuestion: null,
  // Answers & Scores
  selectedAnswer: null,
  answerSubmitted: false,
  questionStartTime: null,
  roundScore: 0,
  totalScore: 0,
  myAnswers: [],
  // Leaderboard
  leaderboard: [],
  // Next question countdown (seconds remaining, 0 = no countdown)
  nextQuestionCountdown: 0,
  // UI
  loading: false,
  error: null,
  timeLeft: 30,
}

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_EVENT':
      return { ...state, event: action.payload, eventId: action.payload?.id }
    case 'SET_PARTICIPANT':
      return { ...state, participant: action.payload, participantId: action.payload?.id }
    case 'SET_STATUS':
      return { ...state, status: action.payload }
    case 'SET_QUESTIONS':
      return { ...state, questions: action.payload }
    case 'SHOW_QUESTION': {
      const idx = action.payload
      // Guard 1: never re-show a question we already answered
      const targetQ = state.questions[idx]
      if (targetQ && state.myAnswers.some(a => a.questionId === targetQ.id)) {
        return state
      }
      // Guard 2: if we're already on this question (active or answered), don't reset
      if (idx === state.currentQuestionIndex) {
        return state
      }
      return {
        ...state,
        currentQuestionIndex: idx,
        currentQuestion: targetQ || null,
        selectedAnswer: null,
        answerSubmitted: false,
        questionStartTime: Date.now(),
        roundScore: 0,
        status: 'active',
        timeLeft: state.event?.time_per_question || 30,
        nextQuestionCountdown: 0, // clear countdown when question appears
      }
    }
    case 'SELECT_ANSWER':
      return { ...state, selectedAnswer: action.payload }
    case 'SUBMIT_ANSWER': {
      return {
        ...state,
        answerSubmitted: true,
        roundScore: action.payload.score,
        totalScore: state.totalScore + action.payload.score,
        myAnswers: [...state.myAnswers, action.payload],
      }
    }
    case 'SET_REVIEW':
      return { ...state, status: 'review' }
    case 'SET_LEADERBOARD':
      return { ...state, leaderboard: action.payload }
    case 'SET_NEXT_COUNTDOWN':
      return { ...state, nextQuestionCountdown: action.payload }
    case 'TICK_NEXT_COUNTDOWN':
      return { ...state, nextQuestionCountdown: Math.max(0, state.nextQuestionCountdown - 1) }
    case 'SET_FINISHED':
      return { ...state, status: 'finished' }
    case 'TICK':
      return { ...state, timeLeft: Math.max(0, state.timeLeft - 1) }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    case 'RESET':
      return { ...initialState }
    default:
      return state
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const timerRef = useRef(null)
  const countdownTimerRef = useRef(null)
  const channelRef = useRef(null)

  // Refs to always have current state for callbacks (prevents stale closures)
  const stateRef = useRef(state)
  stateRef.current = state

  // Timer logic
  useEffect(() => {
    if (state.status === 'active' && state.timeLeft > 0 && !state.answerSubmitted) {
      timerRef.current = setInterval(() => {
        dispatch({ type: 'TICK' })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [state.status, state.timeLeft, state.answerSubmitted])

  // Next question countdown timer
  useEffect(() => {
    if (state.nextQuestionCountdown > 0) {
      countdownTimerRef.current = setInterval(() => {
        dispatch({ type: 'TICK_NEXT_COUNTDOWN' })
      }, 1000)
    }
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [state.nextQuestionCountdown > 0])

  // Auto-submit when time runs out — use selected answer if any, otherwise -1
  useEffect(() => {
    if (state.timeLeft === 0 && state.status === 'active' && !state.answerSubmitted) {
      const currentSelected = stateRef.current.selectedAnswer
      submitAnswer(currentSelected !== null ? currentSelected : -1)
    }
  }, [state.timeLeft, state.status, state.answerSubmitted])

  const joinEvent = useCallback(async (eventCode, playerId, playerName) => {
    // Reset ALL state from any previous game (prevents leaderboard/score bleed)
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    dispatch({ type: 'RESET' })
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      // Find event by code
      const { data: event, error: eventErr } = await supabase
        .from('events')
        .select('*')
        .eq('code', eventCode.toUpperCase())
        .single()

      if (eventErr || !event) throw new Error('Event not found. Check the code and try again.')
      if (event.status === 'finished') throw new Error('This event has already ended.')

      dispatch({ type: 'SET_EVENT', payload: event })

      // Check if this player ID has already joined this event (duplicate prevention)
      const { data: existing } = await supabase
        .from('participants')
        .select('*')
        .eq('event_id', event.id)
        .eq('player_id', playerId.toUpperCase())
        .maybeSingle()

      if (existing) {
        // This ID already joined — block duplicate entry
        throw new Error('This Player ID has already been used to join this event. Each ID can only be used once.')
      }

      // Register as new participant with the provided name and ID
      const { data: newPart, error: partErr } = await supabase
        .from('participants')
        .insert({
          event_id: event.id,
          name: playerName.trim(),
          player_id: playerId.toUpperCase(),
          score: 0,
        })
        .select()
        .single()

      if (partErr) {
        // Race condition: another tab already inserted between check and insert
        if (partErr.message?.includes('duplicate') || partErr.code === '23505') {
          throw new Error('This Player ID has already been used to join this event. Each ID can only be used once.')
        }
        throw new Error('Failed to join event. Please try again.')
      }

      const participant = newPart
      dispatch({ type: 'SET_PARTICIPANT', payload: participant })

      // Fetch questions
      const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('event_id', event.id)
        .order('order_index')

      dispatch({ type: 'SET_QUESTIONS', payload: questions || [] })

      // If the event is already in progress, jump directly to the current question
      if (event.status === 'active' && event.current_question_index != null && event.current_question_index >= 0) {
        dispatch({ type: 'SHOW_QUESTION', payload: event.current_question_index })
      } else {
        dispatch({ type: 'SET_STATUS', payload: 'waiting' })
      }

      // Subscribe to realtime
      subscribeToEvent(event.id)
      dispatch({ type: 'SET_LOADING', payload: false })
      return { event, participant }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message })
      throw err
    }
  }, [])

  const subscribeToEvent = useCallback((eventId) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase.channel(`event-${eventId}`)

    // Listen for event status changes
    channel.on('broadcast', { event: 'event_update' }, ({ payload }) => {
      if (payload.status) dispatch({ type: 'SET_STATUS', payload: payload.status })
      if (payload.event) dispatch({ type: 'SET_EVENT', payload: payload.event })
    })

    // Listen for question reveals
    channel.on('broadcast', { event: 'question_reveal' }, ({ payload }) => {
      dispatch({ type: 'SHOW_QUESTION', payload: payload.questionIndex })
    })

    // Listen for round review
    channel.on('broadcast', { event: 'round_review' }, () => {
      dispatch({ type: 'SET_REVIEW' })
    })

    // Listen for leaderboard updates
    channel.on('broadcast', { event: 'leaderboard_update' }, ({ payload }) => {
      dispatch({ type: 'SET_LEADERBOARD', payload: payload.leaderboard })
    })

    // Listen for next-question countdown
    channel.on('broadcast', { event: 'next_question_countdown' }, ({ payload }) => {
      dispatch({ type: 'SET_NEXT_COUNTDOWN', payload: payload.seconds || 60 })
    })

    // Listen for game end
    channel.on('broadcast', { event: 'game_end' }, () => {
      dispatch({ type: 'SET_FINISHED' })
    })

    channel.subscribe()
    channelRef.current = channel
  }, [])

  const submitAnswer = useCallback(async (answerIndex) => {
    // Read from ref to always get current state (prevents stale closure bugs)
    const s = stateRef.current
    if (s.answerSubmitted || !s.currentQuestion) return

    // Prevent duplicate answer for the same question (broadcast replay could re-trigger)
    if (s.myAnswers.some(a => a.questionId === s.currentQuestion.id)) return

    const responseTime = Date.now() - s.questionStartTime
    // Type-safe comparison: force both sides to integer to prevent string/number mismatch
    const playerAnswer = Number(answerIndex)
    const correctAnswer = Number(s.currentQuestion.correct_answer)
    const isCorrect = playerAnswer >= 0 && playerAnswer === correctAnswer
    const score = calculateScore(responseTime, isCorrect, s.event?.time_per_question || 30)

    dispatch({
      type: 'SUBMIT_ANSWER',
      payload: {
        questionId: s.currentQuestion.id,
        answer: playerAnswer,
        isCorrect,
        responseTime,
        score,
      },
    })

    // Save to database (fire-and-forget, don't block UI)
    try {
      // Use Promise.all for parallel writes to reduce latency under load
      await Promise.all([
        supabase.from('answers').insert({
          event_id: s.eventId,
          participant_id: s.participantId,
          question_id: s.currentQuestion.id,
          answer_index: playerAnswer,
          is_correct: isCorrect,
          response_time_ms: responseTime,
          score,
        }),
        // Atomic score increment via RPC to avoid race conditions with 100+ concurrent players
        // Falls back to absolute update if RPC doesn't exist
        supabase.rpc('increment_score', {
          row_id: s.participantId,
          amount: score,
        }).then(({ error }) => {
          if (error) {
            // Fallback: read latest score then update
            return supabase
              .from('participants')
              .select('score')
              .eq('id', s.participantId)
              .single()
              .then(({ data }) => {
                const currentDbScore = data?.score || 0
                return supabase
                  .from('participants')
                  .update({ score: currentDbScore + score })
                  .eq('id', s.participantId)
              })
          }
        }),
      ])
    } catch (err) {
      console.error('Failed to save answer:', err)
    }
  }, []) // No dependencies needed — reads from stateRef

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }
    if (timerRef.current) clearInterval(timerRef.current)
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    dispatch({ type: 'RESET' })
  }, [])

  return (
    <GameContext.Provider value={{
      ...state,
      dispatch,
      joinEvent,
      submitAnswer,
      subscribeToEvent,
      cleanup,
    }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
