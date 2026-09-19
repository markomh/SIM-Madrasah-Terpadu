"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";

export interface HeaderSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

/**
 * Specialized Primitive Component: HeaderSelect
 * Digunakan untuk dropdown ringkas pada topbar header (seperti Simulasi Persona).
 */
export const HeaderSelect = forwardRef<HTMLSelectElement, HeaderSelectProps>(function HeaderSelect(
  { className = "", children, disabled = false, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      disabled={disabled}
      className={`bg-transparent text-xs outline-none truncate w-full cursor-pointer font-bold text-ink focus:ring-1 focus:ring-primary rounded-[4px] ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});
