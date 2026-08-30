"use client";

import { ArrowUpRight, RefreshCw, Users, ArrowRight } from "lucide-react";
import { SurfaceCard, Field, PrimaryButton, inputClass } from "@/components/ui/primitives";
import type { Rombel, Siswa } from "@/types";

interface KenaikanTujuanPanelProps {
  selectedAsalRombel: Rombel | undefined;
  selectedTujuanRombel: Rombel | undefined;
  tujuanRombelId: string;
  setTujuanRombelId: (val: string) => void;
  promosiRombel: Rombel[];
  rotasiRombel: Rombel[];
  lainnyaRombel: Rombel[];
  asalRombelId: string;
  getTingkatNumber: (r?: Rombel | null) => number;
  tanggalEfektif: string;
  setTanggalEfektif: (val: string) => void;
  tujuanSiswa: Siswa[];
  busy: boolean;
  selectedCount: number;
  handleMove: () => void;
}

export function KenaikanTujuanPanel({
  selectedAsalRombel,
  selectedTujuanRombel,
  tujuanRombelId,
  setTujuanRombelId,
  promosiRombel,
  rotasiRombel,
  lainnyaRombel,
  asalRombelId,
  getTingkatNumber,
  tanggalEfektif,
  setTanggalEfektif,
  tujuanSiswa,
  busy,
  selectedCount,
  handleMove,
}: KenaikanTujuanPanelProps) {
  const headerAction = selectedAsalRombel && selectedTujuanRombel ? (
    getTingkatNumber(selectedTujuanRombel) > getTingkatNumber(selectedAsalRombel) ? (
      <span className="inline-flex items-center gap-1 bg-primary-soft text-primary px-2 py-0.5 rounded text-[10px] font-bold">
        <ArrowUpRight size={12} /> Promosi (Tingkat {getTingkatNumber(selectedAsalRombel)} ➔ {getTingkatNumber(selectedTujuanRombel)})
      </span>
    ) : getTingkatNumber(selectedTujuanRombel) === getTingkatNumber(selectedAsalRombel) ? (
      <span className="inline-flex items-center gap-1 bg-primary-soft text-primary px-2 py-0.5 rounded text-[10px] font-bold">
        <RefreshCw size={12} /> Rotasi Paralel ({selectedAsalRombel.nama_rombel} ➔ {selectedTujuanRombel.nama_rombel})
      </span>
    ) : null
  ) : null;

  return (
    <SurfaceCard title="2. Rombel Tujuan & Eksekusi" action={headerAction}>
      <div className="space-y-4">
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Field label="Smart Rombel Tujuan" helperText="Diurutkan sesuai tingkat berikutnya">
            <select
              className={inputClass}
              value={tujuanRombelId}
              onChange={(e) => setTujuanRombelId(e.target.value)}
            >
              <option value="">— Pilih Rombel Tujuan —</option>

              {promosiRombel.length > 0 && selectedAsalRombel && (
                <optgroup label={`Promosi Kenaikan Kelas (Tingkat ${getTingkatNumber(selectedAsalRombel) + 1})`}>
                  {promosiRombel.map((r) => (
                    <option key={r.id_rombel} value={r.id_rombel}>
                      {r.nama_rombel} (Tingkat {getTingkatNumber(r)})
                    </option>
                  ))}
                </optgroup>
              )}

              {rotasiRombel.length > 0 && selectedAsalRombel && (
                <optgroup label={`Rotasi Kelas Paralel (Tingkat ${getTingkatNumber(selectedAsalRombel)})`}>
                  {rotasiRombel.map((r) => (
                    <option key={r.id_rombel} value={r.id_rombel} disabled={r.id_rombel === asalRombelId}>
                      {r.nama_rombel} (Tingkat {getTingkatNumber(r)})
                    </option>
                  ))}
                </optgroup>
              )}

              {lainnyaRombel.length > 0 && (
                <optgroup label="Rombel Tingkat Lainnya">
                  {lainnyaRombel.map((r) => (
                    <option key={r.id_rombel} value={r.id_rombel} disabled={r.id_rombel === asalRombelId}>
                      {r.nama_rombel} (Tingkat {getTingkatNumber(r)})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </Field>

          <Field label="Tanggal Efektif">
            <input
              type="date"
              className={inputClass}
              value={tanggalEfektif}
              onChange={(e) => setTanggalEfektif(e.target.value)}
            />
          </Field>
        </div>

        {tujuanRombelId ? (
          <div className="border border-border rounded-md overflow-hidden mb-4">
            <div className="bg-paper p-3 border-b border-border flex items-center justify-between">
              <span className="text-xs font-bold text-ink">Daftar Siswa di Rombel Tujuan</span>
              <span className="text-[10px] bg-primary-soft text-primary font-bold px-2 py-0.5 rounded">
                {tujuanSiswa.length} Siswa
              </span>
            </div>
            <div className="max-h-[420px] overflow-y-auto bg-surface divide-y divide-border">
              {tujuanSiswa.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted">Rombel tujuan masih kosong.</div>
              ) : (
                tujuanSiswa.map((s) => (
                  <div key={s.id_siswa} className="flex items-center gap-3 p-3 text-xs">
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div>
                      <p className="font-bold text-ink">{s.nama_lengkap}</p>
                      <p className="text-[10px] text-muted font-mono">NISN: {s.nisn}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 mb-4 text-center border border-dashed border-border rounded-md text-xs text-muted flex flex-col items-center gap-2">
            <Users size={24} className="text-muted/60" />
            <span>Silakan pilih Rombel Tujuan untuk melihat pemetaannya.</span>
          </div>
        )}

        <div className="pt-3 border-t border-border mt-4">
          <PrimaryButton
            className="w-full flex items-center justify-center gap-2 py-2.5 font-bold text-xs shadow-sm"
            onClick={handleMove}
            disabled={busy || selectedCount === 0 || !tujuanRombelId || asalRombelId === tujuanRombelId}
            iconLeft={<ArrowRight className="h-4 w-4" />}
          >
            <span>{busy ? "Memproses..." : `Pindahkan ${selectedCount} Siswa Terpilih`}</span>
          </PrimaryButton>
        </div>
      </div>
    </SurfaceCard>
  );
}
