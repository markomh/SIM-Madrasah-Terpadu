"use client";

import { Megaphone, Calendar, ChevronRight } from "lucide-react";

export function UniversalAnnouncement() {
  return (
    <div className="mb-6 rounded-xl border border-amber/30 bg-amber-soft/40 p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber text-white font-bold">
          <Megaphone size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber text-white text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
              Pengumuman Madrasah
            </span>
            <span className="text-[11px] text-muted flex items-center gap-1">
              <Calendar size={12} /> 20 September 2026
            </span>
          </div>
          <h4 className="mt-1 text-xs font-bold text-ink truncate">
            Rapat Paripurna Persiapan Ujian Tengah Semester (UTS) Ganjil
          </h4>
          <p className="mt-0.5 text-xs text-muted leading-relaxed line-clamp-2">
            Mohon seluruh Dewan Guru & Pengajar membawa draf kisi-kisi soal UTS dan rekapitulasi JTM mengajar. Pelaksanaan pukul 13.00 WITA di Ruang Rapat Utama.
          </p>
        </div>
      </div>
    </div>
  );
}
