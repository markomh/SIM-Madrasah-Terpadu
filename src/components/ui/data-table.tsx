"use client";

import { useMemo, useState, type ReactNode } from "react";

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T>({
  data,
  columns,
  pageSize = 10,
  emptyTitle = "Tidak ada data",
  emptyDescription = "Belum ada data untuk ditampilkan.",
}: {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const slice = useMemo(() => {
    const start = page * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  if (data.length === 0) {
    return (
      <div className="rounded-[6px] border border-dashed border-border bg-paper p-8 text-center">
        <p className="font-semibold text-ink">{emptyTitle}</p>
        <p className="mt-1 text-sm text-muted">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div>
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
              <tr key={idx} className="hover:bg-paper/80">
                {columns.map((col) => (
                  <td key={col.key} className={`px-3 py-2.5 align-middle ${col.className ?? ""}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span>
          Menampilkan {page * pageSize + 1}-{Math.min((page + 1) * pageSize, data.length)} dari {data.length}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-[4px] border border-border px-2 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-[4px] border border-border px-2 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
