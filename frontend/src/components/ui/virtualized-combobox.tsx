"use client";

import { useState, useRef, useEffect, ChangeEvent, useMemo } from "react";
import { Loader2, ChevronDown, Check, Search } from "lucide-react";

export interface VirtualizedOption {
  label: string;
  value: string | number;
  sublabel?: string;
}

export interface VirtualizedComboboxProps {
  label?: string;
  value?: string | number;
  onChange: (value: string | number) => void;
  options: VirtualizedOption[];
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  helperText?: string;
  className?: string;
  maxDisplay?: number;
}

export function VirtualizedCombobox({
  label,
  value,
  onChange,
  options,
  loading = false,
  disabled = false,
  placeholder = "Cari atau pilih...",
  error,
  helperText,
  className = "",
  maxDisplay = 50,
}: VirtualizedComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  // Filter options and chunk to maxDisplay to prevent INP spikes (>200ms)
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options.slice(0, maxDisplay);
    const term = searchTerm.toLowerCase();
    return options
      .filter((o) => o.label.toLowerCase().includes(term) || (o.sublabel && o.sublabel.toLowerCase().includes(term)))
      .slice(0, maxDisplay);
  }, [options, searchTerm, maxDisplay]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className={`relative w-full ${className}`} ref={wrapperRef}>
      {label && <label className="mb-1 block text-sm font-medium text-ink">{label}</label>}

      <div
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        className={`flex w-full cursor-pointer items-center justify-between rounded-[4px] border bg-surface px-3 py-2 text-sm text-ink transition-colors focus:outline-none ${
          error ? "border-danger" : "border-border"
        } ${disabled ? "cursor-not-allowed bg-paper opacity-60" : "hover:border-primary"}`}
      >
        <span className={selectedOption ? "text-ink font-medium" : "text-muted"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-muted" />
      </div>

      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-muted">{helperText}</p>
      ) : null}

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-hidden rounded-md border border-border bg-surface shadow-xl">
          {/* Quick Search Input */}
          <div className="flex items-center border-b border-border bg-paper px-2.5 py-1.5">
            <Search className="mr-2 h-3.5 w-3.5 text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ketik untuk memfilter..."
              className="w-full bg-transparent text-xs text-ink outline-none"
              autoFocus
            />
          </div>

          <div className="max-h-52 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2.5 text-xs text-muted text-center">
                {loading ? "Memuat..." : "Tidak ada data yang cocok"}
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`flex cursor-pointer items-center justify-between px-3 py-2 text-xs hover:bg-hover ${
                    opt.value === value ? "bg-primary/10 text-primary font-semibold" : "text-ink"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="truncate">{opt.label}</p>
                    {opt.sublabel && <p className="truncate text-[10px] text-muted">{opt.sublabel}</p>}
                  </div>
                  {opt.value === value && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
