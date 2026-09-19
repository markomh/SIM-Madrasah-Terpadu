"use client";

import { useState, useMemo } from "react";
import {
  Lock,
  Search,
  Filter,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Hourglass,
  X,
  FileText,
  UserCheck,
  Edit3,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/primitives";
import type {
  KonseliDetail,
  JurnalKonseling,
  BidangLayanan,
  StatusLayanan,
  PendekatanLayanan,
} from "../types";

interface JurnalLayananTabProps {
  jurnalList: (JurnalKonseling & { nama_siswa?: string; nama_rombel?: string })[];
  konseliList: KonseliDetail[];
  currentUserId: string;
  onSaveJurnal: (data: Omit<JurnalKonseling, "id_jurnal">, idToUpdate?: string) => Promise<void>;
  onDeleteJurnal: (id: string) => Promise<void>;
}

export function JurnalLayananTab({
  jurnalList,
  konseliList,
  currentUserId,
  onSaveJurnal,
  onDeleteJurnal,
}: JurnalLayananTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBidang, setSelectedBidang] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Slide-over Form State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingJurnalId, setEditingJurnalId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>("");
  const [tglLayanan, setTglLayanan] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [waktuLayanan, setWaktuLayanan] = useState<string>("10:00");
  const [pendekatan, setPendekatan] = useState<PendekatanLayanan>("Tatap Muka (Individual)");
  const [bidang, setBidang] = useState<BidangLayanan>("Pribadi");
  const [topik, setTopik] = useState<string>("");
  const [uraian, setUraian] = useState<string>("");
  const [tindakLanjut, setTindakLanjut] = useState<string>("Jadwalkan Sesi Lanjutan");
  const [status, setStatus] = useState<StatusLayanan>("Proses");

  // Open Form for Add
  const handleOpenAdd = () => {
    setEditingJurnalId(null);
    setSelectedSiswaId(konseliList[0]?.id_siswa || "");
    setTglLayanan(new Date().toISOString().split("T")[0]);
    setWaktuLayanan("10:00");
    setPendekatan("Tatap Muka (Individual)");
    setBidang("Pribadi");
    setTopik("");
    setUraian("");
    setTindakLanjut("Jadwalkan Sesi Lanjutan");
    setStatus("Proses");
    setDrawerOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (item: JurnalKonseling) => {
    setEditingJurnalId(item.id_jurnal);
    setSelectedSiswaId(item.id_siswa);
    setTglLayanan(item.tanggal);
    setWaktuLayanan(item.waktu || "10:00");
    setPendekatan(item.pendekatan || "Tatap Muka (Individual)");
    setBidang(item.bidang);
    setTopik(item.topik);
    setUraian(item.uraian);
    setTindakLanjut(item.tindak_lanjut || "Jadwalkan Sesi Lanjutan");
    setStatus(item.status);
    setDrawerOpen(true);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiswaId || !topik.trim() || !uraian.trim()) return;

    setSubmitting(true);
    try {
      await onSaveJurnal(
        {
          id_siswa: selectedSiswaId,
          id_pegawai_bk: currentUserId,
          tanggal: tglLayanan,
          waktu: waktuLayanan,
          pendekatan,
          bidang,
          topik,
          uraian,
          tindak_lanjut: tindakLanjut,
          status,
          tingkat_kerahasiaan: "Rahasia",
        },
        editingJurnalId || undefined
      );
      setDrawerOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered list
  const filteredList = useMemo(() => {
    return jurnalList.filter((j) => {
      const nama = j.nama_siswa?.toLowerCase() || "";
      const top = j.topik.toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchSearch = nama.includes(q) || top.includes(q);

      const matchBidang = !selectedBidang || j.bidang === selectedBidang;
      const matchStatus = !selectedStatus || j.status === selectedStatus;

      return matchSearch && matchBidang && matchStatus;
    });
  }, [jurnalList, searchQuery, selectedBidang, selectedStatus]);

  const renderBidangBadge = (b: BidangLayanan) => {
    switch (b) {
      case "Pribadi":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            🔵 Pribadi
          </span>
        );
      case "Karir":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            🟡 Karir
          </span>
        );
      case "Sosial":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            🟢 Sosial
          </span>
        );
      case "Akademik":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            🟣 Akademik
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* BANNER KERAHASIAAN */}
      <div className="p-4 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-md flex items-start gap-3">
        <div className="p-2 bg-slate-800 rounded-lg text-emerald-400 shrink-0 mt-0.5">
          <Lock className="h-5 w-5" />
        </div>
        <div className="text-xs space-y-1">
          <p className="font-bold text-sm text-white flex items-center gap-2">
            <span>Data Terenkripsi (Asas Kerahasiaan BK)</span>
            <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">
              RLS Protected
            </span>
          </p>
          <p className="text-slate-300 leading-relaxed">
            Sesuai asas kerahasiaan konseling nasional, rincian catatan konseling pada halaman ini
            hanya dapat diakses oleh Anda (Guru BK) dan Kepala Madrasah. Wali Kelas dan Admin Sistem
            tidak memiliki hak akses membaca rekaman psikososial ini.
          </p>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5"
            onClick={handleOpenAdd}
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Jurnal Baru</span>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* SEARCH */}
          <div className="relative min-w-[240px]">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Nama Siswa / Topik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded-lg pl-9 pr-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* FILTER BIDANG */}
          <select
            value={selectedBidang}
            onChange={(e) => setSelectedBidang(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="">Bidang: Semua</option>
            <option value="Pribadi">🔵 Pribadi</option>
            <option value="Karir">🟡 Karir</option>
            <option value="Sosial">🟢 Sosial</option>
            <option value="Akademik">🟣 Akademik</option>
          </select>

          {/* FILTER STATUS */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="">Status: Semua</option>
            <option value="Proses">Proses (Perlu Lanjutan)</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
      </div>

      {/* TABLE JURNAL LAYANAN */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50/90 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 text-left w-12">No</th>
                <th className="px-4 py-3.5 text-left w-28">Tanggal</th>
                <th className="px-4 py-3.5 text-left">Nama Siswa &amp; Kelas</th>
                <th className="px-4 py-3.5 text-center w-36">Bidang Layanan</th>
                <th className="px-4 py-3.5 text-left">Topik Pembahasan (Judul)</th>
                <th className="px-4 py-3.5 text-center w-28">Status</th>
                <th className="px-4 py-3.5 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-600">
                      Belum ada catatan jurnal konseling ditemukan
                    </p>
                    <p className="text-[11px] mt-0.5">
                      Klik tombol &ldquo;Tambah Jurnal Baru&rdquo; untuk memulai pencatatan layanan
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((j, idx) => (
                  <tr key={j.id_jurnal} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3.5 text-gray-400 font-mono text-center font-semibold">
                      {idx + 1}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-mono text-gray-800 font-semibold">{j.tanggal}</div>
                      <div className="text-[10px] text-gray-400">{j.waktu || "—"} WIB</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-bold text-gray-900 text-sm">
                        {j.nama_siswa || "Siswa"}
                      </p>
                      <p className="text-[11px] text-gray-500 font-medium">
                        Kelas {j.nama_rombel || "—"}
                      </p>
                    </td>

                    <td className="px-4 py-3.5 text-center">{renderBidangBadge(j.bidang)}</td>

                    <td className="px-4 py-3.5">
                      <p className="font-bold text-gray-900">{j.topik}</p>
                      <p className="text-gray-500 text-[11px] line-clamp-1 mt-0.5">{j.uraian}</p>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {j.status === "Proses" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Hourglass className="h-3 w-3 animate-spin" />
                          <span>Proses</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Selesai</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(j)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Edit Catatan"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Hapus catatan jurnal konseling ini?")) {
                              onDeleteJurnal(j.id_jurnal);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Hapus Catatan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50/80 px-4 py-3 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-600">
          <div>
            Menampilkan <strong>{filteredList.length}</strong> dari <strong>{jurnalList.length}</strong> Catatan Layanan Konseling
          </div>
        </div>
      </div>

      {/* SLIDE-OVER DRAWER FORM JURNAL LAYANAN */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col border-l border-gray-200">
              {/* DRAWER HEADER */}
              <div className="p-5 border-b border-gray-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-indigo-100 text-indigo-800">
                    Formulir Kerahasiaan
                  </span>
                  <h3 className="text-base font-bold text-gray-900 mt-1">
                    {editingJurnalId
                      ? "Edit Catatan Layanan Konseling"
                      : "Form Catatan Layanan Konseling"}
                  </h3>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* DRAWER FORM */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* IDENTITAS KONSELI */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Identitas Konseli
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Pilih Siswa Konseli
                    </label>
                    <select
                      value={selectedSiswaId}
                      onChange={(e) => setSelectedSiswaId(e.target.value)}
                      disabled={!!editingJurnalId}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white font-medium"
                    >
                      {konseliList.map((s) => (
                        <option key={s.id_siswa} value={s.id_siswa}>
                          {s.nama_lengkap} ({s.nama_rombel}) - NISN: {s.nisn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Pendekatan Layanan
                    </label>
                    <select
                      value={pendekatan}
                      onChange={(e) => setPendekatan(e.target.value as PendekatanLayanan)}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white font-medium"
                    >
                      <option value="Tatap Muka (Individual)">Tatap Muka (Individual)</option>
                      <option value="Bimbingan Kelompok">Bimbingan Kelompok</option>
                      <option value="Mediasi">Mediasi</option>
                      <option value="Kunjungan Rumah (Home Visit)">
                        Kunjungan Rumah (Home Visit)
                      </option>
                    </select>
                  </div>
                </div>

                {/* DETAIL LAYANAN */}
                <div className="space-y-4 p-4 bg-indigo-50/30 rounded-xl border border-indigo-200/80">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-indigo-600" />
                      Detail Layanan (Rahasia)
                    </h4>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono font-bold">
                      RLS ENCRYPTED
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Tanggal
                      </label>
                      <input
                        type="date"
                        required
                        value={tglLayanan}
                        onChange={(e) => setTglLayanan(e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Waktu (WIB)
                      </label>
                      <input
                        type="time"
                        required
                        value={waktuLayanan}
                        onChange={(e) => setWaktuLayanan(e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Bidang Layanan (Standar BK)
                    </label>
                    <select
                      value={bidang}
                      onChange={(e) => setBidang(e.target.value as BidangLayanan)}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white font-medium"
                    >
                      <option value="Pribadi">🔵 Pribadi</option>
                      <option value="Sosial">🟢 Sosial</option>
                      <option value="Akademik">🟣 Akademik (Belajar)</option>
                      <option value="Karir">🟡 Karir / Peminatan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Topik Pembahasan (Judul)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Motivasi Belajar Menurun / Minat Lanjut Studi"
                      value={topik}
                      onChange={(e) => setTopik(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Uraian / Hasil Konseling
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Uraikan faktor dinamika psikologis, respon konseli, dan hasil intervensi yang dicapai..."
                      value={uraian}
                      onChange={(e) => setUraian(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Tindak Lanjut
                      </label>
                      <select
                        value={tindakLanjut}
                        onChange={(e) => setTindakLanjut(e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white font-medium"
                      >
                        <option value="Jadwalkan Sesi Lanjutan">Jadwalkan Sesi Lanjutan</option>
                        <option value="Koordinasi dengan Wali Kelas">
                          Koordinasi dengan Wali Kelas
                        </option>
                        <option value="Pemantauan Berkala">Pemantauan Berkala</option>
                        <option value="Kasus Selesai">Kasus Selesai</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Status Layanan
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as StatusLayanan)}
                        className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white font-semibold text-indigo-900"
                      >
                        <option value="Proses">Proses</option>
                        <option value="Selesai">Selesai</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-200">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button variant="primary" type="submit" loading={submitting}>
                    Simpan Catatan Konseling
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
