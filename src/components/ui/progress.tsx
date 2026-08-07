"use client";

import type { Tone } from "@/lib/status-helpers";

export type ProgressVariant = Tone;

export interface ProgressProps {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  label?: string;
  showValue?: boolean;
  className?: string;
}

const progressVariantClasses: Record<ProgressVariant, string> = {
  primary: "bg-primary",
  amber: "bg-amber",
  danger: "bg-danger",
  ai: "bg-ai",
  neutral: "bg-muted",
};

export function Progress({
  value,
  max = 100,
  variant = "primary",
  label,
  showValue = false,
  className = "",
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      {label || showValue ? (
        <div className="mb-1 flex items-center justify-between text-xs font-medium text-ink">
          {label ? <span>{label}</span> : <span />}
          {showValue ? <span className="tabular">{Math.round(percentage)}%</span> : null}
        </div>
      ) : null}
      <div className="h-2 w-full overflow-hidden rounded-full bg-paper border border-border">
        <div
          className={`h-full rounded-full transition-all duration-300 ${progressVariantClasses[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
