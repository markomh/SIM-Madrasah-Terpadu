"use client";

import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import {
  isPembinaBk,
  isPembinaBkSiswa,
  isKepalaMadrasah,
  isAdminMadrasah,
} from "@/lib/access";
import { LoadingBlock, ErrorBlock, Button, PageHeader } from "@/components/ui/primitives";
import { services } from "@/services";
import type { Siswa, Rombel, Pegawai } from "@/types";
import type { CatatanBk } from "@/types/bk";
import { usePermission } from "@/hooks/usePermission";

import { BkStatCards } from "./components/BkStatCards";
import { BukuKasusTab } from "./components/BukuKasusTab";
import { JurnalLayananTab } from "./components/JurnalLayananTab";
import { DaftarKonseliTab } from "./components/DaftarKonseliTab";
import { TindakLanjutDrawer } from "./components/TindakLanjutDrawer";
import { GlobalAddPelanggaranModal } from "./components/GlobalAddPelanggaranModal";
import type {
  KonseliDetail,
  PelanggaranSiswa,
  JurnalKonseling,
  SuratPanggilanSP,
} from "./types";
import {
  BookOpen,
  MessageSquare,
  Users,
  Shield,
  HeartHandshake,
} from "lucide-react";

const INITIAL_PELANGGARAN_SEED: PelanggaranSiswa[] = [
  {
    id_pelanggaran: "plg_01",
    id_siswa: "sw_01", // Ahmad Azza Najril
    id_pegawai_pencatat: "pg_bk",
    tanggal: "2026-09-12",
    kategori: "Kedisiplinan & Ketertiban",
    item_pelanggaran: "Membolos di jam pelajaran",
    bobot_poin: 20,
    catatan_kronologi: "Ditemukan di kantin saat jam pelajaran Matematika berlangsung.",
  },
  {
    id_pelanggaran: "plg_02",
    id_siswa: "sw_01",
    id_pegawai_pencatat: "pg_bk",
    tanggal: "2026-09-02",
    kategori: "Kedisiplinan & Ketertiban",
    item_pelanggaran: "Terlambat masuk sekolah (> 15 menit)",
    bobot_poin: 10,
    catatan_kronologi: "Terlambat 25 menit saat apel pagi.",
  },
  {
    id_pelanggaran: "plg_03",
    id_siswa: "sw_01",
    id_pegawai_pencatat: "pg_bk",
    tanggal: "2026-08-20",
    kategori: "Etika, Perilaku & Sikap",
    item_pelanggaran: "Berkelahi / terlibat pertikaian fisik di sekolah",
    bobot_poin: 40,
    catatan_kronologi: "Terlibat perselisihan fisik di area parkir belakang madrasah.",
  },
  {
    id_pelanggaran: "plg_04",
    id_siswa: "sw_01",
    id_pegawai_pencatat: "pg_bk",
    tanggal: "2026-08-10",
    kategori: "Kedisiplinan & Ketertiban",
    item_pelanggaran: "Keluar lingkungan sekolah tanpa izin",
    bobot_poin: 15,
    catatan_kronologi: "Melompat pagar belakang saat istirahat pertama.",
  },
  {
    id_pelanggaran: "plg_05",
    id_siswa: "sw_04", // Yasinta Fatiha
    id_pegawai_pencatat: "pg_bk",
    tanggal: "2026-09-10",
    kategori: "Kerapian & Atribut",
    item_pelanggaran: "Atribut seragam tidak lengkap (dasi, sabuk, badge, kaos kaki)",
    bobot_poin: 5,
    catatan_kronologi: "Tidak memakai sabuk dan kaos kaki tidak standar.",
  },
  {
    id_pelanggaran: "plg_06",
    id_siswa: "sw_04",
    id_pegawai_pencatat: "pg_bk",
    tanggal: "2026-08-15",
    kategori: "Etika, Perilaku & Sikap",
    item_pelanggaran: "Bersikap tidak sopan / membangkang instruksi guru",
    bobot_poin: 20,
    catatan_kronologi: "Membantah teguran wali kelas saat pemeriksaan atribut.",
  },
  {
    id_pelanggaran: "plg_07",
    id_siswa: "sw_04",
    id_pegawai_pencatat: "pg_bk",
    tanggal: "2026-08-05",
    kategori: "Kedisiplinan & Ketertiban",
    item_pelanggaran: "Bolos sekolah satu hari penuh",
    bobot_poin: 25,
    catatan_kronologi: "Alpa tanpa keterangan izin.",
  },
  {
    id_pelanggaran: "plg_08",
    id_siswa: "sw_05", // Ziadatul Ilmi
    id_pegawai_pencatat: "pg_bk",
    tanggal: "2026-09-02",
    kategori: "Kedisiplinan & Ketertiban",
    item_pelanggaran: "Terlambat masuk sekolah (> 15 menit)",
    bobot_poin: 10,
    catatan_kronologi: "Terlambat 15 menit karena ban bocor.",
  },
  {
    id_pelanggaran: "plg_09",
    id_siswa: "sw_05",
    id_pegawai_pencatat: "pg_bk",
    tanggal: "2026-08-18",
    kategori: "Kedisiplinan & Ketertiban",
    item_pelanggaran: "Tidak mengikuti upacara bendera / apel",
    bobot_poin: 10,
    catatan_kronologi: "Bersembunyi di toilet saat upacara bendera.",
  },
  {
    id_pelanggaran: "plg_10",
    id_siswa: "sw_02", // Alwiy Sahreza
    id_pegawai_pencatat: "pg_bk",
    tanggal: "2026-08-15",
    kategori: "Etika, Perilaku & Sikap",
    item_pelanggaran: "Mengganggu ketertiban KBM di kelas",
    bobot_poin: 5,
    catatan_kronologi: "Membuat kegaduhan berulang di jam pelajaran IPA.",
  },
];

const INITIAL_KONSELING_SEED: JurnalKonseling[] = [
  {
    id_jurnal: "jrn_01",
    id_siswa: "sw_01", // Ahmad Azza Najril
    id_pegawai_bk: "pg_bk",
    tanggal: "2026-09-12",
    waktu: "10:00",
    pendekatan: "Tatap Muka (Individual)",
    bidang: "Pribadi",
    topik: "Motivasi Belajar Menurun",
    uraian:
      "Siswa mengalami demotivasi karena faktor lingkungan di rumah. Telah diberikan teknik self-regulation. Siswa mulai menunjukkan respon positif.",
    tindak_lanjut: "Jadwalkan Sesi Lanjutan",
    status: "Proses",
    tingkat_kerahasiaan: "Rahasia",
  },
  {
    id_jurnal: "jrn_02",
    id_siswa: "sw_04", // Yasinta Fatiha
    id_pegawai_bk: "pg_bk",
    tanggal: "2026-09-10",
    waktu: "11:15",
    pendekatan: "Tatap Muka (Individual)",
    bidang: "Karir",
    topik: "Minat Lanjut Sekolah",
    uraian:
      "Konseling eksplorasi minat bakat dan pilihan jurusan lanjutan MA/SMA. Siswa menunjukkan minat kuat pada bidang sains terapan.",
    tindak_lanjut: "Pemantauan Berkala",
    status: "Selesai",
    tingkat_kerahasiaan: "Rahasia",
  },
  {
    id_jurnal: "jrn_03",
    id_siswa: "sw_05", // Ziadatul Ilmi
    id_pegawai_bk: "pg_bk",
    tanggal: "2026-09-05",
    waktu: "08:45",
    pendekatan: "Mediasi",
    bidang: "Sosial",
    topik: "Konflik dengan Teman",
    uraian:
      "Mediasi penyelesaian kesalahpahaman komunikasi dengan teman sebangku. Kedua belah pihak telah saling memaafkan dan menyepakati etika interaksi.",
    tindak_lanjut: "Kasus Selesai",
    status: "Selesai",
    tingkat_kerahasiaan: "Rahasia",
  },
  {
    id_jurnal: "jrn_04",
    id_siswa: "sw_02", // Alwiy Sahreza
    id_pegawai_bk: "pg_bk",
    tanggal: "2026-09-01",
    waktu: "09:00",
    pendekatan: "Tatap Muka (Individual)",
    bidang: "Akademik",
    topik: "Kesulitan Fokus di Kelas",
    uraian:
      "Bimbingan teknik konsentrasi dan manajemen waktu belajar mandiri di rumah.",
    tindak_lanjut: "Koordinasi dengan Wali Kelas",
    status: "Selesai",
    tingkat_kerahasiaan: "Rahasia",
  },
];

const INITIAL_SP_SEED: SuratPanggilanSP[] = [
  {
    id_sp: "sp_01",
    id_siswa: "sw_01",
    nomor_surat: "SP/BK/2026/041",
    tanggal_terbit: "2026-09-13",
    hari_pemanggilan: "Kamis",
    tanggal_pemanggilan: "2026-09-17",
    jam_pemanggilan: "09:00",
    ruangan_tujuan: "Ruang Bimbingan Konseling (BK)",
    keperluan: "Koordinasi pembinaan perilaku dan akumulasi poin kritis.",
    total_poin_saat_terbit: 85,
    status: "Diterbitkan",
  },
  {
    id_sp: "sp_02",
    id_siswa: "sw_04",
    nomor_surat: "SP/BK/2026/038",
    tanggal_terbit: "2026-08-25",
    hari_pemanggilan: "Selasa",
    tanggal_pemanggilan: "2026-08-28",
    jam_pemanggilan: "10:30",
    ruangan_tujuan: "Ruang Bimbingan Konseling (BK)",
    keperluan: "Pembahasan kehadiran dan kedisiplinan belajar.",
    total_poin_saat_terbit: 50,
    status: "Selesai",
  },
];

export default function BkDashboardPage() {
  const { currentUser, penugasanList, plottingBkList } = useAuth();

  // Role Access Evaluation
  const isBkTeacher = !!(
    currentUser && isPembinaBk(currentUser.id_pegawai, plottingBkList)
  );
  const isKamad = !!(
    currentUser && isKepalaMadrasah(currentUser.id_pegawai, penugasanList)
  );
  const isAdmin = !!(
    currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList)
  );
  const canAccess = isBkTeacher || isKamad || isAdmin;

  // Active Tab: 1 = Buku Kasus & Poin, 2 = Jurnal Layanan, 3 = Daftar Konseli
  const [activeTab, setActiveTab] = useState<"kasus" | "jurnal" | "konseli">("kasus");

  // Raw Data State
  const [rawSiswa, setRawSiswa] = useState<Siswa[]>([]);
  const [rombelList, setRombelList] = useState<Rombel[]>([]);
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [anggotaList, setAnggotaList] = useState<{ id_siswa: string; id_rombel: string }[]>([]);
  const [activePlotting, setActivePlotting] = useState<{ id_pegawai: string; id_rombel: string }[]>([]);
  const [pelanggaranList, setPelanggaranList] = useState<PelanggaranSiswa[]>(INITIAL_PELANGGARAN_SEED);
  const [konselingList, setKonselingList] = useState<JurnalKonseling[]>(INITIAL_KONSELING_SEED);
  const [spList, setSpList] = useState<SuratPanggilanSP[]>(INITIAL_SP_SEED);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drawer / Modal States
  const [selectedTindakLanjutSiswa, setSelectedTindakLanjutSiswa] = useState<KonseliDetail | null>(null);
  const [isGlobalAddOpen, setIsGlobalAddOpen] = useState(false);

  // Load Base Data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [siswaRes, rombelRes, pegawaiRes, anggotaRes, plottingRes] = await Promise.all([
          services.siswa.getAll(),
          services.referensi.getRombel(),
          services.pegawai.getAll(),
          services.keanggotaan.getAnggotaAktif(),
          services.penugasanDomain.getPlottingBK(),
        ]);

        setRawSiswa(siswaRes);
        setRombelList(rombelRes);
        setPegawaiList(pegawaiRes);
        setAnggotaList(anggotaRes);
        setActivePlotting(plottingRes.length > 0 ? plottingRes : (plottingBkList || []));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data BK");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [plottingBkList]);

  // Accessible Rombels based on Plotting
  const accessibleRombelList = useMemo(() => {
    if (!currentUser) return rombelList;
    if (isKamad || isAdmin) return rombelList;
    const assignedRombelIds = new Set(
      activePlotting
        .filter((p) => p.id_pegawai === currentUser.id_pegawai)
        .map((p) => p.id_rombel)
    );
    return rombelList.filter((r) => assignedRombelIds.has(r.id_rombel));
  }, [rombelList, activePlotting, currentUser, isKamad, isAdmin]);

  // RBAC Isolasi Konseli List
  const konseliDetails: KonseliDetail[] = useMemo(() => {
    if (!currentUser) return [];

    const anggotaMap = new Map(anggotaList.map((a) => [a.id_siswa, a.id_rombel]));
    const rombelMap = new Map(rombelList.map((r) => [r.id_rombel, r]));
    const pegawaiMap = new Map(pegawaiList.map((p) => [p.id_pegawai, p]));

    // Filter siswa based on Plotting BK (if not Kamad/Admin)
    const accessibleSiswa = rawSiswa.filter((s) => {
      const studentRombelId = anggotaMap.get(s.id_siswa) || (s as any).id_rombel || "";
      if (isKamad || isAdmin) return !!studentRombelId;
      return isPembinaBkSiswa(
        currentUser.id_pegawai,
        studentRombelId,
        activePlotting as any
      );
    });

    return accessibleSiswa.map((s) => {
      const rombelId = anggotaMap.get(s.id_siswa) || (s as any).id_rombel || "";
      const rombel = rombelMap.get(rombelId);
      const waliKelas = rombel?.id_wali_kelas ? pegawaiMap.get(rombel.id_wali_kelas) : null;

      // Calculate total points from violations
      const studentViolations = pelanggaranList.filter(
        (p) => p.id_siswa === s.id_siswa
      );
      const totalPoin = studentViolations.reduce(
        (acc, p) => acc + (p.bobot_poin || 0),
        0
      );

      // Latest violation
      const sortedViolations = [...studentViolations].sort((a, b) =>
        a.tanggal > b.tanggal ? -1 : 1
      );
      const latestViolation = sortedViolations[0];

      // Counseling sessions
      const studentCounseling = konselingList.filter(
        (k) => k.id_siswa === s.id_siswa
      );

      // SP letters
      const studentSp = spList.filter((sp) => sp.id_siswa === s.id_siswa);

      return {
        ...s,
        id_rombel: rombelId,
        nama_rombel: rombel?.nama_rombel || "—",
        nama_wali_kelas: waliKelas?.nama_lengkap_gelar || "—",
        total_poin: totalPoin,
        kasus_terakhir: latestViolation
          ? latestViolation.item_pelanggaran
          : null,
        tanggal_kasus_terakhir: latestViolation
          ? latestViolation.tanggal
          : null,
        jumlah_layanan: studentCounseling.length,
        riwayat_pelanggaran: studentViolations,
        riwayat_konseling: studentCounseling,
        riwayat_sp: studentSp,
        data_ortu: {
          nama_ayah: (s as any).nama_ayah || "Bpk. Abdullah",
          pekerjaan_ayah: (s as any).pekerjaan_ayah || "Wiraswasta",
          penghasilan_ayah: "Rp 3.000.000 - Rp 5.000.000",
          nama_ibu: (s as any).nama_ibu || "Ibu Maryam",
          pekerjaan_ibu: "Ibu Rumah Tangga",
          no_hp_ortu: (s as any).no_hp || "0812-3456-7890",
          alamat: s.alamat_detail || "Mataram, Nusa Tenggara Barat",
        },
      };
    });
  }, [
    rawSiswa,
    anggotaList,
    rombelList,
    pegawaiList,
    pelanggaranList,
    konselingList,
    spList,
    currentUser,
    isKamad,
    isAdmin,
    activePlotting,
  ]);

  // Statistics
  const stats = useMemo(() => {
    const totalKonseli = konseliDetails.length;
    const distinctRombels = new Set(
      konseliDetails.map((k) => k.id_rombel)
    ).size;
    const totalKritis = konseliDetails.filter((k) => k.total_poin >= 75).length;
    const totalSesiBulanIni = konselingList.length;
    const totalSpDiterbitkan = spList.filter((s) => s.status === "Diterbitkan").length;

    return {
      totalKonseli,
      totalRombel: distinctRombels,
      totalKritis,
      totalSesiBulanIni,
      totalSpDiterbitkan,
    };
  }, [konseliDetails, konselingList, spList]);

  // Enriched Counseling Records for Tab 2
  const enrichedJurnalList = useMemo(() => {
    const siswaMap = new Map(konseliDetails.map((k) => [k.id_siswa, k]));
    return konselingList.map((j) => {
      const konseli = siswaMap.get(j.id_siswa);
      return {
        ...j,
        nama_siswa: konseli?.nama_lengkap || "Siswa",
        nama_rombel: konseli?.nama_rombel || "—",
      };
    });
  }, [konselingList, konseliDetails]);

  // --- ACTIONS & HANDLERS ---
  const handleSavePelanggaran = async (
    data: Omit<PelanggaranSiswa, "id_pelanggaran">
  ) => {
    const newId = `plg_${Date.now()}`;
    const newRecord: PelanggaranSiswa = {
      ...data,
      id_pelanggaran: newId,
    };
    setPelanggaranList((prev) => [newRecord, ...prev]);

    // Update opened drawer student reference if matching
    if (selectedTindakLanjutSiswa?.id_siswa === data.id_siswa) {
      setSelectedTindakLanjutSiswa((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          total_poin: prev.total_poin + data.bobot_poin,
          riwayat_pelanggaran: [newRecord, ...(prev.riwayat_pelanggaran || [])],
        };
      });
    }
  };

  const handleSaveKonseling = async (
    data: Omit<JurnalKonseling, "id_jurnal">,
    idToUpdate?: string
  ) => {
    if (idToUpdate) {
      setKonselingList((prev) =>
        prev.map((k) =>
          k.id_jurnal === idToUpdate ? { ...k, ...data } : k
        )
      );
    } else {
      const newId = `jrn_${Date.now()}`;
      const newRecord: JurnalKonseling = {
        ...data,
        id_jurnal: newId,
      };
      setKonselingList((prev) => [newRecord, ...prev]);

      // Sync with backend mock service if available
      try {
        await services.bk.create({
          id_siswa: data.id_siswa,
          id_pegawai_bk: data.id_pegawai_bk,
          tanggal: data.tanggal,
          kategori: data.bidang as any,
          catatan: `${data.topik}: ${data.uraian}`,
          tingkat_kerahasiaan: data.tingkat_kerahasiaan,
        });
      } catch (e) {
        console.warn("Syncing to backend mock service:", e);
      }

      if (selectedTindakLanjutSiswa?.id_siswa === data.id_siswa) {
        setSelectedTindakLanjutSiswa((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            jumlah_layanan: prev.jumlah_layanan + 1,
            riwayat_konseling: [newRecord, ...(prev.riwayat_konseling || [])],
          };
        });
      }
    }
  };

  const handleDeleteKonseling = async (id: string) => {
    setKonselingList((prev) => prev.filter((k) => k.id_jurnal !== id));
  };

  const handleSaveSp = async (data: Omit<SuratPanggilanSP, "id_sp">) => {
    const newId = `sp_${Date.now()}`;
    const newRecord: SuratPanggilanSP = {
      ...data,
      id_sp: newId,
    };
    setSpList((prev) => [newRecord, ...prev]);

    if (selectedTindakLanjutSiswa?.id_siswa === data.id_siswa) {
      setSelectedTindakLanjutSiswa((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          riwayat_sp: [newRecord, ...(prev.riwayat_sp || [])],
        };
      });
    }
  };

  const handleOpenTindakLanjutWithAction = (
    siswa: KonseliDetail,
    initialAction: "pelanggaran" | "konseling" | "sp"
  ) => {
    setSelectedTindakLanjutSiswa(siswa);
  };

  if (!canAccess) {
    return (
      <AppShell title="Bimbingan Konseling">
        <ErrorBlock message="Anda tidak memiliki hak akses ke modul Bimbingan Konseling (BK)." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Bimbingan Konseling">
      <div className="space-y-6">
        {/* HEADER SECTION (Breadcrumb & User Period Info) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
          <PageHeader
          title="Dashboard Bimbingan Konseling"
          description="Pengelolaan buku kasus kedisiplinan, jurnal layanan konseling berenkripsi, dan master caseload binaan."
          action={
            <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">Periode: Ganjil 2026/2027</span>
              <span className="text-slate-300">|</span>
              <span className="font-bold text-emerald-800">
                Guru: {currentUser?.nama_lengkap_gelar || "Nurul Hidayah, S.Psi."}
              </span>
            </div>
          }
        />
        </div>

        {error && <ErrorBlock message={error} />}

        {/* 4 STATISTICAL CARDS */}
        <BkStatCards
          totalKonseli={stats.totalKonseli}
          totalRombel={stats.totalRombel}
          totalKritis={stats.totalKritis}
          totalSesiBulanIni={stats.totalSesiBulanIni}
          totalSpDiterbitkan={stats.totalSpDiterbitkan}
        />

        {/* TABS NAVIGATION */}
        <div className="border-b border-gray-200 bg-white px-2 rounded-t-xl border-t border-x">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab("kasus")}
              className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "kasus"
                  ? "border-rose-600 text-rose-700 bg-rose-50/40 rounded-t-lg"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>TAB 1: BUKU KASUS &amp; POIN</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("jurnal")}
              className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "jurnal"
                  ? "border-indigo-600 text-indigo-700 bg-indigo-50/40 rounded-t-lg"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>TAB 2: JURNAL LAYANAN</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("konseli")}
              className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "konseli"
                  ? "border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-lg"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>TAB 3: DAFTAR KONSELI</span>
            </button>
          </div>
        </div>

        {/* TAB CONTENTS */}
        {loading ? (
          <LoadingBlock label="Memuat data Bimbingan Konseling..." />
        ) : (
          <div>
            {activeTab === "kasus" && (
              <BukuKasusTab
                konseliList={konseliDetails}
                rombelList={accessibleRombelList}
                onOpenTindakLanjut={(s) => setSelectedTindakLanjutSiswa(s)}
                onOpenGlobalAddPelanggaran={() => setIsGlobalAddOpen(true)}
              />
            )}

            {activeTab === "jurnal" && (
              <JurnalLayananTab
                jurnalList={enrichedJurnalList}
                konseliList={konseliDetails}
                currentUserId={currentUser?.id_pegawai || "pg_bk"}
                onSaveJurnal={handleSaveKonseling}
                onDeleteJurnal={handleDeleteKonseling}
              />
            )}

            {activeTab === "konseli" && (
              <DaftarKonseliTab
                konseliList={konseliDetails}
                rombelList={accessibleRombelList}
                onOpenTindakLanjutWithAction={handleOpenTindakLanjutWithAction}
              />
            )}
          </div>
        )}

        {/* SLIDE-OVER DRAWER TINDAK LANJUT */}
        {selectedTindakLanjutSiswa && (
          <TindakLanjutDrawer
            isOpen={!!selectedTindakLanjutSiswa}
            onClose={() => setSelectedTindakLanjutSiswa(null)}
            siswa={selectedTindakLanjutSiswa}
            currentUserId={currentUser?.id_pegawai || "pg_bk"}
            onSavePelanggaran={handleSavePelanggaran}
            onSaveKonseling={(data) => handleSaveKonseling(data)}
            onSaveSp={handleSaveSp}
          />
        )}

        {/* MODAL GLOBAL TAMBAH PELANGGARAN */}
        {isGlobalAddOpen && (
          <GlobalAddPelanggaranModal
            isOpen={isGlobalAddOpen}
            onClose={() => setIsGlobalAddOpen(false)}
            konseliList={konseliDetails}
            currentUserId={currentUser?.id_pegawai || "pg_bk"}
            onSave={handleSavePelanggaran}
          />
        )}
      </div>
    </AppShell>
  );
}
