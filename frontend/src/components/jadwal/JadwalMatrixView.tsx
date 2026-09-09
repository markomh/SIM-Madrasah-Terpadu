"use client";

import { User, Flag, Sun, Sparkles, Coffee } from "lucide-react";
import { getInstitutionalRoutinesForDay, type BellSchedulePreset } from "@/lib/bell-schedule";
import type { JadwalPelajaran, MataPelajaran, Pegawai, Rombel } from "@/types";

const HARI_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

interface JadwalMatrixViewProps {
  timelineRows: string[];
  activePreset: BellSchedulePreset | null;
  displayJadwal: JadwalPelajaran[];
  pegawaiMap: Record<string, Pegawai>;
  rombelMap: Record<string, Rombel>;
  mapelMap: Record<string, MataPelajaran>;
  onSlotClick: (j: JadwalPelajaran) => void;
  onEmptyClick?: (hari: string, jam_mulai: string, jam_selesai: string) => void;
}

export function JadwalMatrixView({
  timelineRows,
  activePreset,
  displayJadwal,
  pegawaiMap,
  rombelMap,
  mapelMap,
  onSlotClick,
  onEmptyClick,
}: JadwalMatrixViewProps) {
  const getSlotSequenceLabel = (jamMulai: string, jamSelesai: string) => {
    if (!activePreset) return "KBM";
    const found = activePreset.slots.find((s) => s.jam_mulai === jamMulai && s.jam_selesai === jamSelesai);
    if (found) return found.nama;
    return "KBM";
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full table-fixed border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-border bg-paper text-muted">
            <th className="p-2.5 font-bold uppercase tracking-wider text-center w-24 border-r border-border/60">
              JAM
            </th>
            {HARI_LIST.map((hari) => (
              <th
                key={hari}
                className="p-2.5 font-bold uppercase tracking-wider text-center border-r last:border-r-0 border-border/60"
              >
                {hari}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {timelineRows.map((timeRange, rowIndex) => {
            const [jamMulai, jamSelesai] = timeRange.split("–");

            return (
              <tr key={timeRange} className="hover:bg-paper/20 transition-colors">
                {/* Waktu / Jam Ke Column */}
                <td className="p-2 align-middle border-r border-border/50 text-center bg-paper/30 w-24">
                  <div className="font-bold text-ink text-sm">
                    Jam {rowIndex + 1}
                  </div>
                </td>
                {/* 6 Day Columns (table-layout fixed) */}
                {HARI_LIST.map((hari) => {
                  const institutionalSlots = activePreset ? getInstitutionalRoutinesForDay(hari, activePreset) : [];
                  const matchedRoutine = institutionalSlots.find(
                    (s) => s.jam_mulai === jamMulai && s.jam_selesai === jamSelesai
                  );

                  const matchedKbmSlots = displayJadwal.filter(
                    (j) => j.hari === hari && j.jam_mulai === jamMulai && j.jam_selesai === jamSelesai
                  );

                  return (
                    <td key={hari} className="p-2 align-top border-r last:border-r-0 border-border/50 text-center">
                      <div className="text-[11px] text-muted font-mono mb-1.5">{jamMulai} - {jamSelesai}</div>
                      
                      {/* Routine Slot (Upacara / Dhuha / Senam / Istirahat / Ishoma) */}
                      {matchedRoutine ? (
                        <div
                          className={`inline-flex w-full items-center justify-center px-2 py-1.5 rounded text-[11px] font-bold ${
                            matchedRoutine.tipe === "UPACARA"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                              : matchedRoutine.tipe === "IBADAH" || matchedRoutine.tipe === "ISHOMA"
                              ? "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300"
                              : matchedRoutine.tipe === "SENAM"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          }`}
                        >
                          <span className="line-clamp-1">{matchedRoutine.nama}</span>
                        </div>
                      ) : matchedKbmSlots.length === 0 ? (
                        <div
                          className={`h-10 rounded border border-dashed border-border/30 flex items-center justify-center text-[11px] text-muted/40 font-medium py-1 transition-colors ${
                            onEmptyClick ? "cursor-pointer hover:bg-primary/5 hover:border-primary/30 hover:text-primary/70" : ""
                          }`}
                          onClick={() => onEmptyClick && onEmptyClick(hari, jamMulai, jamSelesai)}
                        >
                          {onEmptyClick ? "+ Tambah Jadwal" : "Belum ada jadwal"}
                        </div>
                      ) : (
                        <div className="space-y-1.5 text-left">
                          {matchedKbmSlots.map((j) => {
                            const m = mapelMap[j.id_mapel];
                            const p = pegawaiMap[j.id_pegawai];
                            const r = rombelMap[j.id_rombel];

                            return (
                              <div
                                key={j.id_jadwal}
                                onClick={() => onSlotClick(j)}
                                className="cursor-pointer flex flex-col rounded border border-border/80 bg-surface p-1.5 shadow-2xs hover:shadow-sm hover:border-primary/50 transition-all"
                              >
                                <div className="flex justify-between items-start gap-1">
                                  <span className="text-[10px] font-bold text-ink leading-tight line-clamp-2">
                                    {m?.nama_mapel ?? j.id_mapel}
                                  </span>
                                  <span className="text-[9px] font-semibold bg-paper px-1 rounded text-muted shrink-0">
                                    {r?.nama_rombel ?? j.id_rombel}
                                  </span>
                                </div>
                                <div className="text-[9px] text-muted mt-1 truncate">
                                  {p?.nama_lengkap_gelar ?? j.id_pegawai}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
