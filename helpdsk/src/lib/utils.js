import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function polaczKlasy(...wartosci) {
  return twMerge(clsx(wartosci));
}
