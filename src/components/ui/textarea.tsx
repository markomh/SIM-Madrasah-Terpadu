"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  tabular?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    error,
    helperText,
    tabular = false,
    className = "",
    disabled = false,
    rows = 3,
    id,
    ...props
  },
  ref
) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={textareaId} className="mb-1 block text-sm font-medium text-ink">
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        disabled={disabled}
        className={`w-full rounded-[4px] border bg-surface p-3 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-paper disabled:opacity-60 ${
          error ? "border-danger focus:border-danger focus:ring-danger" : "border-border"
        } ${tabular ? "tabular" : ""} ${className}`}
        {...props}
      />
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-muted">{helperText}</p>
      ) : null}
    </div>
  );
});
