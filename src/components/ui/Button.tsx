import { cn } from "../../utils/tailwind"

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode,
    color?: 'primary' | 'black' | 'ghost',
    size?: 'regular' | 'small',
    shape?: 'rect' | 'circle',
    className?: string
}

export default function Button({
    children,
    color = 'primary',
    size = 'regular',
    shape = 'rect',
    className,
    ...rest
}: Props) {
    const colors = {
        primary: 'cursor-pointer bg-primary text-black',
        black: 'cursor-pointer bg-black text-white',
        ghost: 'cursor-pointer bg-transparent text-black hover:bg-black/10'
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
                className || ''
            )}
            {...rest}
        >
            {children}
        </button>
    )
}
