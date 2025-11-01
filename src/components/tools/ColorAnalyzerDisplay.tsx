import HorizontalLoader from "../HorizontalLoader";

type ColorResult = {
    rgb: string
    hex: string
}

export default function ColorAnalyzerDisplay({ content }: { content: string }) {
    const colors = content
    .split('__PAGEPLUS__TOOL__COLORANALYZER__')?.[1]
    .split('\n')
    .map((line) => line.split(';'))
    .map(([hex, rgb]) => ({ hex, rgb }))

    return (
        <div className="w-full grid grid-cols-2 rounded-[20px] p-2 items-center justify-between gap-2">
            {colors && Array.isArray(colors) ? colors.map((color: ColorResult) => (
                <div>
                    <div key={color.hex} className="w-full h-16 rounded-[12px]" style={{ backgroundColor: color.hex }}>

                    </div>
                    <div className="text-xs text-black/70 dark:text-white/70 mt-1">
                        {color.hex}
                    </div>
                    <div className="text-xs text-black/70 dark:text-white/70">
                        {color.rgb}
                    </div>
                </div>
            )) : <HorizontalLoader />}
        </div>
    )
}