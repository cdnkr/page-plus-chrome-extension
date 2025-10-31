import { useState } from "react"
import Button from "../components/ui/Button"
import Popover from "../components/ui/Popover"
import { IConversationStorageItem } from "../types/conversation"
import { cn } from "../utils/tailwind"
import { useI18n } from "../hooks/useI18n"

function formatRelativeTime(date: Date, t: (path: string, options?: { count?: number }) => string): string {
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    const diffInYears = Math.floor(diffInDays / 365)

    // Within an hour - show minutes ago
    if (diffInMinutes < 60) {
        if (diffInMinutes < 1) return t('history.justNow')
        return `${diffInMinutes} ${t('history.minute', { count: diffInMinutes })} ${t('history.ago')}`
    }

    // Within a day - show hours ago
    if (diffInHours < 24) {
        return `${diffInHours} ${t('history.hour', { count: diffInHours })} ${t('history.ago')}`
    }

    // Within a year - show date like "1 January"
    if (diffInYears < 1) {
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric'
        })
    }

    // Older than a year - show date like "1 January 2025"
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    })
}

interface Props {
    switchToConversation: (convId: string) => void
    deleteConversation: (convId: string) => void
    prevConversations: IConversationStorageItem[]
}

function History({
    switchToConversation,
    deleteConversation,
    prevConversations
}: Props) {
    const [open, setOpen] = useState(false)
    const { t } = useI18n()

    const sortedPrevConversations = [...prevConversations].sort((a, b) => {
        const aTime = new Date(a.lastModified).getTime()
        const bTime = new Date(b.lastModified).getTime()
        return bTime - aTime
    })

    function handleSwitchToConversation(convId: string) {
        switchToConversation(convId)
        setOpen(false)
    }

    return (
        <Popover
            open={open}
            setOpen={setOpen}
            position='bottomRight'
            className="p-0"
            content={(
                <div className={
                    cn(
                        'w-60 max-h-96 overflow-y-auto flex flex-col gap-0 rounded-[20px]',
                        // prevConversations.length > 4 ? 'after:content-[""] after:absolute after:inset-x-0 after:-bottom-[0px] after:h-[40px] after:bg-gradient-to-t after:rounded-b-[25px] after:from-background after:to-transparent' : '',
                        // prevConversations.length > 4 ? 'before:content-[""] before:z-1 before:absolute before:inset-x-0 before:-top-[0px] before:h-[40px] before:bg-gradient-to-b before:rounded-b-[25px] before:from-background before:to-transparent' : '',
                    )}
                >
                    {sortedPrevConversations.map((prevConv, index) => (
                        <div
                            key={prevConv.id}
                            className={
                                cn(
                                    'p-3 border-b border-gray-400 cursor-pointer hover:bg-black/5 relative',
                                    prevConv.isActive ? 'bg-black/10 hover:bg-black/10 cursor-default' : '',
                                    index === (sortedPrevConversations.length - 1) ? 'border-b-0' : ''
                                )
                            }
                            onClick={() => handleSwitchToConversation(prevConv.id)}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                    <p className="font-normal text-sm truncate max-w-[85%]">{prevConv.title}</p>

                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-black/60">
                                            {formatRelativeTime(new Date(prevConv.lastModified), t)}
                                        </p>
                                        <span className="text-xs text-black/60">•</span>
                                        <p className="text-xs text-black/60">
                                            {prevConv.conversations.length} {t('history.messages', { count: prevConv.conversations.length })}
                                        </p>
                                    </div>

                                </div>
                                {!prevConv.isActive && (
                                    <Button
                                        color='ghost'
                                        shape='rect'
                                        size='small'
                                        className='absolute top-2 right-2 p-1'
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            deleteConversation(prevConv.id)
                                        }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        >
            <Button className="text-black/60 hover:text-black" color='ghost' shape='rect' size='small'>
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-history-icon lucide-history"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>
            </Button>
        </Popover>
    )
}

export default History
