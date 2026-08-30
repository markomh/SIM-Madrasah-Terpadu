"use client";

import Link from "next/link";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Tooltip } from "@/components/ui/primitives";
import { STATUS_CONFIG, type StatusKey } from "@/lib/absensi-config";
import type { Siswa, SesiTatapMuka, JadwalPelajaran, MataPelajaran, AbsensiSiswa } from "@/types";

interface SesiColumnData {
  sesi: SesiTatapMuka;
  jadwal: JadwalPelajaran | undefined;
  mapel: MataPelajaran | undefined;
  isFilled: boolean;
  filledCount: number;
  totalSiswa: number;
}

interface RekapTableProps {
  filteredSiswa: Siswa[];
  sesiColumns: SesiColumnData[];
  absensiList: AbsensiSiswa[];
  idRombel: string;
  tanggal: string;
  searchQuery: string;
  statusFilter: string;
}

export function RekapTable({
  filteredSiswa,
  sesiColumns,
  absensiList,
  idRombel,
  tanggal,
  searchQuery,
  statusFilter,
}: RekapTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        {/* ── Table Head ── */}
        <thead>
          <tr className="bg-paper text-left text-xs font-semibold uppercase tracking-wide text-muted">
            <th className="sticky left-0 z-10 bg-paper px-3 py-2.5 w-[200px] min-w-[180px]">
              Nama Siswa
            </th>
            {sesiColumns.map((col) => {
              const allFilled = col.isFilled && col.filledCount === col.totalSiswa;

              return (
                <th
                  key={col.sesi.id_sesi}
                  className="px-3 py-2.5 text-center min-w-[140px] border-l border-border/40"
                >
                  <div className="flex flex-col gap-1 items-center">
                    <span className="font-bold text-ink normal-case">
                      {col.mapel?.nama_mapel ?? "—"}
                    </span>
                    <span className="text-[10px] text-muted tabular">
                      {col.jadwal?.jam_mulai} – {col.jadwal?.jam_selesai}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold tabular ${
                        !col.isFilled ? "text-muted" : allFilled ? "text-primary" : "text-amber"
                      }`}
                    >
                      {!col.isFilled ? (
                        <>— Belum diisi</>
                      ) : allFilled ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          {col.filledCount}/{col.totalSiswa}
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3 w-3" />
                          {col.filledCount}/{col.totalSiswa}
                        </>
                      )}
                    </span>
                    {!col.isFilled && (
                      <Link
                        href={`/akademik/presensi-siswa?rombel=${idRombel}&tanggal=${tanggal}&sesi=${col.sesi.id_sesi}`}
                        className="mt-0.5 inline-flex items-center gap-1 rounded-[4px] border border-primary/30 bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/10"
                      >
                        Isi Presensi
                      </Link>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        {/* ── Table Body ── */}
        <tbody className="divide-y divide-border/60">
          {filteredSiswa.length === 0 ? (
            <tr>
              <td colSpan={1 + sesiColumns.length} className="px-3 py-8 text-center text-sm text-muted">
                {searchQuery || statusFilter !== "Semua"
                  ? "Tidak ada siswa yang cocok dengan filter."
                  : "Belum ada siswa terdaftar di rombel ini."}
              </td>
            </tr>
          ) : (
            filteredSiswa.map((siswa) => (
              <tr key={siswa.id_siswa} className="hover:bg-paper/60 transition-colors">
                {/* Nama siswa — sticky left */}
                <td className="sticky left-0 z-10 bg-surface px-3 py-2.5 font-semibold text-ink">
                  <span className="truncate block max-w-[200px]" title={siswa.nama_lengkap}>
                    {siswa.nama_lengkap}
                  </span>
                </td>

                {/* Status cells */}
                {sesiColumns.map((col) => {
                  const abs = absensiList.find(
                    (a) => a.id_siswa === siswa.id_siswa && a.id_sesi === col.sesi.id_sesi
                  );

                  if (!col.isFilled) {
                    return (
                      <td key={col.sesi.id_sesi} className="px-3 py-2.5 text-center border-l border-border/40">
                        <span className="text-muted text-xs">—</span>
                      </td>
                    );
                  }

                  const status: StatusKey = abs ? abs.status : "Belum";
                  const config = STATUS_CONFIG[status];

                  return (
                    <td key={col.sesi.id_sesi} className="px-3 py-2.5 text-center border-l border-border/40">
                      <Tooltip
                        content={
                          abs ? `${config.label}${abs.catatan ? ` — ${abs.catatan}` : ""}` : "Presensi belum diisi"
                        }
                      >
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-[4px] text-xs font-bold transition-colors ${config.bgClass}`}
                        >
                          {config.letter}
                        </span>
                      </Tooltip>
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
