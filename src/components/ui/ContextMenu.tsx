import { useState } from "react"
import { cn } from "../../utils/tailwind"

export interface IOption {
    icon?: React.ReactNode
    label: string
    description?: string
    action: (...args: any) => void
    disabled?: boolean
}

interface Props {
    children: React.ReactNode
    options?: IOption[]
    position?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
    className?: string
}

export default function ContextMenu({
    children,
    options,
    className,
    position = 'topLeft'
}: Props) {
    const [open, setOpen] = useState(false)

    function onOptionClick(option: IOption) {
        if (option.disabled) return
        setOpen(false)
        option?.action()
    }

    const positions = {
        topLeft: 'bottom-full left-0 mb-1',
        topRight: 'bottom-full right-0 mb-1',
        bottomLeft: 'top-full left-0 mt-1',
        bottomRight: 'top-full right-0 mt-1',
    }

    return (
        <div onClick={() => setOpen(!open)} className="relative">
            {children}

            {/* Options */}
            {open && (
                <>
                    <div
                        onClick={e => e.stopPropagation()}
                        className={cn(
                            "absolute min-w-[200px] bg-surface border border-gray-400  shadow-xl rounded-[20px] p-2 z-30",
                            positions[position],
                            className || ''
                        )}
                    >
                        {/* Regular options */}
                        {options?.map((option, index) => (
                            <div
                                key={index}
                                onClick={() => onOptionClick(option)}
                                className={cn(
                                    "flex items-center gap-3 text-sm rounded-[12px] text-black/70 p-2",
                                    option.disabled 
                                        ? "opacity-50 cursor-not-allowed pointer-events-none" 
                                        : "hover:bg-black/5 hover:text-black cursor-pointer"
                                )}
                            >
                                {option.icon}

                                <div className="flex flex-col">
                                    <span>{option.label}</span>
                                    {option.description && (
                                        <span className="text-xs text-black/50">{option.description}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="fixed h-screen w-screen z-20 inset-0 bg-transparent" onClick={() => setOpen(false)} />
                </>
            )}
        </div>
    )
}