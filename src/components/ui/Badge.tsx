import { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "primary";
  className?: string;
};

const tones = {
  default: "border-border bg-muted text-muted-foreground",
  success: "border-transparent bg-success/15 text-success",
  warning: "border-transparent bg-warning/15 text-warning",
  danger: "border-transparent bg-danger/15 text-danger",
  primary: "border-transparent bg-primary/15 text-primary",
};

export default function Badge({
  children,
  tone = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function toneEstadoCita(estado: string) {
  switch (estado) {
    case "CONFIRMADA":
      return "success" as const;
    case "FINALIZADA":
      return "primary" as const;
    case "CANCELADA":
      return "danger" as const;
    default:
      return "warning" as const;
  }
}
