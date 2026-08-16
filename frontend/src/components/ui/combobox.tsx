"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Loader2, ChevronDown, Check } from "lucide-react";

export interface ComboboxOption {
  label: string;
  value: string | number;
}

export interface ComboboxProps {
  label?: string;
  value?: string | number;
  onChange: (value: string | number) => void;
  onSearch: (searchTerm: string) => void;
  options: ComboboxOption[];
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  helperText?: string;
  className?: string;
}

export function Combobox({
  label,
  value,
  onChange,
  onSearch,
  options,
  loading = false,
  disabled = false,
  placeholder = "Pilih...",
  error,
  helperText,
  className = "",
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Determine displayed label based on selected value
  const selectedOption = options.find((o) => o.value === value);
  const displayValue = isOpen ? searchTerm : selectedOption?.label || "";

  useEffect(() => {
    if (isOpen) {
      onSearch(debouncedSearch);
    }
  }, [debouncedSearch, isOpen, onSearch]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleOptionClick = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className={`relative w-full ${className}`} ref={wrapperRef}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
              setSearchTerm("");
              onSearch("");
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full rounded-[4px] border bg-surface px-3 py-2 pr-10 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-paper disabled:opacity-60 ${
            error ? "border-danger focus:border-danger focus:ring-danger" : "border-border"
          }`}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted" />
          )}
        </div>
      </div>

      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-muted">{helperText}</p>
      ) : null}

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-surface py-1 shadow-lg">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted">
              {loading ? "Mencari..." : "Tidak ada hasil"}
            </div>
          ) : (
            options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleOptionClick(option.value)}
                className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-hover ${
                  option.value === value ? "bg-primary/10 text-primary" : "text-ink"
                }`}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && <Check className="h-4 w-4" />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
