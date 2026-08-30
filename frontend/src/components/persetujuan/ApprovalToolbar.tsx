"use client";

import { ArrowLeftRight, Shield, FileText, CheckSquare, Square } from "lucide-react";

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
}: ApprovalToolbarProps) {
  const isAllSelected = filteredCount > 0 && selectedCount === filteredCount;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
            activeTab === "all"
              ? "bg-primary text-white shadow-sm"
              : "border border-border bg-surface text-ink hover:bg-paper"
          }`}
        >
          <span>Semua Pengajuan</span>
          <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px]">{totalCount}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pindah_rombel")}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
            activeTab === "pindah_rombel"
              ? "bg-primary text-white shadow-sm"
              : "border border-border bg-surface text-ink hover:bg-paper"
          }`}
        >
          <ArrowLeftRight size={13} />
          <span>Pindah Rombel Lintas Tingkat</span>
          <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px]">{pindahCount}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("mutasi")}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
            activeTab === "mutasi"
              ? "bg-primary text-white shadow-sm"
              : "border border-border bg-surface text-ink hover:bg-paper"
          }`}
        >
          <Shield size={13} />
          <span>Mutasi Masuk / Keluar</span>
          <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px]">{mutasiCount}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("surat_dinas")}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
            activeTab === "surat_dinas"
              ? "bg-primary text-white shadow-sm"
              : "border border-border bg-surface text-ink hover:bg-paper"
          }`}
        >
          <FileText size={13} />
          <span>Surat Dinas</span>
          <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px]">{suratCount}</span>
        </button>
      </div>

      {filteredCount > 0 && (
        <button
          type="button"
          onClick={onToggleSelectAll}
          className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-paper"
        >
          {isAllSelected ? (
            <CheckSquare size={14} className="text-primary" />
          ) : (
            <Square size={14} className="text-muted" />
          )}
          <span>
            {isAllSelected ? "Batalkan Pilihan Semua" : "Pilih Semua Pengajuan"}
          </span>
        </button>
      )}
    </div>
  );
}
