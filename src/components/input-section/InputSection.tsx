import { Dispatch, forwardRef, SetStateAction } from "react"
import ContextItem from "../ContextItem"
import Button from "../ui/Button"
import ContextMenu, { IOption } from "../ui/ContextMenu"
import VoiceInputButton from "./VoiceInputButton"
import { SUPPORTED_MODELS, TEXTAREA_PER_ROW } from "../../constants"
import { AiModel } from "../../types/aiProvider"
import { IContextItem } from "../../types/conversation"
import { cn } from "../../utils/tailwind"
import { useI18n } from "../../hooks/useI18n"

interface InputSectionProps {
    selectedModel: AiModel
    setSelectedModel: (model: AiModel) => void
    setIsLoadingContextItems: (isLoading: boolean) => void
    destroySession: () => void
    session: {
        session: any
        isActive: boolean
    }
    setHasInitialized: (hasInitialized: boolean) => void
    contextItems: IContextItem[]
    query: string
    setQuery: Dispatch<SetStateAction<string>>
    onSubmit: () => void
    removeContextItem: (itemId: string) => void
    contextPerc: number
    availability: {
        status: 'unavailable' | 'downloadable' | 'downloading' | 'available'
        isReady: boolean
    }
    processingContextId?: string | null
}

export const InputSection = forwardRef<HTMLDivElement, InputSectionProps>(({
    selectedModel,
    setSelectedModel,
    setIsLoadingContextItems,
    destroySession,
    session,
    setHasInitialized,
    contextItems,
    query,
    setQuery,
    onSubmit,
    removeContextItem,
    contextPerc,
    availability,
    processingContextId,
}, ref) => {
    const { t } = useI18n()

    function activateTextSelection() {
        chrome?.runtime?.sendMessage({ action: 'activateTextSelection' });
    }

    function activateAreaSelection() {
        chrome?.runtime?.sendMessage({ action: 'activateAreaSelection' });
    }

    function captureCurrentPage() {
        setIsLoadingContextItems(true)
        chrome?.runtime?.sendMessage({ action: 'captureCurrentPage' });
    }

    const addContextItems: IOption[] = [
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-italic-icon lucide-italic"><line x1="19" x2="10" y1="4" y2="4" /><line x1="14" x2="5" y1="20" y2="20" /><line x1="15" x2="9" y1="4" y2="20" /></svg>,
            label: 'Select text',
            action: () => activateTextSelection()
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-dashed-icon lucide-square-dashed"><path d="M5 3a2 2 0 0 0-2 2" /><path d="M19 3a2 2 0 0 1 2 2" /><path d="M21 19a2 2 0 0 1-2 2" /><path d="M5 21a2 2 0 0 1-2-2" /><path d="M9 3h1" /><path d="M9 21h1" /><path d="M14 3h1" /><path d="M14 21h1" /><path d="M3 9v1" /><path d="M21 9v1" /><path d="M3 14v1" /><path d="M21 14v1" /></svg>,
            label: 'Select area',
            action: () => activateAreaSelection()
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text-icon lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>,
            label: 'Current page',
            action: () => captureCurrentPage()
        }
    ]

    const modelSwitcherOptions: IOption[] = [
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-laptop-icon lucide-laptop"><path d="M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2z" /><path d="M20.054 15.987H3.946" /></svg>,
            label: 'Google Nano',
            description: 'On-device model',
            action: () => handleModelChange(SUPPORTED_MODELS.GOOGLE_NANO),
            disabled: availability.status !== 'available'
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-cloud-icon lucide-cloud"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" /></svg>,
            label: 'Gemini 2.5 Pro',
            description: 'Cloud-based model',
            action: () => handleModelChange(SUPPORTED_MODELS.GEMINI_2_5_PRO)
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-cloud-icon lucide-cloud"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" /></svg>,
            label: 'Gemini 2.5 Flash Lite',
            description: 'Cloud-based model',
            action: () => handleModelChange(SUPPORTED_MODELS.GEMINI_2_5_FLASH_LITE)
        }
    ]

    // Handle model switching
    async function handleModelChange(newModel: AiModel) {
        try {
            // Destroy current session if it exists
            if (session.isActive && session.session) {
                console.log('Destroying current session...')
                if (typeof session.session?.destroy === 'function') {
                    await session.session.destroy()
                } else {
                    destroySession()
                }
            }

            setSelectedModel(newModel)

            setHasInitialized(false)
        } catch (error) {
            console.error('Failed to switch model:', error)
        }
    }

    return (
        <div
            ref={ref}
            className={cn(
                'mt-auto w-full p-4 rounded-t-[25px] bg-white/60 backdrop-blur-lg',
                // "relative before:content-[''] before:absolute before:inset-x-0 before:-top-[40px] before:h-[40px] before:bg-gradient-to-t before:from-background before:to-transparent"
            )}>
            <div className='rounded-[25px] bg-black/10'>
                {contextItems.length > 0 && (
                    <div className={
                        cn(
                            "flex gap-0",
                        )
                    }>
                        <div className='grid grid-cols-2 p-2 gap-1.5 w-full'>
                            {contextItems.filter(item => item?.isActive).map(item => (
                                <ContextItem
                                    item={item}
                                    onRemoveContextItem={removeContextItem}
                                    isProcessing={processingContextId === item.id}
                                />
                            ))}
                        </div>
                    </div>
                )}
                <div className='px-5 py-3'>
                    <textarea
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => {
                            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                e.preventDefault()
                                onSubmit()
                            }
                        }}
                        className='w-full h-full text-sm resize-none outline-none'
                        placeholder={t('inputSection.placeholder')}
                        rows={Math.ceil(query.length / TEXTAREA_PER_ROW) < 2 ? 2 : Math.ceil(query.length / TEXTAREA_PER_ROW)}
                    />
                </div>
                <div className='flex p-2 justify-between items-end'>
                    <div className='flex items-center'>
                        <ContextMenu options={addContextItems}>
                            <Button color='ghost' shape='circle' size='small'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                            </Button>
                        </ContextMenu>

                        <div>
                            <VoiceInputButton setText={setQuery} />
                        </div>

                        <ContextMenu options={modelSwitcherOptions}>
                            <Button color='ghost' shape='rect' size='small'>
                                <span className="capitalize mr-0 text-xs">{selectedModel?.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}</span>
                            </Button>
                        </ContextMenu>
                    </div>
                    <div className="flex items-end gap-2">
                        <div className="relative w-[36px] h-[36px] ml-1 flex items-center justify-between">
                            <svg className="w-[36px] h-[36px] transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                    className="text-black/10"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    fill="none"
                                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                    className={cn(
                                        ((contextPerc > 90) && (contextPerc < 100))
                                            ? "text-orange-600"
                                            : contextPerc >= 100
                                                ? "text-red-500"
                                                : "text-black/50"
                                    )}
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    fill="none"
                                    strokeDasharray={`${contextPerc}, 100`}
                                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className={cn(
                                    "font-bold text-black text-[9px]"
                                )}>
                                    {(contextPerc)?.toFixed()}%
                                </span>
                            </div>
                        </div>
                        <Button
                            color='primary'
                            shape='circle'
                            size='regular'
                            onClick={onSubmit}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-corner-down-left-icon lucide-corner-down-left"><path d="M20 4v7a4 4 0 0 1-4 4H4" /><path d="m9 10-5 5 5 5" /></svg>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
})
