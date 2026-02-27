import { JSX } from "preact";

interface TextareaProps extends JSX.HTMLAttributes<HTMLTextAreaElement> {}

export function Textarea(props: TextareaProps) {
  return (
    <textarea
      {...props}
      className={`flex min-h-[90px] w-full border-2 border-black bg-white px-2.5 py-1.5 text-xs md:text-sm font-black uppercase italic ring-offset-background placeholder:text-black/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
        props.className || ""
      }`}
    />
  );
}
