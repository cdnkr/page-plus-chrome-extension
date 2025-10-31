const DB_NAME = 'pageplus'
const DB_VERSION = 1
const STORE_NAME = 'conversations'

let dbInstance: IDBDatabase | null = null
let dbPromise: Promise<IDBDatabase> | null = null

/**
 * Opens the IndexedDB database
 */
export async function openDB(): Promise<IDBDatabase> {
    if (dbInstance) {
        return dbInstance
    }

    if (dbPromise) {
        return dbPromise
    }

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onerror = () => {
            console.error('Failed to open IndexedDB:', request.error)
            reject(request.error)
        }

        request.onsuccess = () => {
            dbInstance = request.result
            resolve(dbInstance)
        }

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result

            // Create object store if it doesn't exist
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' })
            }
        }
    })

    return dbPromise
}

/**
 * Gets a single conversation by ID
 */
export async function getConversation(id: string): Promise<any | null> {
    try {
        const db = await openDB()
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly')
            const store = transaction.objectStore(STORE_NAME)
            const request = store.get(id)

            request.onsuccess = () => {
                resolve(request.result || null)
            }

            request.onerror = () => {
                reject(request.error)
            }
        })
    } catch (error) {
        console.error('Failed to get conversation:', error)
        return null
    }
}

/**
 * Gets all conversations
 */
export async function getAllConversations(): Promise<any[]> {
    try {
        const db = await openDB()
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly')
            const store = transaction.objectStore(STORE_NAME)
            const request = store.getAll()

            request.onsuccess = () => {
                resolve(request.result || [])
            }

            request.onerror = () => {
                reject(request.error)
            }
        })
    } catch (error) {
        console.error('Failed to get all conversations:', error)
        return []
    }
}

/**
 * Saves a single conversation
 */
export async function saveConversation(conversation: any): Promise<void> {
    try {
        const db = await openDB()
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite')
            const store = transaction.objectStore(STORE_NAME)
            const request = store.put(conversation)

            request.onsuccess = () => {
                resolve()
            }

            request.onerror = () => {
                reject(request.error)
            }
        })
    } catch (error) {
        console.error('Failed to save conversation:', error)
        throw error
    }
}

/**
 * Saves multiple conversations
 */
export async function saveConversations(conversations: any[]): Promise<void> {
    try {
        const db = await openDB()
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite')
            const store = transaction.objectStore(STORE_NAME)

            // Clear existing conversations first
            store.clear()

            // Add all conversations
            let completed = 0
            const total = conversations.length

            if (total === 0) {
                transaction.oncomplete = () => resolve()
                return
            }

            conversations.forEach((conv) => {
                const request = store.put(conv)
                request.onsuccess = () => {
                    completed++
                    if (completed === total) {
                        resolve()
                    }
                }
                request.onerror = () => {
                    reject(request.error)
                }
            })
        })
    } catch (error) {
        console.error('Failed to save conversations:', error)
        throw error
    }
}

/**
 * Deletes a conversation by ID
 */
export async function deleteConversation(id: string): Promise<void> {
    try {
        const db = await openDB()
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite')
            const store = transaction.objectStore(STORE_NAME)
            const request = store.delete(id)

            request.onsuccess = () => {
                resolve()
            }

            request.onerror = () => {
                reject(request.error)
            }
        })
    } catch (error) {
        console.error('Failed to delete conversation:', error)
        throw error
    }
}

/**
 * Clears all conversations
 */
export async function clearConversations(): Promise<void> {
    try {
        const db = await openDB()
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite')
            const store = transaction.objectStore(STORE_NAME)
            const request = store.clear()

            request.onsuccess = () => {
                resolve()
            }

            request.onerror = () => {
                reject(request.error)
            }
        })
    } catch (error) {
        console.error('Failed to clear conversations:', error)
        throw error
    }
}

