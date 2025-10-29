import { useState } from "react"
import ContextItem from "../ContextItem"
import MarkdownRenderer from "./MarkdownRenderer"
import Button from "../ui/Button"
import { IConversationMessage, IContextItem } from "../../types/conversation"
import { cn } from "../../utils/tailwind"
import { sleep } from "../../utils/timing"
import HorizontalLoader from "../HorizontalLoader"
import { CONVERSATION_COMPONENT_PREFIX } from "../../constants"

function camelCaseToCapitalizeWithSpaces(str: string) {
    return str.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) {
        return str.toUpperCase();
    });
}

export default function Conversation({
    currentConversation,
    contextItems,
    removeContextItem,
    isStreaming,
    aiResponse
}: {
    currentConversation: IConversationMessage[],
    contextItems: IContextItem[],
    removeContextItem: (itemId: string) => void,
    isStreaming: boolean,
    aiResponse: string
}) {
    const [copied, setCopied] = useState(false)

    async function onShareMessageClick(message: IConversationMessage) {
        if (navigator.share) {
            try {
                await navigator.share({ text: message.content });
                console.log('Content shared successfully');
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            console.warn('Web Share API not supported in this browser');
        }
    }

    async function onCopyMessageClick(message: string) {
        navigator.clipboard.writeText(message)
        setCopied(true)
        await sleep(2000)
        setCopied(false)
    }

    function getActiveContextItems(contextIds: string[]) {
        return contextItems.filter(item => contextIds.includes(item.id))
    }

    return (
        <>
            {currentConversation.map(msg => (
                <>
                    {msg.source === 'user' && (
                        <>
                            <div className="w-full flex justify-end">
                                <div className="flex justify-end gap-1 ml-auto w-full max-w-[90%] flex-wrap">
                                    {getActiveContextItems(msg.contextIds).map(item => (
                                        <div key={item.id} className='ml-auto w-full max-w-[calc(50%-0.25rem)] rounded-[20px] bg-black/10'>
                                            <ContextItem
                                                item={item}
                                                onRemoveContextItem={removeContextItem}
                                                showRemoveButton={false}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className={cn(
                                'w-fit ml-auto max-w-[90%] bg-black/10 rounded-[16px] rounded-br-[4px] py-2 px-4',
                            )}>
                                <p className='text-sm'>
                                    {msg.content}
                                </p>
                            </div>
                        </>
                    )}
                    {msg.source === 'ai' && (
                        <div className='w-full p-2'>
                            <MarkdownRenderer
                                markdown={msg.content}
                            />
                            {!msg.content.includes(CONVERSATION_COMPONENT_PREFIX) && (
                                <div className='flex gap-0 items-center'>
                                    <Button
                                        shape="circle"
                                        color="ghost"
                                        size="small"
                                        onClick={() => onCopyMessageClick(msg.content)}
                                    >
                                        {copied ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-icon lucide-check"><path d="M20 6 9 17l-5-5" /></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy-icon lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                        )}
                                    </Button>
                                    <Button
                                        shape="circle"
                                        color="ghost"
                                        size="small"
                                        onClick={() => onShareMessageClick(msg)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-share-icon lucide-share"><path d="M12 2v13" /><path d="m16 6-4-4-4 4" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /></svg>
                                    </Button>

                                    {msg.toolUsed && (
                                        <div className="flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-hammer-icon lucide-hammer"><path d="m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9" /><path d="m18 15 4-4" /><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5" /></svg>
                                            <span className="text-xs text-gray-500">
                                                <em>{camelCaseToCapitalizeWithSpaces(msg.toolUsed)}</em>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </>
            ))}

            {/* Streaming AI Response */}
            {isStreaming && aiResponse && !aiResponse.includes(CONVERSATION_COMPONENT_PREFIX) && (
                <div className='w-full p-2'>
                    <MarkdownRenderer
                        markdown={aiResponse}
                    />
                </div>
            )}

            {isStreaming && !aiResponse && (
                <HorizontalLoader className="mt-4" />
            )}
        </>
    )
}
