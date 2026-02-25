import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Flag to check if Supabase is configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Timeout-wrapped fetch — prevents requests from hanging forever
// (e.g. when Supabase free-tier project is paused or network is down)
const SUPABASE_TIMEOUT_MS = 15000 // 15 seconds
function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS)
  const signal = options.signal
    ? // If caller already has a signal, combine them
      options.signal
    : controller.signal

  return fetch(url, { ...options, signal })
    .then(res => { clearTimeout(timeout); return res })
    .catch(err => {
      clearTimeout(timeout)
      if (err.name === 'AbortError') {
        throw new Error(
          'Supabase request timed out. Your project may be paused — check your Supabase dashboard.'
        )
      }
      throw err
    })
}

// Only create client if credentials exist; otherwise use a dummy placeholder
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 100, // Support high-throughput for 100+ participants
        },
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: { 'x-client-info': 'mind-matrix' },
        fetch: fetchWithTimeout,
      },
    })
  : {
      // Stub so the app doesn't crash when Supabase isn't configured yet
      from: () => ({
        select: () => ({ eq: () => ({ single: () => ({ data: null, error: { message: 'Supabase not configured' } }), order: () => ({ data: [], error: null }), limit: () => ({ data: [], error: null }), data: [], error: null }), order: () => ({ data: [], error: null }), single: () => ({ data: null, error: { message: 'Supabase not configured' } }), data: [], error: null }),
        insert: () => ({ select: () => ({ single: () => ({ data: null, error: { message: 'Supabase not configured' } }), data: null, error: { message: 'Supabase not configured' } }), data: null, error: { message: 'Supabase not configured' } }),
        update: () => ({ eq: () => ({ data: null, error: null }) }),
        delete: () => ({ eq: () => ({ data: null, error: null }) }),
      }),
      channel: () => ({
        on: function() { return this },
        subscribe: () => {},
        send: async () => {},
      }),
      removeChannel: () => {},
    }
