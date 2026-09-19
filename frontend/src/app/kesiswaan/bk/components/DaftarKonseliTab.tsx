"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Download,
  MoreVertical,
  User,
  ShieldAlert,
  MessageSquare,
  FileText,
  X,
  Lock,
  Phone,
  Home,
  Briefcase,
  DollarSign,
  Heart,
  Calendar,
  AlertCircle,
  Clock,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/primitives";
import type { KonseliDetail } from "../types";
import type { Rombel } from "@/types";

interface DaftarKonseliTabProps {
  konseliList: KonseliDetail[];
  rombelList: Rombel[];
  onOpenTindakLanjutWithAction: (siswa: KonseliDetail, initialAction: "pelanggaran" | "konseling" | "sp") => void;
}

export function DaftarKonseliTab({
  konseliList,
  rombelList,
  onOpenTindakLanjutWithAction,
}: DaftarKonseliTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRombel, setSelectedRombel] = useState("");

  // Profil Slide-over state
  const [selectedProfilSiswa, setSelectedProfilSiswa] = useState<KonseliDetail | null>(null);

  // Quick action dropdown menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filter list
  const filteredList = useMemo(() => {
    return konseliList.filter((k) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        k.nama_lengkap.toLowerCase().includes(q) || k.nisn.includes(q);
      const matchRombel = !selectedRombel || k.id_rombel === selectedRombel;
      return matchSearch && matchRombel;
    });
  }, [konseliList, searchQuery, selectedRombel]);

  // Export to CSV/Excel
  const handleExport = () => {
    const headers = [
      "No",
      "NISN",
      "Nama Siswa",
      "Jenis Kelamin",
      "Kelas",
      "Wali Kelas",
      "Total Poin",
      "Jumlah Layanan BK",
      "Kasus Terakhir",
    ];

    const rows = filteredList.map((s, idx) => [
      idx + 1,
      `'${s.nisn}`,
      `"${s.nama_lengkap}"`,
      s.jenis_kelamin,
      `"${s.nama_rombel}"`,
      `"${s.nama_wali_kelas}"`,
      s.total_poin,
      s.jumlah_layanan,
      `"${s.kasus_terakhir || "-"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Daftar_Konseli_BK_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderPoinBadge = (pts: number) => {
    if (pts >= 75) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
          [ {pts} ] 🔴
        </span>
      );
    }
    if (pts >= 51) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
          [ {pts} ] 🟠
        </span>
      );
    }
    if (pts >= 25) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
          [ {pts} ] 🟡
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
        [ {pts} ] 🟢
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* INFO BANNER */}
      <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium">
          <span className="p-1 rounded bg-blue-100 text-blue-700 font-bold">INFO</span>
          <span>
            Menampilkan master caseload: <strong>{konseliList.length} Siswa</strong> dari seluruh
            Rombel binaan Anda.
          </span>
        </div>
        <span className="text-[11px] text-blue-700 font-mono hidden sm:inline-block">
          Semester Ganjil 2026/2027
        </span>
      </div>

      {/* CONTROLS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-2xl">
          {/* SEARCH */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Nama / NISN..."
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
            <option value="">Filter Rombel: Semua Binaan</option>
            {rombelList.map((r) => (
              <option key={r.id_rombel} value={r.id_rombel}>
                Kelas {r.nama_rombel}
              </option>
            ))}
          </select>
        </div>

        <div>
          <button
            onClick={handleExport}
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-gray-600" />
            <span>Export Data (Excel)</span>
          </button>
        </div>
      </div>

      {/* TABLE DAFTAR KONSELI */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50/90 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 text-left w-12">No</th>
                <th className="px-4 py-3.5 text-left w-32">NISN</th>
                <th className="px-4 py-3.5 text-left">Nama Siswa</th>
                <th className="px-4 py-3.5 text-center w-24">Kelas</th>
                <th className="px-4 py-3.5 text-center w-16">L/P</th>
                <th className="px-4 py-3.5 text-center w-28">Poin ⚠️</th>
                <th className="px-4 py-3.5 text-center w-28">Jml. Layanan</th>
                <th className="px-4 py-3.5 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                    <User className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-600">
                      Tidak ada data siswa konseli yang cocok
                    </p>
                    <p className="text-[11px] mt-0.5">
                      Pastikan Anda mencari siswa dari rombel binaan Anda
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((s, idx) => (
                  <tr key={s.id_siswa} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3.5 text-gray-400 font-mono text-center font-semibold">
                      {idx + 1}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-gray-600 font-semibold">{s.nisn}</td>

                    <td className="px-4 py-3.5">
                      <p
                        className="font-bold text-gray-900 hover:text-emerald-700 cursor-pointer"
                        onClick={() => setSelectedProfilSiswa(s)}
                      >
                        {s.nama_lengkap}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Wali: {s.nama_wali_kelas}
                      </p>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        {s.nama_rombel}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center font-bold text-gray-600">
                      {s.jenis_kelamin}
                    </td>

                    <td className="px-4 py-3.5 text-center">{renderPoinBadge(s.total_poin)}</td>

                    <td className="px-4 py-3.5 text-center font-medium">
                      {s.jumlah_layanan > 0 ? (
                        <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {s.jumlah_layanan} Sesi
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">0 Sesi</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5 relative">
                        {/* PROFIL BUTTON */}
                        <button
                          onClick={() => setSelectedProfilSiswa(s)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded hover:bg-emerald-100 transition-colors"
                        >
                          Profil
                        </button>

                        {/* THREE DOTS QUICK ACTIONS */}
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActiveMenuId(activeMenuId === s.id_siswa ? null : s.id_siswa)
                            }
                            className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                            title="Aksi Cepat"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {activeMenuId === s.id_siswa && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setActiveMenuId(null)}
                              />
                              <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-xl border border-gray-200 py-1.5 z-50 text-left text-xs divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onOpenTindakLanjutWithAction(s, "pelanggaran");
                                  }}
                                  className="w-full px-3 py-2 text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-medium"
                                >
                                  <ShieldAlert className="h-4 w-4" />
                                  <span>+ Catat Pelanggaran</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onOpenTindakLanjutWithAction(s, "konseling");
                                  }}
                                  className="w-full px-3 py-2 text-indigo-700 hover:bg-indigo-50 flex items-center gap-2 font-medium"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                  <span>+ Mulai Sesi Konseling</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onOpenTindakLanjutWithAction(s, "sp");
                                  }}
                                  className="w-full px-3 py-2 text-amber-700 hover:bg-amber-50 flex items-center gap-2 font-medium"
                                >
                                  <FileText className="h-4 w-4" />
                                  <span>📄 Cetak Surat Panggilan</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="bg-gray-50/80 px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-gray-600">
          <p className="italic">
            * Keterangan: Kolom &lsquo;Jml. Layanan&rsquo; menunjukkan total sesi bimbingan yang telah diberikan semester ini.
          </p>
          <p className="font-semibold text-gray-700">
            Menampilkan {filteredList.length} dari {konseliList.length} Siswa Binaan
          </p>
        </div>
      </div>

      {/* SLIDE-OVER PROFIL KOMPREHENSIF PSIKOSOSIAL SISWA */}
      {selectedProfilSiswa && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedProfilSiswa(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-gray-200">
              {/* HEADER */}
              <div className="p-5 border-b border-gray-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-emerald-100 text-emerald-800">
                    Buku Induk Psikososial
                  </span>
                  <h3 className="text-base font-bold text-gray-900 mt-1">
                    Profil Komprehensif Siswa Konseli
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedProfilSiswa(null)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* BODY */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 1. DATA POKOK */}
                <div className="p-4.5 bg-gradient-to-br from-emerald-50/60 to-slate-50 rounded-xl border border-emerald-200/80 shadow-2xs">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-extrabold text-gray-900">
                        {selectedProfilSiswa.nama_lengkap}
                      </h4>
                      <p className="text-xs text-gray-600 mt-0.5 font-mono">
                        NISN: {selectedProfilSiswa.nisn} | NIK: {selectedProfilSiswa.nik || "—"}
                      </p>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-700 mt-2">
                        <span>
                          Kelas: <strong>{selectedProfilSiswa.nama_rombel}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Jenis Kelamin:{" "}
                          <strong>
                            {selectedProfilSiswa.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Wali Kelas: <strong>{selectedProfilSiswa.nama_wali_kelas}</strong>
                        </span>
                      </div>
                    </div>
                    <div>{renderPoinBadge(selectedProfilSiswa.total_poin)}</div>
                  </div>
                </div>

                {/* 2. LATAR BELAKANG KELUARGA & SOSIAL */}
                <div className="p-4.5 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Heart className="h-4 w-4 text-rose-500" />
                    Latar Belakang Keluarga &amp; Sosial
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1">
                      <span className="text-gray-400 font-semibold block text-[10px] uppercase">
                        Data Ayah
                      </span>
                      <p className="font-bold text-gray-800">
                        {selectedProfilSiswa.data_ortu?.nama_ayah || "Bpk. Abdullah"}
                      </p>
                      <p className="text-gray-600 flex items-center gap-1">
                        <Briefcase className="h-3 w-3 text-gray-400" />
                        {selectedProfilSiswa.data_ortu?.pekerjaan_ayah || "Wiraswasta / Pedagang"}
                      </p>
                      <p className="text-gray-600 flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-gray-400" />
                        {selectedProfilSiswa.data_ortu?.penghasilan_ayah || "Rp 2.500.000 - Rp 4.000.000"}
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1">
                      <span className="text-gray-400 font-semibold block text-[10px] uppercase">
                        Data Ibu &amp; Kontak
                      </span>
                      <p className="font-bold text-gray-800">
                        {selectedProfilSiswa.data_ortu?.nama_ibu || "Ibu Maryam"}
                      </p>
                      <p className="text-gray-600 flex items-center gap-1">
                        <Briefcase className="h-3 w-3 text-gray-400" />
                        {selectedProfilSiswa.data_ortu?.pekerjaan_ibu || "Ibu Rumah Tangga"}
                      </p>
                      <p className="text-gray-600 flex items-center gap-1">
                        <Phone className="h-3 w-3 text-emerald-600" />
                        {selectedProfilSiswa.data_ortu?.no_hp_ortu || "0812-3456-7890"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-200 text-xs flex items-start gap-2">
                    <Home className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-700">Alamat Tempat Tinggal:</span>
                      <p className="text-gray-600 mt-0.5">
                        {selectedProfilSiswa.alamat_detail ||
                          "Jl. Anggrek No. 14, RT 02/RW 03, Kelurahan Sekarbela, Mataram"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. RIWAYAT KASUS PELANGGARAN */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-rose-500" />
                      Riwayat Pelanggaran Siswa ({selectedProfilSiswa.riwayat_pelanggaran?.length || 0})
                    </h4>
                    <span className="text-xs font-mono font-bold text-rose-700">
                      Total: {selectedProfilSiswa.total_poin} Poin
                    </span>
                  </div>

                  {(!selectedProfilSiswa.riwayat_pelanggaran ||
                    selectedProfilSiswa.riwayat_pelanggaran.length === 0) ? (
                    <p className="text-xs text-gray-400 italic p-3 bg-gray-50 rounded-lg border">
                      Tidak ada catatan pelanggaran.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedProfilSiswa.riwayat_pelanggaran.map((p) => (
                        <div
                          key={p.id_pelanggaran}
                          className="p-3 bg-rose-50/40 rounded-lg border border-rose-200/80 text-xs flex items-start justify-between gap-3"
                        >
                          <div>
                            <p className="font-bold text-gray-900">{p.item_pelanggaran}</p>
                            <p className="text-gray-600 text-[11px] mt-0.5">
                              {p.catatan_kronologi || `Kategori: ${p.kategori}`}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-extrabold text-rose-700 block">
                              +{p.bobot_poin} Poin
                            </span>
                            <span className="text-[10px] text-gray-400">{p.tanggal}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. RIWAYAT JURNAL KONSELING (PRIVAT) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-indigo-600" />
                      Riwayat Jurnal Konseling Privat ({selectedProfilSiswa.riwayat_konseling?.length || 0})
                    </h4>
                    <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      Asas Kerahasiaan
                    </span>
                  </div>

                  {(!selectedProfilSiswa.riwayat_konseling ||
                    selectedProfilSiswa.riwayat_konseling.length === 0) ? (
                    <p className="text-xs text-gray-400 italic p-3 bg-gray-50 rounded-lg border">
                      Belum ada sesi konseling tercatat untuk siswa ini.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedProfilSiswa.riwayat_konseling.map((k) => (
                        <div
                          key={k.id_jurnal}
                          className="p-3 bg-indigo-50/40 rounded-lg border border-indigo-200/80 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900">
                              {k.topik} ({k.bidang})
                            </span>
                            <span className="text-[10px] font-mono text-gray-400">
                              {k.tanggal} • {k.waktu} WIB
                            </span>
                          </div>
                          <p className="text-gray-700 text-[11px] leading-relaxed">{k.uraian}</p>
                          <div className="flex items-center justify-between pt-1 text-[10px] text-gray-500">
                            <span>Tindak Lanjut: <strong>{k.tindak_lanjut}</strong></span>
                            <span className="font-semibold text-indigo-800">Status: {k.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. RIWAYAT SP */}
                {selectedProfilSiswa.riwayat_sp && selectedProfilSiswa.riwayat_sp.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-amber-600" />
                      Riwayat Surat Panggilan Diterbitkan ({selectedProfilSiswa.riwayat_sp.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedProfilSiswa.riwayat_sp.map((sp) => (
                        <div
                          key={sp.id_sp}
                          className="p-3 bg-amber-50/40 rounded-lg border border-amber-200/80 text-xs flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-gray-900">{sp.nomor_surat}</p>
                            <p className="text-gray-600 text-[11px]">
                              Jadwal: {sp.hari_pemanggilan}, {sp.tanggal_pemanggilan} ({sp.jam_pemanggilan} WIB)
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold text-[10px]">
                            {sp.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
