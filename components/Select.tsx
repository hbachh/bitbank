import { JSX } from "preact";

interface SelectProps extends JSX.HTMLAttributes<HTMLSelectElement> {
  children: JSX.Element | JSX.Element[];
}

function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={`w-full px-3 py-2 border-2 border-black bg-white font-bold text-black focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${className || ""}`}
      {...props}
    >
      {children}
    </select>
  );
}

export { Select };
