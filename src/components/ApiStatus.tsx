import { useState, useEffect } from "react"
import Button from "./ui/Button"
import { useI18n } from "../hooks/useI18n"

type ApiStatusProps = {
    availability: { status: string; isReady: boolean }
    downloadProgress: number
    onStartDownload: () => void
    onRefreshAvailability: () => void
    summarizerAvailability?: { status: string; isReady: boolean } | null
    summarizerDownloadProgress?: number
    onStartSummarizerDownload?: () => void
    writerAvailability?: { status: string; isReady: boolean } | null
    writerDownloadProgress?: number
    onStartWriterDownload?: () => void
}

export default function ApiStatus({
    availability,
    downloadProgress,
    onStartDownload,
    summarizerAvailability,
    summarizerDownloadProgress = 0,
    onStartSummarizerDownload,
    writerAvailability,
    writerDownloadProgress = 0,
    onStartWriterDownload
}: ApiStatusProps) {
    const { t } = useI18n()
    const [verifiedStatus, setVerifiedStatus] = useState<{
        status: 'unavailable' | 'downloadable' | 'downloading' | 'available' | null;
        isReady: boolean;
    }>({ status: null, isReady: false })

    // Secondary verification check - directly queries LanguageModel.availability()
    useEffect(() => {
        const checkAvailability = async () => {
            try {
                if (!('LanguageModel' in window)) {
                    setVerifiedStatus({ status: 'unavailable', isReady: false });
                    return;
                }

                const available = await (window as any).LanguageModel.availability();
                const isReady = available === 'available';
                
                setVerifiedStatus({ status: available, isReady });
            } catch (err) {
                console.error('Error checking Prompt API availability in ApiStatus:', err);
                setVerifiedStatus({ status: 'unavailable', isReady: false });
            }
        };

        checkAvailability();
    }, [availability?.status]);

    // Use verified status when it indicates 'available' but prop says 'unavailable' (fixes false negatives)
    // Otherwise prefer prop status for dynamic states like 'downloading' or 'downloadable'
    // Fall back to verified status if prop is not available
    const effectiveStatus = verifiedStatus.status === 'available' && 
                             availability?.status === 'unavailable'
        ? verifiedStatus.status
        : (availability?.status || verifiedStatus.status || 'unavailable');

    const status = effectiveStatus

    // Remove redundant window check - we already verified via the useEffect
    const isUnavailable = status === 'unavailable'
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

    // Summarizer helpers
    const sStatus = summarizerAvailability?.status
    const sUnavailable = sStatus === 'unavailable' || !('Summarizer' in window)
    const sDownloadable = sStatus === 'downloadable'
    const sDownloading = sStatus === 'downloading'
    const sAvailable = sStatus === 'available'

    const renderSummarizerIcon = () => {
        if (sUnavailable) {
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

        if (sDownloadable) {
            return (
                <div className="p-2 rounded-full hover:bg-black/5 cursor-pointer" onClick={onStartSummarizerDownload}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7,10 12,15 17,10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                </div>
            )
        }

        if (sDownloading) {
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
                            strokeDasharray={`${summarizerDownloadProgress}, 100`}
                            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-bold text-black text-[8px]">
                            {summarizerDownloadProgress?.toFixed(0)}%
                        </span>
                    </div>
                </div>
            )
        }

        if (sAvailable) {
            return (
                <div className="p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-icon lucide-check text-green-500"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
            )
        }

        return null
    }

    // Writer helpers
    const wStatus = writerAvailability?.status
    const wUnavailable = wStatus === 'unavailable' || !('Writer' in window)
    const wDownloadable = wStatus === 'downloadable'
    const wDownloading = wStatus === 'downloading'
    const wAvailable = wStatus === 'available'

    const renderWriterIcon = () => {
        if (wUnavailable) {
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

        if (wDownloadable) {
            return (
                <div className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer" onClick={onStartWriterDownload}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7,10 12,15 17,10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                </div>
            )
        }

        if (wDownloading) {
            return (
                <div className="relative w-[40px] h-[40px] p-2 flex items-center justify-center">
                    <svg className="w-[40px] h-[40px] transform -rotate-90 shrink-0" viewBox="0 0 36 36">
                        <path
                            className="text-gray-300 dark:text-gray-700"
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
                            strokeDasharray={`${writerDownloadProgress}, 100`}
                            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-bold text-black dark:text-white text-[8px]">
                            {writerDownloadProgress?.toFixed(0)}%
                        </span>
                    </div>
                </div>
            )
        }

        if (wAvailable) {
            return (
                <div className="p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-icon lucide-check text-green-500"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
            )
        }

        return null
    }

    return (
        <div className="p-3 space-y-4">
            <div className="flex flex-col gap-1">
                <h3 className="text-base text-black dark:text-white">{t('apiStatus.title')}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t('apiStatus.description')}
                </p>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className=" text-sm text-gray-900 dark:text-gray-200">{t('apiStatus.googlePromptApi.title')}</h3>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {t('apiStatus.googlePromptApi.description')}
                    </p>
                    {isUnavailable && (
                        <>
                            <p className="text-xs text-medium dark:text-gray-400 mb-2">
                                {t('apiStatus.googlePromptApi.unavailable.message')}
                            </p>
                            {renderAction()}
                            <p className="text-xs text-medium dark:text-gray-400 mt-2">
                                {t('apiStatus.googlePromptApi.unavailable.instructions')}
                            </p>
                            <p className="text-xs font-semibold dark:text-gray-400 mt-2">
                                {t('apiStatus.googlePromptApi.unavailable.fallback')}
                            </p>
                        </>
                    )}
                </div>
                <div className="h-full mb-auto">
                    {renderIcon()}
                </div>
            </div>
            {/* Summarizer (Gemini Nano) Section */}
            {summarizerAvailability && (
                <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className=" text-sm text-gray-900 dark:text-gray-200">{t('apiStatus.summarizerApi.title')}</h3>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {t('apiStatus.summarizerApi.description')}
                        </p>
                        {sUnavailable && (
                            <>
                                <p className="text-xs text-medium dark:text-gray-400 mb-2">
                                    {t('apiStatus.summarizerApi.unavailable.message')}
                                </p>
                                <div className="space-y-2">
                                    <Button
                                        color="ghost"
                                        size="small"
                                        onClick={handleOpenFlags}
                                        className="w-full text-xs bg-black/5 hover:bg-black/10 dark:bg-white/5 hover:dark:bg-white/10 gap-2"
                                    >
                                        {t('apiStatus.summarizerApi.unavailable.openFlagsButton')} <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link-icon lucide-external-link"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
                                    </Button>
                                </div>
                                <p className="text-xs text-medium dark:text-gray-400 mt-2">
                                    {t('apiStatus.summarizerApi.unavailable.separateAvailability')}
                                </p>
                            </>
                        )}
                    </div>
                    <div className="h-full mb-auto">
                        {renderSummarizerIcon()}
                    </div>
                </div>
            )}
            {/* Writer (Gemini Nano) Section */}
            {writerAvailability && (
                <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className=" text-sm text-gray-900 dark:text-gray-200">{t('apiStatus.writerApi.title')}</h3>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {t('apiStatus.writerApi.description')}
                        </p>
                        {wUnavailable && (
                            <>
                                <p className="text-xs text-medium dark:text-gray-400 mb-2">
                                    {t('apiStatus.writerApi.unavailable.message')}
                                </p>
                                <div className="space-y-2">
                                    <Button
                                        color="ghost"
                                        size="small"
                                        onClick={handleOpenFlags}
                                        className="w-full text-xs bg-black/5 hover:bg-black/10 dark:bg-white/5 hover:dark:bg-white/10 gap-2"
                                    >
                                        {t('apiStatus.writerApi.unavailable.openFlagsButton')} <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link-icon lucide-external-link"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
                                    </Button>
                                </div>
                                <p className="text-xs text-medium mt-2">
                                    {t('apiStatus.writerApi.unavailable.separateAvailability')}
                                </p>
                            </>
                        )}
                    </div>
                    <div className="h-full mb-auto">
                        {renderWriterIcon()}
                    </div>
                </div>
            )}
        </div>
    )
}
