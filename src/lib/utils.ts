import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProgressColor(progress: number) {
  // Returns a CSS gradient from blue to red based on progress
  return `linear-gradient(90deg, rgb(37 99 235) ${progress}%, rgb(239 68 68) ${progress}%)`;
}
