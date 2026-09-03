"use client";

import { ArrowLeftRight, Shield, FileText, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApprovalToolbarProps {
  activeTab: "all" | "pindah_rombel" | "mutasi" | "surat_dinas";
  setActiveTab: (tab: "all" | "pindah_rombel" | "mutasi" | "surat_dinas") => void;
  totalCount: number;
  pindahCount: number;
  mutasiCount: number;
  suratCount: number;
  filteredCount: number;
  selectedCount: number;
  onToggleSelectAll: () => void;
  isKamad?: boolean;
}

export function ApprovalToolbar({
  activeTab,
  setActiveTab,
  totalCount,
  pindahCount,
  mutasiCount,
  suratCount,
  filteredCount,
  selectedCount,
  onToggleSelectAll,
  isKamad = true,
}: ApprovalToolbarProps) {
  const isAllSelected = filteredCount > 0 && selectedCount === filteredCount;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={activeTab === "all" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setActiveTab("all")}
          className="flex items-center gap-1.5 font-bold"
        >
          <span>Semua Pengajuan</span>
          <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px]">{totalCount}</span>
        </Button>
        <Button
          type="button"
          variant={activeTab === "pindah_rombel" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setActiveTab("pindah_rombel")}
          className="flex items-center gap-1.5 font-bold"
        >
          <ArrowLeftRight size={13} />
          <span>Pindah Rombel Lintas Tingkat</span>
          <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px]">{pindahCount}</span>
        </Button>
        <Button
          type="button"
          variant={activeTab === "mutasi" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setActiveTab("mutasi")}
          className="flex items-center gap-1.5 font-bold"
        >
          <Shield size={13} />
          <span>Mutasi Masuk / Keluar</span>
          <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px]">{mutasiCount}</span>
        </Button>
        <Button
          type="button"
          variant={activeTab === "surat_dinas" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setActiveTab("surat_dinas")}
          className="flex items-center gap-1.5 font-bold"
        >
          <FileText size={13} />
          <span>Surat Dinas</span>
          <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px]">{suratCount}</span>
        </Button>
      </div>

      {isKamad && filteredCount > 0 && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onToggleSelectAll}
          className="flex items-center gap-1.5 text-xs font-semibold"
        >
          {isAllSelected ? (
            <CheckSquare size={14} className="text-primary" />
          ) : (
            <Square size={14} className="text-muted" />
          )}
          <span>
            {isAllSelected ? "Batalkan Pilihan Semua" : "Pilih Semua Pengajuan"}
          </span>
        </Button>
      )}
    </div>
  );
}
