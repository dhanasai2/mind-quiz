import { firebase, isSupabaseConfigured } from './firebase.js'

// Export Firebase instance as 'supabase' for compatibility with existing code
export const supabase = firebase

export { isSupabaseConfigured }
