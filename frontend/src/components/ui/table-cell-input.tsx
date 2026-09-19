"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

export interface TableCellInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

/**
 * Specialized Primitive Component: TableCellInput
 * Digunakan untuk input sel tabel mikro (seperti entri nilai Gradebook / Absensi).
 * Memenuhi spesifikasi desain dengan border-radius 4px dan primary focus ring.
 */
export const TableCellInput = forwardRef<HTMLInputElement, TableCellInputProps>(function TableCellInput(
  { className = "", error = false, disabled = false, type = "text", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      disabled={disabled}
      className={`w-full rounded-[4px] border bg-surface py-1 px-1.5 text-xs font-bold text-ink outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-paper disabled:opacity-60 ${
        error ? "border-danger focus:border-danger focus:ring-danger" : "border-border"
      } ${className}`}
      {...props}
    />
  );
});
