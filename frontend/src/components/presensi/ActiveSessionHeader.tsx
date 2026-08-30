"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { SurfaceCard, ActionButton } from "@/components/ui/primitives";
import type { SesiTatapMuka, JadwalPelajaran, MataPelajaran } from "@/types";

interface ActiveSessionHeaderProps {
  sesi: SesiTatapMuka;
  jadwal: JadwalPelajaran;
  mapel?: MataPelajaran;
  onEdit: () => void;
}

export function ActiveSessionHeader({
  sesi,
  jadwal,
  mapel,
  onEdit,
}: ActiveSessionHeaderProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [startHour, startMin] = jadwal.jam_mulai.split(":").map(Number);
  const [endHour, endMin] = jadwal.jam_selesai.split(":").map(Number);

  const startTime = new Date(sesi.tanggal);
  startTime.setHours(startHour, startMin, 0, 0);

  const endTime = new Date(sesi.tanggal);
  endTime.setHours(endHour, endMin, 0, 0);

  const totalMs = endTime.getTime() - startTime.getTime();
  const elapsedMs = now.getTime() - startTime.getTime();
  const remainingMs = endTime.getTime() - now.getTime();

  const isFuture = now < startTime;
  const isFinished = now > endTime;

  let progress = 0;
  if (isFinished) progress = 100;
  else if (!isFuture) progress = (elapsedMs / totalMs) * 100;

  const remainingMins = Math.max(0, Math.floor(remainingMs / 60000));
  const remainingSecs = Math.max(0, Math.floor((remainingMs % 60000) / 1000));

  let statusText = "";
  let barColor = "bg-primary";
  let pulse = false;

  if (isFuture) {
    statusText = "Sesi Belum Dimulai";
    barColor = "bg-muted";
  } else if (isFinished) {
    statusText = "Sesi Selesai - Waktunya Pergantian Jam";
    barColor = "bg-muted/80";
  } else {
    statusText = `${remainingMins} Menit ${remainingSecs} Detik Tersisa`;
    if (remainingMins < 5) {
      barColor = "bg-amber-500";
      pulse = true;
    }
  }

  return (
    <SurfaceCard className="flex flex-col items-center text-center space-y-5 p-6 shadow-sm">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
          <Clock size={13} />
          <span>Sesi Pembelajaran Aktif</span>
        </div>
        <h3 className="text-xl font-bold text-ink mt-1">
          {mapel?.nama_mapel ?? "Mata Pelajaran"}
        </h3>
        <p className="text-xs text-muted">
          Pukul {jadwal.jam_mulai} – {jadwal.jam_selesai} • Semester {jadwal.semester}
        </p>
      </div>

      <div className="w-full max-w-md space-y-2">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-muted">{jadwal.jam_mulai}</span>
          <span className={`font-bold ${pulse ? "text-amber-500 animate-pulse" : "text-ink"}`}>
            {statusText}
          </span>
          <span className="text-muted">{jadwal.jam_selesai}</span>
        </div>
        <div className="h-3.5 w-full bg-paper rounded-full overflow-hidden border border-border/50">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${barColor}`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>

      <div className="pt-2 flex gap-3 text-xs w-full max-w-md justify-center">
        <div className="px-3.5 py-2 bg-paper rounded-lg border border-border flex-1 text-center">
          <p className="text-muted text-[10px] uppercase font-semibold">Waktu Presensi</p>
          <p className="font-bold text-ink mt-0.5">
            {sesi.waktu_input
              ? new Date(sesi.waktu_input).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-"}
          </p>
        </div>
        <div className="px-3.5 py-2 bg-paper rounded-lg border border-border flex-1 text-center">
          <p className="text-muted text-[10px] uppercase font-semibold">Status Kehadiran Guru</p>
          <p className="font-bold text-primary mt-0.5">{sesi.status_kehadiran_guru}</p>
        </div>
      </div>

      <div className="pt-2 flex flex-wrap gap-2 justify-center">
        <ActionButton
          capability={true} // everyone can click edit to view details
          type="button"
          onClick={onEdit}
          className="text-xs"
        >
          Lihat / Edit Presensi & Jurnal
        </ActionButton>
      </div>
    </SurfaceCard>
  );
}
