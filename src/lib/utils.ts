import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format minutes into "Hh Mm" when >= 60, otherwise show "Xm".
export function formatMinutes(minutes: number | undefined | null): string {
  if (minutes == null) return "0m";
  if (!minutes && minutes !== 0) return "0m";
  const mins = Math.max(0, Math.round(minutes));
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0 ? `${hrs}h` : `${hrs}h ${rem}m`;
}
