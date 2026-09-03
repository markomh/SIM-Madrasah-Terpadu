"use client";

import { Printer, X } from "lucide-react";
import { PrimaryButton, Button } from "@/components/ui/primitives";
import { getInstitutionalRoutinesForDay, type BellSchedulePreset } from "@/lib/bell-schedule";
import type { JadwalPelajaran, MataPelajaran, Pegawai, ProfilMadrasah, Rombel, TahunAjaran } from "@/types";

const HARI_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

interface PrintJadwalModalProps {
  profilMadrasah: ProfilMadrasah | null;
  selectedSemester: string;
  selectedTahun: TahunAjaran | null;
  timelineRows: string[];
  activePreset: BellSchedulePreset | null;
  displayJadwal: JadwalPelajaran[];
  pegawaiMap: Record<string, Pegawai>;
  rombelMap: Record<string, Rombel>;
  mapelMap: Record<string, MataPelajaran>;
  onClose: () => void;
}

export function PrintJadwalModal({
  profilMadrasah,
  selectedSemester,
  selectedTahun,
  timelineRows,
  activePreset,
  displayJadwal,
  pegawaiMap,
  rombelMap,
  mapelMap,
  onClose,
}: PrintJadwalModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-lg border border-border bg-surface shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4 bg-paper">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-primary" />
            <h3 className="text-sm font-bold text-ink">Pratinjau Cetak Jadwal Pelajaran Mingguan</h3>
          </div>
          <div className="flex items-center gap-2">
            <PrimaryButton size="sm" onClick={() => window.print()} className="flex items-center gap-1.5">
              <Printer size={13} />
              <span>Cetak Dokumen</span>
            </PrimaryButton>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1 h-auto min-w-0"
            >
              <X size={14} />
            </Button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto space-y-6 text-ink bg-white dark:bg-zinc-950 print:p-0">
          <div className="border-b-2 border-ink pb-3 text-center space-y-1">
            <h2 className="text-base font-extrabold uppercase tracking-wider">
              {profilMadrasah?.nama_madrasah ?? "MADRASAH TSANAWIYAH TERPADU NUSANTARA"}
            </h2>
            <p className="text-xs text-muted">
              NSM: {profilMadrasah?.nsm ?? "121232010001"} • NPSN: {profilMadrasah?.npsn ?? "20100001"} •{" "}
              {profilMadrasah?.alamat ?? "Jl. Pendidikan Islam No. 45, Jawa Barat"}
            </p>
            <h3 className="text-sm font-bold underline pt-2">
              JADWAL PELAJARAN MINGGUAN — SEMESTER {selectedSemester} T.A. {selectedTahun?.nama_tahun ?? "2026/2027"}
            </h3>
          </div>

          <table className="w-full border border-collapse border-zinc-300 dark:border-zinc-700 text-xs">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-300 dark:border-zinc-700">
                <th className="p-2 border-r text-center w-28">Waktu</th>
                {HARI_LIST.map((h) => (
                  <th key={h} className="p-2 border-r text-center">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {timelineRows.map((tr) => {
                const [jm, js] = tr.split("–");
                return (
                  <tr key={tr}>
                    <td className="p-2 border-r font-mono text-center font-bold">{tr}</td>
                    {HARI_LIST.map((h) => {
                      const inst = activePreset
                        ? getInstitutionalRoutinesForDay(h, activePreset).find(
                            (s) => s.jam_mulai === jm && s.jam_selesai === js
                          )
                        : null;
                      const slots = displayJadwal.filter((j) => j.hari === h && j.jam_mulai === jm && j.jam_selesai === js);
                      return (
                        <td key={h} className="p-2 border-r align-top">
                          {inst ? (
                            <span className="font-bold text-[10px] text-zinc-500 italic block text-center">
                              [{inst.nama}]
                            </span>
                          ) : slots.length === 0 ? (
                            <span className="text-zinc-400 text-center block">—</span>
                          ) : (
                            slots.map((s) => (
                              <div key={s.id_jadwal} className="mb-1">
                                <strong className="block">
                                  {mapelMap[s.id_mapel]?.nama_mapel} ({rombelMap[s.id_rombel]?.nama_rombel})
                                </strong>
                                <span className="text-[10px] text-zinc-600 dark:text-zinc-400 block">
                                  {pegawaiMap[s.id_pegawai]?.nama_lengkap_gelar}
                                </span>
                              </div>
                            ))
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="pt-8 flex justify-between text-xs text-center">
            <div className="space-y-12">
              <p>
                Mengetahui,
                <br />
                Kepala Madrasah
              </p>
              <p className="font-bold underline">
                Dra. Nurul Hidayah, M.Pd.
                <br />
                <span className="font-normal text-[11px]">NIP. 197801012005011001</span>
              </p>
            </div>
            <div className="space-y-12">
              <p>
                Kota Bogor, {new Date().toLocaleDateString("id-ID")}
                <br />
                Wakamad Bidang Kurikulum
              </p>
              <p className="font-bold underline">
                Budi Santoso, S.Pd.
                <br />
                <span className="font-normal text-[11px]">NIP. 198203152008011004</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
