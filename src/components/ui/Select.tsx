"use client";

import { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export default function Select({
  label,
  className = "",
  id,
  children,
  ...props
}: SelectProps) {
  const selectId = id || props.name;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium">
          {label}
        </label>
      )}
      <select
        id={selectId}
        {...props}
        className={`w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2.5 outline-none transition focus:ring-2 focus:ring-primary/40 ${className}`}
      >
        {children}
      </select>
    </div>
  );
}
