"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

export interface CommandSearchInputProps extends InputHTMLAttributes<HTMLInputElement> {}

/**
 * Specialized Primitive Component: CommandSearchInput
 * Digunakan untuk input pencarian dialog Command Palette (Ctrl+K).
 */
export const CommandSearchInput = forwardRef<HTMLInputElement, CommandSearchInputProps>(function CommandSearchInput(
  { className = "", type = "text", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={`w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted focus:ring-0 border-none ${className}`}
      {...props}
    />
  );
});
