"use client";

import { SurfaceCard } from "@/components/ui/primitives";
import { UserCheck, RefreshCw, FileSpreadsheet, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface OperatorKesiswaanWidgetProps {
  siswaCount?: number;
}

export function OperatorKesiswaanWidget({ siswaCount }: OperatorKesiswaanWidgetProps) {
  return (
    <SurfaceCard className="p-5 border border-border/80 rounded-xl shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-soft text-indigo-600">
            <UserCheck size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              Layanan Operator Kesiswaan & Verval EMIS
            </h3>
            <p className="text-xs text-muted">Pengelolaan data induk siswa, kenaikan kelas & sinkronisasi</p>
          </div>
        </div>

        <span className="rounded-md bg-indigo-soft px-2.5 py-1 text-xs font-bold text-indigo-700">
          {siswaCount} Siswa Aktif
        </span>
      </div>

      {/* Grid Quick Action Cards untuk Operator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Data Induk & Verval NISN */}
        <div className="p-3.5 rounded-lg bg-surface-subtle border border-border/50 space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <ShieldCheck size={15} className="text-emerald-600" />
              <span>Validasi NISN & Verval PD</span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              Verifikasi NIK, NISN, dan kelengkapan data siswa terdaftar.
            </p>
          </div>
          <Link
            href="/kesiswaan/siswa"
            className="pt-2 text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            Kelola Data Siswa <ArrowRight size={13} />
          </Link>
        </div>

        {/* Card 2: Kenaikan Kelas & Rombel */}
        <div className="p-3.5 rounded-lg bg-surface-subtle border border-border/50 space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <RefreshCw size={15} className="text-blue-600" />
              <span>Kenaikan Kelas & Rombel</span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              Pemetaan rombel massal & transaksi perpindahan kelas siswa.
            </p>
          </div>
          <Link
            href="/kesiswaan/rombel"
            className="pt-2 text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            Kelola Rombel <ArrowRight size={13} />
          </Link>
        </div>

        {/* Card 3: Ekspor Data EMIS */}
        <div className="p-3.5 rounded-lg bg-surface-subtle border border-border/50 space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <FileSpreadsheet size={15} className="text-amber-600" />
              <span>Ekspor EMIS 4.0 & Verval</span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              Generate berkas ekspor format resmi Kemenag & Verval PD.
            </p>
          </div>
          <Link
            href="/kesiswaan/siswa"
            className="pt-2 text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            Ekspor Data Siswa <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </SurfaceCard>
  );
}
