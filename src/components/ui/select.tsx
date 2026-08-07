"use client";

import { forwardRef, type ReactNode, type SelectHTMLAttributes } from "react";

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  children?: ReactNode;
  containerClassName?: string;
}

function splitLayoutClasses(className: string): { containerClass: string; selectClass: string } {
  const containerTokens: string[] = [];
  const selectTokens: string[] = [];

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
      selectTokens.push(token);
    }
  }

  return {
    containerClass: containerTokens.join(" "),
    selectClass: selectTokens.join(" "),
  };
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    error,
    helperText,
    options,
    children,
    className = "",
    containerClassName = "",
    disabled = false,
    id,
    ...props
  },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const { containerClass, selectClass } = splitLayoutClasses(className);

  const containerWidth = containerClass || "w-full";

  return (
    <div className={`${containerWidth} ${containerClassName}`}>
      {label ? (
        <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-ink">
          {label}
        </label>
      ) : null}
      <select
        ref={ref}
        id={selectId}
        disabled={disabled}
        className={`w-full rounded-[4px] border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-paper disabled:opacity-60 ${
          error ? "border-danger focus:border-danger focus:ring-danger" : "border-border"
        } ${selectClass}`}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={String(opt.value)} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-muted">{helperText}</p>
      ) : null}
    </div>
  );
});

