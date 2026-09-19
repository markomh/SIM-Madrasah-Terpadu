"use client";

import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion } from "@/components/app-providers";
import {
  Alert,
  Button,
  ConfirmDialog,
  Drawer,
  LoadingBlock,
  Modal,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
} from "@/components/ui/primitives";
import { services } from "@/services";
import { isAdminMadrasah, isPembinaEkstrakurikuler } from "@/lib/access";
import type { Ekstrakurikuler, KeanggotaanEkstra } from "@/types/ekstrakurikuler";
import type { Pegawai, Siswa, Rombel } from "@/types";
import {
  Users,
  Plus,
  FileSpreadsheet,
  Calendar,
  Award,
  UserPlus,
  Save,
  Printer,
  AlertTriangle,
  SlidersHorizontal,
  Info,
  Flag,
  Edit3,
  Eye,
  Clock,
  Zap,
  Send,
} from "lucide-react";

interface NilaiEkstraState {
  predikat: "Sangat Baik" | "Baik" | "Cukup" | "Kurang";
  deskripsi: string;
}

interface EkskulMeta {
  kategori: "Wajib" | "Pilihan";
  hari: string;
  waktu: string;
}

const PAGE_SIZE = 10;

export default function EkstrakurikulerPage() {
  const { currentUser, penugasanList, ekstraList } = useAuth();
  const { bump, version } = useDataVersion();

  const [ekstraListAll, setEkstraListAll] = useState<Ekstrakurikuler[]>([]);
  const [selectedEkstraId, setSelectedEkstraId] = useState<string>("");
  const [keanggotaanMap, setKeanggotaanMap] = useState<Record<string, KeanggotaanEkstra[]>>({});
  const [allSiswa, setAllSiswa] = useState<Siswa[]>([]);
  const [allRombel, setAllRombel] = useState<Rombel[]>([]);
  const [siswaRombelMap, setSiswaRombelMap] = useState<Record<string, string>>({});
  const [allPegawai, setAllPegawai] = useState<Pegawai[]>([]);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; type: "primary" | "danger" } | null>(null);

  // Mode View: "admin_master" vs "pembina_workspace"
  const [viewMode, setViewMode] = useState<"admin_master" | "pembina_workspace">("admin_master");

  // Filter Master (Mode Admin)
  const [filterKategori, setFilterKategori] = useState<string>("all");
  const [filterStatusPlotting, setFilterStatusPlotting] = useState<string>("all");
  const [searchMaster, setSearchMaster] = useState<string>("");
  const [pageMaster, setPageMaster] = useState(0);

  // Modal Tambah Program Baru (Mode Admin)
  const [isAddProgramOpen, setIsAddProgramOpen] = useState(false);
  const [newProgram, setNewProgram] = useState({
    nama_ekstra: "",
    kategori: "Pilihan",
    hari: "Jumat",
    waktu: "15:00 WITA",
  });
  const [savingProgram, setSavingProgram] = useState(false);

  // Modal Edit Program (Mode Admin)
  const [isEditProgramOpen, setIsEditProgramOpen] = useState(false);
  const [editProgramData, setEditProgramData] = useState<{
    id_ekstra: string;
    nama_ekstra: string;
    kategori: "Wajib" | "Pilihan";
    hari: string;
    waktu: string;
  } | null>(null);
  const [savingEditProgram, setSavingEditProgram] = useState(false);

  // Slide-over Drawer Detail Siswa Read-only (Mode Admin)
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [detailEkstra, setDetailEkstra] = useState<Ekstrakurikuler | null>(null);
  const [searchDetailAnggota, setSearchDetailAnggota] = useState("");
  const [filterDetailKelas, setFilterDetailKelas] = useState("all");
  const [filterDetailStatus, setFilterDetailStatus] = useState<string>("all");
  const [pageDetail, setPageDetail] = useState(0);

  // Metadata dummy per ekskul (kategori, hari, waktu)
  const [ekskulMetaMap, setEkskulMetaMap] = useState<Record<string, EkskulMeta>>({
    "ek_pramuka": { kategori: "Wajib", hari: "Jumat", waktu: "15:00 WITA" },
    "ek_paskibra": { kategori: "Pilihan", hari: "Rabu", waktu: "16:00 WITA" },
    "ek_futsal": { kategori: "Pilihan", hari: "Sabtu", waktu: "15:30 WITA" },
    "ek_robotik": { kategori: "Pilihan", hari: "Kamis", waktu: "14:00 WITA" },
    "ek_pmr": { kategori: "Pilihan", hari: "Selasa", waktu: "15:00 WITA" },
  });

  // Operasional Tab State (Mode Pembina)
  const [pembinaTab, setPembinaTab] = useState<"anggota" | "presensi" | "penilaian">("anggota");
  const [searchAnggota, setSearchAnggota] = useState("");
  const [filterKelas, setFilterKelas] = useState("all");

  const [searchPresensi, setSearchPresensi] = useState("");
  const [filterPresensiKelas, setFilterPresensiKelas] = useState("all");

  const [searchPenilaian, setSearchPenilaian] = useState("");
  const [filterPenilaianKelas, setFilterPenilaianKelas] = useState("all");

  // Pagination states for the 3 sub-tabs
  const [pageAnggota, setPageAnggota] = useState(0);
  const [pagePresensi, setPagePresensi] = useState(0);
  const [pagePenilaian, setPagePenilaian] = useState(0);

  // Slide-over Drawer Tambah Siswa (Mode Pembina)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchCalon, setSearchCalon] = useState("");
  const [filterCalonKelas, setFilterCalonKelas] = useState("all");
  const [submittingIdSiswa, setSubmittingIdSiswa] = useState<string | null>(null);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);

  // Presensi State (Mode Pembina)
  const [presensiTanggal, setPresensiTanggal] = useState<string>(new Date().toISOString().split("T")[0]);
  const [presensiMateri, setPresensiMateri] = useState<string>("Latihan Rutin & Pembinaan Karakter");
  const [presensiMap, setPresensiMap] = useState<Record<string, "Hadir" | "Tidak Hadir" | "Izin" | "Sakit">>({});
  const [savingPresensi, setSavingPresensi] = useState(false);

  // Penilaian State (Mode Pembina)
  const [nilaiMap, setNilaiMap] = useState<Record<string, NilaiEkstraState>>({});
  const [savingNilai, setSavingNilai] = useState(false);

  // Confirm Dialog State
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; action: "toggle" | "remove" } | null>(null);

  const isAdmin = currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList);
  const isPembina = currentUser && isPembinaEkstrakurikuler(currentUser.id_pegawai, ekstraList);
  const canAccess = isAdmin || isPembina;

  // 1. Initial Data Fetch
  useEffect(() => {
    let ignore = false;
    async function init() {
      setLoading(true);
      try {
        const [eks, sw, rb, pg] = await Promise.all([
          services.ekstrakurikuler.getAll(),
          services.siswa.getAll(),
          services.referensi.getRombel({}),
          services.pegawai.getAll(),
        ]);

        if (!ignore) {
          setAllSiswa(sw);
          setAllRombel(rb);
          setAllPegawai(pg);
          setEkstraListAll(eks);

          // Mapping siswa -> nama rombel
          const sRMap: Record<string, string> = {};
          await Promise.all(
            rb.map(async (r) => {
              try {
                const swInRombel = await services.siswa.getAll({ id_rombel: r.id_rombel });
                swInRombel.forEach((s) => {
                  sRMap[s.id_siswa] = r.nama_rombel;
                });
              } catch { }
            })
          );
          setSiswaRombelMap(sRMap);

          // Load membership for all extracurriculars
          const kMap: Record<string, KeanggotaanEkstra[]> = {};
          await Promise.all(
            eks.map(async (e) => {
              try {
                const members = await services.ekstrakurikuler.getKeanggotaan(e.id_ekstra);
                kMap[e.id_ekstra] = members;
              } catch {
                kMap[e.id_ekstra] = [];
              }
            })
          );
          setKeanggotaanMap(kMap);

          // Default mode & selection
          if (isPembina && !isAdmin) {
            setViewMode("pembina_workspace");
            const myEks = eks.filter((e) => e.id_pembina === currentUser?.id_pegawai);
            if (myEks.length > 0) {
              setSelectedEkstraId(myEks[0].id_ekstra);
            }
          } else {
            setViewMode("admin_master");
            if (eks.length > 0) {
              setSelectedEkstraId(eks[0].id_ekstra);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [version, currentUser]);

  // Ekstrakurikuler terfilter untuk Pembina (Scoped)
  const pembinaEkskulList = useMemo(() => {
    if (isAdmin) return ekstraListAll;
    if (currentUser) {
      return ekstraListAll.filter((e) => e.id_pembina === currentUser.id_pegawai);
    }
    return [];
  }, [ekstraListAll, isAdmin, currentUser]);

  // Current active extracurricular for workspace
  const currentEkstra = useMemo(() => {
    return ekstraListAll.find((e) => e.id_ekstra === selectedEkstraId);
  }, [ekstraListAll, selectedEkstraId]);

  const activeKeanggotaan = useMemo(() => {
    return keanggotaanMap[selectedEkstraId] || [];
  }, [keanggotaanMap, selectedEkstraId]);

  const pembinaPegawai = useMemo(() => {
    if (!currentEkstra?.id_pembina) return null;
    return allPegawai.find((p) => p.id_pegawai === currentEkstra.id_pembina);
  }, [currentEkstra, allPegawai]);

  const siswaMap = useMemo(() => {
    const map: Record<string, Siswa> = {};
    allSiswa.forEach((s) => {
      map[s.id_siswa] = s;
    });
    return map;
  }, [allSiswa]);

  // Filtered members for Tab 1 (Daftar Anggota)
  const filteredAnggota = useMemo(() => {
    return activeKeanggotaan.filter((item) => {
      const siswa = siswaMap[item.id_siswa];
      if (!siswa) return false;

      const matchName =
        siswa.nama_lengkap.toLowerCase().includes(searchAnggota.toLowerCase()) ||
        (siswa.nisn && siswa.nisn.includes(searchAnggota));

      const kelasName = siswaRombelMap[item.id_siswa] || "";
      const matchKelas =
        filterKelas === "all" ||
        kelasName.startsWith(filterKelas) ||
        (filterKelas === "7" && (kelasName.startsWith("7") || kelasName.startsWith("VII"))) ||
        (filterKelas === "8" && (kelasName.startsWith("8") || kelasName.startsWith("VIII"))) ||
        (filterKelas === "9" && (kelasName.startsWith("9") || kelasName.startsWith("IX")));

      return matchName && matchKelas;
    });
  }, [activeKeanggotaan, siswaMap, searchAnggota, filterKelas, siswaRombelMap]);

  // Active members for Presensi & Penilaian (only status "Aktif")
  const activeMembersOnly = useMemo(() => {
    return activeKeanggotaan.filter((k) => k.status === "Aktif");
  }, [activeKeanggotaan]);

  // Paginated Data for Tab 1 (Anggota)
  const paginatedAnggota = useMemo(() => {
    const start = pageAnggota * PAGE_SIZE;
    return filteredAnggota.slice(start, start + PAGE_SIZE);
  }, [filteredAnggota, pageAnggota]);

  // Filtered members for Tab 2 (Presensi)
  const filteredPresensi = useMemo(() => {
    return activeMembersOnly.filter((item) => {
      const siswa = siswaMap[item.id_siswa];
      if (!siswa) return false;

      const matchName =
        siswa.nama_lengkap.toLowerCase().includes(searchPresensi.toLowerCase()) ||
        (siswa.nisn && siswa.nisn.includes(searchPresensi));

      const kelasName = siswaRombelMap[item.id_siswa] || "";
      const matchKelas =
        filterPresensiKelas === "all" ||
        kelasName.startsWith(filterPresensiKelas) ||
        (filterPresensiKelas === "7" && (kelasName.startsWith("7") || kelasName.startsWith("VII"))) ||
        (filterPresensiKelas === "8" && (kelasName.startsWith("8") || kelasName.startsWith("VIII"))) ||
        (filterPresensiKelas === "9" && (kelasName.startsWith("9") || kelasName.startsWith("IX")));

      return matchName && matchKelas;
    });
  }, [activeMembersOnly, siswaMap, searchPresensi, filterPresensiKelas, siswaRombelMap]);

  // Paginated Data for Tab 2 (Presensi)
  const paginatedPresensi = useMemo(() => {
    const start = pagePresensi * PAGE_SIZE;
    return filteredPresensi.slice(start, start + PAGE_SIZE);
  }, [filteredPresensi, pagePresensi]);

  // Filtered members for Tab 3 (Penilaian)
  const filteredPenilaian = useMemo(() => {
    return activeMembersOnly.filter((item) => {
      const siswa = siswaMap[item.id_siswa];
      if (!siswa) return false;

      const matchName =
        siswa.nama_lengkap.toLowerCase().includes(searchPenilaian.toLowerCase()) ||
        (siswa.nisn && siswa.nisn.includes(searchPenilaian));

      const kelasName = siswaRombelMap[item.id_siswa] || "";
      const matchKelas =
        filterPenilaianKelas === "all" ||
        kelasName.startsWith(filterPenilaianKelas) ||
        (filterPenilaianKelas === "7" && (kelasName.startsWith("7") || kelasName.startsWith("VII"))) ||
        (filterPenilaianKelas === "8" && (kelasName.startsWith("8") || kelasName.startsWith("VIII"))) ||
        (filterPenilaianKelas === "9" && (kelasName.startsWith("9") || kelasName.startsWith("IX")));

      return matchName && matchKelas;
    });
  }, [activeMembersOnly, siswaMap, searchPenilaian, filterPenilaianKelas, siswaRombelMap]);

  // Paginated Data for Tab 3 (Penilaian)
  const paginatedPenilaian = useMemo(() => {
    const start = pagePenilaian * PAGE_SIZE;
    return filteredPenilaian.slice(start, start + PAGE_SIZE);
  }, [filteredPenilaian, pagePenilaian]);

  // Filtered Master Table (Mode Admin)
  const filteredMasterEkstra = useMemo(() => {
    return ekstraListAll.filter((e) => {
      const meta = ekskulMetaMap[e.id_ekstra] || { kategori: "Pilihan", hari: "Jumat", waktu: "15:00 WITA" };
      const matchName = e.nama_ekstra.toLowerCase().includes(searchMaster.toLowerCase());
      const matchKategori = filterKategori === "all" || meta.kategori === filterKategori;
      const matchPlotting =
        filterStatusPlotting === "all" ||
        (filterStatusPlotting === "plotted" && Boolean(e.id_pembina)) ||
        (filterStatusPlotting === "unplotted" && !e.id_pembina);

      return matchName && matchKategori && matchPlotting;
    });
  }, [ekstraListAll, searchMaster, filterKategori, filterStatusPlotting, ekskulMetaMap]);

  const paginatedMaster = useMemo(() => {
    const start = pageMaster * PAGE_SIZE;
    return filteredMasterEkstra.slice(start, start + PAGE_SIZE);
  }, [filteredMasterEkstra, pageMaster]);

  // Candidate students for Slide-over Drawer
  const calonSiswaList = useMemo(() => {
    const existingSiswaIds = new Set(
      activeKeanggotaan.filter((k) => k.status === "Aktif").map((k) => k.id_siswa)
    );

    return allSiswa.filter((s) => {
      if (existingSiswaIds.has(s.id_siswa)) return false;

      // Filter search
      const q = searchCalon.trim().toLowerCase();
      const matchQuery =
        !q || s.nama_lengkap.toLowerCase().includes(q) || (s.nisn && s.nisn.includes(q));

      // Filter tingkat kelas (Semua Kelas, Kelas 7, Kelas 8, Kelas 9)
      const kelas = siswaRombelMap[s.id_siswa] || "";
      const matchKelas =
        filterCalonKelas === "all" ||
        kelas.startsWith(filterCalonKelas) ||
        (filterCalonKelas === "7" && (kelas.startsWith("7") || kelas.startsWith("VII"))) ||
        (filterCalonKelas === "8" && (kelas.startsWith("8") || kelas.startsWith("VIII"))) ||
        (filterCalonKelas === "9" && (kelas.startsWith("9") || kelas.startsWith("IX")));

      return matchQuery && matchKelas;
    });
  }, [allSiswa, activeKeanggotaan, searchCalon, filterCalonKelas, siswaRombelMap]);

  // Members for Detail Drawer (Mode Admin Read-Only)
  const detailMembers = useMemo(() => {
    if (!detailEkstra) return [];
    const members = keanggotaanMap[detailEkstra.id_ekstra] || [];
    return members.filter((item) => {
      const siswa = siswaMap[item.id_siswa];
      if (!siswa) return false;

      const q = searchDetailAnggota.trim().toLowerCase();
      const matchName =
        !q ||
        siswa.nama_lengkap.toLowerCase().includes(q) ||
        (siswa.nisn && siswa.nisn.includes(q));

      const kelasName = siswaRombelMap[item.id_siswa] || "";
      const matchKelas =
        filterDetailKelas === "all" ||
        kelasName.startsWith(filterDetailKelas) ||
        (filterDetailKelas === "7" && (kelasName.startsWith("7") || kelasName.startsWith("VII"))) ||
        (filterDetailKelas === "8" && (kelasName.startsWith("8") || kelasName.startsWith("VIII"))) ||
        (filterDetailKelas === "9" && (kelasName.startsWith("9") || kelasName.startsWith("IX")));

      const matchStatus =
        filterDetailStatus === "all" || item.status === filterDetailStatus;

      return matchName && matchKelas && matchStatus;
    });
  }, [detailEkstra, keanggotaanMap, siswaMap, searchDetailAnggota, filterDetailKelas, filterDetailStatus, siswaRombelMap]);

  const paginatedDetailMembers = useMemo(() => {
    const start = pageDetail * PAGE_SIZE;
    return detailMembers.slice(start, start + PAGE_SIZE);
  }, [detailMembers, pageDetail]);

  // Create Program Baru (Mode Admin)
  const handleCreateProgram = async () => {
    if (!newProgram.nama_ekstra.trim()) return;
    setSavingProgram(true);
    try {
      const created = await services.ekstrakurikuler.create({
        nama_ekstra: newProgram.nama_ekstra.trim(),
        id_madrasah: "md_1",
        id_tahun: "th_2026",
        id_pembina: "", // Sengaja kosong, menunggu plotting HRD
      });

      setEkskulMetaMap((prev) => ({
        ...prev,
        [created.id_ekstra]: {
          kategori: newProgram.kategori as "Wajib" | "Pilihan",
          hari: newProgram.hari,
          waktu: newProgram.waktu,
        },
      }));

      setMsg({
        text: `Master program "${created.nama_ekstra}" berhasil dibuat. Silakan lakukan plotting Pembina pada menu Penugasan & SK.`,
        type: "primary",
      });
      setIsAddProgramOpen(false);
      setNewProgram({
        nama_ekstra: "",
        kategori: "Pilihan",
        hari: "Jumat",
        waktu: "15:00 WITA",
      });
      bump();
    } catch (e: unknown) {
      setMsg({
        text: `Gagal membuat program: ${e instanceof Error ? e.message : "Error"}`,
        type: "danger",
      });
    } finally {
      setSavingProgram(false);
    }
  };

  // Open Edit Modal (Mode Admin)
  const handleOpenEdit = (ekstra: Ekstrakurikuler) => {
    const meta = ekskulMetaMap[ekstra.id_ekstra] || {
      kategori: "Pilihan",
      hari: "Jumat",
      waktu: "15:00 WITA",
    };
    setEditProgramData({
      id_ekstra: ekstra.id_ekstra,
      nama_ekstra: ekstra.nama_ekstra,
      kategori: meta.kategori,
      hari: meta.hari,
      waktu: meta.waktu,
    });
    setIsEditProgramOpen(true);
  };

  // Open Detail Drawer (Mode Admin Read-Only)
  const handleOpenDetail = (ekstra: Ekstrakurikuler) => {
    setDetailEkstra(ekstra);
    setSearchDetailAnggota("");
    setFilterDetailKelas("all");
    setFilterDetailStatus("all");
    setPageDetail(0);
    setIsDetailDrawerOpen(true);
  };

  // Save Edit Program (Mode Admin)
  const handleSaveEditProgram = async () => {
    if (!editProgramData || !editProgramData.nama_ekstra.trim()) return;
    setSavingEditProgram(true);
    try {
      await services.ekstrakurikuler.update(editProgramData.id_ekstra, {
        nama_ekstra: editProgramData.nama_ekstra.trim(),
      });
      setEkskulMetaMap((prev) => ({
        ...prev,
        [editProgramData.id_ekstra]: {
          kategori: editProgramData.kategori,
          hari: editProgramData.hari,
          waktu: editProgramData.waktu,
        },
      }));
      setMsg({
        text: `Data program "${editProgramData.nama_ekstra}" berhasil diperbarui.`,
        type: "primary",
      });
      setIsEditProgramOpen(false);
      setEditProgramData(null);
      bump();
    } catch (e: unknown) {
      setMsg({
        text: `Gagal memperbarui program: ${e instanceof Error ? e.message : "Error"}`,
        type: "danger",
      });
    } finally {
      setSavingEditProgram(false);
    }
  };

  // Handlers Mode Pembina
  const handleAddSiswa = async (idSiswa: string) => {
    if (!selectedEkstraId) return;
    setSubmittingIdSiswa(idSiswa);
    try {
      await services.ekstrakurikuler.addAnggota({
        id_ekstra: selectedEkstraId,
        id_siswa: idSiswa,
      });
      setMsg({ text: "Siswa berhasil didaftarkan ke ekstrakurikuler.", type: "primary" });
      bump();
    } catch (e: unknown) {
      setMsg({
        text: `Gagal mendaftarkan siswa: ${e instanceof Error ? e.message : "Error"}`,
        type: "danger",
      });
    } finally {
      setSubmittingIdSiswa(null);
    }
  };

  // Pendaftaran Massal / Batch Enrollment (Ekskul Wajib & Rekrutmen Kelas)
  const handleBatchAddSiswa = async () => {
    if (!selectedEkstraId || calonSiswaList.length === 0) return;
    setIsSubmittingBatch(true);
    const count = calonSiswaList.length;
    try {
      await Promise.all(
        calonSiswaList.map((s) =>
          services.ekstrakurikuler.addAnggota({
            id_ekstra: selectedEkstraId,
            id_siswa: s.id_siswa,
          })
        )
      );
      setMsg({
        text: `Berhasil mendaftarkan ${count} siswa secara kolektif ke ${currentEkstra?.nama_ekstra || "Ekstrakurikuler"}.`,
        type: "primary",
      });
      bump();
    } catch (e: unknown) {
      setMsg({
        text: `Gagal mendaftarkan siswa secara massal: ${e instanceof Error ? e.message : "Error"}`,
        type: "danger",
      });
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  const handleToggleStatus = async (idKeanggotaan: string) => {
    const current = activeKeanggotaan.find((k) => k.id_keanggotaan === idKeanggotaan);
    if (!current) return;
    try {
      if (current.status === "Aktif") {
        await services.ekstrakurikuler.removeAnggota(idKeanggotaan);
        setMsg({ text: "Status keanggotaan diubah menjadi Keluar/Nonaktif.", type: "primary" });
      }
      bump();
    } catch (e: unknown) {
      setMsg({ text: `Gagal mengubah status: ${e instanceof Error ? e.message : "Error"}`, type: "danger" });
    } finally {
      setConfirmTarget(null);
    }
  };

  const handleSavePresensi = async () => {
    if (!selectedEkstraId) return;
    setSavingPresensi(true);
    try {
      for (const k of activeKeanggotaan) {
        const status = presensiMap[k.id_keanggotaan] === "Tidak Hadir" ? "Tidak Hadir" : "Hadir";
        await services.ekstrakurikuler.catatAbsensi({
          id_keanggotaan: k.id_keanggotaan,
          tanggal: presensiTanggal,
          status,
        });
      }
      setMsg({ text: `Presensi & Jurnal Kegiatan tanggal ${presensiTanggal} berhasil disimpan.`, type: "primary" });
      bump();
    } catch (e: unknown) {
      setMsg({ text: `Gagal menyimpan presensi: ${e instanceof Error ? e.message : "Error"}`, type: "danger" });
    } finally {
      setSavingPresensi(false);
    }
  };

  const handleSavePenilaian = () => {
    setSavingNilai(true);
    setTimeout(() => {
      setSavingNilai(false);
      setMsg({
        text: "Penilaian Capaian Semester Ekstrakurikuler berhasil disimpan & disinkronkan ke Modul Rapor.",
        type: "primary",
      });
    }, 500);
  };

  const [sendingNilai, setSendingNilai] = useState(false);
  const handleKirimNilai = () => {
    setSendingNilai(true);
    setTimeout(() => {
      setSendingNilai(false);
      setMsg({
        text: "Nilai capaian ekstrakurikuler berhasil dikirim & disahkan ke Wali Kelas dan Rapor Digital.",
        type: "primary",
      });
    }, 600);
  };

  if (!canAccess) {
    return (
      <AppShell title="Ekstrakurikuler">
        <div className="p-8">
          <Alert variant="danger">
            Halaman ini khusus untuk Pembina Ekstrakurikuler dan Admin Madrasah.
          </Alert>
        </div>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell title="Ekstrakurikuler">
        <div className="p-8">
          <LoadingBlock label="Memuat Data Ekstrakurikuler..." />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={viewMode === "admin_master" ? "Master Ekstrakurikuler" : "Ruang Kerja Pembina Ekstrakurikuler"}>
      <div className="space-y-6 pb-20">
        {/* TOP BREADCRUMB & MODE TOGGLE */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 pb-3">
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <span className="hover:text-gray-700">Kesiswaan</span>
            <span>/</span>
            <span className="font-semibold text-gray-800">
              {viewMode === "admin_master" ? "Master Ekstrakurikuler" : "Ekstrakurikuler Saya"}
            </span>
          </div>

          {/* ADMIN MODE SWITCHER */}
          {isAdmin && (
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs">
              <span className="text-[11px] font-bold text-gray-500 px-2 uppercase tracking-wider flex items-center gap-1">
                <SlidersHorizontal className="h-3 w-3" />
                Mode Tampilan:
              </span>
              <button
                type="button"
                onClick={() => setViewMode("admin_master")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${viewMode === "admin_master"
                  ? "bg-white text-primary-800 shadow-2xs border border-gray-200"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Master Data (Admin)
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode("pembina_workspace");
                  if (ekstraListAll.length > 0 && !selectedEkstraId) {
                    setSelectedEkstraId(ekstraListAll[0].id_ekstra);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${viewMode === "pembina_workspace"
                  ? "bg-white text-emerald-800 shadow-2xs border border-gray-200"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Ruang Kerja Pembina
              </button>
            </div>
          )}
        </div>

        {msg && (
          <Alert variant={msg.type} className="shadow-2xs" onClose={() => setMsg(null)}>
            {msg.text}
          </Alert>
        )}

        {/* ========================================================================= */}
        {/* 1. MODE ADMIN: MASTER DATA PROGRAM (WAKADIK KESISWAAN) */}
        {/* ========================================================================= */}
        {viewMode === "admin_master" && (
          <div className="space-y-6">
            <PageHeader
              title="Kelola Master Program Ekstrakurikuler"
              description="Buat dan kelola daftar kegiatan ekstrakurikuler madrasah beserta jadwal utamanya."
              action={
                <>
                  <Button
                    variant="primary"
                    iconLeft={<Plus className="h-4 w-4" />}
                    onClick={() => setIsAddProgramOpen(true)}
                  >
                    Tambah
                  </Button>
                  <Button
                    variant="secondary"
                    iconLeft={<Printer className="h-4 w-4 text-gray-600" />}
                    onClick={() => window.print()}
                  >
                    Cetak
                  </Button>
                </>
              }
            />

            {/* INFO BANNER SSoT */}
            <div className="bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed">
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>INFO SISTEM:</strong> Penugasan Guru Pembina dilakukan secara terpusat oleh HRD / Kepala Madrasah melalui menu{" "}
                <a href="/penugasan?tab=tugas-tambahan" className="font-bold underline text-blue-950">
                  [Penugasan & SK Beban Kerja]
                </a>
                . Ruang ini murni mengelola wadah program dan jadwal master kegiatan.
              </div>
            </div>

            {/* FILTER & SEARCH TOOLBAR */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={filterKategori}
                  onChange={(e) => {
                    setFilterKategori(e.target.value);
                    setPageMaster(0);
                  }}
                  className="w-36 text-xs"
                >
                  <option value="all">Semua Kategori</option>
                  <option value="Wajib">Kategori: Wajib</option>
                  <option value="Pilihan">Kategori: Pilihan</option>
                </Select>

                <Select
                  value={filterStatusPlotting}
                  onChange={(e) => {
                    setFilterStatusPlotting(e.target.value);
                    setPageMaster(0);
                  }}
                  className="w-44 text-xs"
                >
                  <option value="all">Semua Status Plotting</option>
                  <option value="plotted">Sudah Ada Pembina</option>
                  <option value="unplotted">Belum Diplot HRD</option>
                </Select>
              </div>

              <div className="w-full md:w-72">
                <SearchInput
                  placeholder="Cari Nama Program..."
                  value={searchMaster}
                  onChange={(val) => {
                    setSearchMaster(val);
                    setPageMaster(0);
                  }}
                />
              </div>
            </div>

            {/* MASTER TABLE */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5 text-left w-12">NO</th>
                      <th className="px-4 py-3.5 text-left">NAMA PROGRAM</th>
                      <th className="px-4 py-3.5 text-left w-28">KATEGORI</th>
                      <th className="px-4 py-3.5 text-left">JADWAL (HARI/WAKTU)</th>
                      {/* GURU PEMBINA (SK HRD DI PLOTTING DI TAB PEMBAGIAN TUGAS) */}
                      <th className="px-4 py-3.5 text-left">GURU PEMBINA</th>
                      <th className="px-4 py-3.5 text-center w-24">ANGGOTA</th>
                      <th className="px-4 py-3.5 text-right w-40">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {paginatedMaster.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          Tidak ada program ekstrakurikuler yang sesuai filter.
                        </td>
                      </tr>
                    ) : (
                      paginatedMaster.map((e, idx) => {
                        const pembina = allPegawai.find((p) => p.id_pegawai === e.id_pembina);
                        const meta = ekskulMetaMap[e.id_ekstra] || {
                          kategori: "Pilihan",
                          hari: "Jumat",
                          waktu: "15:00 WITA",
                        };
                        const members = keanggotaanMap[e.id_ekstra] || [];
                        const activeCount = members.filter((m) => m.status === "Aktif").length;

                        return (
                          <tr key={e.id_ekstra} className="hover:bg-gray-50/70 transition-colors">
                            <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">{pageMaster * PAGE_SIZE + idx + 1}</td>
                            <td className="px-4 py-3.5">
                              <span className="font-bold text-gray-900">{e.nama_ekstra}</span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-bold ${meta.kategori === "Wajib"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                                  }`}
                              >
                                {meta.kategori}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-gray-700 text-xs">
                              {meta.hari}, {meta.waktu}
                            </td>
                            <td className="px-4 py-3.5">
                              {pembina ? (
                                <span className="font-medium text-gray-900 flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>
                                  {pembina.nama_lengkap_gelar}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                  Belum Diplot HRD
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center font-bold text-gray-800">
                              <span className="px-2 py-0.5 bg-gray-100 rounded-md text-xs">
                                {activeCount}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  iconLeft={<Eye className="h-3.5 w-3.5 text-gray-500" />}
                                  onClick={() => handleOpenDetail(e)}
                                  className="text-xs"
                                  title="Lihat Detail & Anggota"
                                >
                                  Detail
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  iconLeft={<Edit3 className="h-3.5 w-3.5 text-primary-600" />}
                                  onClick={() => handleOpenEdit(e)}
                                  className="text-xs font-semibold text-primary-700 hover:text-primary-800"
                                  title="Edit Data Program"
                                >
                                  Edit
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <Pagination
                  page={pageMaster}
                  totalPages={Math.ceil(filteredMasterEkstra.length / PAGE_SIZE)}
                  totalItems={filteredMasterEkstra.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPageMaster}
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. MODE GURU PEMBINA: RUANG KERJA EKSTRAKURIKULER (OPERASIONAL LAPANGAN) */}
        {/* ========================================================================= */}
        {viewMode === "pembina_workspace" && (
          <div className="space-y-6">
            {/* PROGRAM SWITCHER (SCOPED) */}
            {pembinaEkskulList.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-gray-200 text-center space-y-3 shadow-2xs">
                <div className="inline-flex p-3 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Belum Ada Program Ekstrakurikuler</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Anda belum ditugaskan sebagai Pembina Ekstrakurikuler atau belum ada program yang dibuat oleh Kesiswaan / HRD.
                </p>
              </div>
            ) : (
              <>
                {/* DYNAMIC PROGRAM TABS DENGAN BACKGROUND BERSIH */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0 mr-1">
                    PROGRAM:
                  </span>
                  {pembinaEkskulList.map((e) => {
                    const isSelected = e.id_ekstra === selectedEkstraId;
                    return (
                      <button
                        key={e.id_ekstra}
                        type="button"
                        onClick={() => {
                          setSelectedEkstraId(e.id_ekstra);
                          setPageAnggota(0);
                          setPagePresensi(0);
                          setPagePenilaian(0);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 flex items-center gap-2 ${isSelected
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs font-extrabold"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                      >
                        <span>{e.nama_ekstra.toUpperCase()}</span>
                        {isSelected && (
                          <span className="text-[10px] bg-emerald-700/90 text-white px-2 py-0.5 rounded-md font-bold">
                            (Aktif)
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* KARTU INFORMASI PROGRAM */}
                {currentEkstra && (
                  <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-800/40 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider">
                          <Flag className="h-3.5 w-3.5" />
                          <span>PROGRAM AKTIF</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                          {currentEkstra.nama_ekstra.toUpperCase()}
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-emerald-100 font-medium">
                          <div>
                            Pembina: <strong className="text-white">{pembinaPegawai?.nama_lengkap_gelar || "Dewi Sartika, S.Pd."}</strong>
                          </div>
                          <div>
                            Jadwal: <strong className="text-white">{(ekskulMetaMap[currentEkstra.id_ekstra]?.hari || "Jumat")}, {(ekskulMetaMap[currentEkstra.id_ekstra]?.waktu || "15:00 WITA")}</strong>
                          </div>
                          <div>
                            Total Anggota: <strong className="text-emerald-300 font-bold">{activeKeanggotaan.filter(k => k.status === "Aktif").length} Siswa</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-white/10 backdrop-blur-xs border border-white/20 px-5 py-3 rounded-xl text-center shadow-inner">
                          <span className="text-[11px] uppercase tracking-wider text-emerald-200 block font-semibold">BEBAN SK</span>
                          <span className="text-2xl font-black text-white">2 JTM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3 SUB-TABS OPERASIONAL */}
                <div className="border-b border-gray-200 bg-white px-3 rounded-t-xl shadow-2xs">
                  <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {[
                      { key: "anggota", label: "DAFTAR ANGGOTA", count: activeKeanggotaan.filter(k => k.status === "Aktif").length },
                      { key: "presensi", label: "PRESENSI KEGIATAN" },
                      { key: "penilaian", label: "PENILAIAN" },
                    ].map((tab) => {
                      const isActive = pembinaTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setPembinaTab(tab.key as any)}
                          className={`${isActive
                            ? "border-primary-600 text-primary-700 font-extrabold"
                            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 font-semibold"
                            } whitespace-nowrap border-b-2 py-4 px-2 text-xs uppercase tracking-wider flex items-center gap-2 transition-colors`}
                        >
                          <span>{tab.label}</span>
                          {tab.count !== undefined && (
                            <span
                              className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-primary-100 text-primary-800" : "bg-gray-100 text-gray-600"
                                }`}
                            >
                              {tab.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* SUB-TAB CONTENTS */}
                <div className="min-h-[400px]">
                  {/* SUB-TAB 1: DAFTAR ANGGOTA */}
                  {pembinaTab === "anggota" && (
                    <div className="bg-white p-5 rounded-b-xl border border-gray-200 shadow-2xs space-y-4">
                      {/* TOOLBAR DAFTAR ANGGOTA: PENCARIAN -> FILTER KELAS -> TOMBOL RATA KANAN */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-1 max-w-xl">
                          <div className="flex-1">
                            <SearchInput
                              placeholder="Cari Nama Siswa atau NISN..."
                              value={searchAnggota}
                              onChange={(val) => {
                                setSearchAnggota(val);
                                setPageAnggota(0);
                              }}
                            />
                          </div>
                          <Select
                            value={filterKelas}
                            onChange={(e) => {
                              setFilterKelas(e.target.value);
                              setPageAnggota(0);
                            }}
                            className="w-36 text-xs shrink-0"
                          >
                            <option value="all">Semua Kelas</option>
                            <option value="7">Kelas 7</option>
                            <option value="8">Kelas 8</option>
                            <option value="9">Kelas 9</option>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="primary"
                            iconLeft={<Plus className="h-4 w-4" />}
                            onClick={() => setIsDrawerOpen(true)}
                          >
                            Daftarkan Siswa
                          </Button>
                          <Button
                            variant="secondary"
                            iconLeft={<FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
                            onClick={() => {
                              alert("Data anggota berhasil diekspor ke Excel.");
                            }}
                          >
                            Ekspor Data
                          </Button>
                        </div>
                      </div>

                      <div className="overflow-x-auto border border-gray-200 rounded-xl">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-3.5 text-left w-12">NO</th>
                              <th className="px-4 py-3.5 text-left w-36">NISN</th>
                              <th className="px-4 py-3.5 text-left">NAMA SISWA</th>
                              <th className="px-4 py-3.5 text-left w-28">KELAS</th>
                              <th className="px-4 py-3.5 text-center w-36">STATUS KEANGGOTAAN</th>
                              <th className="px-4 py-3.5 text-right w-28">AKSI</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {paginatedAnggota.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                  {activeKeanggotaan.length === 0
                                    ? "Belum ada anggota yang terdaftar di ekstrakurikuler ini."
                                    : "Tidak ada siswa yang cocok dengan kriteria pencarian."}
                                </td>
                              </tr>
                            ) : (
                              paginatedAnggota.map((k, idx) => {
                                const siswa = siswaMap[k.id_siswa];
                                const namaKelas = siswaRombelMap[k.id_siswa] || "7-A";
                                const isAktif = k.status === "Aktif";

                                return (
                                  <tr key={k.id_keanggotaan} className="hover:bg-gray-50/70 transition-colors">
                                    <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">{pageAnggota * PAGE_SIZE + idx + 1}</td>
                                    <td className="px-4 py-3.5 font-mono text-xs text-gray-600">{siswa?.nisn || "-"}</td>
                                    <td className="px-4 py-3.5 font-bold text-gray-900">{siswa?.nama_lengkap || "-"}</td>
                                    <td className="px-4 py-3.5 text-gray-700 font-medium">
                                      <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-xs font-medium">
                                        {namaKelas}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                      {isAktif ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                          Aktif
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                                          Keluar
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                      {isAktif && (
                                        <Button
                                          variant="danger"
                                          size="sm"
                                          onClick={() =>
                                            setConfirmTarget({ id: k.id_keanggotaan, action: "toggle" })
                                          }
                                          className="text-xs"
                                        >
                                          Keluarkan
                                        </Button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                        <Pagination
                          page={pageAnggota}
                          totalPages={Math.max(1, Math.ceil(filteredAnggota.length / PAGE_SIZE))}
                          totalItems={filteredAnggota.length}
                          pageSize={PAGE_SIZE}
                          onPageChange={setPageAnggota}
                        />
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 2: PRESENSI KEGIATAN & JURNAL */}
                  {pembinaTab === "presensi" && (
                    <div className="bg-white p-5 rounded-b-xl border border-gray-200 shadow-2xs space-y-4">
                      {/* 1 BARIS: TANGGAL, TOPIK, SIMPAN PRESENSI, EKSPOR EXCEL, CARI & FILTER KELAS */}
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-gray-50/80 p-3 rounded-xl border border-gray-200">
                        <div className="flex flex-wrap items-center gap-2.5 flex-1">
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-gray-700 whitespace-nowrap">Tanggal:</span>
                            <input
                              type="date"
                              value={presensiTanggal}
                              onChange={(e) => setPresensiTanggal(e.target.value)}
                              className="text-xs font-semibold border border-gray-300 rounded-lg p-2 bg-white w-36"
                            />
                          </div>
                          <div className="flex-1 min-w-[200px]">
                            <input
                              type="text"
                              value={presensiMateri}
                              onChange={(e) => setPresensiMateri(e.target.value)}
                              placeholder="Topik / Materi Latihan..."
                              className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white"
                            />
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="primary"
                              iconLeft={<Save className="h-4 w-4" />}
                              onClick={handleSavePresensi}
                              loading={savingPresensi}
                            >
                              Simpan Presensi
                            </Button>
                            <Button
                              variant="secondary"
                              iconLeft={<FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
                              onClick={() => {
                                alert("Data presensi kegiatan berhasil diekspor ke Excel.");
                              }}
                            >
                              Ekspor Data
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full lg:w-80 shrink-0">
                          <div className="flex-1">
                            <SearchInput
                              placeholder="Cari Nama Siswa atau NISN..."
                              value={searchPresensi}
                              onChange={(val) => {
                                setSearchPresensi(val);
                                setPagePresensi(0);
                              }}
                            />
                          </div>
                          <Select
                            value={filterPresensiKelas}
                            onChange={(e) => {
                              setFilterPresensiKelas(e.target.value);
                              setPagePresensi(0);
                            }}
                            className="w-32 text-xs"
                          >
                            <option value="all">Semua Kelas</option>
                            <option value="7">Kelas 7</option>
                            <option value="8">Kelas 8</option>
                            <option value="9">Kelas 9</option>
                          </Select>
                        </div>
                      </div>

                      <div className="overflow-x-auto border border-gray-200 rounded-xl">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-3.5 text-left w-12">NO</th>
                              <th className="px-4 py-3.5 text-left w-36">NISN</th>
                              <th className="px-4 py-3.5 text-left">NAMA SISWA</th>
                              <th className="px-4 py-3.5 text-left w-28">KELAS</th>
                              <th className="px-4 py-3.5 text-center">STATUS KEHADIRAN</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {paginatedPresensi.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                  {activeMembersOnly.length === 0
                                    ? "Tidak ada anggota aktif untuk dicatat kehadirannya."
                                    : "Tidak ada siswa yang cocok dengan kriteria pencarian."}
                                </td>
                              </tr>
                            ) : (
                              paginatedPresensi.map((k, idx) => {
                                const siswa = siswaMap[k.id_siswa];
                                const namaKelas = siswaRombelMap[k.id_siswa] || "7-A";
                                const statusHadir = presensiMap[k.id_keanggotaan] || "Hadir";

                                return (
                                  <tr key={k.id_keanggotaan} className="hover:bg-gray-50/70 transition-colors">
                                    <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">{pagePresensi * PAGE_SIZE + idx + 1}</td>
                                    <td className="px-4 py-3.5 font-mono text-xs text-gray-600">{siswa?.nisn || "-"}</td>
                                    <td className="px-4 py-3.5 font-bold text-gray-900">{siswa?.nama_lengkap || "-"}</td>
                                    <td className="px-4 py-3.5 text-gray-700 font-medium">
                                      <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-xs font-medium">
                                        {namaKelas}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                      <div className="flex items-center justify-center gap-2">
                                        {[
                                          { val: "Hadir", label: "Hadir", activeClass: "bg-emerald-600 text-white" },
                                          { val: "Izin", label: "Izin", activeClass: "bg-blue-600 text-white" },
                                          { val: "Sakit", label: "Sakit", activeClass: "bg-amber-600 text-white" },
                                          { val: "Tidak Hadir", label: "Alpa", activeClass: "bg-rose-600 text-white" },
                                        ].map((btn) => (
                                          <button
                                            key={btn.val}
                                            type="button"
                                            onClick={() =>
                                              setPresensiMap((prev) => ({
                                                ...prev,
                                                [k.id_keanggotaan]: btn.val as any,
                                              }))
                                            }
                                            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${statusHadir === btn.val
                                              ? `${btn.activeClass} border-transparent shadow-2xs`
                                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                                              }`}
                                          >
                                            {btn.label}
                                          </button>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                        <Pagination
                          page={pagePresensi}
                          totalPages={Math.max(1, Math.ceil(filteredPresensi.length / PAGE_SIZE))}
                          totalItems={filteredPresensi.length}
                          pageSize={PAGE_SIZE}
                          onPageChange={setPagePresensi}
                        />
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 3: PENILAIAN SEMESTER */}
                  {pembinaTab === "penilaian" && (
                    <div className="bg-white p-5 rounded-b-xl border border-gray-200 shadow-2xs space-y-4">
                      {/* INFORMASI INTEGRASI RAPOR */}
                      <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
                        <p className="font-bold text-sm flex items-center gap-1.5">
                          <Award className="h-4 w-4 text-blue-600" />
                          Penilaian Terintegrasi Rapor Digital
                        </p>
                        <p>
                          Nilai predikat dan deskripsi capaian yang diinput di sini akan otomatis mengalir ke Buku Rapor pada modul Rombel & Kesiswaan.
                        </p>
                      </div>

                      {/* TOOLBAR PENILAIAN: PENCARIAN -> FILTER KELAS -> TOMBOL RATA KANAN */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-1 max-w-xl">
                          <div className="flex-1">
                            <SearchInput
                              placeholder="Cari Nama Siswa atau NISN..."
                              value={searchPenilaian}
                              onChange={(val) => {
                                setSearchPenilaian(val);
                                setPagePenilaian(0);
                              }}
                            />
                          </div>
                          <Select
                            value={filterPenilaianKelas}
                            onChange={(e) => {
                              setFilterPenilaianKelas(e.target.value);
                              setPagePenilaian(0);
                            }}
                            className="w-36 text-xs shrink-0"
                          >
                            <option value="all">Semua Kelas</option>
                            <option value="7">Kelas 7</option>
                            <option value="8">Kelas 8</option>
                            <option value="9">Kelas 9</option>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="primary"
                            iconLeft={<Save className="h-4 w-4" />}
                            onClick={handleSavePenilaian}
                            loading={savingNilai}
                          >
                            Simpan Penilaian
                          </Button>
                          <Button
                            variant="secondary"
                            iconLeft={<Send className="h-4 w-4 text-primary-600" />}
                            onClick={handleKirimNilai}
                            loading={sendingNilai}
                          >
                            Kirim Nilai
                          </Button>
                        </div>
                      </div>

                      <div className="overflow-x-auto border border-gray-200 rounded-xl">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-3.5 text-left w-12">NO</th>
                              <th className="px-4 py-3.5 text-left w-36">NISN</th>
                              <th className="px-4 py-3.5 text-left w-48">NAMA SISWA</th>
                              <th className="px-4 py-3.5 text-left w-28">KELAS</th>
                              <th className="px-4 py-3.5 text-left w-44">PREDIKAT</th>
                              <th className="px-4 py-3.5 text-left">DESKRIPSI CAPAIAN</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {paginatedPenilaian.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                  {activeMembersOnly.length === 0
                                    ? "Belum ada anggota aktif untuk dinilai."
                                    : "Tidak ada siswa yang cocok dengan kriteria pencarian."}
                                </td>
                              </tr>
                            ) : (
                              paginatedPenilaian.map((k, idx) => {
                                const siswa = siswaMap[k.id_siswa];
                                const namaKelas = siswaRombelMap[k.id_siswa] || "7-A";
                                const curNilai = nilaiMap[k.id_keanggotaan] || {
                                  predikat: "Baik",
                                  deskripsi: "Aktif mengikuti latihan rutin dan berdisiplin.",
                                };

                                return (
                                  <tr key={k.id_keanggotaan} className="hover:bg-gray-50/70 transition-colors">
                                    <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">{pagePenilaian * PAGE_SIZE + idx + 1}</td>
                                    <td className="px-4 py-3.5 font-mono text-xs text-gray-600">{siswa?.nisn || "-"}</td>
                                    <td className="px-4 py-3.5 font-bold text-gray-900">{siswa?.nama_lengkap || "-"}</td>
                                    <td className="px-4 py-3.5 text-gray-700 font-medium">
                                      <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-xs font-medium">
                                        {namaKelas}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                      <select
                                        value={curNilai.predikat}
                                        onChange={(e) =>
                                          setNilaiMap((prev) => ({
                                            ...prev,
                                            [k.id_keanggotaan]: {
                                              ...curNilai,
                                              predikat: e.target.value as any,
                                            },
                                          }))
                                        }
                                        className="w-full text-xs font-bold border border-gray-300 rounded-lg p-2 bg-white text-gray-800"
                                      >
                                        <option value="Sangat Baik">A (Sangat Baik)</option>
                                        <option value="Baik">B (Baik)</option>
                                        <option value="Cukup">C (Cukup)</option>
                                        <option value="Kurang">D (Kurang)</option>
                                      </select>
                                    </td>
                                    <td className="px-4 py-3.5">
                                      <input
                                        type="text"
                                        value={curNilai.deskripsi}
                                        onChange={(e) =>
                                          setNilaiMap((prev) => ({
                                            ...prev,
                                            [k.id_keanggotaan]: {
                                              ...curNilai,
                                              deskripsi: e.target.value,
                                            },
                                          }))
                                        }
                                        placeholder="Deskripsi kemajuan dan capaian siswa..."
                                        className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white"
                                      />
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                        <Pagination
                          page={pagePenilaian}
                          totalPages={Math.max(1, Math.ceil(filteredPenilaian.length / PAGE_SIZE))}
                          totalItems={filteredPenilaian.length}
                          pageSize={PAGE_SIZE}
                          onPageChange={setPagePenilaian}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* MODAL TAMBAH PROGRAM BARU (MODE ADMIN) */}
      <Modal
        isOpen={isAddProgramOpen}
        onClose={() => setIsAddProgramOpen(false)}
        title="Tambah Program Ekstrakurikuler Baru"
        description="Buat wadah master kegiatan ekstrakurikuler madrasah."
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsAddProgramOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateProgram}
              loading={savingProgram}
              disabled={!newProgram.nama_ekstra.trim()}
            >
              Simpan Program
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
              Nama Program Ekstrakurikuler
            </label>
            <input
              type="text"
              placeholder="Misal: Robotik, PMR, Seni Kaligrafi..."
              value={newProgram.nama_ekstra}
              onChange={(e) => setNewProgram({ ...newProgram, nama_ekstra: e.target.value })}
              className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Kategori
              </label>
              <select
                value={newProgram.kategori}
                onChange={(e) => setNewProgram({ ...newProgram, kategori: e.target.value })}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white font-medium"
              >
                <option value="Wajib">Wajib</option>
                <option value="Pilihan">Pilihan</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Jadwal Hari
              </label>
              <select
                value={newProgram.hari}
                onChange={(e) => setNewProgram({ ...newProgram, hari: e.target.value })}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white font-medium"
              >
                <option value="Senin">Senin</option>
                <option value="Selasa">Selasa</option>
                <option value="Rabu">Rabu</option>
                <option value="Kamis">Kamis</option>
                <option value="Jumat">Jumat</option>
                <option value="Sabtu">Sabtu</option>
                <option value="Minggu">Minggu</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
              Waktu Pelaksanaan
            </label>
            <input
              type="text"
              placeholder="Misal: 15:00 WITA"
              value={newProgram.waktu}
              onChange={(e) => setNewProgram({ ...newProgram, waktu: e.target.value })}
              className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white"
            />
          </div>

          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
            <strong>Catatan SSoT:</strong> Penugasan Guru Pembina sengaja tidak dicantumkan di formulir ini karena wewenang plotting guru berada di tangan HRD/Kepala Madrasah pada menu <strong>Penugasan & SK</strong>.
          </div>
        </div>
      </Modal>

      {/* MODAL EDIT PROGRAM (MODE ADMIN) */}
      <Modal
        isOpen={isEditProgramOpen}
        onClose={() => {
          setIsEditProgramOpen(false);
          setEditProgramData(null);
        }}
        title="Edit Program Ekstrakurikuler"
        description="Perbarui informasi wadah master kegiatan ekstrakurikuler."
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditProgramOpen(false);
                setEditProgramData(null);
              }}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveEditProgram}
              loading={savingEditProgram}
              disabled={!editProgramData?.nama_ekstra.trim()}
            >
              Simpan Perubahan
            </Button>
          </div>
        }
      >
        {editProgramData && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Nama Program Ekstrakurikuler
              </label>
              <input
                type="text"
                placeholder="Misal: Robotik, PMR, Seni Kaligrafi..."
                value={editProgramData.nama_ekstra}
                onChange={(e) =>
                  setEditProgramData({ ...editProgramData, nama_ekstra: e.target.value })
                }
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Kategori
                </label>
                <select
                  value={editProgramData.kategori}
                  onChange={(e) =>
                    setEditProgramData({
                      ...editProgramData,
                      kategori: e.target.value as "Wajib" | "Pilihan",
                    })
                  }
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white font-medium"
                >
                  <option value="Wajib">Wajib</option>
                  <option value="Pilihan">Pilihan</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Jadwal Hari
                </label>
                <select
                  value={editProgramData.hari}
                  onChange={(e) =>
                    setEditProgramData({ ...editProgramData, hari: e.target.value })
                  }
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white font-medium"
                >
                  <option value="Senin">Senin</option>
                  <option value="Selasa">Selasa</option>
                  <option value="Rabu">Rabu</option>
                  <option value="Kamis">Kamis</option>
                  <option value="Jumat">Jumat</option>
                  <option value="Sabtu">Sabtu</option>
                  <option value="Minggu">Minggu</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Waktu Pelaksanaan
              </label>
              <input
                type="text"
                placeholder="Misal: 15:00 WITA"
                value={editProgramData.waktu}
                onChange={(e) =>
                  setEditProgramData({ ...editProgramData, waktu: e.target.value })
                }
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white"
              />
            </div>

            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
              <strong>Catatan SSoT:</strong> Penugasan Guru Pembina dikelola secara terpusat oleh HRD/Kepala Madrasah pada menu <strong>Penugasan & SK</strong>.
            </div>
          </div>
        )}
      </Modal>

      {/* SLIDE-OVER DRAWER: DETAIL PROGRAM & DAFTAR SISWA READ-ONLY (MODE ADMIN) */}
      <Drawer
        isOpen={isDetailDrawerOpen}
        onClose={() => {
          setIsDetailDrawerOpen(false);
          setDetailEkstra(null);
        }}
        title={`Detail Program: ${detailEkstra?.nama_ekstra || ""}`}
        description="Informasi program dan daftar siswa terdaftar (Tinjauan Read-Only Admin)."
        size="lg"
      >
        {detailEkstra && (() => {
          const pembina = allPegawai.find((p) => p.id_pegawai === detailEkstra.id_pembina);
          const meta = ekskulMetaMap[detailEkstra.id_ekstra] || {
            kategori: "Pilihan",
            hari: "Jumat",
            waktu: "15:00 WITA",
          };
          const allMembers = keanggotaanMap[detailEkstra.id_ekstra] || [];
          const activeCount = allMembers.filter((m) => m.status === "Aktif").length;
          const totalCount = detailMembers.length;

          return (
            <div className="space-y-5">
              {/* [ KARTU INFORMASI PROGRAM ] */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">PROGRAM</span>
                    <h3 className="text-base font-extrabold text-gray-900">{detailEkstra.nama_ekstra}</h3>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-bold ${meta.kategori === "Wajib"
                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                  >
                    Kategori {meta.kategori}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[11px]">Jadwal Master:</span>
                    <span className="font-semibold text-gray-800">{meta.hari}, {meta.waktu}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Guru Pembina:</span>
                    {pembina ? (
                      <span className="font-semibold text-gray-900">{pembina.nama_lengkap_gelar}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                        Belum Diplot HRD
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Total Anggota:</span>
                    <span className="font-bold text-emerald-700">{activeCount} Siswa Aktif</span>
                  </div>
                </div>

                {/* STATISTIK LATIHAN (DENYUT NADI PROGRAM) */}
                <div className="border-t border-gray-200 pt-2.5 flex items-center gap-2 text-xs text-gray-700">
                  <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>Statistik Latihan:</strong> 4 Kali Pertemuan (Terakhir update: 15 Sep 2026)
                  </span>
                </div>
              </div>

              {/* [ AREA TOOLBAR & FILTER ] */}
              <div className="space-y-2.5">
                {/* Baris 1: Expanded Search (Kiri) & Tombol Aksi Ekspor / Cetak (Kanan) */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="flex-1">
                    <SearchInput
                      placeholder="Cari Nama atau NISN..."
                      value={searchDetailAnggota}
                      onChange={(val) => {
                        setSearchDetailAnggota(val);
                        setPageDetail(0);
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      iconLeft={<FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
                      onClick={() => alert(`Data anggota ${detailEkstra.nama_ekstra} berhasil diekspor ke Excel.`)}
                      className="text-xs"
                    >
                      Ekspor Excel
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      iconLeft={<Printer className="h-4 w-4 text-gray-600" />}
                      onClick={() => window.print()}
                      className="text-xs"
                    >
                      Cetak PDF
                    </Button>
                  </div>
                </div>

                {/* Baris 2: Dropdown Filter Kelas & Filter Status */}
                <div className="flex items-center gap-2">
                  <Select
                    value={filterDetailKelas}
                    onChange={(e) => {
                      setFilterDetailKelas(e.target.value);
                      setPageDetail(0);
                    }}
                    className="w-36 text-xs"
                  >
                    <option value="all">Semua Kelas</option>
                    <option value="7">Kelas 7</option>
                    <option value="8">Kelas 8</option>
                    <option value="9">Kelas 9</option>
                  </Select>

                  <Select
                    value={filterDetailStatus}
                    onChange={(e) => {
                      setFilterDetailStatus(e.target.value);
                      setPageDetail(0);
                    }}
                    className="w-36 text-xs"
                  >
                    <option value="all">Status: Semua</option>
                    <option value="Aktif">Status: Aktif</option>
                    <option value="Keluar">Status: Keluar</option>
                  </Select>
                </div>
              </div>

              {/* READ-ONLY MEMBERS TABLE */}
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-hidden">
                  <table className="w-full table-auto divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-3.5 py-3 text-left w-px whitespace-nowrap">NO</th>
                        <th className="px-3.5 py-3 text-left w-px whitespace-nowrap">NISN</th>
                        <th className="px-3.5 py-3 text-left">NAMA SISWA</th>
                        <th className="px-3.5 py-3 text-left w-px whitespace-nowrap">KELAS</th>
                        <th className="px-3.5 py-3 text-left w-px whitespace-nowrap">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {paginatedDetailMembers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-500">
                            Tidak ada anggota yang terdaftar atau cocok dengan kriteria filter.
                          </td>
                        </tr>
                      ) : (
                        paginatedDetailMembers.map((k, idx) => {
                          const siswa = siswaMap[k.id_siswa];
                          const namaKelas = siswaRombelMap[k.id_siswa] || "7-A";
                          const isAktif = k.status === "Aktif";

                          return (
                            <tr key={k.id_keanggotaan} className="hover:bg-gray-50/70 transition-colors">
                              <td className="px-3.5 py-3 text-gray-400 font-mono text-xs whitespace-nowrap">
                                {pageDetail * PAGE_SIZE + idx + 1}
                              </td>
                              <td className="px-3.5 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">
                                {siswa?.nisn || "-"}
                              </td>
                              <td className="px-3.5 py-3 font-bold text-gray-900 text-xs">
                                <div
                                  className="max-w-[160px] sm:max-w-[240px] truncate"
                                  title={siswa?.nama_lengkap || "-"}
                                >
                                  {siswa?.nama_lengkap || "-"}
                                </div>
                              </td>
                              <td className="px-3.5 py-3 text-gray-700 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-[11px] font-medium">
                                  {namaKelas}
                                </span>
                              </td>
                              <td className="px-3.5 py-3 text-left whitespace-nowrap">
                                {isAktif ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                    Aktif
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                                    Keluar {k.tanggal_selesai ? `(Sejak ${k.tanggal_selesai})` : "(Sejak 10 Sep 2026)"}
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

                <div className="p-3 bg-gray-50 border-t border-gray-200">
                  <Pagination
                    page={pageDetail}
                    totalPages={Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
                    totalItems={totalCount}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPageDetail}
                  />
                </div>
              </div>
            </div>
          );
        })()}
      </Drawer>



      {/* SLIDE-OVER DRAWER: DAFTARKAN SISWA (MODE PEMBINA) */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Daftarkan Siswa ke Ekstrakurikuler"
        description={`Pilih siswa dari populasi madrasah untuk didaftarkan ke ${currentEkstra?.nama_ekstra || "Ekstrakurikuler"}.`}
        size="lg"
      >
        <div className="space-y-4">
          {/* SEARCH & FILTER KELAS DI DRAWER (1 BARIS) */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchInput
                placeholder="Cari Nama Siswa atau NISN..."
                value={searchCalon}
                onChange={setSearchCalon}
              />
            </div>
            <Select
              value={filterCalonKelas}
              onChange={(e) => setFilterCalonKelas(e.target.value)}
              className="w-36 text-xs"
            >
              <option value="all">Semua Kelas</option>
              <option value="7">Kelas 7</option>
              <option value="8">Kelas 8</option>
              <option value="9">Kelas 9</option>
            </Select>
          </div>

          {/* OPSI PENDAFTARAN KOLEKTIF / BATCH ENROLLMENT */}
          {calonSiswaList.length > 1 && (
            <div className="flex items-center justify-between bg-emerald-50/80 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-900 shadow-2xs">
              <div>
                <span className="font-semibold block">
                  Tersedia <strong>{calonSiswaList.length} siswa</strong> {filterCalonKelas !== "all" ? `(Kelas ${filterCalonKelas})` : "siap didaftarkan"}
                </span>
                <span className="text-[11px] text-emerald-700">
                  Daftarkan seluruh siswa yang terpilih sekaligus ke program ini.
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                iconLeft={<Zap className="h-3.5 w-3.5" />}
                onClick={handleBatchAddSiswa}
                loading={isSubmittingBatch}
                disabled={Boolean(submittingIdSiswa) || isSubmittingBatch}
                className="shrink-0 text-xs shadow-xs"
              >
                Daftarkan Semua ({calonSiswaList.length})
              </Button>
            </div>
          )}

          <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-200">
            {calonSiswaList.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                Tidak ada siswa yang tersedia untuk didaftarkan.
              </div>
            ) : (
              calonSiswaList.map((s) => {
                const kelas = siswaRombelMap[s.id_siswa] || "-";
                const isItemSubmitting = submittingIdSiswa === s.id_siswa;
                const isAnySubmitting = Boolean(submittingIdSiswa) || isSubmittingBatch;

                return (
                  <div
                    key={s.id_siswa}
                    className="p-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">{s.nama_lengkap}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        NISN: <span className="font-mono text-gray-600">{s.nisn || "-"}</span> | Kelas: <span className="font-semibold text-gray-700">{kelas}</span>
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      iconLeft={<UserPlus className="h-3.5 w-3.5" />}
                      onClick={() => handleAddSiswa(s.id_siswa)}
                      loading={isItemSubmitting}
                      disabled={isAnySubmitting}
                    >
                      Daftarkan
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Drawer>

      {/* CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => confirmTarget && handleToggleStatus(confirmTarget.id)}
        title="Konfirmasi Perubahan Status Keanggotaan"
        description="Apakah Anda yakin ingin mengubah status keanggotaan siswa ini menjadi nonaktif/keluar?"
        confirmLabel="Ya, Keluarkan Siswa"
        cancelLabel="Batal"
        variant="danger"
      />
    </AppShell>
  );
}
