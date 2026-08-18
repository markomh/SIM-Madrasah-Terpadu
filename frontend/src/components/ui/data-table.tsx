"use client";

/**
 * DataTable — komponen tabel universal dengan paginasi bawaan.
 *
 * Footer menampilkan: "Menampilkan X-Y dari Z  [Prev] [Next]"
 *
 * Props:
 *  - data        : array data apapun
 *  - columns     : definisi kolom (key, header, render, className)
 *  - pageSize    : jumlah baris per halaman (default 10)
 *  - rowClassName: opsional — fungsi (row, idx) => string untuk kelas per baris
 *                  → dipakai untuk Signature Element border-l-3px (FRONTEND.md Bab 3)
 *  - emptyTitle / emptyDescription: pesan kosong
 */

import { useMemo, useState, type ReactNode } from "react";
import { Pagination } from "./pagination";
import { EmptyBlock } from "./primitives";

type Column<T> = {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T>({
  data,
  columns,
  pageSize = 10,
  loading = false,
  rowClassName,
  emptyTitle = "Tidak ada data",
  emptyDescription = "Belum ada data untuk ditampilkan.",
  emptyAction,
}: {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  loading?: boolean;
  rowClassName?: (row: T, idx: number) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}) {
  const [page, setPage] = useState(0);

  // Reset ke halaman 0 saat data berubah (misal filter)
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);

  const slice = useMemo(() => {
    const start = safePage * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, safePage, pageSize]);

  if (loading) {
    return (
      <div className="overflow-x-auto rounded-[6px] border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-paper text-left text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={`px-3 py-2.5 ${col.className ?? ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {Array.from({ length: Math.min(pageSize, 5) }).map((_, idx) => (
              <tr key={idx} className="animate-pulse">
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-3">
                    <div className="h-4 w-3/4 rounded bg-muted/20"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyBlock title={emptyTitle} description={emptyDescription} action={emptyAction} />
    );
  }

  return (
    <div>
      {/* ── Tabel ──────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-[6px] border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-paper text-left text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={`px-3 py-2.5 ${col.className ?? ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {slice.map((row, idx) => (
              <tr
                key={idx}
                className={`hover:bg-paper/80 ${rowClassName ? rowClassName(row, idx) : ""}`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2.5 align-middle ${col.className ?? ""}`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Footer paginasi ─────────────────────────────────────────────── */}
      <Pagination
        page={safePage}
        totalPages={totalPages}
        totalItems={data.length}
        pageSize={pageSize}
        onPageChange={setPage}
        className="mt-3"
      />
    </div>
  );
}
