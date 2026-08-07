"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  tabular?: boolean;
  containerClassName?: string;
}

function splitLayoutClasses(className: string): { containerClass: string; inputClass: string } {
  const containerTokens: string[] = [];
  const inputTokens: string[] = [];

  const tokens = className.split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    if (
      token.startsWith("max-w-") ||
      token.startsWith("min-w-") ||
      token.startsWith("w-") ||
      token.startsWith("flex-") ||
      token.startsWith("shrink-") ||
      token.startsWith("grow-") ||
      token.startsWith("col-span-")
    ) {
      containerTokens.push(token);
    } else {
      inputTokens.push(token);
    }
  }

  return {
    containerClass: containerTokens.join(" "),
    inputClass: inputTokens.join(" "),
  };
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    helperText,
    startIcon,
    endIcon,
    tabular = false,
    className = "",
    containerClassName = "",
    disabled = false,
    id,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const { containerClass, inputClass } = splitLayoutClasses(className);

  const containerWidth = containerClass || "w-full";

  return (
    <div className={`${containerWidth} ${containerClassName}`}>
      {label ? (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-ink">
          {label}
        </label>
      ) : null}
      <div className="relative flex items-center w-full">
        {startIcon ? (
          <span className="pointer-events-none absolute left-3 flex items-center text-muted">
            {startIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`w-full rounded-[4px] border bg-surface py-2 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-paper disabled:opacity-60 ${
            startIcon ? "pl-9" : "pl-3"
          } ${endIcon ? "pr-9" : "pr-3"} ${
            error ? "border-danger focus:border-danger focus:ring-danger" : "border-border"
          } ${tabular ? "tabular" : ""} ${inputClass}`}
          {...props}
        />
        {endIcon ? (
          <span className="pointer-events-none absolute right-3 flex items-center text-muted">
            {endIcon}
          </span>
        ) : null}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-muted">{helperText}</p>
      ) : null}
    </div>
  );
});

