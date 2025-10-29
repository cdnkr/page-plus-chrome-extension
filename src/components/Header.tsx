import Button from "../components/ui/Button"
import { IConversationStorageItem } from "../types/conversation"
import { cn } from "../utils/tailwind"
import History from "./History"
import Menu from "./Menu"

interface Props {
  onNewChatClick: () => void
  switchToConversation: (convId: string) => void
  deleteConversation: (convId: string) => void
  prevConversations: IConversationStorageItem[]
  promptAvailability?: { status: string; isReady: boolean } | null
  promptDownloadProgress: number
  onStartPromptDownload: () => void
  onRefreshPromptAvailability: () => void
  summarizerAvailability?: { status: string; isReady: boolean } | null
  summarizerDownloadProgress?: number
  onStartSummarizerDownload?: () => void
}

function Header({
  onNewChatClick,
  switchToConversation,
  deleteConversation,
  prevConversations,
  promptAvailability,
  promptDownloadProgress,
  onStartPromptDownload,
  onRefreshPromptAvailability,
  summarizerAvailability,
  summarizerDownloadProgress,
  onStartSummarizerDownload
}: Props) {

  return (
    <div className={cn(
      "w-full flex justify-between items-center p-3 pl-5 absolute top-0 left-0 right-0",
      'bg-white/60 backdrop-blur-lg rounded-b-[25px]',
      'z-20'
    )}>
      <div>
        <span className="font-light text-xl">Page+</span>
      </div>

      <div className='flex items-center'>
        <History
          switchToConversation={switchToConversation}
          deleteConversation={deleteConversation}
          prevConversations={prevConversations}
        />

        {/* New chat */}
        <Button className="text-black/60 hover:text-black" color='ghost' shape='rect' size='small' onClick={onNewChatClick}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle-plus-icon lucide-message-circle-plus"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" /><path d="M8 12h8" /><path d="M12 8v8" /></svg>
        </Button>

        <Menu
          promptAvailability={promptAvailability}
          promptDownloadProgress={promptDownloadProgress}
          onStartPromptDownload={onStartPromptDownload}
          onRefreshPromptAvailability={onRefreshPromptAvailability}
          summarizerAvailability={summarizerAvailability}
          summarizerDownloadProgress={summarizerDownloadProgress}
          onStartSummarizerDownload={onStartSummarizerDownload}
        />
      </div>
    </div>
  )
}

export default Header
