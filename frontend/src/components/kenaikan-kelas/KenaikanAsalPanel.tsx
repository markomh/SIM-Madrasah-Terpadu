"use client";

import { Layers } from "lucide-react";
import { SurfaceCard, Field, inputClass } from "@/components/ui/primitives";
import type { Rombel } from "@/types";

interface SiswaRow {
  id_siswa: string;
  nama_lengkap: string;
  nisn: string;
  selected: boolean;
}

interface KenaikanAsalPanelProps {
  selectedTingkatAsal: string;
  setSelectedTingkatAsal: (val: string) => void;
  asalRombelId: string;
  setAsalRombelId: (val: string) => void;
  availableTingkatNumbers: number[];
  filteredRombelAsal: Rombel[];
  getTingkatNumber: (r?: Rombel | null) => number;
  searchQueryAsal: string;
  setSearchQueryAsal: (val: string) => void;
  isAllSelected: boolean;
  toggleAll: (checked: boolean) => void;
  asalSiswa: SiswaRow[];
  selectedCount: number;
  searchFilteredAsalSiswa: SiswaRow[];
  toggleSiswa: (id_siswa: string) => void;
}

export function KenaikanAsalPanel({
  selectedTingkatAsal,
  setSelectedTingkatAsal,
  asalRombelId,
  setAsalRombelId,
  availableTingkatNumbers,
  filteredRombelAsal,
  getTingkatNumber,
  searchQueryAsal,
  setSearchQueryAsal,
  isAllSelected,
  toggleAll,
  asalSiswa,
  selectedCount,
  searchFilteredAsalSiswa,
  toggleSiswa,
}: KenaikanAsalPanelProps) {
  return (
    <SurfaceCard title="1. Filter & Pilih Siswa Rombel Asal">
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Field label="Filter Tingkat Asal" helperText="Tingkat kelas">
          <select
            className={inputClass}
            value={selectedTingkatAsal}
            onChange={(e) => {
              setSelectedTingkatAsal(e.target.value);
              setAsalRombelId("");
            }}
          >
            <option value="">— Semua Tingkat —</option>
            {availableTingkatNumbers.map((num) => (
              <option key={num} value={String(num)}>
                Tingkat {num}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Rombel Asal">
          <select
            className={inputClass}
            value={asalRombelId}
            onChange={(e) => setAsalRombelId(e.target.value)}
          >
            <option value="">— Pilih Rombel Asal —</option>
            {filteredRombelAsal.map((r) => (
              <option key={r.id_rombel} value={r.id_rombel}>
                {r.nama_rombel} (Tingkat {getTingkatNumber(r)})
              </option>
            ))}
          </select>
        </Field>
      </div>

      {asalRombelId ? (
        <div className="border border-border rounded-md overflow-hidden">
          {/* Search Bar & Checkbox Controls */}
          <div className="bg-paper p-3 border-b border-border space-y-2.5">
            <div className="relative">
              <input
                type="text"
                className={`${inputClass} pl-8 py-1.5 text-xs`}
                placeholder="Cari Nama Lengkap Siswa / NISN..."
                value={searchQueryAsal}
                onChange={(e) => setSearchQueryAsal(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  checked={isAllSelected}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
                Pilih Semua ({asalSiswa.length} Siswa)
              </label>
              {selectedCount > 0 && (
                <span className="text-[10px] bg-primary-soft text-primary px-2 py-0.5 rounded font-bold">
                  {selectedCount} Terpilih
                </span>
              )}
            </div>
          </div>

          {/* List Siswa Asal */}
          <div className="max-h-[420px] overflow-y-auto bg-surface divide-y divide-border">
            {searchFilteredAsalSiswa.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted">
                {searchQueryAsal ? "Siswa tidak ditemukan." : "Tidak ada siswa di rombel ini."}
              </div>
            ) : (
              searchFilteredAsalSiswa.map((s) => (
                <label
                  key={s.id_siswa}
                  className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-paper transition-colors ${
                    s.selected ? "bg-primary-soft/30" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    checked={s.selected}
                    onChange={() => toggleSiswa(s.id_siswa)}
                  />
                  <div className="text-xs">
                    <p className="font-bold text-ink">{s.nama_lengkap}</p>
                    <p className="text-[10px] text-muted font-mono">NISN: {s.nisn}</p>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center border border-dashed border-border rounded-md text-xs text-muted flex flex-col items-center gap-2">
          <Layers size={24} className="text-muted/60" />
          <span>Silakan pilih Rombel Asal untuk menampilkan daftar siswa.</span>
        </div>
      )}
    </SurfaceCard>
  );
}
