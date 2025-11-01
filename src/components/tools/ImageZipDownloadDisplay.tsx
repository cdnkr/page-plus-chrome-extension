import { useEffect, useMemo, useState } from "react";
import Button from "../ui/Button";
import { useI18n } from "../../hooks/useI18n";

export default function ImageZipDownloadDisplay({
    content
}: {
    content: string
}) {
    const { t } = useI18n();

    const lines = content.split('__PAGEPLUS__TOOL__IMAGEZIPDOWNLOAD__')?.[1]?.split('\n');

    const zipUrl = lines?.[1]?.trim();
    const expires = lines?.[2]?.trim().replace('Expires:', '');
    const imageCount = lines?.[3]?.trim().replace('imageCount:', '');
    const fileSizeKB = lines?.[4]?.trim().replace('fileSizeKB:', '');

    const expiresAt = useMemo(() => {
        const parsed = expires ? new Date(expires).getTime() : NaN;
        return Number.isFinite(parsed) ? parsed : NaN;
    }, [expires]);

    const [nowTs, setNowTs] = useState<number>(Date.now());

    const remainingMs = useMemo(() => {
        if (!Number.isFinite(expiresAt)) return 0;
        return Math.max(0, expiresAt - nowTs);
    }, [expiresAt, nowTs]);

    const isExpired = remainingMs <= 0;

    useEffect(() => {
        if (!Number.isFinite(expiresAt)) return;
        if (isExpired) return;
        const id = setInterval(() => setNowTs(Date.now()), 10_000);
        return () => clearInterval(id);
    }, [expiresAt, isExpired]);

    const expiresInLabel = useMemo(() => {
        if (!Number.isFinite(expiresAt)) return "";
        const seconds = Math.ceil(remainingMs / 1000);
        if (seconds < 60) return `${t('tools.imageZipDownload.expiresIn')} ${seconds} ${t('tools.imageZipDownload.second', { count: seconds })}`;
        const minutes = Math.ceil(seconds / 60);
        if (minutes < 60) return `${t('tools.imageZipDownload.expiresIn')} ${minutes} ${t('tools.imageZipDownload.minute', { count: minutes })}`;
        const hours = Math.ceil(minutes / 60);
        if (hours < 24) return `${t('tools.imageZipDownload.expiresIn')} ${hours} ${t('tools.imageZipDownload.hour', { count: hours })}`;
        const days = Math.ceil(hours / 24);
        return `${t('tools.imageZipDownload.expiresIn')} ${days} ${t('tools.imageZipDownload.day', { count: days })}`;
    }, [expiresAt, remainingMs, t]);

    return (
        <div className="w-fit rounded-[20px] p-3 bg-black/5 dark:bg-white/5 flex items-center justify-center gap-3">
            <div className="w-full">
                <p className="text-sm text-black/70 dark:text-white/70">
                    {t("tools.imageZipDownload.pageImages")}.zip
                </p>
                <div className="flex items-center gap-1 mt-1">
                    <p className="text-[12px] text-black/60 dark:text-white/60">
                        {imageCount} {t("tools.imageZipDownload.images")}
                    </p>
                    <span className="text-[12px] text-black/60 dark:text-white/60">•</span>
                    <p className="text-[12px] text-black/60 dark:text-white/60">
                        {fileSizeKB} KB
                    </p>
                    <span className="text-[12px] text-black/60 dark:text-white/60">•</span>
                    {isExpired ? (
                        <span className="text-[12px] text-black/60 dark:text-white/60">{t("tools.imageZipDownload.expired")}</span>
                    ) : (
                        <span className="text-[12px] text-black/60 dark:text-white/60">{expiresInLabel}</span>
                    )}
                </div>
            </div>

            {!isExpired ? (
                <a href={zipUrl} download={t("tools.imageZipDownload.pageImages") + ".zip"}>
                    <Button
                        color="black"
                        shape="rect"
                        size="regular"
                        className="gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-down-to-line-icon lucide-arrow-down-to-line"><path d="M12 17V3" /><path d="m6 11 6 6 6-6" /><path d="M19 21H5" /></svg>
                    </Button>
                </a>
            ) : null}
        </div>
    )
}