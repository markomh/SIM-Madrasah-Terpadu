"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useTahunAjaran, useDataVersion } from "@/components/app-providers";
import {
  ErrorBlock,
  LoadingBlock,
  Button,
  Input,
  Select,
  Badge,
  Modal,
  Drawer,
  Tooltip,
} from "@/components/ui/primitives";
import { isAdminMadrasah } from "@/lib/access";
import { services } from "@/services";
import type { Rombel, TingkatPendidikan, Pegawai, Siswa } from "@/types";
import {
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Info,
  MoreVertical,
  Edit3,
} from "lucide-react";

export default function RombelPage() {
  const { currentUser, penugasanList } = useAuth();
  const { selected: selectedTahun } = useTahunAjaran();
  const { version, bump } = useDataVersion();

  const [tingkat, setTingkat] = useState<TingkatPendidikan[]>([]);
  const [rombelList, setRombelList] = useState<Rombel[]>([]);
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [anggotaMap, setAnggotaMap] = useState<Record<string, Siswa[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTingkatFilter, setSelectedTingkatFilter] = useState("ALL");
  const [selectedKurikulumFilter, setSelectedKurikulumFilter] = useState("ALL");

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRombel, setEditingRombel] = useState<Rombel | null>(null);
  const [formNamaRombel, setFormNamaRombel] = useState("");
  const [formIdTingkat, setFormIdTingkat] = useState("");
  const [formRuangan, setFormRuangan] = useState("");
  const [formKuota, setFormKuota] = useState<number>(32);
  const [formKurikulum, setFormKurikulum] = useState("Merdeka");
  const [formIdWaliKelas, setFormIdWaliKelas] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Slide-over Drawer State (Anggota Siswa)
  const [drawerRombel, setDrawerRombel] = useState<Rombel | null>(null);
  const [drawerSiswaList, setDrawerSiswaList] = useState<Siswa[]>([]);
  const [loadingDrawer, setLoadingDrawer] = useState(false);

  // Action Menu Dropdown State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const canManage = currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tList, rList, pList] = await Promise.all([
        services.referensi.getTingkat(),
        services.referensi.getRombel({ id_tahun: selectedTahun?.id_tahun }),
        services.pegawai.getAll(),
      ]);

      setTingkat(tList);
      setRombelList(rList);
      setPegawaiList(pList.filter((p) => p.tugas_utama === "Guru"));

      // Fetch anggota count / list per rombel for accurate statistics
      const map: Record<string, Siswa[]> = {};
      await Promise.all(
        rList.map(async (r) => {
          try {
            const siswa = await services.siswa.getAll({ id_rombel: r.id_rombel });
            map[r.id_rombel] = siswa;
          } catch {
            map[r.id_rombel] = [];
          }
        })
      );
      setAnggotaMap(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data rombongan belajar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [version, selectedTahun?.id_tahun]);

  // Calculations for Statistics
  const waliAssignmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    rombelList.forEach((r) => {
      if (r.id_wali_kelas) {
        counts[r.id_wali_kelas] = (counts[r.id_wali_kelas] || 0) + 1;
      }
    });
    return counts;
  }, [rombelList]);

  const duplicateWaliCount = useMemo(() => {
    return Object.values(waliAssignmentCounts).filter((cnt) => cnt > 1).length;
  }, [waliAssignmentCounts]);

  const totalSiswaTerisi = useMemo(() => {
    return Object.values(anggotaMap).reduce((acc, curr) => acc + curr.length, 0);
  }, [anggotaMap]);

  const rataKapasitas = useMemo(() => {
    if (rombelList.length === 0) return "0 / 32";
    const avgSiswa = (totalSiswaTerisi / rombelList.length).toFixed(1);
    return `${avgSiswa} / 32`;
  }, [totalSiswaTerisi, rombelList]);

  // Filtered Rombel List
  const filteredRombel = useMemo(() => {
    return rombelList.filter((r) => {
      const matchSearch =
        r.nama_rombel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pegawaiList.find((p) => p.id_pegawai === r.id_wali_kelas)?.nama_lengkap_gelar || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchTingkat = selectedTingkatFilter === "ALL" || r.id_tingkat === selectedTingkatFilter;

      const rKurikulum = r.kurikulum || "Merdeka";
      const matchKurikulum =
        selectedKurikulumFilter === "ALL" || rKurikulum === selectedKurikulumFilter;

      return matchSearch && matchTingkat && matchKurikulum;
    });
  }, [rombelList, searchQuery, selectedTingkatFilter, selectedKurikulumFilter, pegawaiList]);

  // Handlers for Modal
  const handleOpenAddModal = () => {
    setEditingRombel(null);
    setFormNamaRombel("");
    setFormIdTingkat(tingkat[0]?.id_tingkat || "");
    setFormRuangan("R. ");
    setFormKuota(32);
    setFormKurikulum("Merdeka");
    setFormIdWaliKelas("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (r: Rombel) => {
    setEditingRombel(r);
    setFormNamaRombel(r.nama_rombel);
    setFormIdTingkat(r.id_tingkat);
    setFormRuangan(r.ruangan || "");
    setFormKuota(r.kuota || 32);
    setFormKurikulum(r.kurikulum || "Merdeka");
    setFormIdWaliKelas(r.id_wali_kelas || "");
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSaveRombel = async () => {
    if (!formNamaRombel.trim() || !selectedTahun) return;
    setSubmitting(true);
    try {
      if (editingRombel) {
        await services.referensi.updateRombel(editingRombel.id_rombel, {
          nama_rombel: formNamaRombel,
          id_tingkat: formIdTingkat,
          id_wali_kelas: formIdWaliKelas || null,
          ruangan: formRuangan || undefined,
          kuota: formKuota,
          kurikulum: formKurikulum,
        });
      } else {
        await services.referensi.createRombel({
          nama_rombel: formNamaRombel,
          id_tingkat: formIdTingkat,
          id_tahun: selectedTahun.id_tahun,
          id_wali_kelas: formIdWaliKelas || null,
          ruangan: formRuangan || undefined,
          kuota: formKuota,
          kurikulum: formKurikulum,
        });
      }
      setIsModalOpen(false);
      bump();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menyimpan Rombel");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAnggotaDrawer = async (r: Rombel) => {
    setDrawerRombel(r);
    setLoadingDrawer(true);
    try {
      const list = await services.siswa.getAll({ id_rombel: r.id_rombel });
      setDrawerSiswaList(list);
    } catch {
      setDrawerSiswaList([]);
    } finally {
      setLoadingDrawer(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Rombongan Belajar">
        <LoadingBlock label="Memuat data rombongan belajar..." />
      </AppShell>
    );
  }

  if (!canManage) {
    return (
      <AppShell title="Rombongan Belajar">
        <ErrorBlock message="Anda tidak memiliki akses untuk mengelola Rombongan Belajar." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Rombongan Belajar">
      <div className="space-y-6 pb-20">
        {/* BREADCRUMB */}
        <div className="text-xs text-gray-500 flex items-center gap-1.5">
          <span className="hover:text-gray-700">Kesiswaan</span>
          <span>/</span>
          <span className="font-medium text-gray-800">Rombongan Belajar</span>
        </div>

        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Rombongan Belajar</h1>
            <p className="text-sm text-gray-500 mt-1">
              Kelola data rombel, daya tampung kelas, dan pemetaan wali kelas tahun ajaran aktif.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleOpenAddModal}
            iconLeft={<Plus className="h-4 w-4" />}
            className="shadow-xs self-start md:self-auto"
          >
            Tambah Rombel
          </Button>
        </div>

        {/* STATISTIK RINGKAS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Rombel</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-2">{rombelList.length} Rombel</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Siswa Terisi</p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-2">{totalSiswaTerisi} Siswa</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rata-rata Kapasitas</p>
            <p className="text-2xl font-extrabold text-blue-700 mt-2">{rataKapasitas} Kuota</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Peringatan Validasi</p>
            <div className="mt-2 flex items-center gap-2">
              {duplicateWaliCount > 0 ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                  <span className="text-lg font-bold text-amber-700">{duplicateWaliCount} Wali Ganda</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="text-lg font-bold text-emerald-700">Semua Valid</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* INFO BANNER STANDAR EMIS */}
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50/80 p-4 text-blue-900 text-sm">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed text-xs sm:text-sm">
            <strong>Info Rasio</strong> Batas rasio rombel sesuai standar Ditjen Pendis: MI = 28 siswa, MTs/MA = 32 siswa. Format keterisian: <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-blue-800">[Jumlah Siswa / Kuota Ruangan]</code>. Penetapan beban JTM otomatis dihitung.
          </div>
        </div>

        {/* ACTION & FILTER TOOLBAR */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari rombel / wali..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedTingkatFilter}
              onChange={(e) => setSelectedTingkatFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">Semua Tingkat</option>
              {tingkat.map((t) => (
                <option key={t.id_tingkat} value={t.id_tingkat}>
                  {t.nama_tingkat}
                </option>
              ))}
            </select>

            <select
              value={selectedKurikulumFilter}
              onChange={(e) => setSelectedKurikulumFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">Kurikulum</option>
              <option value="Merdeka">Merdeka</option>
              <option value="Kurikulum 2013">Kurikulum 2013</option>
            </select>
          </div>
        </div>

        {/* TABEL UTAMA ROMBEL */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left w-12">No</th>
                  <th className="px-4 py-3 text-left">Rombel</th>
                  <th className="px-4 py-3 text-left">Tingkat</th>
                  <th className="px-4 py-3 text-left">Wali Kelas</th>
                  <th className="px-4 py-3 text-left">Ruangan</th>
                  <th className="px-4 py-3 text-left">Kurikulum</th>
                  <th className="px-4 py-3 text-center">Jumlah Siswa</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center w-36">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredRombel.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      Tidak ada data rombongan belajar yang sesuai.
                    </td>
                  </tr>
                ) : (
                  filteredRombel.map((r, idx) => {
                    const wali = pegawaiList.find((p) => p.id_pegawai === r.id_wali_kelas);
                    const tName = tingkat.find((t) => t.id_tingkat === r.id_tingkat)?.nama_tingkat ?? "—";
                    const siswaList = anggotaMap[r.id_rombel] || [];
                    const count = siswaList.length;
                    const kuota = r.kuota ?? 32;

                    // Keterisian Badge & Color
                    let countBadgeVariant: "neutral" | "amber" | "danger" = "neutral";
                    if (count >= kuota) countBadgeVariant = "amber";
                    if (count > kuota) countBadgeVariant = "danger";

                    // Ganda Status Check
                    const isGanda = r.id_wali_kelas ? (waliAssignmentCounts[r.id_wali_kelas] || 0) > 1 : false;

                    return (
                      <tr key={r.id_rombel} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3 text-gray-500 text-xs font-mono">{idx + 1}</td>
                        <td className="px-4 py-3 font-bold text-primary">{r.nama_rombel}</td>
                        <td className="px-4 py-3 text-gray-700">{tName}</td>
                        <td className="px-4 py-3">
                          {wali ? (
                            <span className="font-medium text-gray-900">{wali.nama_lengkap_gelar}</span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Belum Ditetapkan</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {r.ruangan ? r.ruangan : <span className="text-gray-400 italic">Belum tersedia</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {r.kurikulum ? r.kurikulum : <span className="text-gray-400 italic">Belum tersedia</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={countBadgeVariant} className="font-mono text-xs font-bold px-2 py-0.5">
                            {count} / {kuota}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isGanda ? (
                            <Tooltip content="Wali Kelas terdaftar di lebih dari satu rombel reguler">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                                ! Ganda
                              </span>
                            </Tooltip>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center relative">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenAnggotaDrawer(r)}
                              className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                            >
                              Anggota
                            </button>

                            <Link href={`/jadwal?rombel=${r.id_rombel}`}>
                              <button className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors">
                                Jadwal
                              </button>
                            </Link>

                            <div className="relative inline-block text-left">
                              <button
                                onClick={() => setActiveMenuId(activeMenuId === r.id_rombel ? null : r.id_rombel)}
                                className="p-1 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {activeMenuId === r.id_rombel && (
                                <div className="origin-top-right absolute right-0 mt-1 w-44 rounded-md shadow-lg bg-white ring-1 ring-black/5 divide-y divide-gray-100 z-30">
                                  <div className="py-1">
                                    <button
                                      onClick={() => handleOpenEditModal(r)}
                                      className="group flex items-center w-full px-4 py-2 text-xs text-gray-700 hover:bg-gray-100"
                                    >
                                      <Edit3 className="mr-2 h-3.5 w-3.5 text-gray-400 group-hover:text-gray-500" />
                                      Edit / Ganti Wali
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
            <span>Menampilkan 1 - {filteredRombel.length} dari {rombelList.length} rombel</span>
            <div className="flex gap-1">
              <button disabled className="px-2 py-1 border rounded bg-white text-gray-400 cursor-not-allowed">Prev</button>
              <button className="px-2 py-1 border rounded bg-primary-50 text-primary-600 font-bold border-primary-200">1</button>
              <button disabled className="px-2 py-1 border rounded bg-white text-gray-400 cursor-not-allowed">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL FORM: TAMBAH / EDIT ROMBEL & WALI KELAS */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="xl"
        title={editingRombel ? `Edit Rombel — ${editingRombel.nama_rombel}` : "Tambah Rombongan Belajar Baru"}
      >
        <div className="space-y-4 pt-2">
          {/* 2-COLUMN GRID LAYOUT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ROW 1 KIRI: Tahun Ajaran (Readonly) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tahun Ajaran
              </label>
              <input
                type="text"
                disabled
                value={selectedTahun?.nama_tahun ?? "Tahun Ajaran Aktif"}
                className="w-full text-sm border border-gray-300 bg-gray-100 text-gray-600 rounded-lg p-2.5 cursor-not-allowed font-medium"
              />
            </div>

            {/* ROW 1 KANAN: Tingkat Kelas (Readonly saat Edit) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tingkat Kelas {editingRombel ? <span className="text-amber-600 text-[10px] font-normal">(Readonly)</span> : null}
              </label>
              <select
                disabled={!!editingRombel}
                value={formIdTingkat}
                onChange={(e) => setFormIdTingkat(e.target.value)}
                className={`w-full text-sm border rounded-lg p-2.5 ${editingRombel ? "bg-gray-100 text-gray-600 cursor-not-allowed" : "border-gray-300 bg-white"
                  }`}
              >
                <option value="">Tingkat Kelas</option>
                {tingkat.map((t) => (
                  <option key={t.id_tingkat} value={t.id_tingkat}>
                    {t.nama_tingkat}
                  </option>
                ))}
              </select>
            </div>

            {/* ROW 2 KIRI: Nama Rombel */}
            <div>
              <Input
                label="Nama Rombel"
                placeholder="Nama Rombel (misal: 7-A)"
                value={formNamaRombel}
                onChange={(e) => setFormNamaRombel(e.target.value)}
              />
            </div>

            {/* ROW 2 KANAN: Wali Kelas */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Wali Kelas
              </label>
              <select
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                value={formIdWaliKelas}
                onChange={(e) => setFormIdWaliKelas(e.target.value)}
              >
                <option value="">Wali Kelas</option>
                {pegawaiList.map((p) => (
                  <option key={p.id_pegawai} value={p.id_pegawai}>
                    {p.nama_lengkap_gelar}
                  </option>
                ))}
              </select>
            </div>

            {/* ROW 3 KIRI: Nama Ruangan (Belum Tersedia di DB) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nama Ruangan <span className="text-gray-400 text-[10px] font-normal">(Belum Tersedia di DB)</span>
              </label>
              <input
                type="text"
                placeholder="Nama Ruangan (misal: R. 701)"
                value={formRuangan}
                onChange={(e) => setFormRuangan(e.target.value)}
                className="w-full text-sm border border-gray-300 bg-white rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* ROW 3 KANAN: Kurikulum (Belum Tersedia di DB) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Kurikulum <span className="text-gray-400 text-[10px] font-normal">(Belum Tersedia di DB)</span>
              </label>
              <select
                value={formKurikulum}
                onChange={(e) => setFormKurikulum(e.target.value)}
                className="w-full text-sm border border-gray-300 bg-white rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Kurikulum</option>
                <option value="Merdeka">Merdeka</option>
                <option value="Kurikulum 2013">Kurikulum 2013</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              loading={submitting}
              disabled={submitting || !formNamaRombel.trim()}
              onClick={handleSaveRombel}
            >
              Simpan Rombel
            </Button>
          </div>
        </div>
      </Modal>

      {/* SLIDE-OVER DRAWER: ANGGOTA SISWA */}
      <Drawer
        isOpen={!!drawerRombel}
        onClose={() => setDrawerRombel(null)}
        title={`Daftar Anggota Siswa — ${drawerRombel?.nama_rombel ?? ""}`}
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-gray-500">
            Daftar siswa terdaftar aktif pada rombongan belajar ini.
          </p>

          {loadingDrawer ? (
            <LoadingBlock label="Memuat anggota siswa..." />
          ) : drawerSiswaList.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500 border border-dashed rounded-lg">
              Belum ada siswa terdaftar di rombel ini.
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">No</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">NISN</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">Nama Siswa</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-500">L/P</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {drawerSiswaList.map((s, idx) => (
                    <tr key={s.id_siswa} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-400 font-mono">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono text-gray-600">{s.nisn ?? "—"}</td>
                      <td className="px-3 py-2 font-medium text-gray-900">{s.nama_lengkap}</td>
                      <td className="px-3 py-2 text-center font-semibold text-gray-500">{s.jenis_kelamin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Drawer>
    </AppShell>
  );
}
