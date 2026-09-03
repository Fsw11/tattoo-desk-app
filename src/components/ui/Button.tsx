"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    variant?: "primary" | "secondary" | "danger" | "outline";
  };

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {

  const estilos = {
    primary:
      "bg-primary text-primary-foreground hover:opacity-90",

    secondary:
      "bg-muted text-foreground hover:bg-muted/80",

    danger:
      "bg-red-600 text-white hover:bg-red-700",

    outline:
      "border hover:bg-muted",
  };

  return (
    <button
      {...props}
      className={`
        rounded-lg
        px-4
        py-2
        font-medium
        transition
        ${estilos[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
