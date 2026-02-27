import { JSX } from "preact";
import { cn } from "../lib/utils.ts";

export function Input(
  { className, type, ...props }: JSX.HTMLAttributes<HTMLInputElement>,
) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full border-2 border-black bg-white px-2.5 py-1.5 text-xs md:text-sm font-bold ring-offset-white file:border-0 file:bg-transparent file:text-xs md:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-neo-sm",
        className,
      )}
      {...props}
    />
  );
}
