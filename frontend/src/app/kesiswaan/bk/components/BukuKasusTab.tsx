"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Plus, ShieldAlert, AlertTriangle, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import type { KonseliDetail, PelanggaranSiswa } from "../types";
import type { Rombel } from "@/types";

interface BukuKasusTabProps {
  konseliList: KonseliDetail[];
  rombelList: Rombel[];
  onOpenTindakLanjut: (siswa: KonseliDetail) => void;
  onOpenGlobalAddPelanggaran: () => void;
}

export function BukuKasusTab({
  konseliList,
  rombelList,
  onOpenTindakLanjut,
  onOpenGlobalAddPelanggaran,
}: BukuKasusTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRombel, setSelectedRombel] = useState("");
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>("all");

  // Filter logic
  const filteredList = useMemo(() => {
    return konseliList.filter((k) => {
      const matchSearch =
        k.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.nisn.includes(searchQuery);

      const matchRombel = !selectedRombel || k.id_rombel === selectedRombel;

      let matchLevel = true;
      if (selectedLevelFilter === "kritis") matchLevel = k.total_poin >= 75;
      else if (selectedLevelFilter === "warning2") matchLevel = k.total_poin >= 51 && k.total_poin < 75;
      else if (selectedLevelFilter === "warning1") matchLevel = k.total_poin >= 25 && k.total_poin < 51;
      else if (selectedLevelFilter === "aman") matchLevel = k.total_poin < 25;

      return matchSearch && matchRombel && matchLevel;
    });
  }, [konseliList, searchQuery, selectedRombel, selectedLevelFilter]);

  // Sort: highest points first, then has recent case
  const sortedList = useMemo(() => {
    return [...filteredList].sort((a, b) => b.total_poin - a.total_poin);
  }, [filteredList]);

  const renderPoinBadge = (pts: number) => {
    if (pts >= 75) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
          <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
          <span>[ {pts} ] 🔴 Kritis</span>
        </span>
      );
    }
    if (pts >= 51) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
          [ {pts} ] 🟠 Peringatan 2
        </span>
      );
    }
    if (pts >= 25) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
          [ {pts} ] 🟡 Peringatan 1
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
        [ {pts} ] 🟢 Aman
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* ACTION & SEARCH CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-1.5"
            onClick={onOpenGlobalAddPelanggaran}
          >
            <Plus className="h-4 w-4" />
            <span>Catat Kasus Pelanggaran</span>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* SEARCH BOX */}
          <div className="relative min-w-[240px]">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Nama Siswa / NISN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded-lg pl-9 pr-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* FILTER ROMBEL */}
          <select
            value={selectedRombel}
            onChange={(e) => setSelectedRombel(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="">Filter Rombel: Semua</option>
            {rombelList.map((r) => (
              <option key={r.id_rombel} value={r.id_rombel}>
                Kelas {r.nama_rombel}
              </option>
            ))}
          </select>

          {/* FILTER STATUS POIN */}
          <select
            value={selectedLevelFilter}
            onChange={(e) => setSelectedLevelFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="all">Status Poin: Semua</option>
            <option value="kritis">🔴 Kritis (&gt;75 Poin)</option>
            <option value="warning2">🟠 Peringatan 2 (51-75)</option>
            <option value="warning1">🟡 Peringatan 1 (25-50)</option>
            <option value="aman">🟢 Aman (&lt;25)</option>
          </select>
        </div>
      </div>

      {/* TABLE BUKU KASUS & POIN */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50/90 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 text-left w-12">No</th>
                <th className="px-4 py-3.5 text-left">Nama Siswa &amp; NISN</th>
                <th className="px-4 py-3.5 text-center w-24">Kelas</th>
                <th className="px-4 py-3.5 text-center w-40">Total Poin</th>
                <th className="px-4 py-3.5 text-left">Kasus Terakhir</th>
                <th className="px-4 py-3.5 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sortedList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    <ShieldAlert className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-600">Tidak ada data kasus pelanggaran ditemukan</p>
                    <p className="text-[11px] mt-0.5">Coba sesuaikan kata kunci pencarian atau filter rombel</p>
                  </td>
                </tr>
              ) : (
                sortedList.map((s, idx) => (
                  <tr
                    key={s.id_siswa}
                    className={`hover:bg-gray-50/80 transition-colors ${
                      s.total_poin >= 75 ? "bg-rose-50/30" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-400 font-mono text-center font-semibold">
                      {idx + 1}
                    </td>

                    <td className="px-4 py-3">
                      <div>
                        <p className="font-bold text-gray-900 text-sm hover:text-emerald-700 cursor-pointer" onClick={() => onOpenTindakLanjut(s)}>
                          {s.nama_lengkap}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                          <span className="font-mono">{s.nisn}</span>
                          <span>•</span>
                          <span>Wali: {s.nama_wali_kelas}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="inline-block font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                        {s.nama_rombel}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      {renderPoinBadge(s.total_poin)}
                    </td>

                    <td className="px-4 py-3">
                      {s.kasus_terakhir ? (
                        <div>
                          <p className="font-medium text-gray-900">
                            {s.tanggal_kasus_terakhir && (
                              <span className="font-bold text-gray-600 mr-1.5 font-mono text-[11px]">
                                ({s.tanggal_kasus_terakhir.slice(5).replace("-", "/")})
                              </span>
                            )}
                            {s.kasus_terakhir}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">Belum ada catatan kasus</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onOpenTindakLanjut(s)}
                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-bold text-xs"
                      >
                        <span>Tindak Lanjut</span>
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER KETERANGAN INDIKATOR */}
        <div className="bg-gray-50/80 px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-gray-600">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-bold text-gray-700">Keterangan Indikator Poin:</span>
            <span className="flex items-center gap-1">
              <span>🟢</span> Aman (&lt;25)
            </span>
            <span className="flex items-center gap-1">
              <span>🟡</span> Peringatan 1 (25-50)
            </span>
            <span className="flex items-center gap-1">
              <span>🟠</span> Peringatan 2 (51-75)
            </span>
            <span className="flex items-center gap-1 font-semibold text-rose-700">
              <span>🔴</span> Kritis / Panggilan Orang Tua (&gt;75)
            </span>
          </div>

          <div className="text-gray-500 font-medium self-end sm:self-auto">
            Menampilkan <strong>{sortedList.length}</strong> dari <strong>{konseliList.length}</strong> Siswa Binaan
          </div>
        </div>
      </div>
    </div>
  );
}
