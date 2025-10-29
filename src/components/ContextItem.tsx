import { CONTEXT_CHAR_DISPLAY_LIMIT } from "../constants";
import { IContextItem } from "../types/conversation";
import { cn } from "../utils/tailwind";
// import { formatUrlForDisplay } from "../../utils/url";

const ICONS = {
    text: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-italic-icon lucide-italic"><line x1="19" x2="10" y1="4" y2="4" /><line x1="14" x2="5" y1="20" y2="20" /><line x1="15" x2="9" y1="4" y2="20" /></svg>,
    image: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-dashed-icon lucide-square-dashed"><path d="M5 3a2 2 0 0 0-2 2" /><path d="M19 3a2 2 0 0 1 2 2" /><path d="M21 19a2 2 0 0 1-2 2" /><path d="M5 21a2 2 0 0 1-2-2" /><path d="M9 3h1" /><path d="M9 21h1" /><path d="M14 3h1" /><path d="M14 21h1" /><path d="M3 9v1" /><path d="M21 9v1" /><path d="M3 14v1" /><path d="M21 14v1" /></svg>,
    page: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text-icon lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>,
}

interface ContextItemProps {
    item: IContextItem,
    onRemoveContextItem: (itemId: string) => void
    showRemoveButton?: boolean
}

export default function ContextItem({ item, onRemoveContextItem, showRemoveButton = true }: ContextItemProps) {
    return (
        <div className={cn(
            'group',
            'w-full relative rounded-[20px] bg-black/5 text-black p-2',
            'h-[100px]',
            ((item.type === 'image') || (item.type === 'page')) ? 'p-0' : '',
            // "relative after:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:h-[100%] after:bg-gradient-to-t after:from-black/20 after:to-transparent after:z-0 after:rounded-b-[20px]"
        )}>
            {showRemoveButton && (
                <div className="absolute top-2 right-2 z-10">
                    <button onClick={() => onRemoveContextItem(item.id)} className='size-4 rounded-full cursor-pointer bg-content/50 text-surface flex items-center justify-center'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                </div>
            )}
            {item.type === 'text' && (
                <p className='text-xs text-black text-left italic'>{item.content.length > CONTEXT_CHAR_DISPLAY_LIMIT ? `${item.content.slice(0, CONTEXT_CHAR_DISPLAY_LIMIT)}...` : item.content}</p>
            )}
            {item.type === 'page' && item.screenshot && (
                <img className='w-full h-full object-cover rounded-[20px]' src={item.screenshot} />
            )}
            {item.type === 'image' && (
                <img className='w-full h-full object-cover rounded-[20px]' src={item.content} />
            )}

            <div className="absolute bottom-1 right-1 size-8 flex items-center justify-center bg-white/80 text-black aspect-square rounded-full">
                {ICONS[item.type]}
            </div>

            {/* {item.url && item.type !== 'page' && (
                <div className='absolute bottom-0 left-0 right-0 p-3 z-10'>
                    <p className='text-white text-xs text-center font-medium truncate'>{formatUrlForDisplay(item.url)}</p>
                </div>
            )} */}
        </div>
    )
}