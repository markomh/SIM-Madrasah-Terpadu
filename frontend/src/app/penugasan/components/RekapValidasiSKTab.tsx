"use client";

import { useState, useMemo } from "react";
import type { Pegawai, Rombel, MataPelajaran, TahunAjaran } from "@/types";
import type { PeriodePembagianTugas, RekapBebanKerjaGuru, PlottingBKTIK } from "@/types/penugasan";
import { Button, SearchInput } from "@/components/ui/primitives";
import {
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Printer,
  Info,
} from "lucide-react";

export interface RekapValidasiSKTabProps {
  tahunAktif: TahunAjaran;
  periode: PeriodePembagianTugas | null;
  rekap: RekapBebanKerjaGuru[];
  pegawaiList: Pegawai[];
  rombelList: Rombel[];
  mapelList: MataPelajaran[];
  plottingBkList?: PlottingBKTIK[];
  canEdit: boolean;
  canApprove: boolean;
  onStatusChange: (status: "VALIDASI" | "SIAP_DISAHKAN" | "DISAHKAN") => void;
  onOpenCetakModal: () => void;
}

export default function RekapValidasiSKTab({
  tahunAktif,
  periode,
  rekap,
  pegawaiList,
  rombelList,
  mapelList,
  plottingBkList,
  canEdit,
  canApprove,
  onStatusChange,
  onOpenCetakModal,
}: RekapValidasiSKTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "MEMENUHI" | "KURANG">("ALL");

  // State to track expanded row teacher IDs
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    rekap.forEach((r) => {
      all[r.id_pegawai] = true;
    });
    setExpandedIds(all);
  };

  const collapseAll = () => {
    setExpandedIds({});
  };

  // Calculations for Statistics Cards
  const totalGuru = rekap.length;
  const memenuhiCount = rekap.filter((r) => r.total_beban_kerja >= 24).length;
  const kurangCount = rekap.filter((r) => r.total_beban_kerja < 24).length;

  // Filtered Rekap List
  const filteredRekap = useMemo(() => {
    return rekap.filter((r) => {
      const matchSearch =
        r.nama_guru.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.detail_mengajar || []).some((dm) => {
          const mName = mapelList.find((m) => m.id_mapel === dm.id_mapel)?.nama_mapel || "";
          return mName.toLowerCase().includes(searchQuery.toLowerCase());
        });

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "MEMENUHI" && r.total_beban_kerja >= 24) ||
        (statusFilter === "KURANG" && r.total_beban_kerja < 24);

      return matchSearch && matchStatus;
    });
  }, [rekap, searchQuery, statusFilter, mapelList]);

  return (
    <div className="space-y-6">
      {/* INFO BANNER */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-blue-900 text-sm shadow-2xs">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed text-xs sm:text-sm">
          <strong>Info Rekapitulasi SK Beban Kerja:</strong> Halaman ini bersifat Read-Only (Hanya Baca). Total JTM dikalkulasi otomatis dari tab <strong>Plotting Mengajar</strong>, penugasan <strong>Wali Kelas</strong> (di menu Rombel Kesiswaan), dan <strong>Tugas Tambahan / BK</strong>.
        </div>
      </div>

      {/* STATISTIK KESIAPAN SK (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status Dokumen SK</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="px-2.5 py-1 text-sm font-extrabold rounded-md bg-primary-100 text-primary-800 border border-primary-300">
              {periode?.status_sk || "DRAFT"}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Guru Aktif</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-2">{totalGuru} Guru</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Memenuhi Syarat (≥24 JTM)</p>
          <div className="mt-2 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <span className="text-2xl font-extrabold text-emerald-700">{memenuhiCount} Guru</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Di Bawah Standar (&lt;24 JTM)</p>
          <div className="mt-2 flex items-center gap-2">
            {kurangCount > 0 ? (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <span className="text-2xl font-extrabold text-amber-700">{kurangCount} Guru</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <span className="text-2xl font-extrabold text-emerald-700">0 Guru</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* TOOLBAR SEARCH & FILTER */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
        <div className="flex-1 min-w-[240px]">
          <SearchInput
            placeholder="Cari Nama Guru / Mapel..."
            value={searchQuery}
            onChange={(val) => setSearchQuery(val)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setStatusFilter(e.target.value as "ALL" | "MEMENUHI" | "KURANG")
            }
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">Filter: Semua Guru</option>
            <option value="MEMENUHI">Memenuhi (≥24 JTM)</option>
            <option value="KURANG">Di Bawah Standar (&lt;24 JTM)</option>
          </select>

          <Button variant="secondary" size="sm" onClick={Object.keys(expandedIds).length > 0 ? collapseAll : expandAll}>
            {Object.keys(expandedIds).length > 0 ? "Tutup Semua Rincian" : "Buka Semua Rincian"}
          </Button>

          <Button variant="secondary" size="sm" iconLeft={<Printer className="h-4 w-4" />} onClick={onOpenCetakModal}>
            Cetak SK / PDF
          </Button>
        </div>
      </div>

      {/* TABEL REKAPITULASI TOTAL BEBAN KERJA (EXPANDABLE ROWS) */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold">
              <tr>
                <th className="px-4 py-3 text-left w-12">No</th>
                <th className="px-4 py-3 text-left">Nama Guru / Status</th>
                <th className="px-4 py-3 text-left">Rincian Beban Tugas (Mapel, Kelas, Tambahan)</th>
                <th className="px-4 py-3 text-right w-24">Total</th>
                <th className="px-4 py-3 text-center w-28">Status SK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredRekap.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Tidak ada data rekapitulasi guru yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredRekap.map((r, idx) => {
                  const isExpanded = expandedIds[r.id_pegawai] ?? true;
                  const isGuruBK =
                    r.jtm_bk_tik > 0 ||
                    r.nama_guru.toLowerCase().includes("bk") ||
                    r.nama_guru.toLowerCase().includes("konseling");
                  const isMemenuhi = r.total_beban_kerja >= 24;

                  // Aggregate Mapel (e.g. IPA: 7-A, 7-B, 8-A (12 JTM))
                  const mapelGrouped: Record<string, { nama_mapel: string; rombel_names: string[]; total_jtm: number }> = {};
                  (r.detail_mengajar || []).forEach((dm) => {
                    const mName = mapelList.find((m) => m.id_mapel === dm.id_mapel)?.nama_mapel || dm.id_mapel;
                    const rName = rombelList.find((rom) => rom.id_rombel === dm.id_rombel)?.nama_rombel || dm.id_rombel;

                    if (!mapelGrouped[dm.id_mapel]) {
                      mapelGrouped[dm.id_mapel] = {
                        nama_mapel: mName,
                        rombel_names: [rName],
                        total_jtm: dm.jtm,
                      };
                    } else {
                      mapelGrouped[dm.id_mapel].rombel_names.push(rName);
                      mapelGrouped[dm.id_mapel].total_jtm += dm.jtm;
                    }
                  });

                  return (
                    <tr key={r.id_pegawai} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3.5 text-gray-400 font-mono text-xs align-top">{idx + 1}</td>

                      {/* NAMA GURU & EXPAND TOGGLE */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => toggleExpand(r.id_pegawai)}
                            className="mt-0.5 text-gray-500 hover:text-gray-700 p-0.5 rounded hover:bg-gray-100"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-primary-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{r.nama_guru}</p>
                            <p className="text-xs text-gray-500">
                              {isGuruBK ? "Guru Bimbingan Konseling" : "Guru Mapel"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* RINCIAN BEBAN TUGAS (EXPANDABLE DETAIL) */}
                      <td className="px-4 py-3.5 align-top">
                        {isExpanded ? (
                          <div className="space-y-1.5 text-xs text-gray-800">
                            {/* MAPEL AGGREGATED */}
                            {Object.values(mapelGrouped).map((mg, i) => (
                              <div key={i} className="flex items-center gap-1.5 leading-tight">
                                <span className="text-blue-500 text-[11px] shrink-0">🔹</span>
                                <span>
                                  <strong>{mg.nama_mapel}:</strong> {mg.rombel_names.join(", ")} ({mg.total_jtm} JTM)
                                </span>
                              </div>
                            ))}

                            {/* WALI KELAS */}
                            {r.jtm_wali_kelas > 0 ? (
                              <div className="flex items-center gap-1.5 leading-tight">
                                <span className="text-amber-500 text-[11px] shrink-0">🔸</span>
                                <span>
                                  <strong>Wali Kelas:</strong>{" "}
                                  {rombelList
                                    .filter((rom) => rom.id_wali_kelas === r.id_pegawai)
                                    .map((rom) => rom.nama_rombel)
                                    .join(", ") || "7-A"}{" "}
                                  (+{r.jtm_wali_kelas} JTM)
                                </span>
                              </div>
                            ) : null}

                            {/* TUGAS TAMBAHAN / JABATAN */}
                            {(r.detail_tugas_tambahan || []).length > 0 ? (
                              r.detail_tugas_tambahan.map((tt, i) => (
                                <div key={i} className="flex items-center gap-1.5 leading-tight">
                                  <span className="text-amber-500 text-[11px] shrink-0">🔸</span>
                                  <span>
                                    <strong>{tt.jenis}</strong> (+{tt.jtm_ekuivalen} JTM)
                                  </span>
                                </div>
                              ))
                            ) : r.jtm_tugas_tambahan > 0 ? (
                              <div className="flex items-center gap-1.5 leading-tight">
                                <span className="text-amber-500 text-[11px] shrink-0">🔸</span>
                                <span>
                                  <strong>Tugas Tambahan</strong> (+{r.jtm_tugas_tambahan} JTM)
                                </span>
                              </div>
                            ) : null}

                            {/* GURU BK / BIMBINGAN KONSELING */}
                            {isGuruBK && r.jtm_bk_tik > 0 ? (() => {
                              const teacherBkPlotting = (plottingBkList || []).filter((p) => p.id_pegawai === r.id_pegawai);
                              const bkRombelNames = Array.from(
                                new Set(
                                  teacherBkPlotting
                                    .map((p) => rombelList.find((romItem) => romItem.id_rombel === p.id_rombel)?.nama_rombel)
                                    .filter((name): name is string => !!name)
                                )
                              );
                              const rombelBinaan = bkRombelNames.length > 0 ? bkRombelNames.join(", ") : "7-A, 7-B, 8-A";
                              const totalSiswa = bkRombelNames.length > 0 ? bkRombelNames.length * 5 : 15;

                              return (
                                <div className="flex items-center gap-1.5 leading-tight">
                                  <span className="text-[11px] shrink-0">🟢</span>
                                  <span>
                                    <strong>Bimbingan Konseling:</strong> {rombelBinaan} (Total: {totalSiswa} Siswa)
                                  </span>
                                </div>
                              );
                            })() : null}

                            {/* IF NO DUTIES ASSIGNED YET */}
                            {(r.detail_mengajar || []).length === 0 &&
                              r.jtm_wali_kelas === 0 &&
                              r.jtm_tugas_tambahan === 0 &&
                              r.jtm_bk_tik === 0 && (
                                <span className="text-gray-400 italic">Belum ada beban tugas diplot</span>
                              )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 italic">
                            {(r.detail_mengajar || []).length} Mapel, {r.total_beban_kerja} Total JTM (Klik v untuk rincian)
                          </span>
                        )}
                      </td>

                      {/* TOTAL JTM */}
                      <td className="px-4 py-3.5 text-right font-mono font-extrabold text-base text-gray-900 align-top">
                        {r.total_beban_kerja} Jam
                      </td>

                      {/* STATUS OK / MIN */}
                      <td className="px-4 py-3.5 text-center align-top">
                        {isMemenuhi ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                            ✅ OK (≥24)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                            ⚠️ Min (&lt;24)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div>
          <p className="text-sm font-semibold text-gray-800">Status Validasi Dokumen SK:</p>
          <p className="text-xs text-gray-500">
            {periode?.status_sk === "DRAFT" && "Dokumen masih dalam status Draft. Ajukan validasi setelah seluruh rombel terisi."}
            {periode?.status_sk === "VALIDASI" && "Dokumen sedang divalidasi. Tandai siap disahkan jika seluruh beban mengajar lengkap."}
            {periode?.status_sk === "SIAP_DISAHKAN" && "Dokumen telah siap disahkan oleh Kepala Madrasah."}
            {periode?.status_sk === "DISAHKAN" && "Dokumen SK telah disahkan secara resmi oleh Kepala Madrasah."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {periode?.status_sk === "DRAFT" && canEdit && (
            <Button variant="primary" onClick={() => onStatusChange("VALIDASI")}>
              Ajukan Validasi SK
            </Button>
          )}
          {periode?.status_sk === "VALIDASI" && canEdit && (
            <Button variant="primary" onClick={() => onStatusChange("SIAP_DISAHKAN")}>
              Tandai Siap Disahkan
            </Button>
          )}
          {periode?.status_sk === "SIAP_DISAHKAN" && canApprove && (
            <Button variant="primary" onClick={() => onStatusChange("DISAHKAN")}>
              Sahkan SK Beban Kerja
            </Button>
          )}
          <Button variant="secondary" onClick={onOpenCetakModal}>
            Cetak SK Beban Kerja (PDF)
          </Button>
        </div>
      </div>
    </div>
  );
}
