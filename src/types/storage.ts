import { generateId } from "../utils/id"
import { IConversationStorageItem } from "./conversation"

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
        console.log('Loading conversations from storage...')
        const result = await chrome?.storage?.local?.get(['pageplus_prevconversations'])
        console.log('Storage result:', result)
        const conversations = result?.pageplus_prevconversations || []
        console.log('Found conversations:', conversations.length)

        if (Array.isArray(conversations) && conversations.length > 0) {
            return await migrateStorageIfNeeded(conversations)
        }
        return []
    } catch (error) {
        console.error('Failed to load conversations:', error)
        return []
    }
}

export async function saveConversations(conversations: IConversationStorageItem[]): Promise<void> {
    try {
        console.log('Saving conversations:', conversations.length, 'conversations')
        await chrome?.storage?.local?.set({
            'pageplus_prevconversations': conversations
        })
        console.log('Successfully saved conversations to storage')
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
