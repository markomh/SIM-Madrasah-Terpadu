"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ArrowRight, UserCheck, Calendar } from "lucide-react";
import { SurfaceCard, Button } from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import { services } from "@/services";
import type { JadwalPelajaran, Rombel } from "@/types";

interface JadwalMengajarHariIniWidgetProps {
  jadwalList: JadwalPelajaran[];
  rombelList: Rombel[];
  currentUserId?: string;
  onOpenPresensi: () => void;
  onOpenJadwalLengkap: () => void;
}

export function JadwalMengajarHariIniWidget({
  jadwalList,
  rombelList,
  currentUserId,
  onOpenPresensi,
  onOpenJadwalLengkap,
}: JadwalMengajarHariIniWidgetProps) {
  const [mapelMap, setMapelMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    services.referensi
      .getMapel()
      .then((mapels) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        (mapels || []).forEach((m) => {
          map[m.id_mapel] = m.nama_mapel;
        });
        setMapelMap(map);
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, []);

  const dayNamesIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const now = new Date();
  const todayDayName = dayNamesIndo[now.getDay()];

  // Filter user's schedule
  const myJadwal = jadwalList.filter(
    (j) =>
      j.id_pegawai === currentUserId ||
      (j.id_pengajar_tambahan && j.id_pengajar_tambahan.includes(currentUserId ?? ""))
  );

  const todayJadwal = myJadwal.filter((j) => j.hari === todayDayName);
  const displayJadwal = todayJadwal.length > 0 ? todayJadwal : myJadwal.slice(0, 3);
  const limitedJadwal = displayJadwal.slice(0, 3);

  // Current time in HH:mm
  const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const dateFormatted = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <SurfaceCard className="p-4 sm:p-5 border border-border/80 rounded-xl shadow-xs space-y-4">
      {/* Compact Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Calendar size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              Jadwal Mengajar Hari Ini
              <span className="rounded-md bg-paper px-2 py-0.5 text-[11px] font-medium text-muted border border-border/60">
                {dateFormatted}
              </span>
            </h3>
            <p className="text-xs text-muted">Sesi KBM & jurnal tatap muka terdaftar</p>
          </div>
        </div>

        {/* Single Compact Header Link */}
        <button
          type="button"
          onClick={onOpenJadwalLengkap}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all cursor-pointer"
        >
          <span>Lihat Semua ({todayJadwal.length || displayJadwal.length} Sesi)</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* DataTable UI Primitive */}
      <DataTable<JadwalPelajaran>
        data={limitedJadwal}
        pageSize={3}
        emptyTitle="Tidak Ada Jadwal Hari Ini"
        emptyDescription="Anda tidak memiliki jadwal mengajar tatap muka yang terdaftar pada hari ini."
        columns={[
          {
            key: "waktu",
            header: "Jam Sesi",
            render: (j) => (
              <span className="font-mono font-semibold text-ink">
                {j.jam_mulai} – {j.jam_selesai}
              </span>
            ),
          },
          {
            key: "rombel",
            header: "Rombel",
            render: (j) => {
              const rombelObj = rombelList.find((r) => r.id_rombel === j.id_rombel);
              return (
                <span className="font-bold text-ink">
                  {rombelObj ? `Kelas ${rombelObj.nama_rombel}` : `Rombel ${j.id_rombel}`}
                </span>
              );
            },
          },
          {
            key: "mapel",
            header: "Mata Pelajaran",
            render: (j) => (
              <span className="font-medium text-ink">
                {mapelMap[j.id_mapel] || "Mata Pelajaran"}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status Sesi",
            render: (j) => {
              let statusSesi: "selesai" | "berlangsung" | "terjadwal" = "terjadwal";
              if (currentTimeStr > j.jam_selesai) {
                statusSesi = "selesai";
              } else if (currentTimeStr >= j.jam_mulai && currentTimeStr <= j.jam_selesai) {
                statusSesi = "berlangsung";
              }

              if (statusSesi === "berlangsung") {
                return (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-soft px-2 py-0.5 text-[10px] font-bold text-amber border border-amber/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber animate-pulse" /> Berlangsung
                  </span>
                );
              }
              if (statusSesi === "selesai") {
                return (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/30">
                    <CheckCircle2 size={11} /> Selesai
                  </span>
                );
              }
              return (
                <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 text-[10px] font-semibold text-muted border border-border">
                  Terjadwal
                </span>
              );
            },
          },
          {
            key: "aksi",
            header: <span className="text-right block">Aksi Cepat</span>,
            className: "text-right",
            render: (j) => {
              let statusSesi: "selesai" | "berlangsung" | "terjadwal" = "terjadwal";
              if (currentTimeStr > j.jam_selesai) {
                statusSesi = "selesai";
              } else if (currentTimeStr >= j.jam_mulai && currentTimeStr <= j.jam_selesai) {
                statusSesi = "berlangsung";
              }

              return (
                <Button
                  type="button"
                  size="sm"
                  variant={statusSesi === "berlangsung" ? "primary" : "secondary"}
                  onClick={onOpenPresensi}
                  className="py-1 px-2.5 text-xs font-bold shadow-2xs"
                >
                  <UserCheck size={12} className="mr-1" />
                  {statusSesi === "selesai" ? "Lihat Presensi" : "Presensi"}
                </Button>
              );
            },
          },
        ]}
      />
    </SurfaceCard>
  );
}
