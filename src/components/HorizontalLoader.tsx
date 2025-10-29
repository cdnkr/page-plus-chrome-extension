import { cn } from "../utils/tailwind";

export default function HorizontalLoader({ loaderText, className = '', loaderElClassName = '' }: { loaderText?: string, className?: string, loaderElClassName?: string }) {
  return (
    <div className={cn("w-full flex flex-col gap-1", className)}>
      {loaderText && (
        <div className="text-sm mb-2 text-black/70 text-center">
          {loaderText}
        </div>
      )}
      <div className={cn(
        "w-full flex justify-center items-center",
        loaderElClassName
      )}>
        <div className="loader">
          <div className="loader-bar"></div>
        </div>
      </div>
    </div>
  );
}