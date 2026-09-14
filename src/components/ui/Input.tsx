"use client";

import { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export default function Input({
  label,
  error,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || props.name;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={`w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2.5 outline-none transition focus:ring-2 focus:ring-primary/40 ${className}`}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
