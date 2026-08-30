"use client";

import { CheckCircle2 } from "lucide-react";
import { SurfaceCard } from "@/components/ui/primitives";
import type { Rombel } from "@/types";

interface KenaikanMonitoringViewProps {
  rombel: Rombel[];
  pemetaan: any[];
  anggotaAktif: any[];
  getTingkatNumber: (r?: Rombel | null) => number;
}

export function KenaikanMonitoringView({
  rombel,
  pemetaan,
  anggotaAktif,
  getTingkatNumber,
}: KenaikanMonitoringViewProps) {
  return (
    <div className="space-y-6">
      <SurfaceCard title="Rekapitulasi Pemetaan Kenaikan Rombel (Mode Monitoring)">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-paper border-b border-border text-muted font-bold">
                <th className="p-3">No</th>
                <th className="p-3">Rombel Asal</th>
                <th className="p-3">Tingkat Asal</th>
                <th className="p-3">Rombel Tujuan</th>
                <th className="p-3">Tingkat Tujuan</th>
                <th className="p-3 text-right">Jumlah Siswa</th>
                <th className="p-3">Status Pemetaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rombel.map((r, idx) => {
                const mapping = pemetaan.find((p) => p.id_rombel_asal === r.id_rombel);
                const targetRombelObj = mapping ? rombel.find((x) => x.id_rombel === mapping.id_rombel_tujuan) : null;
                const studentCount = anggotaAktif.filter((a) => a.id_rombel === r.id_rombel).length;
                return (
                  <tr key={r.id_rombel} className="hover:bg-paper/50">
                    <td className="p-3 font-semibold text-muted">{idx + 1}</td>
                    <td className="p-3 font-bold text-ink">{r.nama_rombel}</td>
                    <td className="p-3 font-medium text-muted">Tingkat {getTingkatNumber(r)}</td>
                    <td className="p-3 font-bold text-primary">{targetRombelObj?.nama_rombel ?? "—"}</td>
                    <td className="p-3 font-medium text-muted">
                      {targetRombelObj ? `Tingkat ${getTingkatNumber(targetRombelObj)}` : "—"}
                    </td>
                    <td className="p-3 text-right font-bold text-ink">{studentCount} Siswa</td>
                    <td className="p-3">
                      {mapping ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                          <CheckCircle2 size={11} className="text-emerald-500" /> Telah Dipetakan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200">
                          Belum Dipetakan
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  );
}
