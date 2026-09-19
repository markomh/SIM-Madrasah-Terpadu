"use client";

import type { CapabilitiesMap } from "./widget-registry";
import { PlusCircle, Megaphone, CalendarPlus, UserPlus, Edit3, Calendar } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/toast-context";

import type { PresentationContextFilter } from "./ContextFilterBar";

export interface QuickActionBarProps {
  capabilities: CapabilitiesMap;
  activeFilter: PresentationContextFilter;
  onOpenDrawer: (drawerType: "presensi" | "bk" | "approval" | "izin") => void;
}

export function QuickActionBar({ capabilities, activeFilter, onOpenDrawer }: QuickActionBarProps) {
  const { toast } = useToast();

  const handleCreateAnnouncement = () => {
    toast("Form Buat Pengumuman Baru dibuka", "info");
  };

  const handleDelegateTask = () => {
    toast("Form Delegasi Tugas Pegawai dibuka", "info");
  };

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 p-3 bg-surface rounded-lg border border-border shadow-2xs">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-ink flex items-center gap-1.5">
          <PlusCircle size={14} className="text-primary" />
          Aksi Cepat (Create Only):
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Universal Actions for Teachers */}
        {capabilities.isPengajar && (activeFilter === "semua" || activeFilter === "pengajar") && (
          <>
            <Link
              href="/akademik/nilai"
              className="px-2.5 py-1 rounded bg-info-soft text-info hover:bg-info hover:text-white text-xs font-semibold transition inline-flex items-center gap-1"
            >
              <Edit3 size={13} /> + Input Nilai Harian
            </Link>
            <Link
              href="/akademik/jadwal"
              className="px-2.5 py-1 rounded bg-paper border border-border text-ink hover:bg-surface text-xs font-semibold transition inline-flex items-center gap-1"
            >
              <Calendar size={13} /> + Lihat Jadwal
            </Link>
          </>
        )}

        {(capabilities.isKepalaMadrasah || capabilities.isAdminMadrasah || capabilities.isOperatorKesiswaan) && 
         (activeFilter === "semua" || activeFilter === "manajerial") && (
          <button
            onClick={handleCreateAnnouncement}
            className="px-2.5 py-1 rounded bg-primary-soft text-primary hover:bg-primary hover:text-white text-xs font-semibold transition inline-flex items-center gap-1"
          >
            <Megaphone size={13} /> + Buat Pengumuman
          </button>
        )}

        {capabilities.isKepalaMadrasah && (activeFilter === "semua" || activeFilter === "manajerial") && (
          <button
            onClick={handleDelegateTask}
            className="px-2.5 py-1 rounded bg-amber-soft text-amber hover:bg-amber hover:text-white text-xs font-semibold transition inline-flex items-center gap-1"
          >
            <UserPlus size={13} /> + Delegasikan Tugas
          </button>
        )}

        {(capabilities.isGuruBk || capabilities.isWaliKelas) && (activeFilter === "semua" || activeFilter === "bk" || activeFilter === "walikelas") && (
          <button
            onClick={() => onOpenDrawer("bk")}
            className="px-2.5 py-1 rounded bg-danger-soft text-danger hover:bg-danger hover:text-white text-xs font-semibold transition inline-flex items-center gap-1"
          >
            <Edit3 size={13} /> + Catat Kasus Siswa
          </button>
        )}

        <button
          onClick={() => onOpenDrawer("izin")}
          className="px-2.5 py-1 rounded border border-border bg-paper hover:bg-surface text-ink text-xs font-semibold transition inline-flex items-center gap-1"
        >
          <CalendarPlus size={13} /> + Ajukan Izin Pegawai
        </button>
      </div>
    </div>
  );
}
