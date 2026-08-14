"use client";

import { Search, X } from "lucide-react";
import { Input, type InputProps } from "./input";

export interface SearchInputProps extends Omit<InputProps, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}

export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Pencarian...",
  className = "",
  ...props
}: SearchInputProps) {
  const handleClear = () => {
    onChange("");
    if (onClear) onClear();
  };

  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      startIcon={<Search className="h-4 w-4" />}
      endIcon={
        value ? (
          <button
            type="button"
            onClick={handleClear}
            className="rounded p-0.5 text-muted hover:text-ink focus:outline-none"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null
      }
      className={className}
      {...props}
    />
  );
}
