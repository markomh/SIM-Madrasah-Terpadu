"use client";

import { StatusBadge } from "@/components/ui/primitives";

interface RekapSesiPagiWidgetProps {
  rekapPagi: any;
}

export function RekapSesiPagiWidget({ rekapPagi }: RekapSesiPagiWidgetProps) {
  return (
    <div className="space-y-4">
      {rekapPagi ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-paper p-3 rounded-[6px] border border-border text-center">
              <p className="text-2xl font-bold text-ink tabular">{rekapPagi.terjadwal}</p>
              <p className="text-xs text-muted">Sesi Terjadwal</p>
            </div>
            <div className="bg-paper p-3 rounded-[6px] border border-border text-center">
              <p className="text-2xl font-bold text-primary tabular">{rekapPagi.tepatWaktu}</p>
              <p className="text-xs text-muted">Tepat Waktu</p>
            </div>
            <div className="bg-paper p-3 rounded-[6px] border border-border text-center">
              <p className="text-2xl font-bold text-amber tabular">{rekapPagi.terlambat}</p>
              <p className="text-xs text-muted">Terlambat</p>
            </div>
            <div className="bg-paper p-3 rounded-[6px] border border-border text-center">
              <p className="text-2xl font-bold text-ai tabular">{rekapPagi.digantikan}</p>
              <p className="text-xs text-muted">Digantikan</p>
            </div>
          </div>

          {(rekapPagi.daftarDetail?.length ?? 0) > 0 && (
            <div className="max-h-[320px] overflow-y-auto pr-2 custom-scrollbar text-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-muted text-xs uppercase tracking-wider">
                    <th className="py-2.5 text-left font-semibold">Jadwal Sesi</th>
                    <th className="py-2.5 text-left font-semibold">Guru Pengajar</th>
                    <th className="py-2.5 text-left font-semibold">Status Presensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rekapPagi.daftarDetail.map((d: any, idx: number) => (
                    <tr key={idx} className="hover:bg-paper/50">
                      <td className="py-2.5 font-medium">{d.mapel} - {d.rombel}</td>
                      <td className="py-2.5">
                        {d.nama_guru_seharusnya}
                        {d.nama_guru_pelaksana && d.nama_guru_pelaksana !== d.nama_guru_seharusnya && (
                          <span className="block text-xs text-amber font-medium mt-0.5">
                            Diwakili: {d.nama_guru_pelaksana}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <StatusBadge
                          status={
                            d.status === "Terlambat" || d.status.includes("Mendadak")
                              ? "Menunggu Persetujuan"
                              : d.status === "Tepat Waktu" || d.status.includes("Terjadwal")
                              ? "Disetujui"
                              : d.status
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted">Memuat data rekapitulasi...</p>
      )}
    </div>
  );
}
