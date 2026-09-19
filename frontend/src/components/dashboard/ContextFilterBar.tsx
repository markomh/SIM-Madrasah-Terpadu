"use client";

import type { CapabilitiesMap } from "./widget-registry";
import { Filter, Layers, BookOpen, Users, Shield, Building2, Trophy } from "lucide-react";

export type PresentationContextFilter =
  | "semua"
  | "pengajar"
  | "walikelas"
  | "ekstrakurikuler"
  | "bk"
  | "manajerial";

interface ContextFilterBarProps {
  capabilities: CapabilitiesMap;
  activeFilter: PresentationContextFilter;
  onFilterChange: (filter: PresentationContextFilter) => void;
  jadwalCount?: number;
  rombelLabel?: string;
  ekstraLabel?: string;
  risikoBkCount?: number;
}

export function ContextFilterBar({
  capabilities,
  activeFilter,
  onFilterChange,
  jadwalCount,
  rombelLabel,
  ekstraLabel,
  risikoBkCount,
}: ContextFilterBarProps) {
  const availableFilters: {
    id: PresentationContextFilter;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
  }[] = [
    { id: "semua", label: "Semua Ringkasan", icon: Layers },
  ];

  // 1. Tugas Utama / Kesiswaan / Struktural
  if (capabilities.isWaliKelas) {
    availableFilters.push({
      id: "walikelas",
      label: rombelLabel ? `Wali Kelas ${rombelLabel}` : "Wali Kelas",
      icon: Users,
    });
  }

  if (capabilities.isGuruBk) {
    availableFilters.push({
      id: "bk",
      label: "Bimbingan BK",
      icon: Shield,
      badge: risikoBkCount && risikoBkCount > 0 ? `${risikoBkCount} Kasus` : undefined,
    });
  }

  if (capabilities.isKepalaMadrasah) {
    availableFilters.push({ id: "manajerial", label: "Kepemimpinan Kamad", icon: Building2 });
  } else if (capabilities.isAdminMadrasah) {
    availableFilters.push({ id: "manajerial", label: "Admin & Manajerial", icon: Building2 });
  } else if (capabilities.isOperatorKesiswaan) {
    availableFilters.push({ id: "manajerial", label: "Operator Kesiswaan", icon: Building2 });
  }

  // 2. Tugas Mengajar / KBM
  if (capabilities.isPengajar) {
    availableFilters.push({
      id: "pengajar",
      label: "Guru Pengajar",
      icon: BookOpen,
      badge: jadwalCount && jadwalCount > 0 ? `${jadwalCount} Sesi` : undefined,
    });
  }

  // 3. Tugas Tambahan / Ekstrakurikuler
  if (capabilities.isPembinaEkstrakurikuler) {
    availableFilters.push({
      id: "ekstrakurikuler",
      label: ekstraLabel ? `Pembina ${ekstraLabel}` : "Pembina Ekskul",
      icon: Trophy,
    });
  }

  // If user only has 1 role group (semua + 1 tab = single jabatan), hide filter bar
  if (availableFilters.length <= 2) {
    return null;
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted mr-2">
        <Filter className="w-3.5 h-3.5 text-primary" />
        <span>Filter Konteks:</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {availableFilters.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onFilterChange(filter.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "bg-surface-subtle text-muted hover:text-ink hover:bg-surface-subtle/80 border border-border/40"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{filter.label}</span>
              {filter.badge !== undefined && (
                <span
                  className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-primary-soft text-primary border border-primary/20"
                  }`}
                >
                  {filter.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

