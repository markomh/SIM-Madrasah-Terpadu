"use client";

// Clean HMR trigger

import { isAdminMadrasah } from "@/lib/access";
import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion, useTahunAjaran } from "@/components/app-providers";
import {
  ErrorBlock,
  LoadingBlock,
  Button,
  Input,
  Select,
  SearchInput,
  Badge,
  Modal,
} from "@/components/ui/primitives";
import { services } from "@/services";
import type { HariLibur, MataPelajaran, Pegawai, Rombel, TingkatPendidikan } from "@/types";
import {
  BookOpen,
  Calendar,
  Plus,
  Save,
  Edit2,
  Briefcase,
  X,
  FileSpreadsheet,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Trash2,
  Search,
} from "lucide-react";

type TabDomain = "kurikulum" | "beban-kerja" | "kalender";

interface EkuivalensiParam {
  id: string;
  jenis: string;
  nilai_jtm: string | number;
  sumber: string;
  status: string;
}

interface KuotaMapelParam {
  id: string;
  tingkat: string;
  kode_mapel: string;
  nama_mapel: string;
  kelompok: string;
  kuota_jtm: number;
  sumber_kurikulum: string;
}

export default function ReferensiPage() {
  const { currentUser, penugasanList } = useAuth();
  const { selected } = useTahunAjaran();
  const { version, bump } = useDataVersion();

  const [activeTab, setActiveTab] = useState<TabDomain>("kurikulum");

  // Data State
  const [mapel, setMapel] = useState<MataPelajaran[]>([]);
  const [tingkat, setTingkat] = useState<TingkatPendidikan[]>([]);
  const [rombel, setRombel] = useState<Rombel[]>([]);
  const [libur, setLibur] = useState<HariLibur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedTingkatFilter, setSelectedTingkatFilter] = useState<string>("Kelas 7");
  const [filterKurikulum, setFilterKurikulum] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Action States
  const [isAddMapelOpen, setIsAddMapelOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSinkronEmisOpen, setIsSinkronEmisOpen] = useState(false);

  // Form Add Mapel
  const [newKodeMapel, setNewKodeMapel] = useState("");
  const [newNamaMapel, setNewNamaMapel] = useState("");
  const [newKelompokMapel, setNewKelompokMapel] = useState("Kelompok A (Wajib)");
  const [newTingkatMapel, setNewTingkatMapel] = useState("Kelas 7");
  const [newKuotaJtm, setNewKuotaJtm] = useState<number>(2);
  const [submittingMapel, setSubmittingMapel] = useState(false);

  // Edit Kuota Modal/State
  const [editingKuota, setEditingKuota] = useState<KuotaMapelParam | null>(null);
  const [editKuotaVal, setEditKuotaVal] = useState<number>(0);

  // Master Data Kuota Mapel (Standard 15 Mapel for Kelas 7 EMIS / KMA 347)
  const [kuotaMapelList, setKuotaMapelList] = useState<KuotaMapelParam[]>([
    { id: "1", tingkat: "Kelas 7", kode_mapel: "QH", nama_mapel: "Al-Qur'an Hadis", kelompok: "Kelompok A (PAI)", kuota_jtm: 2, sumber_kurikulum: "KMA No. 347/2022 (Kurikulum Merdeka)" },
    { id: "2", tingkat: "Kelas 7", kode_mapel: "AA", nama_mapel: "Akidah Akhlak", kelompok: "Kelompok A (PAI)", kuota_jtm: 2, sumber_kurikulum: "KMA No. 347/2022 (Kurikulum Merdeka)" },
    { id: "3", tingkat: "Kelas 7", kode_mapel: "FIQ", nama_mapel: "Fikih", kelompok: "Kelompok A (PAI)", kuota_jtm: 2, sumber_kurikulum: "KMA No. 347/2022 (Kurikulum Merdeka)" },
    { id: "4", tingkat: "Kelas 7", kode_mapel: "SKI", nama_mapel: "Sejarah Kebudayaan Islam", kelompok: "Kelompok A (PAI)", kuota_jtm: 2, sumber_kurikulum: "KMA No. 347/2022 (Kurikulum Merdeka)" },
    { id: "5", tingkat: "Kelas 7", kode_mapel: "BAR", nama_mapel: "Bahasa Arab", kelompok: "Kelompok A (Wajib)", kuota_jtm: 3, sumber_kurikulum: "KMA No. 347/2022 (Kurikulum Merdeka)" },
    { id: "6", tingkat: "Kelas 7", kode_mapel: "IND", nama_mapel: "Bahasa Indonesia", kelompok: "Kelompok A (Wajib)", kuota_jtm: 6, sumber_kurikulum: "KMA No. 347/2022 (Kurikulum Merdeka)" },
    { id: "7", tingkat: "Kelas 7", kode_mapel: "MTK", nama_mapel: "Matematika", kelompok: "Kelompok A (Wajib)", kuota_jtm: 5, sumber_kurikulum: "KMA No. 347/2022 (Kurikulum Merdeka)" },
    { id: "8", tingkat: "Kelas 7", kode_mapel: "IPA", nama_mapel: "Ilmu Pengetahuan Alam", kelompok: "Kelompok A (Wajib)", kuota_jtm: 5, sumber_kurikulum: "KMA No. 347/2022 (Kurikulum Merdeka)" },
    { id: "9", tingkat: "Kelas 7", kode_mapel: "IPS", nama_mapel: "Ilmu Pengetahuan Sosial", kelompok: "Kelompok A (Wajib)", kuota_jtm: 4, sumber_kurikulum: "KMA No. 347/2022 (Kurikulum Merdeka)" },
    { id: "10", tingkat: "Kelas 7", kode_mapel: "ING", nama_mapel: "Bahasa Inggris", kelompok: "Kelompok A (Wajib)", kuota_jtm: 4, sumber_kurikulum: "KMA No. 347/2022 (Kurikulum Merdeka)" },
    { id: "11", tingkat: "Kelas 7", kode_mapel: "PPKN", nama_mapel: "Pendidikan Pancasila", kelompok: "Kelompok A (Wajib)", kuota_jtm: 3, sumber_kurikulum: "KMA No. 347/2022 (Kurikulum Merdeka)" },
    { id: "12", tingkat: "Kelas 7", kode_mapel: "PJOK", nama_mapel: "PJOK", kelompok: "Kelompok A (Wajib)", kuota_jtm: 3, sumber_kurikulum: "KMA No. 347/2022 (Kurikulum Merdeka)" },
    { id: "13", tingkat: "Kelas 7", kode_mapel: "INF", nama_mapel: "Informatika", kelompok: "Kelompok B (Pilihan)", kuota_jtm: 2, sumber_kurikulum: "KMA No. 347/2022 (Kurikulum Merdeka)" },
    { id: "14", tingkat: "Kelas 7", kode_mapel: "SEN", nama_mapel: "Seni & Budaya", kelompok: "Kelompok B (Pilihan)", kuota_jtm: 2, sumber_kurikulum: "KMA No. 347/2022 (Kurikulum Merdeka)" },
    { id: "15", tingkat: "Kelas 7", kode_mapel: "ML", nama_mapel: "Muatan Lokal (Bahasa Daerah)", kelompok: "Muatan Lokal", kuota_jtm: 2, sumber_kurikulum: "KMA No. 347/2022 (Kurikulum Merdeka)" },

    { id: "16", tingkat: "Kelas 8", kode_mapel: "QH", nama_mapel: "Al-Qur'an Hadis", kelompok: "Kelompok A (PAI)", kuota_jtm: 2, sumber_kurikulum: "KMA No. 347/2022 (Kurikulum Merdeka)" },
    { id: "17", tingkat: "Kelas 8", kode_mapel: "IND", nama_mapel: "Bahasa Indonesia", kelompok: "Kelompok A (Wajib)", kuota_jtm: 6, sumber_kurikulum: "KMA No. 347/2022 (Kurikulum Merdeka)" },
    { id: "18", tingkat: "Kelas 8", kode_mapel: "MTK", nama_mapel: "Matematika", kelompok: "Kelompok A (Wajib)", kuota_jtm: 5, sumber_kurikulum: "KMA No. 347/2022 (Kurikulum Merdeka)" },

    { id: "19", tingkat: "Kelas 9", kode_mapel: "QH", nama_mapel: "Al-Qur'an Hadis", kelompok: "Kelompok A (PAI)", kuota_jtm: 2, sumber_kurikulum: "Kurikulum 2013 (K13)" },
    { id: "20", tingkat: "Kelas 9", kode_mapel: "IND", nama_mapel: "Bahasa Indonesia", kelompok: "Kelompok A (Wajib)", kuota_jtm: 6, sumber_kurikulum: "Kurikulum 2013 (K13)" },
    { id: "21", tingkat: "Kelas 9", kode_mapel: "MTK", nama_mapel: "Matematika", kelompok: "Kelompok A (Wajib)", kuota_jtm: 5, sumber_kurikulum: "Kurikulum 2013 (K13)" },
  ]);

  // Ekuivalensi JTM List
  const [ekuivalensiList, setEkuivalensiList] = useState<EkuivalensiParam[]>([
    { id: "1", jenis: "Kepala Madrasah", nilai_jtm: 24, sumber: "PMA No. 19 Tahun 2020", status: "Aktif" },
    { id: "2", jenis: "Wakil Kepala Madrasah", nilai_jtm: 12, sumber: "PMA No. 19 Tahun 2020", status: "Aktif" },
    { id: "3", jenis: "Wali Kelas", nilai_jtm: 6, sumber: "Juknis Kemenag RI", status: "Aktif" },
    { id: "4", jenis: "Guru BK / Konselor", nilai_jtm: 24, sumber: "PMA No. 19/2020 (150 Konseli = 24 JTM)", status: "Aktif" },
    { id: "5", jenis: "Kepala Perpustakaan / Laboratorium", nilai_jtm: 12, sumber: "PMA No. 19 Tahun 2020", status: "Aktif" },
    { id: "6", jenis: "Pembina Ekstrakurikuler", nilai_jtm: 2, sumber: "Juknis Kemenag RI", status: "Aktif" },
    { id: "7", jenis: "Koordinator P5 / PPRA", nilai_jtm: 2, sumber: "KMA No. 347 Tahun 2022", status: "Aktif" },
  ]);
  const [editingEkuivalensi, setEditingEkuivalensi] = useState<EkuivalensiParam | null>(null);
  const [editNilaiJtm, setEditNilaiJtm] = useState<string>("");
  const [editSumber, setEditSumber] = useState<string>("");

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      try {
        const [m, t, r, l] = await Promise.all([
          services.referensi.getMapel(),
          services.referensi.getTingkat(),
          services.referensi.getRombel({ id_tahun: selected?.id_tahun }),
          services.referensi.getHariLibur(),
        ]);
        if (!ignore) {
          setMapel(m);
          setTingkat(t);
          setRombel(r);
          setLibur(l);
        }
      } catch (e: unknown) {
        if (!ignore) setError(e instanceof Error ? e.message : "Gagal memuat data referensi");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [version, selected?.id_tahun]);

  const canManage = currentUser ? isAdminMadrasah(currentUser.id_pegawai, penugasanList) : false;

  // Statistics calculation for selected Tingkat
  const tingkatDataList = useMemo(() => {
    return kuotaMapelList.filter((k) => k.tingkat === selectedTingkatFilter);
  }, [kuotaMapelList, selectedTingkatFilter]);

  const totalMapelTingkat = tingkatDataList.length;
  const totalJtmTingkat = useMemo(() => {
    return tingkatDataList.reduce((acc, curr) => acc + curr.kuota_jtm, 0);
  }, [tingkatDataList]);

  const countPaiMapel = useMemo(() => {
    return tingkatDataList.filter((k) => (k.kelompok || "").includes("PAI")).length;
  }, [tingkatDataList]);

  const countUmumMapel = useMemo(() => {
    return tingkatDataList.filter((k) => !(k.kelompok || "").includes("PAI")).length;
  }, [tingkatDataList]);

  // Filtered Table List
  const filteredTableList = useMemo(() => {
    return kuotaMapelList.filter((k) => {
      const matchTingkat = k.tingkat === selectedTingkatFilter;
      const matchSearch =
        k.nama_mapel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.kode_mapel.toLowerCase().includes(searchQuery.toLowerCase());
      const matchKurikulum =
        filterKurikulum === "ALL" ||
        (filterKurikulum === "MERDEKA" && k.sumber_kurikulum.includes("Merdeka")) ||
        (filterKurikulum === "K13" && k.sumber_kurikulum.includes("2013"));

      return matchTingkat && matchSearch && matchKurikulum;
    });
  }, [kuotaMapelList, selectedTingkatFilter, searchQuery, filterKurikulum]);

  const handleAddMapel = async () => {
    if (!newKodeMapel || !newNamaMapel) return;
    setSubmittingMapel(true);
    try {
      await services.referensi.createMapel({
        kode_mapel: newKodeMapel,
        nama_mapel: newNamaMapel,
        kelompok_mapel: newKelompokMapel,
      });

      const newItem: KuotaMapelParam = {
        id: String(Date.now()),
        tingkat: newTingkatMapel,
        kode_mapel: newKodeMapel.toUpperCase(),
        nama_mapel: newNamaMapel,
        kelompok: newKelompokMapel,
        kuota_jtm: newKuotaJtm,
        sumber_kurikulum: "KMA No. 347/2022 (Kurikulum Merdeka)",
      };

      setKuotaMapelList((prev) => [...prev, newItem]);
      setNewKodeMapel("");
      setNewNamaMapel("");
      setIsAddMapelOpen(false);
      bump();
    } catch (e) {
      alert("Gagal menambahkan mata pelajaran");
    } finally {
      setSubmittingMapel(false);
    }
  };

  const handleDeleteMapel = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus mata pelajaran ini dari katalog?")) {
      setKuotaMapelList((prev) => prev.filter((k) => k.id !== id));
    }
  };

  if (loading) {
    return (
      <AppShell title="Referensi Master Data">
        <LoadingBlock label="Memuat referensi data..." />
      </AppShell>
    );
  }

  if (!canManage) {
    return (
      <AppShell title="Referensi Master Data">
        <ErrorBlock message="Halaman manajemen referensi master data khusus untuk Admin Madrasah." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Referensi Master Data">
      <div className="space-y-6 pb-20">
        {/* BREADCRUMB */}
        <div className="text-xs text-gray-500 flex items-center gap-1.5">
          <span className="hover:text-gray-700">Referensi</span>
          <span>/</span>
          <span className="font-medium text-gray-800">Master Kurikulum</span>
        </div>

        {/* PAGE HEADER */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Referensi Master Data
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Kelola kurikulum &amp; mapel, parameter ekuivalensi JTM, serta kalender akademik sesuai standar EMIS.
          </p>
        </div>

        {/* 3 DOMAIN TABS */}
        <div className="border-b border-gray-200 bg-white px-2 rounded-t-xl">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {[
              { key: "kurikulum", label: `Kurikulum & Mapel (${mapel.length || kuotaMapelList.length})`, icon: <BookOpen className="h-4 w-4" /> },
              { key: "beban-kerja", label: `Ekuivalensi JTM (${ekuivalensiList.length})`, icon: <Briefcase className="h-4 w-4" /> },
              { key: "kalender", label: `Kalender & Hari Libur (${libur.length})`, icon: <Calendar className="h-4 w-4" /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabDomain)}
                className={`${activeTab === tab.key
                  ? "border-primary-600 text-primary-700 font-extrabold"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 font-semibold"
                  } whitespace-nowrap border-b-2 py-3.5 px-2 text-xs uppercase tracking-wider transition-colors flex items-center gap-2`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {error ? <ErrorBlock message={error} /> : null}

        {/* TAB 1: KURIKULUM & MAPEL */}
        {activeTab === "kurikulum" && (
          <div className="space-y-6">
            {/* TINGKAT FILTER SELECTOR & ACTION BUTTONS BAR */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-700">Filter Tingkat:</label>
                <select
                  value={selectedTingkatFilter}
                  onChange={(e) => setSelectedTingkatFilter(e.target.value)}
                  className="text-xs font-bold border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 shadow-2xs"
                >
                  <option value="Kelas 7">Kelas 7 (VII)</option>
                  <option value="Kelas 8">Kelas 8 (VIII)</option>
                  <option value="Kelas 9">Kelas 9 (IX)</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft={<FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
                  onClick={() => setIsImportOpen(true)}
                >
                  Import Excel
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft={<RefreshCw className="h-4 w-4 text-blue-600" />}
                  onClick={() => setIsSinkronEmisOpen(true)}
                >
                  Sinkron EMIS
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  iconLeft={<Plus className="h-4 w-4" />}
                  onClick={() => setIsAddMapelOpen(true)}
                >
                  Tambah Mapel
                </Button>
              </div>
            </div>

            {/* 4 STATISTIK KURIKULUM CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* CARD 1: TOTAL MAPEL */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">TOTAL MATA PELAJARAN</p>
                <p className="text-2xl font-extrabold text-gray-900 mt-2">{totalMapelTingkat} Mapel</p>
              </div>

              {/* CARD 2: TOTAL ALOKASI JTM */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">TOTAL ALOKASI JTM</p>
                <p className="text-2xl font-extrabold text-gray-900 mt-2">
                  [{totalJtmTingkat} / 35] JTM
                </p>
              </div>

              {/* CARD 3: KELOMPOK PAI (A) */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">KELOMPOK PAI (A)</p>
                <p className="text-2xl font-extrabold text-blue-900 mt-2">{countPaiMapel} Mapel</p>
              </div>

              {/* CARD 4: KELOMPOK UMUM (B) */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">KELOMPOK UMUM (B)</p>
                <p className="text-2xl font-extrabold text-amber-900 mt-2">{countUmumMapel} Mapel</p>
              </div>
            </div>

            {/* BANNER INFORMASI EMIS & KMA */}
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-blue-900 text-xs sm:text-sm shadow-2xs">
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Info Kurikulum:</strong> Menggunakan standar <strong>KMA No. 347 Tahun 2022 (Kurikulum Merdeka)</strong>. Total JTM maksimal per minggu untuk jenjang MTs adalah <strong>35 JTM</strong>. Beban JTM otomatis terintegrasi ke menu Penugasan &amp; SK Beban Kerja.
              </div>
            </div>

            {/* TOOLBAR FILTER & SEARCH */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterKurikulum}
                  onChange={(e) => setFilterKurikulum(e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 font-medium"
                >
                  <option value="ALL">Semua Kurikulum</option>
                  <option value="MERDEKA">Kurikulum Merdeka (KMA 347)</option>
                  <option value="K13">Kurikulum 2013 (K13)</option>
                </select>

                <select
                  value={selectedTingkatFilter}
                  onChange={(e) => setSelectedTingkatFilter(e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 font-medium"
                >
                  <option value="">Semua Kelas</option>
                  <option value="Kelas 7">Kelas 7</option>
                  <option value="Kelas 8">Kelas 8</option>
                  <option value="Kelas 9">Kelas 9</option>
                </select>
              </div>

              <div className="w-full sm:w-72">
                <SearchInput
                  placeholder="Cari Mata Pelajaran... 🔍"
                  value={searchQuery}
                  onChange={(val) => setSearchQuery(val)}
                />
              </div>
            </div>

            {/* INLINE EDIT KUOTA JTM PANEL */}
            {editingKuota && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                <div>
                  <p className="font-bold text-emerald-900 text-sm">
                    Edit Kuota JTM: {editingKuota.nama_mapel} ({editingKuota.tingkat})
                  </p>
                  <p className="text-emerald-700 mt-0.5">Kode Mapel: {editingKuota.kode_mapel} | Kelompok: {editingKuota.kelompok}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={editKuotaVal}
                    onChange={(e) => setEditKuotaVal(Number(e.target.value))}
                    className="w-24 text-sm font-bold border-emerald-300"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    iconLeft={<Save className="h-3.5 w-3.5" />}
                    onClick={() => {
                      setKuotaMapelList((prev) =>
                        prev.map((k) => (k.id === editingKuota.id ? { ...k, kuota_jtm: editKuotaVal } : k))
                      );
                      setEditingKuota(null);
                    }}
                  >
                    Simpan
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingKuota(null)}
                  >
                    Batal
                  </Button>
                </div>
              </div>
            )}

            {/* DATA TABLE KATALOG MAPEL */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-gray-600 font-semibold">
                    <tr>
                      <th className="px-3 py-3 text-center w-12 text-xs">NO</th>
                      <th className="px-4 py-3 text-left w-20 text-xs">KODE</th>
                      <th className="px-4 py-3 text-left text-xs">PEMINATAN / KELOMPOK</th>
                      <th className="px-4 py-3 text-left text-xs">NAMA PELAJARAN</th>
                      <th className="px-4 py-3 text-left w-36 text-xs">MAKSIMAL JAM</th>
                      <th className="px-4 py-3 text-center w-28 text-xs">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredTableList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          Tidak ada mata pelajaran yang sesuai filter.
                        </td>
                      </tr>
                    ) : (
                      filteredTableList.map((item, idx) => {
                        const isPai = (item.kelompok || "").includes("PAI");
                        const kelompokLabel = item.kelompok.replace("Kelompok A (Wajib)", "Kelompok A (Umum)").replace("Kelompok B (Pilihan)", "Kelompok B (Umum)");

                        return (
                          <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                            <td className="px-3 py-3.5 text-center font-medium text-gray-500 text-xs">{idx + 1}</td>
                            <td className="px-4 py-3.5 font-mono font-bold text-gray-900 text-xs">{item.kode_mapel}</td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold ${isPai
                                  ? "bg-blue-50 text-blue-800 border border-blue-200"
                                  : "bg-amber-50 text-amber-800 border border-amber-200"
                                  }`}
                              >
                                {isPai ? "🔹" : "🔸"} {kelompokLabel}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 font-semibold text-gray-900">{item.nama_mapel}</td>
                            <td className="px-4 py-3.5 font-bold text-gray-800 text-xs">
                              {item.kuota_jtm} jam/minggu
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingKuota(item);
                                    setEditKuotaVal(item.kuota_jtm);
                                  }}
                                  className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteMapel(item.id)}
                                  className="px-2 py-1 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100 transition-colors"
                                >
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION FOOTER */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
                <div>
                  Menampilkan <strong>1 - {filteredTableList.length}</strong> dari <strong>{kuotaMapelList.length}</strong> Data
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="secondary" size="sm" disabled>Prev</Button>
                  <Button variant="primary" size="sm">1</Button>
                  <Button variant="secondary" size="sm" disabled>Next</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PARAMETER EKUIVALENSI JTM */}
        {activeTab === "beban-kerja" && (
          <div className="space-y-6">
            {editingEkuivalensi && (
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-4">
                <p className="font-bold text-gray-900 text-sm">Edit Parameter: {editingEkuivalensi.jenis}</p>
                <div className="grid gap-4 md:grid-cols-3 items-end">
                  <Input
                    label="Nilai Ekuivalensi JTM"
                    placeholder="mis. 12 atau 24"
                    value={editNilaiJtm}
                    onChange={(e) => setEditNilaiJtm(e.target.value)}
                  />
                  <Input
                    label="Sumber Ketentuan Regulasi"
                    placeholder="mis. KMA No. 347 Tahun 2022"
                    value={editSumber}
                    onChange={(e) => setEditSumber(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      iconLeft={<Save className="h-4 w-4" />}
                      onClick={() => {
                        setEkuivalensiList((prev) =>
                          prev.map((item) =>
                            item.id === editingEkuivalensi.id
                              ? { ...item, nilai_jtm: editNilaiJtm, sumber: editSumber }
                              : item
                          )
                        );
                        setEditingEkuivalensi(null);
                      }}
                    >
                      Simpan
                    </Button>
                    <Button variant="secondary" onClick={() => setEditingEkuivalensi(null)}>
                      Batal
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-900">Parameter Ekuivalensi Jam Tatap Muka (JTM)</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tabel acuan baku ekuivalensi Jam Tatap Muka (JTM) untuk jabatan dan tugas tambahan sesuai regulasi Kemenag.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-gray-600 font-semibold">
                    <tr>
                      <th className="px-4 py-3 text-left">JENIS TUGAS / JABATAN</th>
                      <th className="px-4 py-3 text-right w-36">EKUIVALENSI JTM</th>
                      <th className="px-4 py-3 text-left">SUMBER KETENTUAN REGULASI</th>
                      <th className="px-4 py-3 text-center w-28">STATUS</th>
                      <th className="px-4 py-3 text-center w-28">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {ekuivalensiList.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-gray-900">{p.jenis}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-extrabold text-primary-700 text-base">
                          {p.nilai_jtm} JTM
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-600">{p.sumber}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => {
                              setEditingEkuivalensi(p);
                              setEditNilaiJtm(String(p.nilai_jtm));
                              setEditSumber(p.sumber);
                            }}
                            className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: KALENDER & HARI LIBUR */}
        {activeTab === "kalender" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-900">Kelola Hari Libur &amp; Kalender Akademik</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tambah tanggal libur nasional, libur keagamaan, atau kegiatan khusus madrasah.
                </p>
              </div>

              <div className="p-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-gray-600 font-semibold">
                    <tr>
                      <th className="px-4 py-3 text-left w-36">TANGGAL</th>
                      <th className="px-4 py-3 text-left">KETERANGAN / NAMA HARI LIBUR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {libur.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-8 text-center text-gray-500">
                          Belum ada daftar hari libur yang tercatat.
                        </td>
                      </tr>
                    ) : (
                      libur.map((l) => (
                        <tr key={l.id_libur} className="hover:bg-gray-50/70 transition-colors">
                          <td className="px-4 py-3.5 font-mono text-xs font-bold text-gray-900">{l.tanggal}</td>
                          <td className="px-4 py-3.5 text-gray-800 font-medium">{l.nama}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: TAMBAH MAPEL BARU */}
      <Modal
        isOpen={isAddMapelOpen}
        onClose={() => setIsAddMapelOpen(false)}
        title="Tambah Mata Pelajaran Baru"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddMapelOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" loading={submittingMapel} onClick={handleAddMapel}>
              Simpan Mapel
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Kode Mapel"
            placeholder="mis. MTK, QH, IND"
            value={newKodeMapel}
            onChange={(e) => setNewKodeMapel(e.target.value)}
          />
          <Input
            label="Nama Mata Pelajaran"
            placeholder="mis. Matematika"
            value={newNamaMapel}
            onChange={(e) => setNewNamaMapel(e.target.value)}
          />
          <Select
            label="Kelompok / Peminatan"
            value={newKelompokMapel}
            onChange={(e) => setNewKelompokMapel(e.target.value)}
          >
            <option value="Kelompok A (Wajib)">Kelompok A (Wajib)</option>
            <option value="Kelompok A (PAI)">Kelompok A (PAI)</option>
            <option value="Kelompok B (Pilihan)">Kelompok B (Pilihan)</option>
            <option value="Muatan Lokal">Muatan Lokal</option>
          </Select>
          <Select
            label="Tingkat Kelas"
            value={newTingkatMapel}
            onChange={(e) => setNewTingkatMapel(e.target.value)}
          >
            <option value="Kelas 7">Kelas 7 (VII)</option>
            <option value="Kelas 8">Kelas 8 (VIII)</option>
            <option value="Kelas 9">Kelas 9 (IX)</option>
          </Select>
          <Input
            label="Alokasi Kuota JTM (Jam/Minggu)"
            type="number"
            value={newKuotaJtm}
            onChange={(e) => setNewKuotaJtm(Number(e.target.value))}
          />
        </div>
      </Modal>

      {/* MODAL 2: IMPORT EXCEL */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Mata Pelajaran dari Excel / CSV"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsImportOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={() => { alert("File berhasil diimport!"); setIsImportOpen(false); }}>
              Proses Import
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs text-gray-600">
          <p>
            Pilih file spreadsheet (.xlsx / .csv) berisi daftar kode mapel, nama mapel, dan alokasi JTM standar EMIS.
          </p>
          <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-primary-500 bg-gray-50">
            <FileSpreadsheet className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="font-semibold text-gray-700">Klik atau seret file Excel ke sini</p>
            <p className="text-[11px] text-gray-400 mt-1">Format didukung: .xlsx, .xls, .csv</p>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: SINKRON EMIS */}
      <Modal
        isOpen={isSinkronEmisOpen}
        onClose={() => setIsSinkronEmisOpen(false)}
        title="Sinkronisasi Katalog Kurikulum EMIS Kemenag"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsSinkronEmisOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={() => { alert("Sinkronisasi EMIS Berhasil!"); setIsSinkronEmisOpen(false); }}>
              Mulai Sinkronisasi
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs text-gray-600">
          <p>
            Sistem akan mencocokkan struktur Kurikulum Merdeka (KMA No. 347/2022) dengan database pusat EMIS 4.0.
          </p>
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 p-3 rounded-lg text-blue-900">
            <RefreshCw className="h-5 w-5 text-blue-600 animate-spin shrink-0" />
            <div>
              <p className="font-bold">Koneksi EMIS Terhubung</p>
              <p className="text-[11px] mt-0.5">Versi skema: KMA 347 TAHUN 2022</p>
            </div>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
