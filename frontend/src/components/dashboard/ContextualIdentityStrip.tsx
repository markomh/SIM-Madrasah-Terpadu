"use client";

import type { CapabilitiesMap } from "./widget-registry";
import { User, Calendar, ShieldCheck } from "lucide-react";

export interface ContextualIdentityStripProps {
  nama: string;
  nip?: string | null;
  capabilities: CapabilitiesMap;
}

export function ContextualIdentityStrip({ nama, nip, capabilities }: ContextualIdentityStripProps) {
  // Build readable active roles list
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
    <div className="mb-4 py-2 px-3.5 rounded-lg bg-surface border border-border flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-2xs">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 font-bold text-ink">
          <User size={14} className="text-primary" />
          <span>{nama} </span>
        </div>

        <div className="flex flex-wrap items-center gap-1 ml-1">
          {activeRoles.map((role, idx) => (
            <span
              key={idx}
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/20"
            >
              {role}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-muted font-medium">
        <Calendar size={13} className="text-muted-ink" />
        <span>Tahun Ajaran 2025/2026 — Semester Ganjil</span>
      </div>
    </div>
  );
}
