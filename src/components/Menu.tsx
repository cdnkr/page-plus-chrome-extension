import Button from "../components/ui/Button";
import ApiStatus from "./ApiStatus";
import { LanguageSelector } from "./LanguageSelector";
import Popover from "./ui/Popover";

interface Props {
    promptAvailability?: { status: string; isReady: boolean } | null
    promptDownloadProgress: number
    onStartPromptDownload: () => void
    onRefreshPromptAvailability: () => void
    summarizerAvailability?: { status: string; isReady: boolean } | null
    summarizerDownloadProgress?: number
    onStartSummarizerDownload?: () => void
}

export default function Menu({
    promptAvailability,
    promptDownloadProgress,
    onStartPromptDownload,
    onRefreshPromptAvailability,
    summarizerAvailability,
    summarizerDownloadProgress,
    onStartSummarizerDownload
}: Props) {
    return (
        <Popover
            className="min-w-[320px]"
            position='bottomRight'
            content={
                <>
                    {/* Language Selector */}
                    <LanguageSelector />
                    <ApiStatus
                        availability={promptAvailability || { status: 'unavailable', isReady: false }}
                        downloadProgress={promptDownloadProgress}
                        onStartDownload={onStartPromptDownload}
                        onRefreshAvailability={onRefreshPromptAvailability}
                        summarizerAvailability={summarizerAvailability}
                        summarizerDownloadProgress={summarizerDownloadProgress || 0}
                        onStartSummarizerDownload={onStartSummarizerDownload}
                    />
                </>
            }
        >
            <Button className="" color='ghost' shape='rect' size='small'>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-text-align-end-icon lucide-text-align-end"><path d="M21 5H3" /><path d="M21 12H9" /><path d="M21 19H7" /></svg>
            </Button>
        </Popover>
    )
}
