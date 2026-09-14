import { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export default function Card({
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={`rounded-[var(--radius)] border border-border bg-card p-4 shadow-sm md:p-6 ${className}`}
    >
      {children}
    </div>
  );
}
