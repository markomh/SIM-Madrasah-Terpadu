"use client";

import { useState, useMemo } from "react";
import {
  X,
  AlertCircle,
  Lock,
  Printer,
  Calendar,
  Clock,
  FileText,
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  PlusCircle,
  HelpCircle,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/primitives";
import {
  MASTER_PELANGGARAN,
  type KonseliDetail,
  type PelanggaranSiswa,
  type JurnalKonseling,
  type SuratPanggilanSP,
  type BidangLayanan,
  type StatusLayanan,
  type PendekatanLayanan,
} from "../types";

interface TindakLanjutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  siswa: KonseliDetail | null;
  currentUserId: string;
  madrasahName?: string;
  onSavePelanggaran: (data: Omit<PelanggaranSiswa, "id_pelanggaran">) => Promise<void>;
  onSaveKonseling: (data: Omit<JurnalKonseling, "id_jurnal">) => Promise<void>;
  onSaveSp: (data: Omit<SuratPanggilanSP, "id_sp">) => Promise<void>;
}

export function TindakLanjutDrawer({
  isOpen,
  onClose,
  siswa,
  currentUserId,
  madrasahName = "MTs Terpadu Nusantara",
  onSavePelanggaran,
  onSaveKonseling,
  onSaveSp,
}: TindakLanjutDrawerProps) {
  if (!isOpen || !siswa) return null;

  // Active Sub-Action Tab
  const [activeAction, setActiveAction] = useState<"pelanggaran" | "konseling" | "sp">(
    siswa.total_poin >= 75 ? "sp" : "pelanggaran"
  );

  const [saving, setSaving] = useState(false);
  const [showSpPreview, setShowSpPreview] = useState(false);

  // --- FORM STATE: PELANGGARAN ---
  const [tglPelanggaran, setTglPelanggaran] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedKategoriIdx, setSelectedKategoriIdx] = useState<number>(0);
  const [selectedItemIdx, setSelectedItemIdx] = useState<number>(0);
  const [kronologi, setKronologi] = useState<string>("");

  const currentKategori = MASTER_PELANGGARAN[selectedKategoriIdx] || MASTER_PELANGGARAN[0];
  const currentItem = currentKategori?.items[selectedItemIdx] || currentKategori?.items[0];

  // --- FORM STATE: JURNAL KONSELING ---
  const [tglKonseling, setTglKonseling] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [waktuKonseling, setWaktuKonseling] = useState<string>("09:30");
  const [pendekatan, setPendekatan] = useState<PendekatanLayanan>("Tatap Muka (Individual)");
  const [bidang, setBidang] = useState<BidangLayanan>("Pribadi");
  const [topik, setTopik] = useState<string>("");
  const [uraian, setUraian] = useState<string>("");
  const [tindakLanjut, setTindakLanjut] = useState<string>("Jadwalkan Sesi Lanjutan");
  const [statusKonseling, setStatusKonseling] = useState<StatusLayanan>("Proses");

  // --- FORM STATE: GENERATOR SP ---
  const [nomorSp, setNomorSp] = useState<string>(
    `SP/BK/${new Date().getFullYear()}/${String(Math.floor(100 + Math.random() * 900))}`
  );
  const [hariSp, setHariSp] = useState<string>("Kamis");
  const [tglSp, setTglSp] = useState<string>(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [jamSp, setJamSp] = useState<string>("09:00");
  const [ruangSp, setRuangSp] = useState<string>("Ruang Bimbingan Konseling (BK)");
  const [keperluanSp, setKeperluanSp] = useState<string>(
    "Koordinasi penanganan kedisiplinan dan pembinaan perilaku siswa."
  );

  // Point badge calculation
  const getPoinBadge = (pts: number) => {
    if (pts >= 75)
      return {
        text: `[ ${pts} ] 🔴 Kritis / Panggilan Ortu`,
        cls: "bg-rose-100 text-rose-800 border-rose-300",
      };
    if (pts >= 51)
      return {
        text: `[ ${pts} ] 🟠 Peringatan 2`,
        cls: "bg-orange-100 text-orange-800 border-orange-300",
      };
    if (pts >= 25)
      return {
        text: `[ ${pts} ] 🟡 Peringatan 1`,
        cls: "bg-amber-100 text-amber-800 border-amber-300",
      };
    return {
      text: `[ ${pts} ] 🟢 Aman`,
      cls: "bg-emerald-100 text-emerald-800 border-emerald-300",
    };
  };

  const poinBadge = getPoinBadge(siswa.total_poin);

  // Handle Save Violation
  const handleSubmitPelanggaran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) return;
    setSaving(true);
    try {
      await onSavePelanggaran({
        id_siswa: siswa.id_siswa,
        id_pegawai_pencatat: currentUserId,
        tanggal: tglPelanggaran,
        kategori: currentKategori.kategori,
        item_pelanggaran: currentItem.nama,
        bobot_poin: currentItem.poin,
        catatan_kronologi: kronologi,
      });
      setKronologi("");
    } finally {
      setSaving(false);
    }
  };

  // Handle Save Counseling
  const handleSubmitKonseling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topik.trim() || !uraian.trim()) return;
    setSaving(true);
    try {
      await onSaveKonseling({
        id_siswa: siswa.id_siswa,
        id_pegawai_bk: currentUserId,
        tanggal: tglKonseling,
        waktu: waktuKonseling,
        pendekatan,
        bidang,
        topik,
        uraian,
        tindak_lanjut: tindakLanjut,
        status: statusKonseling,
        tingkat_kerahasiaan: "Rahasia",
      });
      setTopik("");
      setUraian("");
    } finally {
      setSaving(false);
    }
  };

  // Handle Save & Print SP
  const handleSubmitSp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveSp({
        id_siswa: siswa.id_siswa,
        nomor_surat: nomorSp,
        tanggal_terbit: new Date().toISOString().split("T")[0],
        hari_pemanggilan: hariSp,
        tanggal_pemanggilan: tglSp,
        jam_pemanggilan: jamSp,
        ruangan_tujuan: ruangSp,
        keperluan: keperluanSp,
        total_poin_saat_terbit: siswa.total_poin,
        status: "Diterbitkan",
      });
      setShowSpPreview(true);
    } finally {
      setSaving(false);
    }
  };

  // Unified timeline events
  const timelineEvents = useMemo(() => {
    const events: {
      id: string;
      tanggal: string;
      tipe: "pelanggaran" | "konseling" | "sp";
      judul: string;
      detail: string;
      meta?: string;
    }[] = [];

    siswa.riwayat_pelanggaran?.forEach((p) => {
      events.push({
        id: p.id_pelanggaran,
        tanggal: p.tanggal,
        tipe: "pelanggaran",
        judul: `Pelanggaran: ${p.item_pelanggaran} (+${p.bobot_poin} Poin)`,
        detail: p.catatan_kronologi || `Kategori: ${p.kategori}`,
        meta: `+${p.bobot_poin} Poin`,
      });
    });

    siswa.riwayat_konseling?.forEach((k) => {
      events.push({
        id: k.id_jurnal,
        tanggal: k.tanggal,
        tipe: "konseling",
        judul: `Konseling: ${k.topik} (${k.bidang})`,
        detail: k.uraian,
        meta: k.status,
      });
    });

    siswa.riwayat_sp?.forEach((sp) => {
      events.push({
        id: sp.id_sp,
        tanggal: sp.tanggal_terbit,
        tipe: "sp",
        judul: `Surat Panggilan: ${sp.nomor_surat}`,
        detail: `Jadwal: ${sp.hari_pemanggilan}, ${sp.tanggal_pemanggilan} (${sp.jam_pemanggilan} WIB) - ${sp.ruangan_tujuan}`,
        meta: sp.status,
      });
    });

    return events.sort((a, b) => (a.tanggal > b.tanggal ? -1 : 1));
  }, [siswa]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-gray-200">
          {/* HEADER */}
          <div className="p-5 border-b border-gray-200 bg-slate-50 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-indigo-100 text-indigo-800">
                  Slide-over Tindak Lanjut
                </span>
                <span className="text-xs text-gray-500 font-mono">ID: {siswa.nisn}</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mt-1">
                Detail Tindak Lanjut Siswa
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* SCROLLABLE BODY */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 1. PROFIL SISWA CARD */}
            <div className="p-4.5 bg-gradient-to-br from-slate-50 to-gray-100/70 rounded-xl border border-gray-200/80 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{siswa.nama_lengkap}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 mt-1">
                    <span>
                      NISN: <strong className="font-mono text-gray-800">{siswa.nisn}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Kelas: <strong className="text-gray-800">{siswa.nama_rombel}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Wali Kelas: <strong className="text-gray-800">{siswa.nama_wali_kelas}</strong>
                    </span>
                  </div>
                </div>
                <div>
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${poinBadge.cls}`}
                  >
                    {poinBadge.text}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. PILIH TINDAKAN TABS */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Pilih Jenis Tindakan:
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setActiveAction("pelanggaran");
                    setShowSpPreview(false);
                  }}
                  className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeAction === "pelanggaran"
                      ? "bg-white text-rose-700 shadow-xs border border-rose-200"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>Tambah Pelanggaran</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveAction("konseling");
                    setShowSpPreview(false);
                  }}
                  className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeAction === "konseling"
                      ? "bg-white text-indigo-700 shadow-xs border border-indigo-200"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Catat Konseling</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveAction("sp");
                  }}
                  className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeAction === "sp"
                      ? "bg-white text-amber-700 shadow-xs border border-amber-200"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Terbitkan SP</span>
                </button>
              </div>
            </div>

            {/* 3. DYNAMIC FORM CONTAINER */}

            {/* --- ACTION 1: TAMBAH PELANGGARAN BARU --- */}
            {activeAction === "pelanggaran" && (
              <form
                onSubmit={handleSubmitPelanggaran}
                className="p-5 bg-rose-50/40 rounded-xl border border-rose-200/80 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                  <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-rose-600" />
                    Form Input Kasus Pelanggaran Siswa
                  </h4>
                  <span className="text-[11px] text-rose-700 font-medium">
                    Terkoneksi Master Bobot Poin
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tanggal Kejadian
                    </label>
                    <input
                      type="date"
                      required
                      value={tglPelanggaran}
                      onChange={(e) => setTglPelanggaran(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Kategori Kasus
                    </label>
                    <select
                      value={selectedKategoriIdx}
                      onChange={(e) => {
                        setSelectedKategoriIdx(Number(e.target.value));
                        setSelectedItemIdx(0);
                      }}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-rose-500 font-medium"
                    >
                      {MASTER_PELANGGARAN.map((k, idx) => (
                        <option key={k.kategori} value={idx}>
                          {k.kategori}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Item Pelanggaran (Pilihan Baku)
                  </label>
                  <select
                    value={selectedItemIdx}
                    onChange={(e) => setSelectedItemIdx(Number(e.target.value))}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-rose-500 font-medium text-gray-800"
                  >
                    {currentKategori.items.map((item, idx) => (
                      <option key={item.nama} value={idx}>
                        {item.nama} (+{item.poin} Poin)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Auto Poin Display */}
                <div className="bg-rose-100/70 border border-rose-200 p-3 rounded-lg flex items-center justify-between">
                  <span className="text-xs font-medium text-rose-900">
                    Bobot Poin Pelanggaran:
                  </span>
                  <span className="text-lg font-extrabold text-rose-700 font-mono">
                    +{currentItem?.poin || 0} Poin
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Catatan Tambahan (Kronologi Singkat)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Ditemukan di kantin saat jam pelajaran Matematika berlangsung..."
                    value={kronologi}
                    onChange={(e) => setKronologi(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <Button variant="secondary" type="button" onClick={onClose}>
                    Batal
                  </Button>
                  <Button variant="primary" type="submit" loading={saving}>
                    Simpan Kasus Pelanggaran
                  </Button>
                </div>
              </form>
            )}

            {/* --- ACTION 2: CATAT JURNAL KONSELING PRIVAT --- */}
            {activeAction === "konseling" && (
              <form
                onSubmit={handleSubmitKonseling}
                className="p-5 bg-indigo-50/30 rounded-xl border border-indigo-200/80 space-y-4"
              >
                {/* Confidentiality Warning */}
                <div className="bg-indigo-900 text-white p-3.5 rounded-lg flex items-start gap-2.5 text-xs shadow-xs">
                  <Lock className="h-4 w-4 text-indigo-300 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-indigo-200 font-semibold mb-0.5">
                      Asas Kerahasiaan Bimbingan Konseling (Data Terenkripsi)
                    </strong>
                    Catatan konseling ini terisolasi secara ketat dan hanya dapat dibaca oleh Anda
                    (Guru BK) serta Kepala Madrasah sesuai standar RLS SIM Madrasah.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tanggal Layanan
                    </label>
                    <input
                      type="date"
                      required
                      value={tglKonseling}
                      onChange={(e) => setTglKonseling(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Waktu Pelaksanaan (WIB)
                    </label>
                    <input
                      type="time"
                      required
                      value={waktuKonseling}
                      onChange={(e) => setWaktuKonseling(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Pendekatan Layanan
                    </label>
                    <select
                      value={pendekatan}
                      onChange={(e) => setPendekatan(e.target.value as PendekatanLayanan)}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="Tatap Muka (Individual)">Tatap Muka (Individual)</option>
                      <option value="Bimbingan Kelompok">Bimbingan Kelompok</option>
                      <option value="Mediasi">Mediasi</option>
                      <option value="Kunjungan Rumah (Home Visit)">
                        Kunjungan Rumah (Home Visit)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Bidang Layanan (Standar Nasional)
                    </label>
                    <select
                      value={bidang}
                      onChange={(e) => setBidang(e.target.value as BidangLayanan)}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="Pribadi">🔵 Pribadi</option>
                      <option value="Sosial">🟢 Sosial</option>
                      <option value="Akademik">🟣 Akademik (Belajar)</option>
                      <option value="Karir">🟡 Karir / Peminatan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Topik Pembahasan / Judul Kasus
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Motivasi Belajar Menurun / Penanganan Konflik Teman Sebaya"
                    value={topik}
                    onChange={(e) => setTopik(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Uraian / Hasil Konseling (Psikososial)
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Catat dinamika psikologis, faktor penyebab di lingkungan/keluarga, serta teknik konseling yang diberikan..."
                    value={uraian}
                    onChange={(e) => setUraian(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Rencana Tindak Lanjut
                    </label>
                    <select
                      value={tindakLanjut}
                      onChange={(e) => setTindakLanjut(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="Jadwalkan Sesi Lanjutan">Jadwalkan Sesi Lanjutan</option>
                      <option value="Koordinasi dengan Wali Kelas">
                        Koordinasi dengan Wali Kelas
                      </option>
                      <option value="Pemantauan Berkala">Pemantauan Berkala</option>
                      <option value="Kasus Selesai (Discharged)">Kasus Selesai (Discharged)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Status Kasus
                    </label>
                    <select
                      value={statusKonseling}
                      onChange={(e) => setStatusKonseling(e.target.value as StatusLayanan)}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 font-semibold text-indigo-900"
                    >
                      <option value="Proses">⏳ Proses (Perlu Sesi Lanjutan)</option>
                      <option value="Selesai">✅ Selesai</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <Button variant="secondary" type="button" onClick={onClose}>
                    Batal
                  </Button>
                  <Button variant="primary" type="submit" loading={saving}>
                    Simpan Jurnal Konseling
                  </Button>
                </div>
              </form>
            )}

            {/* --- ACTION 3: TERBITKAN SURAT PANGGILAN (SP) --- */}
            {activeAction === "sp" && (
              <div className="space-y-4">
                {/* SP Trigger Alert */}
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                    siswa.total_poin >= 75
                      ? "bg-rose-50 border-rose-300 text-rose-950"
                      : "bg-amber-50 border-amber-300 text-amber-950"
                  }`}
                >
                  <AlertCircle
                    className={`h-5 w-5 shrink-0 mt-0.5 ${
                      siswa.total_poin >= 75 ? "text-rose-600" : "text-amber-600"
                    }`}
                  />
                  <div>
                    <p className="font-bold text-sm">
                      {siswa.total_poin >= 75
                        ? "Ambang Poin Kritis Terlampaui (>75 Poin)"
                        : "Penerbitan Surat Peringatan / Pemanggilan Orang Tua"}
                    </p>
                    <p className="mt-0.5">
                      Siswa <strong>{siswa.nama_lengkap}</strong> memiliki total akumulasi{" "}
                      <strong>{siswa.total_poin} Poin</strong>. Format surat panggilan resmi akan
                      dirakit otomatis dengan rincian kronologi kasus dan kop madrasah.
                    </p>
                  </div>
                </div>

                {!showSpPreview ? (
                  <form
                    onSubmit={handleSubmitSp}
                    className="p-5 bg-amber-50/30 rounded-xl border border-amber-200/80 space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Nomor Surat Panggilan
                        </label>
                        <input
                          type="text"
                          required
                          value={nomorSp}
                          onChange={(e) => setNomorSp(e.target.value)}
                          className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Ruang / Tempat Pertemuan
                        </label>
                        <input
                          type="text"
                          required
                          value={ruangSp}
                          onChange={(e) => setRuangSp(e.target.value)}
                          className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Hari Pemanggilan
                        </label>
                        <select
                          value={hariSp}
                          onChange={(e) => setHariSp(e.target.value)}
                          className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white font-medium"
                        >
                          <option value="Senin">Senin</option>
                          <option value="Selasa">Selasa</option>
                          <option value="Rabu">Rabu</option>
                          <option value="Kamis">Kamis</option>
                          <option value="Jumat">Jumat</option>
                          <option value="Sabtu">Sabtu</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Tanggal Pemanggilan
                        </label>
                        <input
                          type="date"
                          required
                          value={tglSp}
                          onChange={(e) => setTglSp(e.target.value)}
                          className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Jam Pertemuan
                        </label>
                        <input
                          type="time"
                          required
                          value={jamSp}
                          onChange={(e) => setJamSp(e.target.value)}
                          className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Keperluan Pemanggilan
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={keperluanSp}
                        onChange={(e) => setKeperluanSp(e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white"
                      />
                    </div>

                    <div className="flex justify-end gap-2.5 pt-2">
                      <Button variant="secondary" type="button" onClick={onClose}>
                        Batal
                      </Button>
                      <Button
                        variant="primary"
                        type="submit"
                        loading={saving}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        <FileText className="h-4 w-4 mr-1.5" />
                        Terbitkan &amp; Tinjau Dokumen SP
                      </Button>
                    </div>
                  </form>
                ) : (
                  /* SP PRINT / PREVIEW PANEL */
                  <div className="p-6 bg-white rounded-xl border-2 border-dashed border-gray-300 space-y-5 text-gray-900 shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Printer className="h-4 w-4" /> Pratinjau Surat Panggilan Resmi
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1.5 transition-colors"
                        >
                          <Printer className="h-3.5 w-3.5" /> Cetak Dokumen PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSpPreview(false)}
                          className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          Edit Parameter
                        </button>
                      </div>
                    </div>

                    {/* DOKUMEN SP FISIK */}
                    <div className="bg-white p-6 rounded border border-gray-200 text-xs space-y-4 font-serif">
                      {/* Kop Surat */}
                      <div className="text-center border-b-2 border-double border-gray-900 pb-3">
                        <h4 className="font-bold text-sm tracking-wider uppercase">
                          KEMENTERIAN AGAMA REPUBLIK INDONESIA
                        </h4>
                        <h3 className="font-extrabold text-base tracking-wide uppercase">
                          {madrasahName}
                        </h3>
                        <p className="text-[10px] font-sans text-gray-600">
                          Unit Bimbingan dan Konseling (BK) • Tahun Ajaran 2026/2027
                        </p>
                      </div>

                      {/* Header Info */}
                      <div className="flex justify-between text-[11px] font-sans pt-1">
                        <div>
                          <p>
                            Nomor : <strong>{nomorSp}</strong>
                          </p>
                          <p>Lampiran : —</p>
                          <p>Perihal : Surat Panggilan Orang Tua / Wali Siswa</p>
                        </div>
                        <div className="text-right">
                          <p>Tanggal: {new Date().toLocaleDateString("id-ID")}</p>
                          <p>Kepada Yth:</p>
                          <p className="font-bold">Orang Tua / Wali dari {siswa.nama_lengkap}</p>
                          <p>di Tempat</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-[11px] leading-relaxed pt-2 font-sans">
                        <p>
                          <em>Assalamu&apos;alaikum Wr. Wb.</em>
                        </p>
                        <p>
                          Sehubungan dengan pemantauan kedisiplinan dan evaluasi perkembangan
                          belajar siswa kami:
                        </p>
                        <div className="bg-gray-50 p-2.5 rounded border border-gray-200 font-mono text-[11px] space-y-1">
                          <p>
                            Nama : <strong>{siswa.nama_lengkap}</strong>
                          </p>
                          <p>
                            NISN : <strong>{siswa.nisn}</strong>
                          </p>
                          <p>
                            Kelas : <strong>{siswa.nama_rombel}</strong>
                          </p>
                          <p>
                            Total Akumulasi Poin :{" "}
                            <strong className="text-rose-700">{siswa.total_poin} Poin</strong> (
                            {poinBadge.text})
                          </p>
                        </div>
                        <p>
                          Kami mengharap kehadiran Bapak/Ibu Orang Tua / Wali Siswa pada:
                        </p>
                        <table className="w-full border border-gray-200 text-[11px]">
                          <tbody>
                            <tr className="border-b">
                              <td className="p-2 font-semibold w-32 bg-gray-50">Hari / Tanggal</td>
                              <td className="p-2">
                                {hariSp}, {tglSp}
                              </td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2 font-semibold bg-gray-50">Waktu</td>
                              <td className="p-2">{jamSp} WIB s/d Selesai</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2 font-semibold bg-gray-50">Tempat</td>
                              <td className="p-2">{ruangSp}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-semibold bg-gray-50">Keperluan</td>
                              <td className="p-2">{keperluanSp}</td>
                            </tr>
                          </tbody>
                        </table>
                        <p className="pt-2">
                          Mengingat pentingnya hal ini demi masa depan belajar ananda, kehadiran
                          Bapak/Ibu sangat kami harapkan tepat pada waktunya.
                        </p>
                        <p>
                          <em>Wassalamu&apos;alaikum Wr. Wb.</em>
                        </p>
                      </div>

                      {/* Tanda Tangan */}
                      <div className="grid grid-cols-2 text-center text-[11px] pt-4 font-sans">
                        <div>
                          <p>Mengetahui,</p>
                          <p className="font-bold">Kepala Madrasah</p>
                          <div className="h-14" />
                          <p className="font-bold underline">Drs. H. Ahmad Dahlan, M.Pd.</p>
                          <p className="text-[10px] text-gray-500">NIP. 197501012000031001</p>
                        </div>
                        <div>
                          <p>Guru Bimbingan Konseling,</p>
                          <p className="font-bold">Konselor Sekolah</p>
                          <div className="h-14" />
                          <p className="font-bold underline">Nurul Hidayah, S.Psi.</p>
                          <p className="text-[10px] text-gray-500">NIP. 198805052012012003</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. RIWAYAT TINDAKAN (TIMELINE GABUNGAN) */}
            <div className="border-t border-gray-200 pt-5">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <History className="h-4 w-4 text-gray-500" />
                Riwayat Tindakan &amp; Rekam Kasus (Timeline)
              </h4>

              {timelineEvents.length === 0 ? (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center text-xs text-gray-500">
                  Belum ada catatan riwayat pelanggaran atau sesi konseling untuk siswa ini.
                </div>
              ) : (
                <div className="space-y-2.5 relative before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-gray-200 pl-7">
                  {timelineEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="relative p-3 rounded-lg border text-xs transition-all bg-white hover:bg-gray-50"
                    >
                      {/* Timeline dot */}
                      <span
                        className={`absolute -left-5.5 top-3.5 h-3 w-3 rounded-full border-2 border-white ${
                          evt.tipe === "pelanggaran"
                            ? "bg-rose-500"
                            : evt.tipe === "konseling"
                            ? "bg-indigo-500"
                            : "bg-amber-500"
                        }`}
                      />
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-900">{evt.judul}</p>
                          <p className="text-gray-600 text-[11px] mt-0.5">{evt.detail}</p>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 shrink-0">
                          {evt.tanggal}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
