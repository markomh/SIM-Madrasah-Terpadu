"use client";

import { useMemo } from "react";
import { User, Flag, Sun, Sparkles, Coffee } from "lucide-react";
import { getInstitutionalRoutinesForDay, type BellSchedulePreset, type MasterPeriodSlot } from "@/lib/bell-schedule";
import type { JadwalPelajaran, MataPelajaran, Pegawai, Rombel } from "@/types";

const HARI_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

/** Skala: 2px per menit. Baseline: 06:00 (menit 360 dari tengah malam) */
const SCALE = 2;
const BASELINE_MINUTES = 6 * 60; // 06:00

/** Konversi string "HH:MM" ke menit sejak tengah malam */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Konversi menit ke posisi pixel relatif terhadap baseline */
function minutesToPx(minutes: number): number {
  return (minutes - BASELINE_MINUTES) * SCALE;
}

/** Format menit ke "HH:MM" */
function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

interface JadwalCanvasViewProps {
  activePreset: BellSchedulePreset | null;
  displayJadwal: JadwalPelajaran[];
  pegawaiMap: Record<string, Pegawai>;
  rombelMap: Record<string, Rombel>;
  mapelMap: Record<string, MataPelajaran>;
  onSlotClick: (j: JadwalPelajaran) => void;
  onEmptyClick?: (hari: string, jam_mulai: string, jam_selesai: string) => void;
}

/** Menghitung rentang waktu kanvas (dari slot paling awal – paling akhir) */
function useCanvasBounds(
  displayJadwal: JadwalPelajaran[],
  activePreset: BellSchedulePreset | null
) {
  return useMemo(() => {
    let earliest = BASELINE_MINUTES; // 06:00 default
    let latest = 15 * 60; // 15:00 default

    // Dari jadwal KBM
    displayJadwal.forEach((j) => {
      const start = timeToMinutes(j.jam_mulai);
      const end = timeToMinutes(j.jam_selesai);
      if (start < earliest) earliest = start;
      if (end > latest) latest = end;
    });

    // Dari preset rutinitas
    if (activePreset) {
      activePreset.slots.forEach((s) => {
        const start = timeToMinutes(s.jam_mulai);
        const end = timeToMinutes(s.jam_selesai);
        if (start < earliest) earliest = start;
        if (end > latest) latest = end;
      });
    }

    // Snap ke jam penuh terdekat (floor/ceil)
    earliest = Math.floor(earliest / 60) * 60;
    latest = Math.ceil(latest / 60) * 60;

    return { earliest, latest, totalHeight: (latest - earliest) * SCALE };
  }, [displayJadwal, activePreset]);
}

/** Mendeteksi konflik waktu untuk split-column rendering */
function useConflictGroups(displayJadwal: JadwalPelajaran[]) {
  return useMemo(() => {
    const groups: Record<string, JadwalPelajaran[][]> = {};

    HARI_LIST.forEach((hari) => {
      const daySlots = displayJadwal
        .filter((j) => j.hari === hari)
        .sort((a, b) => timeToMinutes(a.jam_mulai) - timeToMinutes(b.jam_mulai));

      const conflictClusters: JadwalPelajaran[][] = [];
      let currentCluster: JadwalPelajaran[] = [];
      let clusterEnd = -1;

      daySlots.forEach((slot) => {
        const start = timeToMinutes(slot.jam_mulai);
        const end = timeToMinutes(slot.jam_selesai);

        if (currentCluster.length === 0 || start < clusterEnd) {
          // Irisan terdeteksi → gabung ke cluster
          currentCluster.push(slot);
          clusterEnd = Math.max(clusterEnd, end);
        } else {
          // Tidak irisan → simpan cluster lama, mulai baru
          if (currentCluster.length > 0) conflictClusters.push(currentCluster);
          currentCluster = [slot];
          clusterEnd = end;
        }
      });

      if (currentCluster.length > 0) conflictClusters.push(currentCluster);
      groups[hari] = conflictClusters;
    });

    return groups;
  }, [displayJadwal]);
}

/** Ikon sesuai tipe rutinitas */
function RoutineIcon({ tipe }: { tipe: MasterPeriodSlot["tipe"] }) {
  switch (tipe) {
    case "UPACARA":
      return <Flag size={10} />;
    case "IBADAH":
    case "ISHOMA":
      return <Sun size={10} />;
    case "SENAM":
      return <Sparkles size={10} />;
    default:
      return <Coffee size={10} />;
  }
}

/** Warna background pita rutinitas sesuai tipe */
function getRoutineBandStyle(tipe: MasterPeriodSlot["tipe"]): React.CSSProperties {
  switch (tipe) {
    case "UPACARA":
      return { backgroundColor: "var(--color-amber-soft)", borderLeft: "3px solid var(--color-amber)" };
    case "IBADAH":
    case "ISHOMA":
      return { backgroundColor: "var(--color-success-soft)", borderLeft: "3px solid var(--color-success)" };
    case "SENAM":
      return { backgroundColor: "var(--color-info-soft)", borderLeft: "3px solid var(--color-info)" };
    default:
      return { backgroundColor: "var(--color-neutral-soft)", borderLeft: "3px solid var(--color-muted)" };
  }
}

export function JadwalCanvasView({
  activePreset,
  displayJadwal,
  pegawaiMap,
  rombelMap,
  mapelMap,
  onSlotClick,
  onEmptyClick,
}: JadwalCanvasViewProps) {
  const { earliest, latest, totalHeight } = useCanvasBounds(displayJadwal, activePreset);
  const conflictGroups = useConflictGroups(displayJadwal);

  // Garis grid: setiap 30 menit
  const gridLines = useMemo(() => {
    const lines: { minutes: number; isHour: boolean }[] = [];
    for (let m = earliest; m <= latest; m += 30) {
      lines.push({ minutes: m, isHour: m % 60 === 0 });
    }
    return lines;
  }, [earliest, latest]);

  // Timeline labels: setiap jam penuh
  const timeLabels = useMemo(() => {
    const labels: { minutes: number; label: string }[] = [];
    for (let m = earliest; m <= latest; m += 60) {
      labels.push({ minutes: m, label: formatTime(m) });
    }
    return labels;
  }, [earliest, latest]);

  // Now line position
  const nowMinutes = useMemo(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, []);

  const showNowLine = nowMinutes >= earliest && nowMinutes <= latest;

  const handleColumnClick = (e: React.MouseEvent<HTMLDivElement>, hari: string) => {
    if (!onEmptyClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const clickedMinutes = earliest + Math.floor(y / SCALE);
    
    // Snap ke kelipatan 5 menit
    const snappedMinutes = Math.floor(clickedMinutes / 5) * 5;
    
    // Default durasi 1 JP sesuai master jam (misal 40 menit)
    const duration = activePreset?.durasiJpMenit ?? 40;
    
    const startStr = formatTime(snappedMinutes);
    const endStr = formatTime(snappedMinutes + duration);
    
    onEmptyClick(hari, startStr, endStr);
  };

  return (
    <div className="w-full overflow-x-auto">
      {/* === HEADER ROW (inline grid matching the canvas) === */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "56px repeat(6, 1fr)",
        }}
      >
        {/* Timeline header corner */}
        <div className="calendar-day-header" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <span className="text-caption text-muted">Jam</span>
        </div>
        {/* Day headers */}
        {HARI_LIST.map((hari) => (
          <div key={hari} className="calendar-day-header">
            <span className="text-label text-ink">{hari}</span>
          </div>
        ))}
      </div>

      {/* === SCROLLABLE CANVAS BODY === */}
      <div
        className="overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 340px)" }}
      >
        <div
          className="calendar-canvas"
          style={{
            height: totalHeight,
            gridTemplateRows: "1fr",
            minHeight: totalHeight,
            border: "none",
            borderRadius: 0,
          }}
        >
          {/* ---- TIMELINE COLUMN ---- */}
          <div className="calendar-timeline" style={{ height: totalHeight }}>
            {timeLabels.map((tl) => (
              <div
                key={tl.minutes}
                className="calendar-time-label text-caption text-muted"
                style={{ top: minutesToPx(tl.minutes) - minutesToPx(earliest) }}
              >
                {tl.label}
              </div>
            ))}
          </div>

          {/* ---- 6 DAY COLUMNS ---- */}
          {HARI_LIST.map((hari) => {
            const routines = activePreset
              ? getInstitutionalRoutinesForDay(hari, activePreset)
              : [];
            const clusters = conflictGroups[hari] ?? [];

            return (
              <div
                key={hari}
                className="calendar-day-column"
                style={{ 
                  height: totalHeight,
                  cursor: onEmptyClick ? "crosshair" : "default"
                }}
                onClick={(e) => handleColumnClick(e, hari)}
              >
                {/* Grid lines */}
                {gridLines.map((gl) => (
                  <div
                    key={gl.minutes}
                    className={`calendar-grid-line ${gl.isHour ? "calendar-grid-line-hour" : ""}`}
                    style={{ top: minutesToPx(gl.minutes) - minutesToPx(earliest) }}
                  />
                ))}

                {/* Now line */}
                {showNowLine && (
                  <div
                    className="calendar-now-line"
                    style={{ top: minutesToPx(nowMinutes) - minutesToPx(earliest) }}
                  />
                )}

                {/* Routine bands (Upacara, Dhuha, Istirahat, Ishoma, Senam) */}
                {routines.map((r) => {
                  const top = minutesToPx(timeToMinutes(r.jam_mulai)) - minutesToPx(earliest);
                  const height = minutesToPx(timeToMinutes(r.jam_selesai)) - minutesToPx(timeToMinutes(r.jam_mulai));

                  return (
                    <div
                      key={r.id_slot}
                      className="calendar-routine-band"
                      style={{
                        top,
                        height: Math.max(height, 4),
                        ...getRoutineBandStyle(r.tipe),
                      }}
                    >
                      {height >= 24 && (
                        <span className="text-caption text-muted" style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                          <RoutineIcon tipe={r.tipe} />
                          <span style={{ opacity: 0.9 }}>{r.nama}</span>
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* KBM Slot Cards */}
                {clusters.map((cluster) => {
                  const clusterSize = cluster.length;
                  const isConflict = clusterSize > 1;

                  return cluster.map((j, idx) => {
                    const m = mapelMap[j.id_mapel];
                    const p = pegawaiMap[j.id_pegawai];
                    const r = rombelMap[j.id_rombel];
                    const isAgama = m?.kelompok_mapel === "Agama";

                    const top = minutesToPx(timeToMinutes(j.jam_mulai)) - minutesToPx(earliest);
                    const height = minutesToPx(timeToMinutes(j.jam_selesai)) - minutesToPx(timeToMinutes(j.jam_mulai));

                    // Split column jika konflik
                    const widthPct = isConflict ? `${100 / clusterSize}%` : undefined;
                    const leftPct = isConflict ? `${(idx * 100) / clusterSize}%` : undefined;

                    return (
                      <div
                        key={j.id_jadwal}
                        className="calendar-slot-card"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSlotClick(j);
                        }}
                        style={{
                          top,
                          height: Math.max(height, 20),
                          ...(isConflict
                            ? { left: leftPct, right: "auto", width: widthPct }
                            : {}),
                          borderColor: isAgama
                            ? "var(--color-success-border)"
                            : "var(--color-primary-border)",
                        }}
                      >
                        {/* Accent strip kiri */}
                        <div
                          className="calendar-slot-card-accent"
                          style={{
                            backgroundColor: isAgama
                              ? "var(--color-success)"
                              : "var(--color-primary)",
                          }}
                        />

                        {/* Card content */}
                        <div style={{ padding: "var(--space-xs) var(--space-xs) var(--space-xs) var(--space-sm)", marginLeft: "3px", overflow: "hidden", flex: 1, display: "flex", flexDirection: "column", gap: "1px" }}>
                          {/* Subject + Rombel */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "2px" }}>
                            <span className="text-caption text-ink" style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textTransform: "uppercase", flex: 1 }}>
                              {m?.nama_mapel ?? j.id_mapel}
                            </span>
                            {height >= 36 && (
                              <span className="text-caption text-ink" style={{ fontWeight: 700, backgroundColor: "var(--color-paper)", border: "1px solid var(--color-border)", padding: "0 var(--space-xs)", borderRadius: "var(--radius-sm)", flexShrink: 0 }}>
                                {r?.nama_rombel ?? j.id_rombel}
                              </span>
                            )}
                          </div>

                          {/* Teacher (hanya jika tinggi cukup) */}
                          {height >= 48 && (
                            <div className="text-caption text-muted" style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)", overflow: "hidden" }}>
                              <User size={10} style={{ flexShrink: 0 }} />
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {p?.nama_lengkap_gelar ?? j.id_pegawai}
                              </span>
                            </div>
                          )}

                          {/* Time range (hanya jika tinggi cukup) */}
                          {height >= 60 && (
                            <span className="text-caption text-muted" style={{ fontVariantNumeric: "tabular-nums" }}>
                              {j.jam_mulai} – {j.jam_selesai}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  });
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
