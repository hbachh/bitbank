import { JSX } from "preact";
import { cn } from "../lib/utils.ts";

export function Card(
  { className, ...props }: JSX.HTMLAttributes<HTMLDivElement>,
) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-2 md:gap-3 border-2 border-black shadow-neo-sm p-2.5 md:p-3.5",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader(
  { className, ...props }: JSX.HTMLAttributes<HTMLDivElement>,
) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle(
  { className, ...props }: JSX.HTMLAttributes<HTMLDivElement>,
) {
  return (
    <div
      className={cn(
        "text-base md:text-xl font-black leading-none tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription(
  { className, ...props }: JSX.HTMLAttributes<HTMLDivElement>,
) {
  return (
    <div
      className={cn("text-muted-foreground text-sm font-medium", className)}
      {...props}
    />
  );
}

export function CardContent(
  { className, ...props }: JSX.HTMLAttributes<HTMLDivElement>,
) {
  return (
    <div
      className={cn("", className)}
      {...props}
    />
  );
}

export function CardFooter(
  { className, ...props }: JSX.HTMLAttributes<HTMLDivElement>,
) {
  return (
    <div
      className={cn("flex items-center pt-4", className)}
      {...props}
    />
  );
}
