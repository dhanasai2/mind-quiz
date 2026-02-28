import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  getDoc,
  setDoc,
  increment,
  onSnapshot,
} from 'firebase/firestore'

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

/**
 * Convert Firestore Timestamps to JS Dates recursively.
 */
function convertTimestamps(obj) {
  if (obj == null) return obj
  if (Array.isArray(obj)) return obj.map(convertTimestamps)
  if (typeof obj !== 'object') return obj
  if (typeof obj.toDate === 'function') return obj.toDate()
  const out = {}
  for (const k of Object.keys(obj)) {
    out[k] = convertTimestamps(obj[k])
  }
  return out
}

/** Sort helper */
function sortBy(arr, field, direction = 'asc') {
  return [...arr].sort((a, b) => {
    const va = a[field] ?? 0
    const vb = b[field] ?? 0
    if (va < vb) return direction === 'asc' ? -1 : 1
    if (va > vb) return direction === 'asc' ? 1 : -1
    return 0
  })
}

// ─── Firebase Database Wrapper (Supabase-compatible API) ─────
export class FirebaseDatabase {
  constructor() {
    this.db = db
  }

  from(collectionName) {
    return new FirebaseQueryBuilder(this.db, collectionName)
  }

  /**
   * Channel — implements Supabase-style broadcast via Firestore document.
   * Admin writes to "broadcasts/{channelName}", players listen via onSnapshot.
   */
  channel(channelName, _opts) {
    return new FirebaseBroadcastChannel(this.db, channelName)
  }

  removeChannel(channel) {
    if (channel && typeof channel.unsubscribe === 'function') {
      channel.unsubscribe()
    }
  }

  /**
   * Real-time listener for a Firestore query.
   * Returns an unsubscribe function.
   */
  onQueryChange(collectionName, filters, callback) {
    const constraints = (filters || []).map((f) =>
      where(f.field, f.operator, f.value),
    )
    const q = query(collection(this.db, collectionName), ...constraints)
    return onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...convertTimestamps(d.data()),
        }))
        callback({ data, error: null })
      },
      (error) => {
        console.error(`[Firebase] onQueryChange error (${collectionName}):`, error)
        callback({ data: null, error })
      },
    )
  }

  /** Real-time listener for a single document */
  onDocumentChange(collectionName, docId, callback) {
    const ref = doc(this.db, collectionName, docId)
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        callback({
          data: { id: snap.id, ...convertTimestamps(snap.data()) },
          error: null,
        })
      } else {
        callback({ data: null, error: null })
      }
    })
  }

  /** RPC — increment_score */
  async rpc(functionName, { row_id, amount }) {
    if (functionName === 'increment_score') {
      try {
        const ref = doc(this.db, 'participants', row_id)
        await updateDoc(ref, { score: increment(amount) })
        return { data: { id: row_id }, error: null }
      } catch (error) {
        return { data: null, error }
      }
    }
    return { data: null, error: new Error(`Unknown RPC: ${functionName}`) }
  }
}

// ─── Broadcast Channel (replaces Supabase Realtime Broadcast) ─────
class FirebaseBroadcastChannel {
  constructor(db, channelName) {
    this.db = db
    this.channelName = channelName
    this.handlers = {}
    this._unsubscribe = null
    this._initialSnapshotSkipped = false
    this._lastProcessedNonce = null  // nonce-based dedup to prevent processing same event twice
  }

  /** Register handler: channel.on('broadcast', { event: 'xyz' }, handler) */
  on(type, opts, callback) {
    if (type === 'broadcast' && opts?.event) {
      this.handlers[opts.event] = callback
    }
    if (type === 'postgres_changes') {
      this.handlers['__db_change'] = callback
    }
    return this
  }

  /** Start listening via Firestore onSnapshot */
  subscribe(statusCallback) {
    const ref = doc(this.db, 'broadcasts', this.channelName)
    this._initialSnapshotSkipped = false
    this._lastProcessedNonce = null

    this._unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          // Doc doesn't exist yet — mark initial as skipped so next real write is processed
          this._initialSnapshotSkipped = true
          return
        }

        const data = snap.data()
        if (!data || !data.eventType) return

        // Skip the initial snapshot (replays the last doc state from before we subscribed).
        // Store its nonce so we never re-process this exact event even if onSnapshot fires again.
        if (!this._initialSnapshotSkipped) {
          this._initialSnapshotSkipped = true
          this._lastProcessedNonce = data._nonce ?? null
          return
        }

        // Nonce-based deduplication: each broadcast has a unique _nonce (Math.random()).
        // Skip if we already processed this exact nonce (prevents cache/server double-fire).
        if (data._nonce != null && data._nonce === this._lastProcessedNonce) return
        this._lastProcessedNonce = data._nonce

        const handler = this.handlers[data.eventType]
        if (handler) {
          handler({ payload: data.payload || {} })
        }

        const dbHandler = this.handlers['__db_change']
        if (dbHandler) dbHandler()
      },
      (err) => {
        console.error(`[BroadcastChannel] Error on ${this.channelName}:`, err)
      },
    )

    if (statusCallback) {
      setTimeout(() => statusCallback('SUBSCRIBED'), 0)
    }
    return this
  }

  /** Send a broadcast — writes to Firestore "broadcasts/{channelName}" doc */
  async send({ type, event: eventType, payload }) {
    try {
      const ref = doc(this.db, 'broadcasts', this.channelName)
      await setDoc(ref, {
        eventType,
        payload: payload || {},
        timestamp: new Date(),
        _nonce: Math.random(), // forces onSnapshot to fire even for same eventType
      })
      return 'ok'
    } catch (err) {
      console.error(`[BroadcastChannel] Send failed:`, err)
      return 'error'
    }
  }

  unsubscribe() {
    if (this._unsubscribe) {
      this._unsubscribe()
      this._unsubscribe = null
    }
  }
}

// ─── Query Builder ───────────────────────────────────────────
class FirebaseQueryBuilder {
  constructor(db, collectionName) {
    this.db = db
    this.collectionName = collectionName
    this.filters = []
    this._orderByFields = []
    this._limitCount = null
    this._singleResult = false
    this._insertData = null
    this._isInsert = false
    this._isUpdate = false
    this._updateData = null
    this._isDelete = false
  }

  select(_fields) {
    return this
  }

  eq(field, value) {
    this.filters.push({ field, op: '==', value })
    return this
  }

  order(field, options = {}) {
    const dir = options.ascending === false ? 'desc' : 'asc'
    this._orderByFields.push({ field, dir })
    return this
  }

  limit(count) {
    this._limitCount = count
    return this
  }

  insert(data) {
    this._insertData = data
    this._isInsert = true
    return this
  }

  update(data) {
    this._updateData = data
    this._isUpdate = true
    return this
  }

  delete() {
    this._isDelete = true
    return this
  }

  single() {
    this._singleResult = true
    return this._execute()
  }

  maybeSingle() {
    this._singleResult = true
    return this._execute().then((result) => {
      if (result.error?.message === 'No results found') {
        return { data: null, error: null }
      }
      return result
    })
  }

  /** Thenable — makes the query builder awaitable */
  then(resolve, reject) {
    return this._execute().then(resolve, reject)
  }

  // ─── Execution ──────────────────────────────────────────
  async _execute() {
    try {
      if (this._isInsert) return this._doInsert()
      if (this._isUpdate) return this._doUpdate()
      if (this._isDelete) return this._doDelete()
      return this._doSelect()
    } catch (error) {
      console.error(`[Firebase] _execute error on '${this.collectionName}':`, error)
      return { data: null, error }
    }
  }

  async _doSelect() {
    try {
      // Build query with ONLY where() — NO orderBy (avoids composite index requirement)
      const constraints = this.filters.map((f) => where(f.field, f.op, f.value))
      const q = query(collection(this.db, this.collectionName), ...constraints)
      const snap = await getDocs(q)

      let data = snap.docs.map((d) => ({
        id: d.id,
        ...convertTimestamps(d.data()),
      }))

      // Sort in JavaScript instead of Firestore (avoids composite index issues)
      for (const o of this._orderByFields) {
        data = sortBy(data, o.field, o.dir)
      }

      // Limit in JavaScript
      if (this._limitCount) {
        data = data.slice(0, this._limitCount)
      }

      if (this._singleResult) {
        return data.length === 0
          ? { data: null, error: { message: 'No results found' } }
          : { data: data[0], error: null }
      }

      return { data, error: null }
    } catch (error) {
      console.error(`[Firebase] SELECT on '${this.collectionName}' failed:`, error)
      return { data: null, error }
    }
  }

  async _doInsert() {
    try {
      const isArray = Array.isArray(this._insertData)
      const docs = isArray ? this._insertData : [this._insertData]
      const collRef = collection(this.db, this.collectionName)
      const results = []

      for (const docData of docs) {
        const ref = await addDoc(collRef, {
          ...docData,
          created_at: new Date(),
          updated_at: new Date(),
        })
        results.push({ ...docData, id: ref.id })
      }

      if (this._singleResult) {
        return { data: results[0] || null, error: null }
      }
      return { data: isArray ? results : results[0], error: null }
    } catch (error) {
      console.error(`[Firebase] INSERT into '${this.collectionName}' failed:`, error)
      return { data: null, error }
    }
  }

  async _doUpdate() {
    try {
      const idFilter = this.filters.find((f) => f.field === 'id')

      if (idFilter) {
        const ref = doc(this.db, this.collectionName, idFilter.value)
        await updateDoc(ref, { ...this._updateData, updated_at: new Date() })
        const snap = await getDoc(ref)
        return {
          data: { id: snap.id, ...convertTimestamps(snap.data()) },
          error: null,
        }
      }

      // Update multiple docs matching filters
      const constraints = this.filters.map((f) => where(f.field, f.op, f.value))
      const q = query(collection(this.db, this.collectionName), ...constraints)
      const snap = await getDocs(q)
      const batch = writeBatch(this.db)
      snap.docs.forEach((d) => {
        batch.update(d.ref, { ...this._updateData, updated_at: new Date() })
      })
      await batch.commit()
      return { data: { count: snap.docs.length }, error: null }
    } catch (error) {
      console.error(`[Firebase] UPDATE on '${this.collectionName}' failed:`, error)
      return { data: null, error }
    }
  }

  async _doDelete() {
    try {
      const idFilter = this.filters.find((f) => f.field === 'id')

      if (idFilter) {
        await deleteDoc(doc(this.db, this.collectionName, idFilter.value))
        return { data: { id: idFilter.value }, error: null }
      }

      if (this.filters.length === 0) {
        throw new Error('Delete requires at least one filter')
      }

      const constraints = this.filters.map((f) => where(f.field, f.op, f.value))
      const q = query(collection(this.db, this.collectionName), ...constraints)
      const snap = await getDocs(q)

      if (snap.docs.length === 0) {
        return { data: { count: 0 }, error: null }
      }

      const batch = writeBatch(this.db)
      snap.docs.forEach((d) => batch.delete(d.ref))
      await batch.commit()
      return { data: { count: snap.docs.length }, error: null }
    } catch (error) {
      console.error(`[Firebase] DELETE on '${this.collectionName}' failed:`, error)
      return { data: null, error }
    }
  }
}

// ─── Exports ─────────────────────────────────────────────────
export const firebase = new FirebaseDatabase()
export function getDatabase() {
  return firebase
}
export const isSupabaseConfigured = Boolean(firebaseConfig.projectId)
