import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  getDoc,
  increment,
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
 * Firebase Database Wrapper — mimics Supabase API for easier migration
 */
export class FirebaseDatabase {
  constructor() {
    this.db = db
  }

  /**
   * Table reference - returns query builder
   */
  from(collectionName) {
    return new FirebaseQueryBuilder(this.db, collectionName)
  }

  /**
   * Real-time channel subscription (stub - use real-time listeners for updates)
   */
  channel(channelName) {
    return {
      on: () => this,
      subscribe: async () => 'ok',
    }
  }

  /**
   * Remove channel (no-op)
   */
  removeChannel() {}

  /**
   * RPC call - increment score
   */
  async rpc(functionName, { row_id, amount }) {
    if (functionName === 'increment_score') {
      try {
        const docRef = doc(this.db, 'participants', row_id)
        await updateDoc(docRef, {
          score: increment(amount),
        })
        return { data: { id: row_id }, error: null }
      } catch (error) {
        return { data: null, error }
      }
    }
    return { data: null, error: new Error(`Unknown RPC: ${functionName}`) }
  }
}

/**
 * Query Builder — supports select, insert, update, delete, eq, order, etc.
 */
class FirebaseQueryBuilder {
  constructor(db, collectionName) {
    this.db = db
    this.collectionName = collectionName
    this.filters = []
    this.orderByFields = []
    this.limitCount = null
    this.singleResult = false
    this.insertData = null
    this.isInsertOperation = false
  }

  /**
   * Select columns (Firebase returns all fields, ignored)
   */
  select(fields) {
    return this
  }

  /**
   * Equality filter - supports multiple filters
   */
  eq(field, value) {
    this.filters.push({ field, operator: '==', value })
    return this
  }

  /**
   * Order by field
   */
  order(field, options = {}) {
    const direction = options.ascending === false ? 'desc' : 'asc'
    this.orderByFields.push({ field, direction })
    return this
  }

  /**
   * Limit results
   */
  limit(count) {
    this.limitCount = count
    return this
  }

  /**
   * Insert documents
   */
  insert(data) {
    this.insertData = data
    this.isInsertOperation = true
    return this
  }

  /**
   * Select after insert - allows chaining
   */
  select() {
    return this
  }

  /**
   * Expect single result - returns Promise
   */
  async single() {
    if (this.isInsertOperation) {
      return this.executeInsert(true)
    }
    this.singleResult = true
    return this.exec()
  }

  /**
   * Maybe single - returns null if not found instead of error
   */
  async maybeSingle() {
    const result = await this.single()
    if (result.error?.message === 'No results found') {
      return { data: null, error: null }
    }
    return result
  }

  /**
   * Execute insert
   */
  async executeInsert(returnSingle = false) {
    try {
      const isArray = Array.isArray(this.insertData)
      const docsToInsert = isArray ? this.insertData : [this.insertData]
      
      const collRef = collection(this.db, this.collectionName)
      const results = []

      for (const docData of docsToInsert) {
        const docRef = await addDoc(collRef, {
          ...docData,
          created_at: new Date(),
          updated_at: new Date(),
        })
        results.push({
          ...docData,
          id: docRef.id,
        })
      }

      if (returnSingle) {
        return { data: results[0] || null, error: null }
      }
      return { data: isArray ? results : results[0], error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Update documents
   */
  async update(updateData) {
    try {
      const id = this.filters.find(f => f.field === 'id')?.value
      if (!id) throw new Error('Update requires id filter')

      const docRef = doc(this.db, this.collectionName, id)
      await updateDoc(docRef, {
        ...updateData,
        updated_at: new Date(),
      })

      const updatedDoc = await getDoc(docRef)
      return { data: { id: updatedDoc.id, ...updatedDoc.data() }, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Delete documents
   */
  async delete() {
    try {
      const id = this.filters.find(f => f.field === 'id')?.value
      if (!id) throw new Error('Delete requires id filter')

      await deleteDoc(doc(this.db, this.collectionName, id))
      return { data: { id }, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Execute query
   */
  async exec() {
    try {
      let q = query(
        collection(this.db, this.collectionName),
        ...this.buildQueryConstraints()
      )

      const snapshot = await getDocs(q)
      let data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))

      if (this.singleResult) {
        if (data.length === 0) {
          return { data: null, error: { message: 'No results found' } }
        }
        return { data: data[0], error: null }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Build Firestore query constraints
   */
  buildQueryConstraints() {
    const constraints = []

    // Add where clauses
    for (const filter of this.filters) {
      constraints.push(where(filter.field, filter.operator, filter.value))
    }

    // Add order by
    for (const ord of this.orderByFields) {
      constraints.push(orderBy(ord.field, ord.direction))
    }

    // Add limit
    if (this.limitCount) {
      constraints.push(limit(this.limitCount))
    }

    return constraints
  }

  /**
   * Make awaitable
   */
  then(resolve, reject) {
    if (this.isInsertOperation) {
      return this.executeInsert().then(resolve, reject)
    }
    return this.exec().then(resolve, reject)
  }
}

// Export singleton instance
export const firebase = new FirebaseDatabase()

// Export for direct DB access
export function getDatabase() {
  return firebase
}

export const isSupabaseConfigured = Boolean(firebaseConfig.projectId)
