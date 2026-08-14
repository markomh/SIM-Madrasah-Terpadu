"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  error?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, error, className = "", disabled = false, id, ...props },
  ref
) {
  const radioId = id || (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="flex flex-col">
      <label htmlFor={radioId} className="inline-flex items-center gap-2 cursor-pointer select-none text-sm text-ink disabled:cursor-not-allowed">
        <input
          ref={ref}
          id={radioId}
          type="radio"
          disabled={disabled}
          className={`h-4 w-4 border-border text-primary focus:ring-primary accent-primary disabled:opacity-50 ${className}`}
          {...props}
        />
        {label ? <span className="font-medium text-ink">{label}</span> : null}
      </label>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
});
