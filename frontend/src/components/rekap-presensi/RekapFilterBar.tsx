"use client";

import { ChevronLeft, ChevronRight, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { formatTanggalPanjang, shiftDate, todayIso } from "@/lib/date-utils";
import type { Rombel } from "@/types";
import type { StatusFilterKey } from "@/lib/absensi-config";

interface RekapFilterBarProps {
  tanggal: string;
  onTanggalChange: (date: string) => void;
  idRombel: string;
  onIdRombelChange: (id: string) => void;
  rombelList: Rombel[];
  statusFilter: StatusFilterKey;
  onStatusFilterChange: (val: StatusFilterKey) => void;
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  onExportCsv: () => void;
  loading: boolean;
  sesiColumnsLength: number;
}

export function RekapFilterBar({
  tanggal,
  onTanggalChange,
  idRombel,
  onIdRombelChange,
  rombelList,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
  onExportCsv,
  loading,
  sesiColumnsLength,
}: RekapFilterBarProps) {
  const isToday = tanggal === todayIso();

  return (
    <div className="space-y-4">
      {/* Date Navigation + Kelas + Export Bar */}
      <div className="rounded-lg border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Date navigator */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onTanggalChange(shiftDate(tanggal, -1))}
              className="p-1.5 h-auto min-w-0"
              aria-label="Hari sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm font-semibold text-ink min-w-[200px] text-center">
              {formatTanggalPanjang(tanggal)}
            </span>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onTanggalChange(shiftDate(tanggal, 1))}
              className="p-1.5 h-auto min-w-0"
              aria-label="Hari berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Date picker (calendar icon) */}
            <label className="relative cursor-pointer" aria-label="Pilih tanggal">
              <span className="inline-flex items-center justify-center rounded-[4px] border border-border bg-surface p-1.5 text-muted hover:bg-paper hover:text-ink transition-colors">
                <Calendar className="h-4 w-4" />
              </span>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => onTanggalChange(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>

            {/* Today button */}
            {!isToday && (
              <Button variant="ghost" size="sm" onClick={() => onTanggalChange(todayIso())}>
                Hari ini
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Rombel selector */}
            <Select
              value={idRombel}
              onChange={(e) => onIdRombelChange(e.target.value)}
              className="min-w-[130px] max-w-[160px]"
              options={rombelList.map((r) => ({
                label: r.nama_rombel,
                value: r.id_rombel,
              }))}
            />

            {/* Export button */}
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Download className="h-3.5 w-3.5" />}
              onClick={onExportCsv}
              disabled={loading || sesiColumnsLength === 0}
            >
              Ekspor
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      {sesiColumnsLength > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as StatusFilterKey)}
            className="max-w-[170px]"
            options={[
              { label: "Semua Status", value: "Semua" },
              { label: "✓ Hadir", value: "Hadir" },
              { label: "I  Izin", value: "Izin" },
              { label: "S  Sakit", value: "Sakit" },
              { label: "A  Alpa", value: "Alpa" },
              { label: "⚠ Belum", value: "Belum" },
            ]}
          />
          <SearchInput
            value={searchQuery}
            onChange={onSearchQueryChange}
            placeholder="Cari siswa..."
            className="max-w-[220px]"
          />
        </div>
      )}
    </div>
  );
}
