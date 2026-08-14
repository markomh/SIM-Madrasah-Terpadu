"use client";

import type { HTMLAttributes, ReactNode } from "react";
import type { Tone } from "@/lib/status-helpers";

export type BadgeVariant = Tone;
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  children: ReactNode;
}

const badgeVariantClasses: Record<BadgeVariant, string> = {
  primary: "bg-primary-soft text-primary border border-primary/20",
  amber: "bg-amber-soft text-amber border border-amber/20",
  danger: "bg-danger-soft text-danger border border-danger/20",
  ai: "bg-ai-soft text-ai border border-ai/30",
  neutral: "bg-paper text-muted border border-border",
};

const badgeSizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs font-semibold rounded-[4px]",
  md: "px-2.5 py-1 text-sm font-semibold rounded-[4px]",
};

export function Badge({
  variant = "neutral",
  size = "sm",
  icon,
  children,
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${badgeVariantClasses[variant]} ${badgeSizeClasses[size]} ${className}`}
      {...props}
    >
      {icon ? <span className="inline-flex shrink-0">{icon}</span> : null}
      <span>{children}</span>
    </span>
  );
}
