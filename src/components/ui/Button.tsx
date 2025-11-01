import { cn } from "../../utils/tailwind"

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode,
    color?: 'primary' | 'black' | 'ghost',
    size?: 'regular' | 'small',
    shape?: 'rect' | 'circle',
    className?: string,
    loading?: boolean
}

export default function Button({
    children,
    color = 'primary',
    size = 'regular',
    shape = 'rect',
    className,
    loading = false,
    ...rest
}: Props) {
    const colors = {
        primary: 'cursor-pointer bg-primary text-black',
        black: 'cursor-pointer bg-black text-white dark:text-white',
        ghost: 'cursor-pointer bg-transparent text-black hover:bg-black/10 dark:text-white dark:hover:bg-white/10'
    }

    const sizes = {
        small: 'p-2',
        regular: 'p-3'
    }

    const shapes = {
        rect: 'rounded-[16px]',
        circle: 'aspect-square rounded-full'
    }

    return (
        <button
            className={cn(
                "shrink-0 flex justify-center items-center p-2",
                colors[color],
                sizes[size],
                shapes[shape],
                className || '',
                loading ? 'pointer-events-none opacity-90' : ''
            )}
            aria-busy={loading ? true : undefined}
            disabled={rest.disabled || loading}
            {...rest}
        >
            {loading ? (
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="black" strokeWidth="3" fill="none" opacity=".15" />
                    <path d="M12 2 a10 10 0 0 1 10 10" stroke="black" strokeWidth="3" fill="none" />
                </svg>
            ) : (
                children
            )}
        </button>
    )
}
