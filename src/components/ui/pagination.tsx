"use client";

import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  page: number; // 0-indexed
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = "",
}: PaginationProps) {
  const safePage = Math.min(Math.max(0, page), Math.max(0, totalPages - 1));
  const startRow = totalItems === 0 ? 0 : safePage * pageSize + 1;
  const endRow = Math.min((safePage + 1) * pageSize, totalItems);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted ${className}`}>
      <span>
        Menampilkan{" "}
        <strong className="text-ink tabular font-semibold">{startRow}</strong>
        {" – "}
        <strong className="text-ink tabular font-semibold">{endRow}</strong>
        {" dari "}
        <strong className="text-ink tabular font-semibold">{totalItems}</strong>
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={safePage === 0}
          onClick={() => onPageChange(Math.max(0, safePage - 1))}
          iconLeft={<ChevronLeft className="h-4 w-4" />}
        >
          Prev
        </Button>
        <span className="flex items-center px-1 tabular font-medium text-ink">
          {safePage + 1} / {Math.max(1, totalPages)}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={safePage >= totalPages - 1}
          onClick={() => onPageChange(Math.min(totalPages - 1, safePage + 1))}
          iconRight={<ChevronRight className="h-4 w-4" />}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
