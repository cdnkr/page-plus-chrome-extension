export interface IContextItem {
    id: string
    url?: string
    type: 'text' | 'page' | 'image'
    content: string
    screenshot?: string
    code?: IContextCodeItem[]
    elements?: Array<{
        html: string
        css: string
        selector: string
    }>
    colors?: string[]
    isActive: boolean
}

export interface IContextCodeItem {
    type: string
    html: string
    css: string
    selector: string
}

export interface IConversationMessage {
    source: 'user' | 'ai' | 'status'
    content: string
    timestamp: number
    status: 'complete' | 'streaming' | 'processing'
    contextIds: string[]
    toolUsed?: string
}

export interface IConversationStorageItem {
    id: string
    title: string
    conversations: IConversationMessage[]
    contexts: IContextItem[]
    timestamp: number
    lastModified: number
    isActive: boolean
  }
  