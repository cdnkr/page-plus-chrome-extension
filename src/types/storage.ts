import { generateId } from "../utils/id"
import { IConversationStorageItem, IContextItem } from "./conversation"
import { getAllConversations, saveConversations as saveConversationsToDB } from "../utils/db"

/**
 * Converts base64 data URL to Blob
 */
function convertBase64ToBlob(dataUrl: string): Blob | null {
    try {
        if (!dataUrl || !dataUrl.startsWith('data:')) {
            return null
        }
        const base64Data = dataUrl.split(',')[1] // Remove data:image/png;base64, prefix
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
        }
        // Try to detect MIME type from data URL
        const mimeMatch = dataUrl.match(/data:([^;]+);/)
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png'
        return new Blob([bytes], { type: mimeType })
    } catch (error) {
        console.error('Failed to convert base64 to blob:', error)
        return null
    }
}

/**
 * Converts Blob back to data URL for compatibility with existing code
 */
async function convertBlobToDataUrl(blob: Blob): Promise<string | null> {
    try {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
        })
    } catch (error) {
        console.error('Failed to convert blob to data URL:', error)
        return null
    }
}

/**
 * Converts context items' base64 screenshots to Blobs
 */
function convertContextScreenshotsToBlobs(contexts: IContextItem[]): IContextItem[] {
    return contexts.map(context => {
        const updated: IContextItem = { ...context }

        // Convert screenshot if present
        if (context.screenshot && typeof context.screenshot === 'string' && context.screenshot.startsWith('data:')) {
            const blob = convertBase64ToBlob(context.screenshot)
            if (blob) {
                // Store as Blob in IndexedDB (will be serialized automatically)
                updated.screenshot = blob as any
            }
        }

        // Convert image content if it's a base64 data URL
        if (context.type === 'image' && context.content && typeof context.content === 'string' && context.content.startsWith('data:')) {
            const blob = convertBase64ToBlob(context.content)
            if (blob) {
                updated.content = blob as any
            }
        }

        return updated
    })
}

/**
 * Converts Blobs back to base64 strings for compatibility
 */
async function convertBlobsToBase64(contexts: IContextItem[]): Promise<IContextItem[]> {
    const converted: IContextItem[] = []

    for (const context of contexts) {
        const updated: IContextItem = { ...context }

        // Convert screenshot Blob back to data URL
        if (context.screenshot && typeof context.screenshot !== 'string') {
            // Check if it's a Blob (after IndexedDB retrieval)
            const blob = context.screenshot as any
            if (blob instanceof Blob) {
                const dataUrl = await convertBlobToDataUrl(blob)
                if (dataUrl) {
                    updated.screenshot = dataUrl
                }
            }
        }

        // Convert image content Blob back to data URL
        if (context.type === 'image' && context.content && typeof context.content !== 'string') {
            // Check if it's a Blob (after IndexedDB retrieval)
            const blob = context.content as any
            if (blob instanceof Blob) {
                const dataUrl = await convertBlobToDataUrl(blob)
                if (dataUrl) {
                    updated.content = dataUrl
                }
            }
        }

        converted.push(updated)
    }

    return converted
}

/**
 * Migrates conversations from chrome.storage.local to IndexedDB
 */
async function migrateFromChromeStorageIfNeeded(): Promise<IConversationStorageItem[]> {
    try {
        // Check if migration has already been done
        const migrationResult = await chrome?.storage?.local?.get(['pageplus_migrated'])
        if (migrationResult?.pageplus_migrated) {
            console.log('Migration already completed')
            return []
        }

        // Load from chrome.storage.local
        const result = await chrome?.storage?.local?.get(['pageplus_prevconversations'])
        const conversations = result?.pageplus_prevconversations || []

        if (!Array.isArray(conversations) || conversations.length === 0) {
            // Mark as migrated even if empty to avoid checking again
            await chrome?.storage?.local?.set({ pageplus_migrated: true })
            return []
        }

        console.log('Migrating conversations from chrome.storage.local to IndexedDB:', conversations.length)

        // Convert base64 screenshots to Blobs
        const migratedConversations = conversations.map(conv => ({
            ...conv,
            contexts: convertContextScreenshotsToBlobs(conv.contexts || [])
        }))

        // Save to IndexedDB
        await saveConversationsToDB(migratedConversations)

        // Mark migration as complete
        await chrome?.storage?.local?.set({ pageplus_migrated: true })

        console.log('Migration completed successfully')
        return migratedConversations
    } catch (error) {
        console.error('Failed to migrate from chrome.storage.local:', error)
        // Don't throw - allow fallback to chrome.storage.local
        return []
    }
}

export async function migrateStorageIfNeeded(conversations: any[]): Promise<IConversationStorageItem[]> {
    if (!Array.isArray(conversations) || conversations.length === 0) {
        return []
    }

    // Check if migration is needed (missing id field or old structure)
    const needsMigration = conversations.some(conv =>
        !conv.id ||
        !conv.title ||
        !conv.lastModified ||
        !conv.isActive !== undefined ||
        Array.isArray(conv.contexts?.[0]) // Old nested structure
    )

    if (needsMigration) {
        const migratedConversations = conversations.map((conv, index) => ({
            id: conv.id || generateId(),
            title: conv.title || `Chat ${index + 1}`,
            conversations: conv.conversations || [],
            contexts: Array.isArray(conv.contexts?.[0]) ? conv.contexts.flat() : (conv.contexts || []),
            timestamp: conv.timestamp || Date.now(),
            lastModified: conv.lastModified || conv.timestamp || Date.now(),
            isActive: conv.isActive !== undefined ? conv.isActive : index === conversations.length - 1
        }))

        await saveConversations(migratedConversations)
        return migratedConversations
    }

    return conversations
}

export async function loadPreviousConversations(): Promise<IConversationStorageItem[]> {
    try {
        console.log('Loading conversations from IndexedDB...')

        // Try IndexedDB first
        try {
            let conversations = await getAllConversations()
            console.log('Found conversations in IndexedDB:', conversations.length)

            // If IndexedDB is empty, try migrating from chrome.storage.local
            if (conversations.length === 0) {
                const migrated = await migrateFromChromeStorageIfNeeded()
                if (migrated.length > 0) {
                    conversations = migrated
                }
            }

            if (conversations.length > 0) {
                // Convert Blobs back to base64 for compatibility
                const converted = await Promise.all(
                    conversations.map(async (conv) => ({
                        ...conv,
                        contexts: await convertBlobsToBase64(conv.contexts || [])
                    }))
                )

                // Apply legacy migration if needed
                return await migrateStorageIfNeeded(converted)
            }

            return []
        } catch (dbError) {
            console.warn('IndexedDB access failed, falling back to chrome.storage.local:', dbError)

            // Fallback to chrome.storage.local
            const result = await chrome?.storage?.local?.get(['pageplus_prevconversations'])
            const conversations = result?.pageplus_prevconversations || []
            console.log('Found conversations in chrome.storage.local:', conversations.length)

            if (Array.isArray(conversations) && conversations.length > 0) {
                return await migrateStorageIfNeeded(conversations)
            }
            return []
        }
    } catch (error) {
        console.error('Failed to load conversations:', error)
        return []
    }
}

export async function saveConversations(conversations: IConversationStorageItem[]): Promise<void> {
    try {
        console.log('Saving conversations to IndexedDB:', conversations.length, 'conversations')

        // Convert base64 screenshots to Blobs before saving
        const conversationsWithBlobs = conversations.map(conv => ({
            ...conv,
            contexts: convertContextScreenshotsToBlobs(conv.contexts || [])
        }))

        // Try IndexedDB first
        try {
            await saveConversationsToDB(conversationsWithBlobs)
            console.log('Successfully saved conversations to IndexedDB')
        } catch (dbError) {
            console.warn('IndexedDB save failed, falling back to chrome.storage.local:', dbError)

            // Fallback to chrome.storage.local (keep base64 format)
            await chrome?.storage?.local?.set({
                'pageplus_prevconversations': conversations
            })
            console.log('Successfully saved conversations to chrome.storage.local (fallback)')
        }
    } catch (error) {
        console.error('Failed to save conversations:', error)
        throw error
    }
}

export async function createNewConversation(existingConversations: IConversationStorageItem[]): Promise<IConversationStorageItem> {
    const newConversation: IConversationStorageItem = {
        id: generateId(),
        title: 'New Chat',
        conversations: [],
        contexts: [],
        timestamp: Date.now(),
        lastModified: Date.now(),
        isActive: true
    }

    const updatedConversations = existingConversations.map(conv => ({ ...conv, isActive: false }))
    updatedConversations.push(newConversation)

    await saveConversations(updatedConversations)
    return newConversation
}

export const MAX_CONVERSATIONS = 50

export async function cleanupOldConversations(conversations: IConversationStorageItem[]): Promise<IConversationStorageItem[]> {
    const sortedConversations = [...conversations].sort((a, b) => b.lastModified - a.lastModified)

    if (sortedConversations.length > MAX_CONVERSATIONS) {
        const toKeep = sortedConversations.slice(0, MAX_CONVERSATIONS)
        await saveConversations(toKeep)
        return toKeep
    }

    return sortedConversations
}
