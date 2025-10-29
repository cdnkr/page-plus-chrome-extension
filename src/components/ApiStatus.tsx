import Button from "./ui/Button"
import { useI18n } from "../hooks/useI18n"

type ApiStatusProps = {
    availability: { status: string; isReady: boolean }
    downloadProgress: number
    onStartDownload: () => void
    onRefreshAvailability: () => void
}

export default function ApiStatus({
    availability,
    downloadProgress,
    onStartDownload
}: ApiStatusProps) {
    const { t } = useI18n()
    const status = availability?.status

    const isUnavailable = status === 'unavailable' || !('LanguageModel' in window)
    const isDownloadable = status === 'downloadable'
    const isDownloading = status === 'downloading'
    const isAvailable = status === 'available'

    const handleOpenFlags = () => {
        chrome.tabs.create({ url: 'chrome://flags/#prompt-api-for-gemini-nano' })
    }

    const renderIcon = () => {
        if (isUnavailable) {
            return (
                <div className="p-0 mb-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <path d="M12 9v4" />
                        <path d="M12 17h.01" />
                    </svg>
                </div>
            )
        }

        if (isDownloadable) {
            return (
                <div className="p-2 rounded-full hover:bg-black/5 cursor-pointer" onClick={onStartDownload}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7,10 12,15 17,10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                </div>
            )
        }

        if (isDownloading) {
            return (
                <div className="relative w-[40px] h-[40px] p-2 flex items-center justify-center">
                    <svg className="w-[40px] h-[40px] transform -rotate-90 shrink-0" viewBox="0 0 36 36">
                        <path
                            className="text-gray-300"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                            className="text-blue-500"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            fill="none"
                            strokeDasharray={`${downloadProgress}, 100`}
                            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-bold text-black text-[8px]">
                            {downloadProgress.toFixed(0)}%
                        </span>
                    </div>
                </div>
            )
        }

        if (isAvailable) {
            return (
                <div className="p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-icon lucide-check text-green-500"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
            )
        }

        return null
    }

    const renderAction = () => {
        if (isUnavailable) {
            return (
                <div className="space-y-2">
                    <Button
                        color="ghost"
                        size="small"
                        onClick={handleOpenFlags}
                        className="w-full text-xs bg-black/5 hover:bg-black/10 gap-2"
                    >
                        {t('apiStatus.googlePromptApi.unavailable.openFlagsButton')} <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link-icon lucide-external-link"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
                    </Button>
                </div>
            )
        }

        return null
    }

    return (
        <div className="p-3 space-y-4">
            <div className="flex flex-col gap-1">
                <h3 className="text-base">{t('apiStatus.title')}</h3>
                <p className="text-xs text-gray-600">
                    {t('apiStatus.description')}
                </p>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className=" text-sm text-gray-900">{t('apiStatus.googlePromptApi.title')}</h3>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                        {t('apiStatus.googlePromptApi.description')}
                    </p>
                    {isUnavailable && (
                        <>
                            <p className="text-xs text-medium mb-2">
                                {t('apiStatus.googlePromptApi.unavailable.message')}
                            </p>
                            {renderAction()}
                            <p className="text-xs text-medium mt-2">
                                {t('apiStatus.googlePromptApi.unavailable.instructions')}
                            </p>
                            <p className="text-xs font-semibold mt-2">
                                {t('apiStatus.googlePromptApi.unavailable.fallback')}
                            </p>
                        </>
                    )}
                </div>
                <div className="h-full mb-auto">
                    {renderIcon()}
                </div>
            </div>

        </div>
    )
}
