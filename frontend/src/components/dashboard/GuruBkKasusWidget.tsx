"use client";

import Link from "next/link";
import { Shield, ArrowRight, AlertTriangle, Plus } from "lucide-react";
import { SurfaceCard, Button } from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import type { Siswa } from "@/types";

interface GuruBkKasusWidgetProps {
  risiko: Siswa[];
  onOpenBkDrawer: () => void;
  onOpenAiDrawer: () => void;
}

export function GuruBkKasusWidget({
  risiko,
  onOpenBkDrawer,
  onOpenAiDrawer,
}: GuruBkKasusWidgetProps) {
  const displayRisiko = risiko.slice(0, 3);

  return (
    <SurfaceCard className="p-4 sm:p-5 border border-border/80 rounded-xl shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ai-soft text-ai">
            <Shield size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              Buku Kasus & Layanan BK
              <span className="rounded-md bg-paper px-2 py-0.5 text-[11px] font-medium text-muted border border-border/60">
                {risiko.length} Siswa Perhatian
              </span>
            </h3>
            <p className="text-xs text-muted">Bimbingan konseling & pemantauan indikator risiko kedisiplinan</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={onOpenBkDrawer}
            className="py-1.5 px-3 text-xs font-bold shadow-2xs"
          >
            <Plus size={13} className="mr-1" /> Catat BK
          </Button>
          <button
            type="button"
            onClick={onOpenAiDrawer}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ai-soft px-3 py-1.5 text-xs font-bold text-ai hover:bg-ai hover:text-white transition-all cursor-pointer"
          >
            <span>Detail AI Risk</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* DataTable UI Primitive */}
      <DataTable<Siswa>
        data={displayRisiko}
        pageSize={5}
        emptyTitle="Tidak Ada Kasus BK Aktif"
        emptyDescription="Semua siswa binaan dalam kondisi terpantau baik."
        columns={[
          {
            key: "nama_lengkap",
            header: "Nama Siswa",
            render: (s) => (
              <div>
                <span className="font-bold text-ink block">{s.nama_lengkap}</span>
                <span className="text-[11px] text-muted font-mono">NISN: {s.nisn}</span>
              </div>
            ),
          },
          {
            key: "skor_risiko_ai",
            header: "Indikator AI Risk",
            render: (s) => (
              <span className="inline-flex items-center gap-1 rounded-full bg-ai-soft px-2 py-0.5 text-[10px] font-bold text-ai border border-ai/30">
                <AlertTriangle size={11} /> Skor: {s.skor_risiko_ai ?? 75}%
              </span>
            ),
          },
          {
            key: "aksi",
            header: <span className="text-right block">Aksi Cepat</span>,
            className: "text-right",
            render: () => (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={onOpenBkDrawer}
                className="py-1 px-2.5 text-xs font-bold shadow-2xs"
              >
                + Bimbingan
              </Button>
            ),
          },
        ]}
      />
    </SurfaceCard>
  );
}
