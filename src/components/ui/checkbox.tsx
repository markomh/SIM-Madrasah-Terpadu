"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  error?: string;
  helperText?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, error, helperText, className = "", disabled = false, id, ...props },
  ref
) {
  const checkboxId = id || (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="flex flex-col">
      <label htmlFor={checkboxId} className="inline-flex items-center gap-2 cursor-pointer select-none text-sm text-ink disabled:cursor-not-allowed">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          disabled={disabled}
          className={`h-4 w-4 rounded-[4px] border-border text-primary focus:ring-primary accent-primary disabled:opacity-50 ${className}`}
          {...props}
        />
        {label ? <span className="font-medium text-ink">{label}</span> : null}
      </label>
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-muted">{helperText}</p>
      ) : null}
    </div>
  );
});
