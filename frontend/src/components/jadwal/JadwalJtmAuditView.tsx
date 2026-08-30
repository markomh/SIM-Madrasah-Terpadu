"use client";

import { CheckCircle, AlertCircle, XCircle } from "lucide-react";
import type { MataPelajaran, Rombel } from "@/types";

interface TeacherJtmItem {
  pegawai: {
    id_pegawai: string;
    nama_lengkap_gelar: string;
    nip: string | null;
  };
  slotCount: number;
  totalJtm: number;
  statusJtm: "UNDERLOAD" | "IDEAL" | "OVERLOAD";
  slots: {
    id_jadwal: string;
    id_rombel: string;
    id_mapel: string;
    hari: string;
  }[];
}

interface JadwalJtmAuditViewProps {
  teacherJtmList: TeacherJtmItem[];
  rombelMap: Record<string, Rombel>;
  mapelMap: Record<string, MataPelajaran>;
}

export function JadwalJtmAuditView({
  teacherJtmList,
  rombelMap,
  mapelMap,
}: JadwalJtmAuditViewProps) {
  return (
    <>
      <div className="border-b border-border bg-paper p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-ink">Audit Pemenuhan Beban Kerja Guru (Simpatika / EMIS GTK)</h3>
            <p className="text-xs text-muted mt-0.5">
              Standar Tunjangan Profesi Guru (TPG): <strong>Minimal 24 JTM</strong> dan <strong>Maksimal 37.5 JTM</strong> per minggu.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle size={13} /> Ideal (24–37.5 JTM)
            </span>
            <span className="flex items-center gap-1 text-amber-600">
              <AlertCircle size={13} /> Kurang (&lt; 24 JTM)
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <XCircle size={13} /> Overload (&gt; 37.5 JTM)
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-paper text-muted">
              <th className="p-3 font-bold uppercase tracking-wider w-10 text-center">No</th>
              <th className="p-3 font-bold uppercase tracking-wider min-w-[200px]">Nama Guru & Gelar</th>
              <th className="p-3 font-bold uppercase tracking-wider w-28 text-center">Total Slot KBM</th>
              <th className="p-3 font-bold uppercase tracking-wider w-44 text-center">JTM Terjadwal (Sertifikasi)</th>
              <th className="p-3 font-bold uppercase tracking-wider w-40 text-center">Status Pemenuhan TPG</th>
              <th className="p-3 font-bold uppercase tracking-wider min-w-[250px]">Rincian Rombel & Mapel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {teacherJtmList.map((t, idx) => (
              <tr key={t.pegawai.id_pegawai} className="hover:bg-paper/30 transition-colors">
                <td className="p-3 text-center text-muted font-medium">{idx + 1}</td>
                <td className="p-3">
                  <p className="font-bold text-ink">{t.pegawai.nama_lengkap_gelar}</p>
                  <p className="text-[11px] text-muted">NIP/NIP: {t.pegawai.nip ?? "-"}</p>
                </td>
                <td className="p-3 text-center font-bold text-ink">{t.slotCount} Sesi</td>
                <td className="p-3 text-center font-extrabold text-sm text-primary">{t.totalJtm} JTM</td>
                <td className="p-3 text-center">
                  {t.statusJtm === "IDEAL" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle size={12} /> Memenuhi (24+ JTM)
                    </span>
                  ) : t.statusJtm === "UNDERLOAD" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-soft px-2.5 py-1 text-xs font-bold text-amber">
                      <AlertCircle size={12} /> Kurang ({t.totalJtm} JTM)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-1 text-xs font-bold text-danger">
                      <XCircle size={12} /> Overload (&gt; 37.5 JTM)
                    </span>
                  )}
                </td>
                <td className="p-3 text-muted">
                  {t.slots.length === 0 ? (
                    <span className="italic text-xs">Belum ada jadwal mengajar</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {t.slots.map((s) => (
                        <span
                          key={s.id_jadwal}
                          className="rounded bg-paper px-1.5 py-0.5 text-[10px] font-semibold text-ink border border-border"
                        >
                          {rombelMap[s.id_rombel]?.nama_rombel}: {mapelMap[s.id_mapel]?.kode_mapel} ({s.hari})
                        </span>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
