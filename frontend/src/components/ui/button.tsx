// "use client";

// import type { ButtonHTMLAttributes, ReactNode } from "react";
// import { Loader2 } from "lucide-react";

// export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "link" | "ai";
// export type ButtonSize = "sm" | "md" | "lg";

// export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
//   variant?: ButtonVariant;
//   size?: ButtonSize;
//   loading?: boolean;
//   iconLeft?: ReactNode;
//   iconRight?: ReactNode;
//   fullWidth?: boolean;
// }

// const variantClasses: Record<ButtonVariant, string> = {
//   primary: "bg-primary text-white hover:opacity-90 active:opacity-95 focus-visible:ring-primary",
//   secondary: "border border-border bg-surface text-ink hover:bg-paper focus-visible:ring-primary",
//   danger: "bg-danger text-white hover:opacity-90 active:opacity-95 focus-visible:ring-danger",
//   ghost: "text-ink hover:bg-paper focus-visible:ring-primary",
//   link: "text-primary hover:underline p-0 h-auto font-medium focus-visible:ring-primary",
//   ai: "border border-ai/30 bg-ai-soft text-ai hover:bg-ai/10 focus-visible:ring-ai",
// };

// const sizeClasses: Record<ButtonSize, string> = {
//   sm: "px-2.5 py-1 text-xs min-h-[30px]",
//   md: "px-3 py-1.5 text-sm min-h-[36px]",
//   lg: "px-4 py-2 text-base min-h-[42px]",
// };

// export function Button({
//   variant = "primary",
//   size = "md",
//   loading = false,
//   disabled = false,
//   iconLeft,
//   iconRight,
//   fullWidth = false,
//   children,
//   className = "",
//   type = "button",
//   ...props
// }: ButtonProps) {
//   const isLinkVariant = variant === "link";
//   const baseClasses =
//     "inline-flex items-center justify-center gap-2 rounded-[4px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50";

//   const sizeClass = isLinkVariant ? "" : sizeClasses[size];
//   const widthClass = fullWidth ? "w-full" : "";

//   return (
//     <button
//       type={type}
//       disabled={disabled || loading}
//       className={`${baseClasses} ${variantClasses[variant]} ${sizeClass} ${widthClass} ${className}`}
//       {...props}
//     >
//       {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : iconLeft ? <span className="inline-flex shrink-0 items-center">{iconLeft}</span> : null}
//       {children}
//       {!loading && iconRight ? <span className="inline-flex shrink-0 items-center">{iconRight}</span> : null}
//     </button>
//   );
// }


"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] focus-visible:ring-[var(--color-primary)]",
  secondary:
    "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-paper)] focus-visible:ring-[var(--color-primary)]",
  danger:
    "bg-[var(--color-danger)] text-white hover:opacity-90 active:opacity-80 focus-visible:ring-[var(--color-danger)]",
  ghost:
    "text-[var(--color-ink)] hover:bg-[var(--color-paper)] focus-visible:ring-[var(--color-primary)]",
  link:
    "text-[var(--color-primary)] hover:underline p-0 h-auto font-medium focus-visible:ring-[var(--color-primary)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-[var(--space-sm)] py-[var(--space-xs)] text-caption min-h-[32px]",
  md: "px-[var(--space-md)] py-[var(--space-sm)] text-label min-h-[40px]",
  lg: "px-[var(--space-lg)] py-[var(--space-md)] text-body min-h-[44px]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  fullWidth = false,
  children,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const isLinkVariant = variant === "link";

  const baseClasses =
    "inline-flex items-center justify-center gap-[var(--space-xs)] rounded-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50";

  const sizeClass = isLinkVariant ? "" : sizeClasses[size];
  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClass} ${widthClass} ${className}`.trim()}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
      ) : iconLeft ? (
        <span className="inline-flex shrink-0 items-center">{iconLeft}</span>
      ) : null}

      {children}

      {!loading && iconRight ? (
        <span className="inline-flex shrink-0 items-center">{iconRight}</span>
      ) : null}
    </button>
  );
}