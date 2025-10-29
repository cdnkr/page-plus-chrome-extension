import { useState, useEffect, useRef, useCallback } from "react"
import { IConversationMessage, IContextItem, IConversationStorageItem } from "../types/conversation"
import { cn } from "../utils/tailwind"
import { sleep } from "../utils/timing"
import { useAiProvider } from "../hooks/useAiProvider"
import { useToolsExecution } from "../hooks/useToolsExecution"
import { AiModel } from "../types/aiProvider"
import { cleanupOldConversations, createNewConversation, loadPreviousConversations, saveConversations } from "../types/storage"
import { generateId } from "../utils/id"
import { IStatusMessage } from "../types/status"
import Header from "../components/Header"
import StatusMessage from "../components/StatusMessage"
import PageSuggestions from "../components/PageSuggestions"
import { PageSuggestion } from "../types/suggestions"
import { generatePageSuggestions } from "../utils/pageSuggestions"
import { AUTO_SUMMARIZE_THRESHOLD, SHOW_SUGGESTIONS, SUPPORTED_MODELS } from "../constants"
import { InputSection } from "../components/input-section/InputSection"
import Conversation from "../components/conversation/Conversation"
import { useLanguage } from "../contexts/LanguageContext"
import { useSummarizerApi } from "../hooks/useSummarizerApi"
import { useWriterApi } from "../hooks/useWriterApi"

export default function Main() {
    const [prevConversations, setPrevConversations] = useState<IConversationStorageItem[]>([]);
    const [contextItems, setContextItems] = useState<IContextItem[]>([])
    const [query, setQuery] = useState('')
    const [currentConversation, setCurrentConversation] = useState<IConversationMessage[]>([])
    const [contextPerc, setContextPerc] = useState(0)
    const [hasInitialized, setHasInitialized] = useState(false)
    const [aiResponse, setAiResponse] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const [status, setStatus] = useState<IStatusMessage | null>(null)
    const [hasInitializedPrevConversations, setHasInitializedPrevConversations] = useState(false)
    const [selectedModel, setSelectedModel] = useState<AiModel>(SUPPORTED_MODELS.GOOGLE_NANO)
    const [pageSuggestions, setPageSuggestions] = useState<PageSuggestion[]>([])
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false)
    const [showPageSuggestions, setShowPageSuggestions] = useState(true)
    const [currentPageUrl, setCurrentPageUrl] = useState('')
    const [isLoadingContextItems, setIsLoadingContextItems] = useState(false)
    const [previousLanguage, setPreviousLanguage] = useState<'en' | 'es' | 'ja'>('en')
    const [processingContextId, setProcessingContextId] = useState<string | null>(null)
    const [autoSummarizeEnabled, setAutoSummarizeEnabled] = useState(false)
    const [autoSummarizeThreshold, setAutoSummarizeThreshold] = useState(AUTO_SUMMARIZE_THRESHOLD)
    
    const inputSectionRef = useRef<HTMLDivElement | null>(null)
    const contextItemsRef = useRef<IContextItem[]>([])
    const messageContainerRef = useRef<HTMLDivElement | null>(null)

    const { language } = useLanguage();
    const aiProvider = useAiProvider(selectedModel, currentConversation)
    const summarizerApi = useSummarizerApi()
    const writerApi = useWriterApi()
    const {
        availability,
        session,
        initializeSession,
        calculateQuotaUsage,
        destroySession,
        downloadProgress,
        checkAvailability,
        hasCheckedAvailability
    } = aiProvider

    // for testing
    // const availability: { status: 'unavailable' | 'downloadable' | 'downloading' | 'available'; isReady: boolean } = { status: 'unavailable', isReady: false }

    const { executeWithTools } = useToolsExecution(aiProvider, writerApi.availability, selectedModel)

    // Conversation management functions
    async function updateCurrentConversation(userMessage: IConversationMessage, aiResponse: IConversationMessage) {
        try {
            const storedConversations = await loadPreviousConversations()
            const currentIndex = storedConversations.findIndex(conv => conv.isActive)

            if (currentIndex >= 0) {
                storedConversations[currentIndex] = {
                    ...storedConversations[currentIndex],
                    conversations: [...storedConversations[currentIndex].conversations, userMessage, aiResponse],
                    contexts: contextItems, // Also save the current context items
                    lastModified: Date.now(),
                    title: storedConversations[currentIndex].title === 'New Chat'
                        ? userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? '...' : '')
                        : storedConversations[currentIndex].title
                }

                await saveConversations(storedConversations)
                setPrevConversations(storedConversations)

            } else {
                console.warn('No active conversation found! Creating a new one...')
                // Create a new conversation if none exists
                const newConversation: IConversationStorageItem = {
                    id: generateId(),
                    title: userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? '...' : ''),
                    conversations: [userMessage, aiResponse],
                    contexts: contextItems,
                    timestamp: Date.now(),
                    lastModified: Date.now(),
                    isActive: true
                }

                // Mark all existing conversations as inactive
                const updatedConversations = prevConversations.map(conv => ({ ...conv, isActive: false }))
                updatedConversations.push(newConversation)

                await saveConversations(updatedConversations)
                setPrevConversations(updatedConversations)
            }
        } catch (error) {
            console.error('Failed to update conversation:', error)
        }
    }

    async function switchToConversation(conversationId: string) {
        try {
            // Destroy current session if it exists
            if (session.isActive && session.session) {
                if (typeof session.session?.destroy === 'function') {
                    await session.session.destroy()
                } else {
                    // For Gemini API, use the destroySession method from the provider
                    destroySession()
                }
            }

            const updatedConversations = prevConversations.map(conv => ({
                ...conv,
                isActive: conv.id === conversationId
            }))

            await saveConversations(updatedConversations)
            setPrevConversations(updatedConversations)

            const targetConversation = updatedConversations.find(conv => conv.id === conversationId)
            if (targetConversation) {
                // Initialize new session with this conversation's history
                await initializeSession(targetConversation.conversations)

                setCurrentConversation(targetConversation.conversations)
                setContextItems(targetConversation.contexts)

                if (targetConversation.conversations.length === 0) {
                    setShowPageSuggestions(true)
                }
            }
        } catch (error) {
            console.error('Failed to switch conversation:', error)
        }
    }

    async function deleteConversation(conversationId: string) {
        try {
            const updatedConversations = prevConversations.filter(conv => conv.id !== conversationId)

            if (updatedConversations.length > 0) {
                // If we deleted the active conversation, activate the most recent one
                const activeConversation = updatedConversations.find(conv => conv.isActive)
                if (!activeConversation) {
                    updatedConversations[updatedConversations.length - 1].isActive = true
                }
            }

            await saveConversations(updatedConversations)
            setPrevConversations(updatedConversations)

            // If we deleted the current conversation, switch to the active one
            const activeConversation = updatedConversations.find(conv => conv.isActive)
            if (activeConversation) {
                // Destroy current session and create new one for the active conversation
                if (session.isActive && session.session) {
                    if (typeof session.session?.destroy === 'function') {
                        await session.session.destroy()
                    } else {
                        destroySession()
                    }
                }
                await initializeSession(activeConversation.conversations)
                setCurrentConversation(activeConversation.conversations)
                setContextItems(activeConversation.contexts)
            } else {
                // No conversations left, create a new one
                if (session.isActive && session.session) {
                    if (typeof session.session?.destroy === 'function') {
                        await session.session.destroy()
                    } else {
                        destroySession()
                    }
                }
                const newConversation = await createNewConversation([])
                setPrevConversations([newConversation])
                setCurrentConversation([])
                setContextItems([])
                await initializeSession([])
            }
        } catch (error) {
            console.error('Failed to delete conversation:', error)
        }
    }

    useEffect(() => {
        if (hasInitialized) return

        async function initPromptApi() {
            if (availability.isReady) {
                // Initialize session with current conversation history
                await initializeSession(currentConversation)
                setHasInitialized(true)
                console.log('Session initialized successfully, sending extensionLoaded message...')

                // Notify the content script that the extension has loaded
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]?.id) {
                        chrome.tabs.sendMessage(tabs[0].id, { action: 'extensionLoaded' }, () => {
                            if (chrome.runtime.lastError) {
                                console.log('Content script not ready for extension loaded:', chrome.runtime.lastError.message);
                            }
                        });
                    }
                });
            } else {
                console.log('Availability not ready yet, waiting...')
            }
        }

        initPromptApi()
    }, [availability, hasInitialized, initializeSession, currentConversation, selectedModel])

    // Set default model to Gemini 2.5 Flash Lite when Nano is unavailable
    useEffect(() => {
        if ((selectedModel === SUPPORTED_MODELS.GOOGLE_NANO) && (availability.status !== 'available') && hasCheckedAvailability) {
            setSelectedModel(SUPPORTED_MODELS.GEMINI_2_5_FLASH_LITE)
        }
    }, [availability.status, selectedModel, hasCheckedAvailability])

    useEffect(() => {
        if (hasInitializedPrevConversations) return

        async function initPreviousConversations() {
            try {
                const conversations = await loadPreviousConversations()

                if (conversations.length > 0) {
                    const cleanedConversations = await cleanupOldConversations(conversations)
                    setPrevConversations(cleanedConversations)

                    // Find and set the active conversation
                    const activeConversation = cleanedConversations.find(conv => conv.isActive)

                    if (activeConversation) {
                        setCurrentConversation(activeConversation.conversations)
                        setContextItems(activeConversation.contexts)
                    }
                } else {
                    console.log('No existing conversations, creating new one')
                    const newConversation = await createNewConversation([])
                    setPrevConversations([newConversation])
                    setCurrentConversation([])
                    setContextItems([])
                }

                setHasInitializedPrevConversations(true)
            } catch (error) {
                console.error('Failed to initialize conversations:', error)
                setHasInitializedPrevConversations(true)
            }
        }
        initPreviousConversations()
    }, [])

    // Load auto-summarize setting and watch for changes
    useEffect(() => {
        chrome?.storage?.local?.get(['autoSummarizeOverCharsEnabled', 'autoSummarizeThreshold'], (result) => {
            setAutoSummarizeEnabled(!!result.autoSummarizeOverCharsEnabled)
            if (typeof result.autoSummarizeThreshold === 'number') setAutoSummarizeThreshold(result.autoSummarizeThreshold)
        })

        function onStorageChanged(changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) {
            if (areaName !== 'local') return
            if (changes.autoSummarizeOverCharsEnabled) {
                setAutoSummarizeEnabled(!!changes.autoSummarizeOverCharsEnabled.newValue)
            }
            if (changes.autoSummarizeThreshold && typeof changes.autoSummarizeThreshold.newValue === 'number') {
                setAutoSummarizeThreshold(changes.autoSummarizeThreshold.newValue)
            }
        }

        chrome?.storage?.onChanged.addListener(onStorageChanged)
        return () => chrome?.storage?.onChanged.removeListener(onStorageChanged)
    }, [])

    // Separate effect for quota calculation after session is ready
    useEffect(() => {
        let isCancelled = false;

        async function getQuota() {
            if (hasInitialized && session.isActive && session.session) {
                try {
                    // Add a small delay to ensure session is fully ready
                    await new Promise(resolve => setTimeout(resolve, 100));

                    // Check if effect was cancelled during the delay
                    if (isCancelled) return;

                    const quotaUsage = await calculateQuotaUsage(contextItems.filter(item => item.isActive), query, currentConversation);

                    // Check again if effect was cancelled during async operation
                    if (isCancelled) return;

                    if (quotaUsage.percentage > 100) {
                        setStatus({
                            type: 'error',
                            title: 'Your context is too large',
                            description: 'You\'ll have to remove some context items before submitting',
                            action: {
                                label: 'Summarize contexts',
                                onClick: summarizeActiveContexts
                            }
                        })
                    } else if (status?.title === 'Your context is too large') {
                        setStatus(null)
                    }

                    setContextPerc(quotaUsage.percentage)
                } catch (error) {
                    // Only log error if effect wasn't cancelled
                    if (!isCancelled) {
                        console.error('Failed to calculate quota:', error);
                        setContextPerc(0);
                    }
                }
            }
        }

        getQuota()

        return () => {
            isCancelled = true;
        };
    }, [hasInitialized, session.isActive, session.session, contextItems, query, currentConversation, calculateQuotaUsage])

    // Summarize all active text/page contexts sequentially using on-device Summarizer
    const summarizeActiveContexts = useCallback(async () => {
        try {
            // Always initialize the summarizer; summarize() requires an instance
            await summarizerApi.initializeSummarizer()

            const activeTargets = contextItems
                .filter(item => item.isActive && (item.type === 'text' || item.type === 'page'))

            for (const item of activeTargets) {
                setProcessingContextId(item.id)
                try {
                    const summarized = await summarizerApi.summarize(item.content)
                    const updated = contextItemsRef.current.map(ci => ci.id === item.id ? { ...ci, content: summarized } : ci)
                    setContextItems(updated)
                    await updateCurrentConversationContext(updated)
                } catch (e) {
                    console.error('Failed to summarize context item', item.id, e)
                    // continue to next item
                }
            }
        } catch (e) {
            console.error('Summarize contexts failed', e)
        } finally {
            setProcessingContextId(null)
        }
    }, [contextItems, summarizerApi])

    // Add message listener for text selection and page changes
    useEffect(() => {
        const handleMessage = (message: any) => {
            if (message.action === 'textSelected') {
                const newContextItem: IContextItem = {
                    id: Date.now().toString(),
                    type: 'text',
                    content: message.text,
                    url: message.url,
                    isActive: true
                };
                const updatedContextItems = [...contextItems, newContextItem];
                setContextItems(updatedContextItems);
                updateCurrentConversationContext(updatedContextItems);

                // Auto-summarize this item if enabled and over threshold
                if (autoSummarizeEnabled && (newContextItem.content?.length || 0) > autoSummarizeThreshold) {
                    (async () => {
                        try {
                            setProcessingContextId(newContextItem.id)
                            await summarizerApi.initializeSummarizer()
                            const summarized = await summarizerApi.summarize(newContextItem.content)
                            const updated = updatedContextItems.map(ci => ci.id === newContextItem.id ? { ...ci, content: summarized } : ci)
                            setContextItems(updated)
                            await updateCurrentConversationContext(updated)
                        } catch (e) {
                            console.error('Auto-summarize failed for textSelected', e)
                        } finally {
                            setProcessingContextId(null)
                        }
                    })()
                }
            } else if (message.action === 'areaSelected') {
                const newContextItem: IContextItem = {
                    id: Date.now().toString(),
                    type: 'image',
                    content: message.imageData,
                    url: message.url,
                    elements: message.elements,
                    colors: message.colors,
                    isActive: true
                };

                const updatedContextItems = [...contextItems, newContextItem];
                setContextItems(updatedContextItems);
                updateCurrentConversationContext(updatedContextItems);
            } else if (message.action === 'pageCaptured') {
                const newContextItem: IContextItem = {
                    id: Date.now().toString(),
                    type: 'page',
                    content: message.content,
                    screenshot: message.screenshot,
                    url: message.url,
                    isActive: true
                };
                const updatedContextItems = [...contextItems, newContextItem];
                setContextItems(updatedContextItems);
                updateCurrentConversationContext(updatedContextItems);
                setIsLoadingContextItems(false);

                // Auto-summarize this item if enabled and over threshold
                if (autoSummarizeEnabled && (newContextItem.content?.length || 0) > autoSummarizeThreshold) {
                    (async () => {
                        try {
                            setProcessingContextId(newContextItem.id)
                            await summarizerApi.initializeSummarizer()
                            const summarized = await summarizerApi.summarize(newContextItem.content)
                            const updated = updatedContextItems.map(ci => ci.id === newContextItem.id ? { ...ci, content: summarized } : ci)
                            setContextItems(updated)
                            await updateCurrentConversationContext(updated)
                        } catch (e) {
                            console.error('Auto-summarize failed for pageCaptured', e)
                        } finally {
                            setProcessingContextId(null)
                        }
                    })()
                }
            } else if (message.action === 'pageChanged') {
                // Handle page change - generate suggestions for new pages
                if (message.url && message.screenshot) {
                    setCurrentPageUrl(message.url?.replace(/^https?:\/\//, ''));
                    setIsGeneratingSuggestions(false);
                    generateSuggestionsForPage(message.url, message.screenshot, message.content);
                }
            }
        };

        chrome?.runtime?.onMessage.addListener(handleMessage);

        return () => {
            chrome?.runtime?.onMessage.removeListener(handleMessage);
        };
    }, [contextItems, currentConversation, language]);

    useEffect(() => {
        if (language !== previousLanguage) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.id) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'extensionLoaded' }, () => {
                        if (chrome.runtime.lastError) {
                            console.log('Content script not ready for extension loaded:', chrome.runtime.lastError.message);
                        }
                    });
                }
            });
        }

        setPreviousLanguage(language);
    }, [language]);

    // Clear suggestions if there are any messages in the conversation loaded
    useEffect(() => {
        if (currentConversation.length > 0) {
            setShowPageSuggestions(false);
        }
    }, [currentConversation.length]);

    // Cleanup session on unmount
    useEffect(() => {
        return () => {
            if (session.isActive && session.session) {
                if (typeof session.session?.destroy === 'function') {
                    session.session.destroy()?.catch(console.error);
                } else {
                    destroySession();
                }
            }
        };
    }, [session.isActive, session.session, destroySession]);

    function removeContextItem(itemId: string) {
        const removedItem = contextItems.find(item => item.id === itemId)

        if (!removedItem) return

        const updatedRemovedItem = {
            ...removedItem,
            isActive: false
        }

        const updatedContextItems = [
            ...contextItems.filter(item => item.id !== itemId),
            updatedRemovedItem
        ]

        setContextItems([...updatedContextItems])

        // Update the current conversation's context items
        updateCurrentConversationContext(updatedContextItems)
    }

    async function updateCurrentConversationContext(contextItems: IContextItem[]) {
        try {
            const updatedConversations = [...prevConversations]
            const currentIndex = updatedConversations.findIndex(conv => conv.isActive)

            if (currentIndex >= 0) {
                updatedConversations[currentIndex] = {
                    ...updatedConversations[currentIndex],
                    contexts: contextItems,
                    lastModified: Date.now()
                }

                await saveConversations(updatedConversations)
                setPrevConversations(updatedConversations)
            } else {
                console.warn('No active conversation found for context update! Creating a new one...')
                // Create a new conversation if none exists
                const newConversation: IConversationStorageItem = {
                    id: generateId(),
                    title: 'New Chat',
                    conversations: [],
                    contexts: contextItems,
                    timestamp: Date.now(),
                    lastModified: Date.now(),
                    isActive: true
                }

                // Mark all existing conversations as inactive
                const updatedConversations = prevConversations.map(conv => ({ ...conv, isActive: false }))
                updatedConversations.push(newConversation)

                await saveConversations(updatedConversations)
                setPrevConversations(updatedConversations)
                console.log('Created new conversation for context update')
            }
        } catch (error) {
            console.error('Failed to update conversation context:', error)
        }
    }

    useEffect(() => {
        contextItemsRef.current = contextItems
    }, [contextItems])

    async function onSubmit() {
        if (!query) return

        if (contextItems.length === 0) {
            captureCurrentPage()

            // wait for isLoadingContextItems to be false
            await new Promise(resolve => {
                const interval = setInterval(() => {
                    if (!isLoadingContextItems) {
                        clearInterval(interval)
                        resolve(true)
                    }
                }, 100)
            })
            await sleep(1000)
        }

        const userMessage = {
            source: 'user' as const,
            content: query,
            timestamp: new Date().getTime(),
            status: 'complete' as const,
            contextIds: contextItemsRef.current.filter(item => item.isActive).map(item => item.id)
        }

        // Add user message immediately
        setCurrentConversation(prev => [...prev, userMessage])

        scrollToBottomOfMessageContainer()

        // Reset AI response and start streaming
        setAiResponse('')
        setIsStreaming(true)
        setQuery('')

        try {
            let accumulatedResponse = ''

            scrollToBottomOfMessageContainer()

            // Execute the prompt with streaming using tools system
            const usedTool = await executeWithTools(query, contextItemsRef.current.filter(item => item.isActive), (chunk: string) => {
                accumulatedResponse += chunk
                setAiResponse(accumulatedResponse)
                scrollToBottomOfMessageContainer()
            }, currentConversation)

            // Streaming completed - add the final response to conversation
            const finalResponse = {
                source: 'ai' as const,
                content: accumulatedResponse,
                timestamp: new Date().getTime(),
                status: 'complete' as const,
                contextIds: contextItems.filter(item => item.isActive).map(item => item.id),
                toolUsed: usedTool
            }

            setCurrentConversation(prev => [...prev, finalResponse])

            // Update the current conversation in storage
            await updateCurrentConversation(userMessage, finalResponse)

            setAiResponse('')
            setIsStreaming(false)
            scrollToBottomOfMessageContainer()

        } catch (error) {
            console.error('Error executing prompt:', error)

            // Add error message to conversation
            const errorMessage = {
                source: 'ai' as const,
                content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
                timestamp: new Date().getTime(),
                status: 'complete' as const,
                contextIds: contextItems.filter(item => item.isActive).map(item => item.id)
            }

            setCurrentConversation(prev => [...prev, errorMessage])
            setAiResponse('')
            setIsStreaming(false)
        }
    }

    function scrollToBottomOfMessageContainer() {
        messageContainerRef.current?.scrollTo({
            top: messageContainerRef.current?.scrollHeight,
            behavior: 'smooth'
        })
    }

    function captureCurrentPage() {
        setIsLoadingContextItems(true)
        chrome?.runtime?.sendMessage({ action: 'captureCurrentPage' });
    }

    async function generateSuggestionsForPage(url: string, screenshot: string, content: string) {
        if (!SHOW_SUGGESTIONS) return; // Check if feature is enabled and prevent multiple simultaneous requests

        setIsGeneratingSuggestions(true);
        try {
            const suggestions = await generatePageSuggestions(url, screenshot, language, content);
            if (suggestions.suggestions.length > 0) setPageSuggestions([...suggestions.suggestions]);
            setIsGeneratingSuggestions(false);
        } catch (error) {
            console.error('Failed to generate page suggestions:', error);
            setPageSuggestions([]);
            setIsGeneratingSuggestions(false);
        }
    }

    function onSuggestionClick(suggestion: PageSuggestion) {
        captureCurrentPage();

        // Set the suggestion prompt as the query and submit it
        setQuery(suggestion.prompt);
        // Clear suggestions since user is now interacting
        setShowPageSuggestions(false);
    }

    async function onNewChatClick() {
        try {
            // Destroy current session if it exists
            if (session.isActive && session.session) {
                if (typeof session.session?.destroy === 'function') {
                    await session.session.destroy()
                } else {
                    destroySession()
                }
            }

            const newConversation = await createNewConversation(prevConversations)
            setShowPageSuggestions(true);
            setPrevConversations(prev => {
                const prevUpdated = prev.map(conv => ({
                    ...conv,
                    isActive: false
                }))

                return [...prevUpdated, newConversation]
            })
            setContextItems([])
            setCurrentConversation([])

            // Initialize new session for the new conversation (empty history)
            await initializeSession([])
        } catch (error) {
            console.error('Failed to create new chat:', error)
        }
    }

    // Prompt API handlers
    const handleStartPromptDownload = useCallback(async () => {
        try {
            await initializeSession([])
        } catch (error) {
            console.error('Failed to start Prompt API download:', error)
        }
    }, [initializeSession])

    const handleRefreshPromptAvailability = useCallback(async () => {
        try {
            if (checkAvailability) {
                await checkAvailability()
            }
        } catch (error) {
            console.error('Failed to refresh Prompt API availability:', error)
        }
    }, [checkAvailability])

    // Summarizer API handlers
    const handleStartSummarizerDownload = useCallback(async () => {
        try {
            await summarizerApi.initializeSummarizer()
        } catch (error) {
            console.error('Failed to start Summarizer download:', error)
        }
    }, [summarizerApi])

    // Writer API handlers
    const handleStartWriterDownload = useCallback(async () => {
        try {
            await writerApi.initializeWriter()
        } catch (error) {
            console.error('Failed to start Writer download:', error)
        }
    }, [writerApi])

    // Summarizer availability refresh is not exposed in UI; omitted

    return (
        <main className='relative bg-background h-screen w-full flex flex-col max-w-full'>
            <Header
                onNewChatClick={onNewChatClick}
                switchToConversation={switchToConversation}
                deleteConversation={deleteConversation}
                prevConversations={prevConversations}
                promptAvailability={selectedModel === 'google-nano' ? availability : null}
                promptDownloadProgress={selectedModel === 'google-nano' ? (downloadProgress || 0) : 0}
                onStartPromptDownload={handleStartPromptDownload}
                onRefreshPromptAvailability={handleRefreshPromptAvailability}
                summarizerAvailability={availability.status === 'available' ? summarizerApi.availability : null}
                summarizerDownloadProgress={summarizerApi.downloadProgress}
                onStartSummarizerDownload={handleStartSummarizerDownload}
                writerAvailability={availability.status === 'available' ? writerApi.availability : null}
                writerDownloadProgress={writerApi.downloadProgress}
                onStartWriterDownload={handleStartWriterDownload}
            />

            <div
                className={cn(
                    "h-full max-h-full overflow-auto min-h-0 px-2 pt-20 pb-[500px] flex flex-col gap-2",
                    "bg-surface"
                )}
                style={{
                    paddingBottom: currentConversation.length > 0 ? inputSectionRef.current?.clientHeight : 0
                }}
                ref={messageContainerRef}
            >
                {showPageSuggestions && (
                    <PageSuggestions
                        suggestions={pageSuggestions}
                        isLoading={isGeneratingSuggestions}
                        onSuggestionClick={onSuggestionClick}
                        currentPageUrl={currentPageUrl}
                    />
                )}

                <Conversation
                    currentConversation={currentConversation}
                    contextItems={contextItems}
                    removeContextItem={removeContextItem}
                    isStreaming={isStreaming}
                    aiResponse={aiResponse}
                />
            </div>

            <div className="absolute bottom-0 left-0 right-0">
                {status && (
                    <StatusMessage
                        {...status}
                        setStatus={setStatus}
                    />
                )}

                <InputSection
                    ref={inputSectionRef}
                    selectedModel={selectedModel}
                    setSelectedModel={setSelectedModel}
                    setIsLoadingContextItems={setIsLoadingContextItems}
                    destroySession={destroySession}
                    session={session}
                    setHasInitialized={setHasInitialized}
                    contextItems={contextItems}
                    query={query}
                    setQuery={setQuery}
                    onSubmit={onSubmit}
                    removeContextItem={removeContextItem}
                    contextPerc={contextPerc}
                    availability={availability}
                    processingContextId={processingContextId}
                />
            </div>
        </main>
    )
}
