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
}

export function JadwalMatrixView({
  timelineRows,
  activePreset,
  displayJadwal,
  pegawaiMap,
  rombelMap,
  mapelMap,
  onSlotClick,
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
            {HARI_LIST.map((hari) => (
              <th
                key={hari}
                className="p-2.5 font-bold uppercase tracking-wider text-center w-1/6 border-r last:border-r-0 border-border/60"
              >
                {hari}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {timelineRows.map((timeRange) => {
            const [jamMulai, jamSelesai] = timeRange.split("–");

            return (
              <tr key={timeRange} className="hover:bg-paper/20 transition-colors">
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
                    <td key={hari} className="p-1.5 align-top border-r last:border-r-0 border-border/50">
                      {/* Routine Slot (Upacara / Dhuha / Senam / Istirahat / Ishoma) */}
                      {matchedRoutine ? (
                        <div className="flex flex-col overflow-hidden rounded-md border border-border bg-surface shadow-2xs">
                          {/* Card Header: Strictly Icon & Time Only */}
                          <div
                            className={`flex items-center justify-between px-2 py-1 text-[9px] font-bold text-white ${
                              matchedRoutine.tipe === "UPACARA"
                                ? "bg-amber-600"
                                : matchedRoutine.tipe === "IBADAH" || matchedRoutine.tipe === "ISHOMA"
                                ? "bg-emerald-700"
                                : matchedRoutine.tipe === "SENAM"
                                ? "bg-teal-600"
                                : "bg-sky-600"
                            }`}
                          >
                            <span className="flex items-center gap-1">
                              {matchedRoutine.tipe === "UPACARA" ? (
                                <Flag size={10} />
                              ) : matchedRoutine.tipe === "IBADAH" || matchedRoutine.tipe === "ISHOMA" ? (
                                <Sun size={10} />
                              ) : matchedRoutine.tipe === "SENAM" ? (
                                <Sparkles size={10} />
                              ) : (
                                <Coffee size={10} />
                              )}
                              <span className="opacity-90">{matchedRoutine.tipe}</span>
                            </span>
                            <span className="font-mono">{matchedRoutine.jam_mulai} – {matchedRoutine.jam_selesai}</span>
                          </div>
                          {/* Card Body: Activity Name & Description */}
                          <div className="p-2 flex flex-col gap-0.5">
                            <span className="text-[10px] font-extrabold text-ink uppercase line-clamp-1">
                              {matchedRoutine.nama}
                            </span>
                            {matchedRoutine.keterangan && (
                              <span className="text-[9px] text-muted line-clamp-1">
                                {matchedRoutine.keterangan}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : matchedKbmSlots.length === 0 ? (
                        <div className="h-10 rounded border border-dashed border-border/30 flex items-center justify-center text-[10px] text-muted/30">
                          —
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {matchedKbmSlots.map((j) => {
                            const m = mapelMap[j.id_mapel];
                            const p = pegawaiMap[j.id_pegawai];
                            const r = rombelMap[j.id_rombel];
                            const isAgama = m?.kelompok_mapel === "Agama";
                            const seqLabel = getSlotSequenceLabel(j.jam_mulai, j.jam_selesai);

                            return (
                              <div
                                key={j.id_jadwal}
                                onClick={() => onSlotClick(j)}
                                className={`cursor-pointer flex flex-col overflow-hidden rounded-md border shadow-2xs transition-all hover:shadow-md hover:scale-[1.01] active:scale-95 ${
                                  isAgama
                                    ? "border-emerald-300 dark:border-emerald-800 bg-surface"
                                    : "border-indigo-300 dark:border-indigo-800 bg-surface"
                                }`}
                              >
                                {/* CARD HEADER: Time & Sequence Bar */}
                                <div
                                  className={`flex items-center justify-between px-2 py-1 text-[9px] font-bold text-white ${
                                    isAgama ? "bg-emerald-700" : "bg-primary"
                                  }`}
                                >
                                  <span className="flex items-center gap-1">
                                    <span className="flex h-3.5 px-1 items-center justify-center rounded-xs bg-white/20 text-white font-mono">
                                      {seqLabel.replace("Jam Ke-", "JP ")}
                                    </span>
                                  </span>
                                  <span className="font-mono">{j.jam_mulai} – {j.jam_selesai}</span>
                                </div>

                                {/* CARD BODY: Subject, Teacher, & Rombel Badge */}
                                <div className="p-2 flex flex-col gap-1">
                                  <div className="flex justify-between items-start gap-1">
                                    <span className="text-[10px] font-extrabold text-ink uppercase line-clamp-1">
                                      {m?.nama_mapel ?? j.id_mapel}
                                    </span>
                                    <span className="text-[9px] font-bold bg-paper border border-border/80 px-1 py-0.2 rounded text-ink shrink-0">
                                      {r?.nama_rombel ?? j.id_rombel}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1 text-[10px] text-muted truncate">
                                    <User size={10} className="shrink-0 text-muted" />
                                    <span className="truncate">{p?.nama_lengkap_gelar ?? j.id_pegawai}</span>
                                  </div>
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
