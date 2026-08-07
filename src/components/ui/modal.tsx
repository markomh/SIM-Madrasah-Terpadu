"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export type ModalSize = "sm" | "md" | "lg" | "xl";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  className?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className = "",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Box */}
      <div
        className={`relative z-10 w-full rounded-[6px] border border-border bg-surface shadow-lg ${sizeClasses[size]} ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        {title || description ? (
          <div className="flex items-start justify-between border-b border-border px-5 py-4">
            <div>
              {title ? <h2 className="text-base font-semibold text-ink">{title}</h2> : null}
              {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[4px] p-1 text-muted hover:bg-paper hover:text-ink focus:outline-none"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 rounded-[4px] p-1 text-muted hover:bg-paper hover:text-ink focus:outline-none"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Content Body */}
        <div className="p-5">{children}</div>

        {/* Footer */}
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-border bg-paper/50 px-5 py-3 rounded-b-[6px]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
