import Button from "../components/ui/Button";
import { AUTO_SUMMARIZE_THRESHOLD } from "../constants";
import { useI18n } from "../hooks/useI18n";
import { cn } from "../utils/tailwind";
import ApiStatus from "./ApiStatus";
import { LanguageSelector } from "./LanguageSelector";
import Popover from "./ui/Popover";
import { useEffect, useState } from "react";

interface Props {
    promptAvailability?: { status: string; isReady: boolean } | null
    promptDownloadProgress: number
    onStartPromptDownload: () => void
    onRefreshPromptAvailability: () => void
    summarizerAvailability?: { status: string; isReady: boolean } | null
    summarizerDownloadProgress?: number
    onStartSummarizerDownload?: () => void
    writerAvailability?: { status: string; isReady: boolean } | null
    writerDownloadProgress?: number
    onStartWriterDownload?: () => void
    privacyFirstModeEnabled: boolean
    setPrivacyFirstModeEnabled: (val: boolean) => void
    darkMode: boolean
    setDarkMode: (val: boolean) => void
}

export default function Menu({
    promptAvailability,
    promptDownloadProgress,
    onStartPromptDownload,
    onRefreshPromptAvailability,
    summarizerAvailability,
    summarizerDownloadProgress,
    onStartSummarizerDownload,
    writerAvailability,
    writerDownloadProgress,
    onStartWriterDownload,
    privacyFirstModeEnabled,
    setPrivacyFirstModeEnabled,
    darkMode,
    setDarkMode
}: Props) {
    const [autoSummarizeEnabled, setAutoSummarizeEnabled] = useState(false)
    const [showSuggestionsAboutPage, setShowSuggestionsAboutPage] = useState(true)
    const [isPageRelatedSuggestionsAccessible, setIsPageRelatedSuggestionsAccessible] = useState(true)
    const [isPrivacyFirstAccessible, setIsPrivacyFirstAccessible] = useState(false)

    const { t } = useI18n()

    useEffect(() => {
        if (
            promptAvailability?.status === "available"
            && summarizerAvailability?.status === "available"
        ) {
            setIsPrivacyFirstAccessible(true)
        } else {
            setIsPrivacyFirstAccessible(false)
        }
    }, [promptAvailability, summarizerAvailability])

    useEffect(() => {
        chrome?.storage?.local?.get(['autoSummarizeOverCharsEnabled'], (result) => {
            setAutoSummarizeEnabled(!!result.autoSummarizeOverCharsEnabled)
        })
        chrome?.storage?.local?.get(['showSuggestionsAboutPage'], (result) => {
            setShowSuggestionsAboutPage(!!result.showSuggestionsAboutPage)
        })
        chrome?.storage?.local?.get(['privacyFirstModeEnabled'], (result) => {
            setPrivacyFirstModeEnabled(!!result.privacyFirstModeEnabled)
        })
    }, [])

    async function toggleAutoSummarize() {
        const next = !autoSummarizeEnabled
        setAutoSummarizeEnabled(next)
        await chrome?.storage?.local?.set({ autoSummarizeOverCharsEnabled: next, autoSummarizeThreshold: { AUTO_SUMMARIZE_THRESHOLD } })
    }

    async function toggleShowSuggestionsAboutPage(next?: boolean) {
        next = typeof next === 'boolean' ? next : !showSuggestionsAboutPage
        setShowSuggestionsAboutPage(next)
        await chrome?.storage?.local?.set({ showSuggestionsAboutPage: next })
    }

    async function togglePrivacyFirstMode() {
        const next = !privacyFirstModeEnabled
        setPrivacyFirstModeEnabled(next)
        await chrome?.storage?.local?.set({ privacyFirstModeEnabled: next })

        if (next) {
            toggleShowSuggestionsAboutPage(false)
            setIsPageRelatedSuggestionsAccessible(false)
        } else {
            setIsPageRelatedSuggestionsAccessible(true)
        }
    }

    return (
        <Popover
            className="min-w-[320px]"
            position='bottomRight'
            content={
                <>
                    {/* Language Selector */}
                    <LanguageSelector />
                    <div className="p-3 space-y-4">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-base text-black dark:text-white">{t('options.title')}</h3>
                        </div>
                        <div className="mt-3 rounded-[12px] flex items-start justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm text-black dark:text-white">{t('options.summarizeByDefault.label')}</span>
                                <span className="text-xs text-gray-600 dark:text-gray-400 max-w-[90%]">{t('options.summarizeByDefault.description').replace('{threshold}', AUTO_SUMMARIZE_THRESHOLD.toString())}</span>
                            </div>
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={autoSummarizeEnabled}
                                    onChange={toggleAutoSummarize}
                                />
                                <div className="relative w-9 h-5 bg-black/20 dark:bg-white/20 rounded-full peer-focus:outline-none peer-checked:bg-black transition-colors">
                                    <div
                                        className={cn(
                                            "absolute top-0.5 left-0.5 w-4 h-4 bg-white dark:bg-white rounded-full shadow transition-transform duration-200",
                                            autoSummarizeEnabled ? 'translate-x-[16px]' : 'translate-x-0'
                                        )}
                                    />
                                </div>
                            </label>
                        </div>
                        <div
                            className={cn(
                                "mt-3 rounded-[12px] flex items-start justify-between",
                                !isPageRelatedSuggestionsAccessible ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                            )}
                        >
                            <div className="flex flex-col gap-1">
                                <span className="text-sm text-black dark:text-white">{t('options.pageRelatedSuggestions.label')}</span>
                                <span className="text-xs text-gray-600 dark:text-gray-400 max-w-[90%]">{t('options.pageRelatedSuggestions.description')}</span>
                            </div>
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={showSuggestionsAboutPage}
                                    onChange={() => toggleShowSuggestionsAboutPage()}
                                />
                                <div className="relative w-9 h-5 bg-black/20 dark:bg-white/20 rounded-full peer-focus:outline-none peer-checked:bg-black transition-colors">
                                    <div
                                        className={cn(
                                            "absolute top-0.5 left-0.5 w-4 h-4 bg-white dark:bg-white rounded-full shadow transition-transform duration-200",
                                            showSuggestionsAboutPage ? 'translate-x-[16px]' : 'translate-x-0'
                                        )}
                                    />
                                </div>
                            </label>
                        </div>
                        <div
                            className={cn(
                                "mt-3 rounded-[12px] flex items-start justify-between",
                                !isPrivacyFirstAccessible ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                            )}
                        >
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-black dark:text-white">{t('options.privacyFirst.label')}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-half-icon lucide-shield-half text-black dark:text-white"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 22V2"/></svg>
                                </div>
                                <span className="text-xs text-gray-600 dark:text-gray-400 max-w-[90%]">{t('options.privacyFirst.description')}</span>
                                {!isPrivacyFirstAccessible && (
                                    <span className="text-xs text-black dark:text-white max-w-[90%]">{t('options.privacyFirst.info')}</span>
                                )}
                            </div>
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={privacyFirstModeEnabled}
                                    onChange={togglePrivacyFirstMode}
                                />
                                <div className="relative w-9 h-5 bg-black/20 dark:bg-white/20 rounded-full peer-focus:outline-none peer-checked:bg-black transition-colors">
                                    <div
                                        className={cn(
                                            "absolute top-0.5 left-0.5 w-4 h-4 bg-white dark:bg-white rounded-full shadow transition-transform duration-200",
                                            privacyFirstModeEnabled ? 'translate-x-[16px]' : 'translate-x-0'
                                        )}
                                    />
                                </div>
                            </label>
                        </div>
                        <div className="mt-3 rounded-[12px] flex items-start justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm text-black dark:text-white">{t('options.darkMode.label')}</span>
                            </div>
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={darkMode}
                                    onChange={() => setDarkMode(!darkMode)}
                                />
                                <div className="relative w-9 h-5 bg-black/20 dark:bg-white/20 rounded-full peer-focus:outline-none peer-checked:bg-black transition-colors">
                                    <div
                                        className={cn(
                                            "absolute top-0.5 left-0.5 w-4 h-4 bg-white dark:bg-white rounded-full shadow transition-transform duration-200",
                                            darkMode ? 'translate-x-[16px]' : 'translate-x-0'
                                        )}
                                    />
                                </div>
                            </label>
                        </div>
                    </div>
                    <ApiStatus
                        availability={promptAvailability || { status: 'unavailable', isReady: false }}
                        downloadProgress={promptDownloadProgress}
                        onStartDownload={onStartPromptDownload}
                        onRefreshAvailability={onRefreshPromptAvailability}
                        summarizerAvailability={summarizerAvailability}
                        summarizerDownloadProgress={summarizerDownloadProgress || 0}
                        onStartSummarizerDownload={onStartSummarizerDownload}
                        writerAvailability={writerAvailability}
                        writerDownloadProgress={writerDownloadProgress || 0}
                        onStartWriterDownload={onStartWriterDownload}
                    />
                </>
            }
        >
            <Button className=" text-black dark:text-white/80" color='ghost' shape='rect' size='small'>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-text-align-end-icon lucide-text-align-end"><path d="M21 5H3" /><path d="M21 12H9" /><path d="M21 19H7" /></svg>
            </Button>
        </Popover>
    )
}
