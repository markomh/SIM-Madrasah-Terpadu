"use client";

import type { ReactNode } from "react";
import { Info, CheckCircle2, AlertTriangle, AlertCircle, Sparkles, X } from "lucide-react";
import type { Tone } from "@/lib/status-helpers";

export type AlertVariant = Tone;

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  icon?: ReactNode;
  onClose?: () => void;
  className?: string;
}

const alertVariantClasses: Record<AlertVariant, string> = {
  primary: "bg-primary-soft text-primary border-primary/30",
  amber: "bg-amber-soft text-amber border-amber/30",
  danger: "bg-danger-soft text-danger border-danger/30",
  ai: "bg-ai-soft text-ai border-ai/30",
  neutral: "bg-paper text-ink border-border",
};

const defaultIcons: Record<AlertVariant, ReactNode> = {
  primary: <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />,
  amber: <AlertTriangle className="h-4 w-4 shrink-0 text-amber" />,
  danger: <AlertCircle className="h-4 w-4 shrink-0 text-danger" />,
  ai: <Sparkles className="h-4 w-4 shrink-0 text-ai" />,
  neutral: <Info className="h-4 w-4 shrink-0 text-muted" />,
};

export function Alert({
  variant = "neutral",
  title,
  children,
  icon,
  onClose,
  className = "",
}: AlertProps) {
  const displayIcon = icon !== undefined ? icon : defaultIcons[variant];

  return (
    <div
      className={`relative flex items-start gap-3 rounded-[6px] border p-4 text-sm ${alertVariantClasses[variant]} ${className}`}
      role="alert"
    >
      {displayIcon ? <div className="mt-0.5">{displayIcon}</div> : null}
      <div className="flex-1">
        {title ? <h4 className="font-semibold leading-tight">{title}</h4> : null}
        <div className={title ? "mt-1 text-xs opacity-90" : "text-sm"}>{children}</div>
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="rounded p-0.5 opacity-70 hover:opacity-100 focus:outline-none"
          aria-label="Close alert"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
