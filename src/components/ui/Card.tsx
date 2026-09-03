import { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default function Card({
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`
        rounded-2xl
        border
        bg-background
        p-5
        shadow-sm
        ${className}
      `}
    >
      {children}
    </div>
  );
}
