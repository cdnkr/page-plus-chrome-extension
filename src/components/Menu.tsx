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
    onStartWriterDownload
}: Props) {
    const [autoSummarizeEnabled, setAutoSummarizeEnabled] = useState(false)
    const [showSuggestionsAboutPage, setShowSuggestionsAboutPage] = useState(true)
    const { t } = useI18n()

    useEffect(() => {
        chrome?.storage?.local?.get(['autoSummarizeOverCharsEnabled'], (result) => {
            setAutoSummarizeEnabled(!!result.autoSummarizeOverCharsEnabled)
        })
        chrome?.storage?.local?.get(['showSuggestionsAboutPage'], (result) => {
            setShowSuggestionsAboutPage(!!result.showSuggestionsAboutPage)
        })
    }, [])

    async function toggleAutoSummarize() {
        const next = !autoSummarizeEnabled
        setAutoSummarizeEnabled(next)
        await chrome?.storage?.local?.set({ autoSummarizeOverCharsEnabled: next, autoSummarizeThreshold: {AUTO_SUMMARIZE_THRESHOLD} })
    }

    async function toggleShowSuggestionsAboutPage() {
        const next = !showSuggestionsAboutPage
        setShowSuggestionsAboutPage(next)
        await chrome?.storage?.local?.set({ showSuggestionsAboutPage: next })
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
                            <h3 className="text-base">{t('options.title')}</h3>
                        </div>
                        <div className="mt-3 rounded-[12px] flex items-start justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm">{t('options.summarizeByDefault.label')}</span>
                                <span className="text-xs text-gray-600 max-w-[90%]">{t('options.summarizeByDefault.description').replace('{threshold}', AUTO_SUMMARIZE_THRESHOLD.toString())}</span>
                            </div>
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={autoSummarizeEnabled}
                                    onChange={toggleAutoSummarize}
                                />
                                <div className="relative w-9 h-5 bg-black/20 rounded-full peer-focus:outline-none peer-checked:bg-black transition-colors">
                                    <div
                                        className={cn(
                                            "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200",
                                            autoSummarizeEnabled ? 'translate-x-[16px]' : 'translate-x-0'
                                        )}
                                    />
                                </div>
                            </label>
                        </div>
                        <div className="mt-3 rounded-[12px] flex items-start justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm">{t('options.pageRelatedSuggestions.label')}</span>
                                <span className="text-xs text-gray-600 max-w-[90%]">{t('options.pageRelatedSuggestions.description')}</span>
                            </div>
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={showSuggestionsAboutPage}
                                    onChange={toggleShowSuggestionsAboutPage}
                                />
                                <div className="relative w-9 h-5 bg-black/20 rounded-full peer-focus:outline-none peer-checked:bg-black transition-colors">
                                    <div
                                        className={cn(
                                            "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200",
                                            showSuggestionsAboutPage ? 'translate-x-[16px]' : 'translate-x-0'
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
            <Button className="" color='ghost' shape='rect' size='small'>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-text-align-end-icon lucide-text-align-end"><path d="M21 5H3" /><path d="M21 12H9" /><path d="M21 19H7" /></svg>
            </Button>
        </Popover>
    )
}
