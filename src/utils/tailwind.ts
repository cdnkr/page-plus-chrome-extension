import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: string[]) {
  return twMerge(clsx(inputs));
}

export const AFTER_FADE_CLASSES = "relative after:content-[''] after:absolute after:left-0 after:top-full after:h-[40px] after:w-full after:bg-gradient-to-b after:from-white after:to-transparent"
export const INSET_FADE_FROM_BOTTOM_CLASSES = "relative after:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:h-[60px] after:bg-gradient-to-t after:from-white after:to-transparent"
