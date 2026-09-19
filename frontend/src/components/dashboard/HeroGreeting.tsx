"use client";

import type { CapabilitiesMap } from "./widget-registry";
import { Sparkles, ShieldCheck, UserCheck } from "lucide-react";

export interface HeroGreetingProps {
  nama: string;
  nip?: string | null;
  tugasUtama?: string | null;
  capabilities: CapabilitiesMap;
  pendingCount: number;
}

export function HeroGreeting({ nama, nip, tugasUtama, capabilities, pendingCount }: HeroGreetingProps) {
  // Build readable role badges
  const activeRoles: string[] = [];
  if (capabilities.isKepalaMadrasah) activeRoles.push("Kepala Madrasah");
  if (capabilities.isAdminMadrasah) activeRoles.push("Admin Madrasah");
  if (capabilities.isOperatorKesiswaan) activeRoles.push("Operator Kesiswaan");
  if (capabilities.isWaliKelas) activeRoles.push("Wali Kelas");
  if (capabilities.isGuruBk) activeRoles.push("Guru BK");
  if (capabilities.isPembinaEkstrakurikuler) activeRoles.push("Pembina Ekskul");
  if (capabilities.isPengajar) activeRoles.push("Guru Pengajar");
  if (capabilities.isTendik && !capabilities.isKepalaMadrasah) activeRoles.push("Tendik");

  return (
    <div className="mb-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white shadow-md relative overflow-hidden">
      {/* Background Subtle Pattern */}
      <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
        <Sparkles size={200} />
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 border border-emerald-400/30">
              <ShieldCheck size={13} /> SSoT Identity Verified
            </span>
            <span className="text-[11px] text-slate-300">Tahun Ajaran 2025/2026 Ganjil</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Selamat Pagi, {nama} 👋
          </h2>

          <p className="text-xs text-slate-300">
            {tugasUtama ? `Tugas Utama: ${tugasUtama}` : "Pegawai Terdaftar"}
          </p>

          {/* Active Role Badges */}
          <div className="pt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Penugasan Aktif:</span>
            {activeRoles.map((role, idx) => (
              <span
                key={idx}
                className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white border border-white/15"
              >
                {role}
              </span>
            ))}
          </div>
        </div>

        {/* Quick Pending Status Badge */}
        {pendingCount > 0 && (
          <div className="bg-amber-500/20 border border-amber-400/30 p-3 rounded-xl text-amber-200 text-xs shrink-0 flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center">
              {pendingCount}
            </div>
            <div>
              <p className="font-bold">Antrean Pending TTD</p>
              <p className="text-[10px] text-amber-300/80">Perlu tindakan pengesahan Anda</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
