"use client";

import type { Tone } from "@/lib/status-helpers";

export type AvatarSize = "sm" | "md" | "lg";
export type AvatarVariant = Tone;

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  variant?: AvatarVariant;
  className?: string;
}

const avatarSizeClasses: Record<AvatarSize, string> = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
};

const avatarVariantClasses: Record<AvatarVariant, string> = {
  primary: "bg-primary-soft text-primary border-primary/20",
  amber: "bg-amber-soft text-amber border-amber/20",
  danger: "bg-danger-soft text-danger border-danger/20",
  ai: "bg-ai-soft text-ai border-ai/30",
  neutral: "bg-paper text-ink border-border",
};

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function Avatar({
  src,
  name,
  size = "md",
  variant = "primary",
  className = "",
}: AvatarProps) {
  const initials = getInitials(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`inline-block rounded-full object-cover border border-border ${avatarSizeClasses[size]} ${className}`}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border font-semibold select-none ${avatarSizeClasses[size]} ${avatarVariantClasses[variant]} ${className}`}
      title={name}
    >
      {initials}
    </span>
  );
}
