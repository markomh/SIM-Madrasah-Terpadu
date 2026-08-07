"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export type DrawerSize = "sm" | "md" | "lg" | "xl";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: DrawerSize;
  className?: string;
}

const drawerSizeClasses: Record<DrawerSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className = "",
}: DrawerProps) {
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
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        {/* Drawer Box */}
        <div
          className={`relative flex w-screen flex-col border-l border-border bg-surface shadow-xl ${drawerSizeClasses[size]} ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              {title ? <h2 className="text-base font-semibold text-ink">{title}</h2> : null}
              {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[4px] p-1 text-muted hover:bg-paper hover:text-ink focus:outline-none"
              aria-label="Close drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="relative flex-1 overflow-y-auto p-5">{children}</div>

          {/* Footer */}
          {footer ? (
            <div className="flex items-center justify-end gap-2 border-t border-border bg-paper/50 px-5 py-3">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
