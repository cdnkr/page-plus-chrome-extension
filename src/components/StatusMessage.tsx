import { IStatusMessage } from "../types/status";
import { cn } from "../utils/tailwind";
import Button from "./ui/Button";
import { useState } from "react";

export default function StatusMessage({
    title,
    description,
    type,
    action,
    setStatus
}: IStatusMessage & { setStatus: (val: IStatusMessage | null) => void }) {
    const [isActionLoading, setIsActionLoading] = useState(false)

    async function handleActionClick() {
        if (!action || isActionLoading) return
        try {
            setIsActionLoading(true)
            await Promise.resolve(action.onClick())
        } finally {
            setIsActionLoading(false)
        }
    }

    return (
        <div className='absolute bottom-full w-full p-2 mb-2'>
            <div className={cn(
                "relative p-4 bg-white/60 border-l-4 backdrop-blur-lg rounded-none shadow-lg",
                type === 'error'
                    ? 'border-red-500'
                    : type === 'info'
                        ? 'border-blue-500'
                        : type === 'warning'
                            ? 'border-amber-500'
                            : 'border-green-500'
            )}>
                <h3 className="text-base font-medium">{title}</h3>
                <p className="text-sm text-black/50">{description}</p>
                {action && (
                    <div className="mt-3">
                        <Button
                            color="ghost"
                            onClick={handleActionClick}
                            loading={isActionLoading}
                            className={cn(
                                'text-black',
                                'rounded-[12px]',
                            )}
                        >
                            {isActionLoading ? '' : action.label}
                        </Button>
                    </div>
                )}

                <Button
                    size='small'
                    color="ghost"
                    className='absolute top-2 right-2 cursor-pointer'
                    onClick={() => setStatus(null)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </Button>
            </div>
        </div>
    )
}