import { useEffect, useState } from "react"
import { cn } from "../../utils/tailwind"

interface Props {
    children: React.ReactNode
    className?: string
    content: React.ReactNode
    position?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
    open?: boolean
    setOpen?: (open: boolean) => void
}

export default function Popover({
    children,
    className,
    content,
    position = 'topLeft',
    open,
    setOpen
}: Props) {
    const [openState, setOpenState] = useState(false)

    const positions = {
        topLeft: 'bottom-full left-0 mb-1',
        topRight: 'bottom-full right-0 mb-1',
        bottomLeft: 'top-full left-0 mt-1',
        bottomRight: 'top-full right-0 mt-1',
    }

    useEffect(() => {
        if (typeof open === 'boolean' && open !== openState) setOpenState(open)
    }, [open])

    useEffect(() => {
        if (open !== openState && typeof setOpen === 'function') setOpen(openState)
    }, [openState])

    return (
        <div onClick={() => setOpenState(!openState)} className="relative">
            <div className="relative z-30">
                {children}
            </div>
            {/* Options */}
            {openState && (
                <>
                    <div
                        onClick={e => e.stopPropagation()}
                        className={cn(
                            "absolute  min-w-[200px] bg-surface border border-gray-400 max-h-[85vh] overflow-y-auto rounded-[20px] shadow-xl p-2 z-30",
                            positions[position],
                            className || '',
                            'backdrop-blur-xl'
                        )}
                    >
                        {content}
                    </div>
                    <div className="fixed h-screen w-screen z-20 inset-0 bg-transparent" onClick={() => setOpenState(false)} />
                </>
            )}
        </div>
    )
}