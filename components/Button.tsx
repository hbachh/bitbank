import { JSX } from "preact";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils.ts";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-xs md:text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5 md:[&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none border-2 border-black active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-neo hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-neo hover:bg-destructive/90",
        outline:
          "bg-background shadow-neo hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-neo hover:bg-secondary/80",
        ghost:
          "border-transparent hover:bg-accent hover:text-accent-foreground",
        link:
          "border-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3 py-1.5",
        xs: "h-7 px-2 text-[11px]",
        sm: "h-8 px-2.5",
        lg: "h-10 px-4 text-sm md:text-base",
        icon: "size-9",
        "icon-xs": "size-6",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    JSX.HTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
}

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
