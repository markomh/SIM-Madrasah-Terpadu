import type {
  AbsensiSiswa,
  AnggotaRombel,
  AuditLog,
  HariLibur,
  JadwalPelajaran,
  MataPelajaran,
  Pegawai,
  PemetaanKenaikan,
  RiwayatMutasi,
  Rombel,
  Siswa,
  Surat,
  TahunAjaran,
  TingkatPendidikan,
  SesiTatapMuka,
  IzinGuru,
  Ekstrakurikuler,
  KeanggotaanEkstra,
  AbsensiEkstra,
  PenugasanJabatan,
  ProfilMadrasah,
  TemplateSurat,
  CatatanBk,
  KomponenNilai,
  NilaiSiswa,
  Madrasah,
} from "@/types";

export const STORAGE_KEY = "sim-madrasah-demo-store-v6";
export const SIMULATE_ERROR_KEY = "sim-madrasah-simulate-error";

export type DemoStore = {
  madrasah: Madrasah[];
  tahunAjaran: TahunAjaran[];
  tingkat: TingkatPendidikan[];
  mapel: MataPelajaran[];
  hariLibur: HariLibur[];
  pegawai: Pegawai[];
  rombel: Rombel[];
  siswa: Siswa[];
  anggotaRombel: AnggotaRombel[];
  pemetaanKenaikan: PemetaanKenaikan[];
  mutasi: RiwayatMutasi[];
  /** Maps id_mutasi → id_rombel_tujuan for pending mutasi masuk (demo-only helper). */
  pendingMutasiRombel: Record<string, string>;
  absensi: AbsensiSiswa[];
  jadwal: JadwalPelajaran[];
  surat: Surat[];
  auditLog: AuditLog[];
  sesiTatapMuka: SesiTatapMuka[];
  izinGuru: IzinGuru[];
  pengaturan: {
    ambangToleransiTerlambatMenit: number;
    ambangFlagDigantikanMendadak: number;
  };
  ekstrakurikuler: Ekstrakurikuler[];
  keanggotaanEkstra: KeanggotaanEkstra[];
  absensiEkstra: AbsensiEkstra[];
  penugasanJabatan: PenugasanJabatan[];
  profilMadrasah: ProfilMadrasah;
  templateSurat: TemplateSurat[];
  catatanBk: CatatanBk[];
  komponenNilai: KomponenNilai[];
  nilaiSiswa: NilaiSiswa[];
};

export function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function maskNik(nik: string | null | undefined): string {
  if (!nik) return "—";
  const str = String(nik);
  if (str.length < 6) return str;
  return `${str.slice(0, 2)}${"*".repeat(Math.max(0, str.length - 4))}${str.slice(-2)}`;
}

export async function simulateLatency(): Promise<void> {
  const ms = 200 + Math.floor(Math.random() * 400);
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function maybeThrowSimulatedError(): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SIMULATE_ERROR_KEY) === "1") {
    throw new Error("Simulasi error layanan mock. Nonaktifkan flag di Pengaturan Akun.");
  }
}

function buildSeed(): DemoStore {
  const madrasah: Madrasah[] = [
    {
      id_madrasah: "md_1",
      nama_madrasah: "MTs Terpadu Nusantara",
      npsn: "10892345",
      alamat: "Jl. Pendidikan No. 123, Kompleks Islamic Center",
      id_desa: "desa_1",
      status_aktif: true,
    },
  ];

  const tahunAjaran: TahunAjaran[] = [
    { id_tahun: "ta_2526", id_madrasah: "md_1", nama_tahun: "2025/2026", status_aktif: false },
    { id_tahun: "ta_2627", id_madrasah: "md_1", nama_tahun: "2026/2027", status_aktif: true },
  ];

  const tingkat: TingkatPendidikan[] = [
    { id_tingkat: "t_7", nama_tingkat: "Kelas 7", urutan: 7 },
    { id_tingkat: "t_8", nama_tingkat: "Kelas 8", urutan: 8 },
    { id_tingkat: "t_9", nama_tingkat: "Kelas 9", urutan: 9 },
  ];

  const mapel: MataPelajaran[] = [
    { id_mapel: "mp_pai", id_madrasah: "md_1", kode_mapel: "PAI", nama_mapel: "Pendidikan Agama Islam", kelompok_mapel: "Agama" },
    { id_mapel: "mp_mtk", id_madrasah: "md_1", kode_mapel: "MTK", nama_mapel: "Matematika", kelompok_mapel: "Umum" },
    { id_mapel: "mp_bind", id_madrasah: "md_1", kode_mapel: "BIN", nama_mapel: "Bahasa Indonesia", kelompok_mapel: "Umum" },
    { id_mapel: "mp_bing", id_madrasah: "md_1", kode_mapel: "BIG", nama_mapel: "Bahasa Inggris", kelompok_mapel: "Umum" },
    { id_mapel: "mp_ipa", id_madrasah: "md_1", kode_mapel: "IPA", nama_mapel: "Ilmu Pengetahuan Alam", kelompok_mapel: "Umum" },
    { id_mapel: "mp_qur", id_madrasah: "md_1", kode_mapel: "QUR", nama_mapel: "Al-Qur'an Hadis", kelompok_mapel: "Agama" },
    { id_mapel: "mp_pjok", id_madrasah: "md_1", kode_mapel: "PJK", nama_mapel: "PJOK", kelompok_mapel: "Umum" },
  ];

  const pegawai: Pegawai[] = [
    { id_pegawai: "pg_kepala", id_madrasah: "md_1", nik: "3201010101010010", nip: "197501012000031001", npk: null, nama_lengkap_gelar: "Drs. H. Ahmad Dahlan, M.Pd.", status_kepegawaian: "PNS", tugas_utama: "Guru", alamat_detail: "Jl. Merdeka No.1", id_desa: "desa_1", mapel_sertifikasi: [] },
    { id_pegawai: "pg_admin", id_madrasah: "md_1", nik: "3201010101010020", nip: "199002022015011002", npk: null, nama_lengkap_gelar: "Rizky Pratama, S.Kom.", status_kepegawaian: "PNS", tugas_utama: "Tendik", alamat_detail: "Jl. Sudirman No.2", id_desa: "desa_2", mapel_sertifikasi: [] },
    { id_pegawai: "pg_ops", id_madrasah: "md_1", nik: "3201010101010030", nip: null, npk: "NPK-003", nama_lengkap_gelar: "Siti Nurhaliza, A.Md.", status_kepegawaian: "Non-PNS", tugas_utama: "Tendik", alamat_detail: "Jl. Pahlawan No.3", id_desa: "desa_3", mapel_sertifikasi: [] },
    { id_pegawai: "pg_wali_a", id_madrasah: "md_1", nik: "3201010101010060", nip: "198503032010012005", npk: null, nama_lengkap_gelar: "Dewi Sartika, S.Pd.", status_kepegawaian: "PNS", tugas_utama: "Guru", alamat_detail: "Jl. Mawar No.4", id_desa: "desa_4", mapel_sertifikasi: ["mp_qur"] },
    { id_pegawai: "pg_bk", id_madrasah: "md_1", nik: "3201010101010040", nip: "198805052012012003", npk: null, nama_lengkap_gelar: "Nurul Hidayah, S.Psi.", status_kepegawaian: "PNS", tugas_utama: "Guru", alamat_detail: "Jl. Diponegoro No.11", id_desa: "desa_3", mapel_sertifikasi: [] },
    { id_pegawai: "019153a0-f8f2-777b-bb66-6b211a7e28a5", id_madrasah: "md_1", nik: "3201010101010001", nip: "19800101200501001", npk: null, nama_lengkap_gelar: "Dr. H. Syaiful Rahman, M.Pd.", status_kepegawaian: "PNS", tugas_utama: "Guru", alamat_detail: "Jl. Demo Terpadu", id_desa: "desa_1", mapel_sertifikasi: ["mp_mtk"] },
    { id_pegawai: "pg_guru_polos", id_madrasah: "md_1", nik: "3201010101010050", nip: "199208082019011004", npk: null, nama_lengkap_gelar: "Bambang Sudarsono, S.Pd.", status_kepegawaian: "PNS", tugas_utama: "Guru", alamat_detail: "Jl. Polos No.13", id_desa: "desa_4", mapel_sertifikasi: ["mp_pjok"] },
    { id_pegawai: "019153a0-f8f2-777b-bb66-6b211a7e28a9", id_madrasah: "md_1", nik: "3175010901920009", nip: "199209092018012009", npk: null, nama_lengkap_gelar: "Maya Anggraini, S.Kom.", status_kepegawaian: "PNS", tugas_utama: "Guru", alamat_detail: "Jl. Veteran No.12", id_desa: "desa_1", mapel_sertifikasi: [] },
  ];

  const rombel: Rombel[] = [
    { id_rombel: "rb_7a", id_madrasah: "md_1", nama_rombel: "7-A", id_tingkat: "t_7", id_tahun: "ta_2627", id_wali_kelas: "019153a0-f8f2-777b-bb66-6b211a7e28a5" },
    { id_rombel: "rb_7b", id_madrasah: "md_1", nama_rombel: "7-B", id_tingkat: "t_7", id_tahun: "ta_2627", id_wali_kelas: "pg_wali_a" },
    { id_rombel: "rb_8a", id_madrasah: "md_1", nama_rombel: "8-A", id_tingkat: "t_8", id_tahun: "ta_2627", id_wali_kelas: "pg_wali_a" },
    { id_rombel: "rb_8b", id_madrasah: "md_1", nama_rombel: "8-B", id_tingkat: "t_8", id_tahun: "ta_2627", id_wali_kelas: "pg_wali_a" },
    { id_rombel: "rb_9a", id_madrasah: "md_1", nama_rombel: "9-A", id_tingkat: "t_9", id_tahun: "ta_2627", id_wali_kelas: "pg_wali_a" },
    { id_rombel: "rb_9b", id_madrasah: "md_1", nama_rombel: "9-B", id_tingkat: "t_9", id_tahun: "ta_2627", id_wali_kelas: "pg_wali_a" },
  ];

  const firstNames = [
    "Dania", "Ahmad", "Azzahra", "Farhan", "Siti", "Rafi", "Nadia", "Iqbal", "Putri", "Dimas",
    "Laila", "Fajar", "Hana", "Reza", "Maya", "Yoga", "Citra", "Bima", "Anisa", "Gilang",
    "Zahra", "Aditya", "Nabila", "Kevin", "Salma", "Arif", "Tiara", "Bayu", "Rina", "Eko",
  ];
  const lastNames = [
    "Apriana", "Fauzan", "Putri", "Syah", "Nurhaliza", "Pratama", "Salsabila", "Ramadhan", "Melati", "Wibowo",
    "Hasanah", "Nugraha", "Amelia", "Maulana", "Safitri", "Saputra", "Lestari", "Kusuma", "Rahma", "Permana",
    "Aulia", "Santoso", "Khairunnisa", "Hakim", "Azizah", "Hidayat", "Anggraini", "Firmansyah", "Dewi", "Setiawan",
  ];

  const siswa: Siswa[] = firstNames.map((fn, i) => {
    const jk: "L" | "P" = i % 2 === 0 ? "P" : "L";
    const risk = i % 5 === 0 ? 80 + (i % 15) : i % 3 === 0 ? 55 + (i % 20) : i % 4 === 0 ? 40 + (i % 10) : null;
    return {
      id_siswa: `sw_${String(i + 1).padStart(2, "0")}`,
      id_madrasah: "md_1",
      nik: `3175${String(100000000000 + i).slice(0, 12)}`,
      nisn: `${3000000000 + i * 17}`,
      nama_lengkap: `${fn} ${lastNames[i]}`.toUpperCase(),
      tempat_lahir: i % 3 === 0 ? "Jakarta" : i % 3 === 1 ? "Bogor" : "Depok",
      tanggal_lahir: `20${8 + (i % 5)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`,
      jenis_kelamin: jk,
      agama: "Islam",
      nama_ibu_kandung: `Ibu ${lastNames[i]}`,
      alamat_detail: "Jl. Kebon Raya No. 12",
      id_desa: "desa_1",
      status_siswa: i === 3 ? "Mutasi Keluar" : "Aktif",
      jalur_masuk: i % 9 === 0 ? "Mutasi Masuk" : "PPDB Reguler",
      skor_risiko_ai: risk,
    };
  });

  const rombelIds = ["rb_7a", "rb_7b", "rb_8a", "rb_8b", "rb_9a", "rb_9b"];
  const anggotaRombel: AnggotaRombel[] = siswa
    .filter((s) => s.status_siswa === "Aktif")
    .map((s, i) => ({
      id_anggota: `ar_${s.id_siswa}`,
      id_siswa: s.id_siswa,
      id_rombel: rombelIds[i % rombelIds.length],
      tanggal_mulai: "2026-07-15",
      tanggal_selesai: null,
      status_keanggotaan: "Aktif" as const,
      jenis_perpindahan: s.jalur_masuk === "Mutasi Masuk" ? ("Mutasi Masuk" as const) : ("Awal Masuk" as const),
      status_persetujuan: "Tidak Perlu" as const,
      diajukan_oleh: null,
      disetujui_oleh: null,
      tanggal_persetujuan: null,
    }));

  // Pending lintas-tingkat transfer for demo
  const pendingSiswa = siswa.find((s) => s.id_siswa === "sw_05");
  if (pendingSiswa) {
    anggotaRombel.push({
      id_anggota: "ar_pending_05",
      id_siswa: "sw_05",
      id_rombel: "rb_8a",
      tanggal_mulai: todayIso(),
      tanggal_selesai: null,
      status_keanggotaan: "Aktif",
      jenis_perpindahan: "Kenaikan Tingkat",
      status_persetujuan: "Menunggu Persetujuan",
      diajukan_oleh: "pg_ops",
      disetujui_oleh: null,
      tanggal_persetujuan: null,
    });
  }

  siswa.push({
    id_siswa: "sw_31_pending",
    id_madrasah: "md_1",
    nik: "3175999900000031",
    nisn: "3099990031",
    nama_lengkap: "RAFIQ ALFARIZI",
    tempat_lahir: "Bogor",
    tanggal_lahir: "2010-03-12",
    jenis_kelamin: "L",
    agama: "Islam",
    nama_ibu_kandung: "Ibu Alfarizi",
    alamat_detail: "Gg. Kancil No. 4",
    id_desa: "desa_2",
    status_siswa: "Aktif",
    jalur_masuk: "Mutasi Masuk",
    skor_risiko_ai: null,
  });

  const mutasi: RiwayatMutasi[] = [
    {
      id_mutasi: "mt_01",
      id_siswa: "sw_31_pending",
      jenis_mutasi: "Masuk",
      sekolah_asal: "MTsN 2 Kota Bogor",
      sekolah_tujuan: null,
      tanggal_mutasi: todayIso(),
      no_surat_mutasi: "421.3/012/MT/2026",
      alasan: "Mengikuti orang tua pindah domisili",
      status_persetujuan: "Menunggu Persetujuan",
      diajukan_oleh: "pg_ops",
      disetujui_oleh: null,
      tanggal_persetujuan: null,
      id_tahun: "ta_2627",
    },
    {
      id_mutasi: "mt_02",
      id_siswa: "sw_08",
      jenis_mutasi: "Keluar",
      sekolah_asal: null,
      sekolah_tujuan: "MAN 1 Jakarta",
      tanggal_mutasi: todayIso(),
      no_surat_mutasi: "421.3/088/MK/2026",
      alasan: "Pindah dekat tempat tinggal baru",
      status_persetujuan: "Menunggu Persetujuan",
      diajukan_oleh: "pg_ops",
      disetujui_oleh: null,
      tanggal_persetujuan: null,
      id_tahun: "ta_2627",
    },
  ];

  const pendingMutasiRombel: Record<string, string> = {
    mt_01: "rb_7a",
  };

  const absensi: AbsensiSiswa[] = anggotaRombel
    .filter((a) => a.status_persetujuan !== "Menunggu Persetujuan" && a.tanggal_selesai === null)
    .slice(0, 12)
    .map((a, i) => ({
      id_absensi: `ab_${i + 1}`,
      tanggal: todayIso(),
      id_siswa: a.id_siswa,
      id_rombel: a.id_rombel,
      id_sesi: `st_${(i % 4) + 1}`,
      status: (i % 5 === 0 ? "Izin" : i % 7 === 0 ? "Sakit" : i % 11 === 0 ? "Alpa" : "Hadir") as AbsensiSiswa["status"],
      catatan: i % 5 === 0 ? "Surat orang tua" : null,
    }));

  // Jadwal Pelajaran Lengkap 1 Madrasah (MTs: 7-A, 7-B, 8-A, 8-B, 9-A, 9-B)
  // Durasi 40 Menit / JP, Bebas Bentrok (0 Collision), Audit 24 JTM Sertifikasi Terpenuhi
  const g_syaiful = "019153a0-f8f2-777b-bb66-6b211a7e28a5"; // MTK
  const g_dewi = "pg_wali_a";                                 // QUR, PAI
  const g_maya = "019153a0-f8f2-777b-bb66-6b211a7e28a9";     // BIN, BIG
  const g_bambang = "pg_guru_polos";                          // IPA, PJOK
  const g_ahmad = "pg_kepala";                                // PAI

  const jadwal: JadwalPelajaran[] = [
    // === SENIN ===
    // Jam 1 (07:45 - 08:25)
    { id_jadwal: "jd_mon_1_7a", id_rombel: "rb_7a", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Senin", jam_mulai: "07:45", jam_selesai: "08:25" },
    { id_jadwal: "jd_mon_1_7b", id_rombel: "rb_7b", id_pegawai: g_dewi, id_mapel: "mp_qur", semester: "Ganjil", hari: "Senin", jam_mulai: "07:45", jam_selesai: "08:25" },
    { id_jadwal: "jd_mon_1_8a", id_rombel: "rb_8a", id_pegawai: g_maya, id_mapel: "mp_bind", semester: "Ganjil", hari: "Senin", jam_mulai: "07:45", jam_selesai: "08:25" },
    { id_jadwal: "jd_mon_1_8b", id_rombel: "rb_8b", id_pegawai: g_bambang, id_mapel: "mp_ipa", semester: "Ganjil", hari: "Senin", jam_mulai: "07:45", jam_selesai: "08:25" },
    { id_jadwal: "jd_mon_1_9a", id_rombel: "rb_9a", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Senin", jam_mulai: "07:45", jam_selesai: "08:25" },

    // Jam 2 (08:25 - 09:05)
    { id_jadwal: "jd_mon_2_7a", id_rombel: "rb_7a", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Senin", jam_mulai: "08:25", jam_selesai: "09:05" },
    { id_jadwal: "jd_mon_2_7b", id_rombel: "rb_7b", id_pegawai: g_dewi, id_mapel: "mp_qur", semester: "Ganjil", hari: "Senin", jam_mulai: "08:25", jam_selesai: "09:05" },
    { id_jadwal: "jd_mon_2_8a", id_rombel: "rb_8a", id_pegawai: g_maya, id_mapel: "mp_bind", semester: "Ganjil", hari: "Senin", jam_mulai: "08:25", jam_selesai: "09:05" },
    { id_jadwal: "jd_mon_2_8b", id_rombel: "rb_8b", id_pegawai: g_bambang, id_mapel: "mp_ipa", semester: "Ganjil", hari: "Senin", jam_mulai: "08:25", jam_selesai: "09:05" },
    { id_jadwal: "jd_mon_2_9a", id_rombel: "rb_9a", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Senin", jam_mulai: "08:25", jam_selesai: "09:05" },

    // Jam 3 (09:05 - 09:45)
    { id_jadwal: "jd_mon_3_7a", id_rombel: "rb_7a", id_pegawai: g_maya, id_mapel: "mp_bind", semester: "Ganjil", hari: "Senin", jam_mulai: "09:05", jam_selesai: "09:45" },
    { id_jadwal: "jd_mon_3_7b", id_rombel: "rb_7b", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Senin", jam_mulai: "09:05", jam_selesai: "09:45" },
    { id_jadwal: "jd_mon_3_8a", id_rombel: "rb_8a", id_pegawai: g_dewi, id_mapel: "mp_qur", semester: "Ganjil", hari: "Senin", jam_mulai: "09:05", jam_selesai: "09:45" },
    { id_jadwal: "jd_mon_3_8b", id_rombel: "rb_8b", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Senin", jam_mulai: "09:05", jam_selesai: "09:45" },
    { id_jadwal: "jd_mon_3_9b", id_rombel: "rb_9b", id_pegawai: g_bambang, id_mapel: "mp_ipa", semester: "Ganjil", hari: "Senin", jam_mulai: "09:05", jam_selesai: "09:45" },

    // Jam 4 (10:15 - 10:55)
    { id_jadwal: "jd_mon_4_7a", id_rombel: "rb_7a", id_pegawai: g_maya, id_mapel: "mp_bind", semester: "Ganjil", hari: "Senin", jam_mulai: "10:15", jam_selesai: "10:55" },
    { id_jadwal: "jd_mon_4_7b", id_rombel: "rb_7b", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Senin", jam_mulai: "10:15", jam_selesai: "10:55" },
    { id_jadwal: "jd_mon_4_8a", id_rombel: "rb_8a", id_pegawai: g_bambang, id_mapel: "mp_ipa", semester: "Ganjil", hari: "Senin", jam_mulai: "10:15", jam_selesai: "10:55" },
    { id_jadwal: "jd_mon_4_9a", id_rombel: "rb_9a", id_pegawai: g_dewi, id_mapel: "mp_qur", semester: "Ganjil", hari: "Senin", jam_mulai: "10:15", jam_selesai: "10:55" },
    { id_jadwal: "jd_mon_4_9b", id_rombel: "rb_9b", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Senin", jam_mulai: "10:15", jam_selesai: "10:55" },

    // Jam 5 (10:55 - 11:35)
    { id_jadwal: "jd_mon_5_7a", id_rombel: "rb_7a", id_pegawai: g_bambang, id_mapel: "mp_pjok", semester: "Ganjil", hari: "Senin", jam_mulai: "10:55", jam_selesai: "11:35" },
    { id_jadwal: "jd_mon_5_8a", id_rombel: "rb_8a", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Senin", jam_mulai: "10:55", jam_selesai: "11:35" },
    { id_jadwal: "jd_mon_5_8b", id_rombel: "rb_8b", id_pegawai: g_maya, id_mapel: "mp_bing", semester: "Ganjil", hari: "Senin", jam_mulai: "10:55", jam_selesai: "11:35" },
    { id_jadwal: "jd_mon_5_9a", id_rombel: "rb_9a", id_pegawai: g_dewi, id_mapel: "mp_qur", semester: "Ganjil", hari: "Senin", jam_mulai: "10:55", jam_selesai: "11:35" },
    { id_jadwal: "jd_mon_5_9b", id_rombel: "rb_9b", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Senin", jam_mulai: "10:55", jam_selesai: "11:35" },

    // === SELASA ===
    // Jam 1 (07:45 - 08:25)
    { id_jadwal: "jd_tue_1_7a", id_rombel: "rb_7a", id_pegawai: g_dewi, id_mapel: "mp_qur", semester: "Ganjil", hari: "Selasa", jam_mulai: "07:45", jam_selesai: "08:25" },
    { id_jadwal: "jd_tue_1_7b", id_rombel: "rb_7b", id_pegawai: g_bambang, id_mapel: "mp_pjok", semester: "Ganjil", hari: "Selasa", jam_mulai: "07:45", jam_selesai: "08:25" },
    { id_jadwal: "jd_tue_1_8a", id_rombel: "rb_8a", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Selasa", jam_mulai: "07:45", jam_selesai: "08:25" },
    { id_jadwal: "jd_tue_1_9a", id_rombel: "rb_9a", id_pegawai: g_maya, id_mapel: "mp_bing", semester: "Ganjil", hari: "Selasa", jam_mulai: "07:45", jam_selesai: "08:25" },
    { id_jadwal: "jd_tue_1_9b", id_rombel: "rb_9b", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Selasa", jam_mulai: "07:45", jam_selesai: "08:25" },

    // Jam 2 (08:25 - 09:05)
    { id_jadwal: "jd_tue_2_7a", id_rombel: "rb_7a", id_pegawai: g_dewi, id_mapel: "mp_qur", semester: "Ganjil", hari: "Selasa", jam_mulai: "08:25", jam_selesai: "09:05" },
    { id_jadwal: "jd_tue_2_7b", id_rombel: "rb_7b", id_pegawai: g_bambang, id_mapel: "mp_pjok", semester: "Ganjil", hari: "Selasa", jam_mulai: "08:25", jam_selesai: "09:05" },
    { id_jadwal: "jd_tue_2_8a", id_rombel: "rb_8a", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Selasa", jam_mulai: "08:25", jam_selesai: "09:05" },
    { id_jadwal: "jd_tue_2_9a", id_rombel: "rb_9a", id_pegawai: g_maya, id_mapel: "mp_bing", semester: "Ganjil", hari: "Selasa", jam_mulai: "08:25", jam_selesai: "09:05" },
    { id_jadwal: "jd_tue_2_9b", id_rombel: "rb_9b", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Selasa", jam_mulai: "08:25", jam_selesai: "09:05" },

    // Jam 3 (09:05 - 09:45)
    { id_jadwal: "jd_tue_3_7a", id_rombel: "rb_7a", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Selasa", jam_mulai: "09:05", jam_selesai: "09:45" },
    { id_jadwal: "jd_tue_3_7b", id_rombel: "rb_7b", id_pegawai: g_maya, id_mapel: "mp_bind", semester: "Ganjil", hari: "Selasa", jam_mulai: "09:05", jam_selesai: "09:45" },
    { id_jadwal: "jd_tue_3_8b", id_rombel: "rb_8b", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Selasa", jam_mulai: "09:05", jam_selesai: "09:45" },
    { id_jadwal: "jd_tue_3_9a", id_rombel: "rb_9a", id_pegawai: g_bambang, id_mapel: "mp_ipa", semester: "Ganjil", hari: "Selasa", jam_mulai: "09:05", jam_selesai: "09:45" },
    { id_jadwal: "jd_tue_3_9b", id_rombel: "rb_9b", id_pegawai: g_dewi, id_mapel: "mp_qur", semester: "Ganjil", hari: "Selasa", jam_mulai: "09:05", jam_selesai: "09:45" },

    // Jam 4 (10:15 - 10:55)
    { id_jadwal: "jd_tue_4_7a", id_rombel: "rb_7a", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Selasa", jam_mulai: "10:15", jam_selesai: "10:55" },
    { id_jadwal: "jd_tue_4_7b", id_rombel: "rb_7b", id_pegawai: g_maya, id_mapel: "mp_bind", semester: "Ganjil", hari: "Selasa", jam_mulai: "10:15", jam_selesai: "10:55" },
    { id_jadwal: "jd_tue_4_8b", id_rombel: "rb_8b", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Selasa", jam_mulai: "10:15", jam_selesai: "10:55" },
    { id_jadwal: "jd_tue_4_9a", id_rombel: "rb_9a", id_pegawai: g_bambang, id_mapel: "mp_ipa", semester: "Ganjil", hari: "Selasa", jam_mulai: "10:15", jam_selesai: "10:55" },
    { id_jadwal: "jd_tue_4_9b", id_rombel: "rb_9b", id_pegawai: g_dewi, id_mapel: "mp_qur", semester: "Ganjil", hari: "Selasa", jam_mulai: "10:15", jam_selesai: "10:55" },

    // Jam 5 (10:55 - 11:35)
    { id_jadwal: "jd_tue_5_7b", id_rombel: "rb_7b", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Selasa", jam_mulai: "10:55", jam_selesai: "11:35" },
    { id_jadwal: "jd_tue_5_8a", id_rombel: "rb_8a", id_pegawai: g_maya, id_mapel: "mp_bing", semester: "Ganjil", hari: "Selasa", jam_mulai: "10:55", jam_selesai: "11:35" },
    { id_jadwal: "jd_tue_5_8b", id_rombel: "rb_8b", id_pegawai: g_dewi, id_mapel: "mp_qur", semester: "Ganjil", hari: "Selasa", jam_mulai: "10:55", jam_selesai: "11:35" },
    { id_jadwal: "jd_tue_5_9a", id_rombel: "rb_9a", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Selasa", jam_mulai: "10:55", jam_selesai: "11:35" },
    { id_jadwal: "jd_tue_5_9b", id_rombel: "rb_9b", id_pegawai: g_bambang, id_mapel: "mp_pjok", semester: "Ganjil", hari: "Selasa", jam_mulai: "10:55", jam_selesai: "11:35" },

    // === RABU ===
    // Jam 1 (07:45 - 08:25)
    { id_jadwal: "jd_wed_1_7a", id_rombel: "rb_7a", id_pegawai: g_bambang, id_mapel: "mp_ipa", semester: "Ganjil", hari: "Rabu", jam_mulai: "07:45", jam_selesai: "08:25" },
    { id_jadwal: "jd_wed_1_7b", id_rombel: "rb_7b", id_pegawai: g_maya, id_mapel: "mp_bing", semester: "Ganjil", hari: "Rabu", jam_mulai: "07:45", jam_selesai: "08:25" },
    { id_jadwal: "jd_wed_1_8a", id_rombel: "rb_8a", id_pegawai: g_dewi, id_mapel: "mp_pai", semester: "Ganjil", hari: "Rabu", jam_mulai: "07:45", jam_selesai: "08:25" },
    { id_jadwal: "jd_wed_1_8b", id_rombel: "rb_8b", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Rabu", jam_mulai: "07:45", jam_selesai: "08:25" },
    { id_jadwal: "jd_wed_1_9a", id_rombel: "rb_9a", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Rabu", jam_mulai: "07:45", jam_selesai: "08:25" },

    // Jam 2 (08:25 - 09:05)
    { id_jadwal: "jd_wed_2_7a", id_rombel: "rb_7a", id_pegawai: g_bambang, id_mapel: "mp_ipa", semester: "Ganjil", hari: "Rabu", jam_mulai: "08:25", jam_selesai: "09:05" },
    { id_jadwal: "jd_wed_2_7b", id_rombel: "rb_7b", id_pegawai: g_maya, id_mapel: "mp_bing", semester: "Ganjil", hari: "Rabu", jam_mulai: "08:25", jam_selesai: "09:05" },
    { id_jadwal: "jd_wed_2_8a", id_rombel: "rb_8a", id_pegawai: g_dewi, id_mapel: "mp_pai", semester: "Ganjil", hari: "Rabu", jam_mulai: "08:25", jam_selesai: "09:05" },
    { id_jadwal: "jd_wed_2_8b", id_rombel: "rb_8b", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Rabu", jam_mulai: "08:25", jam_selesai: "09:05" },
    { id_jadwal: "jd_wed_2_9a", id_rombel: "rb_9a", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Rabu", jam_mulai: "08:25", jam_selesai: "09:05" },

    // Jam 3 (09:05 - 09:45)
    { id_jadwal: "jd_wed_3_7a", id_rombel: "rb_7a", id_pegawai: g_maya, id_mapel: "mp_bing", semester: "Ganjil", hari: "Rabu", jam_mulai: "09:05", jam_selesai: "09:45" },
    { id_jadwal: "jd_wed_3_7b", id_rombel: "rb_7b", id_pegawai: g_bambang, id_mapel: "mp_ipa", semester: "Ganjil", hari: "Rabu", jam_mulai: "09:05", jam_selesai: "09:45" },
    { id_jadwal: "jd_wed_3_8a", id_rombel: "rb_8a", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Rabu", jam_mulai: "09:05", jam_selesai: "09:45" },
    { id_jadwal: "jd_wed_3_8b", id_rombel: "rb_8b", id_pegawai: g_dewi, id_mapel: "mp_qur", semester: "Ganjil", hari: "Rabu", jam_mulai: "09:05", jam_selesai: "09:45" },
    { id_jadwal: "jd_wed_3_9b", id_rombel: "rb_9b", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Rabu", jam_mulai: "09:05", jam_selesai: "09:45" },

    // Jam 4 (10:15 - 10:55)
    { id_jadwal: "jd_wed_4_7a", id_rombel: "rb_7a", id_pegawai: g_maya, id_mapel: "mp_bing", semester: "Ganjil", hari: "Rabu", jam_mulai: "10:15", jam_selesai: "10:55" },
    { id_jadwal: "jd_wed_4_7b", id_rombel: "rb_7b", id_pegawai: g_bambang, id_mapel: "mp_ipa", semester: "Ganjil", hari: "Rabu", jam_mulai: "10:15", jam_selesai: "10:55" },
    { id_jadwal: "jd_wed_4_8a", id_rombel: "rb_8a", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Rabu", jam_mulai: "10:15", jam_selesai: "10:55" },
    { id_jadwal: "jd_wed_4_9a", id_rombel: "rb_9a", id_pegawai: g_dewi, id_mapel: "mp_pai", semester: "Ganjil", hari: "Rabu", jam_mulai: "10:15", jam_selesai: "10:55" },
    { id_jadwal: "jd_wed_4_9b", id_rombel: "rb_9b", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Rabu", jam_mulai: "10:15", jam_selesai: "10:55" },

    // === KAMIS ===
    // Jam 1 (07:45 - 08:25)
    { id_jadwal: "jd_thu_1_7a", id_rombel: "rb_7a", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Kamis", jam_mulai: "07:45", jam_selesai: "08:25" },
    { id_jadwal: "jd_thu_1_7b", id_rombel: "rb_7b", id_pegawai: g_dewi, id_mapel: "mp_pai", semester: "Ganjil", hari: "Kamis", jam_mulai: "07:45", jam_selesai: "08:25" },
    { id_jadwal: "jd_thu_1_8a", id_rombel: "rb_8a", id_pegawai: g_bambang, id_mapel: "mp_pjok", semester: "Ganjil", hari: "Kamis", jam_mulai: "07:45", jam_selesai: "08:25" },
    { id_jadwal: "jd_thu_1_8b", id_rombel: "rb_8b", id_pegawai: g_maya, id_mapel: "mp_bind", semester: "Ganjil", hari: "Kamis", jam_mulai: "07:45", jam_selesai: "08:25" },
    { id_jadwal: "jd_thu_1_9b", id_rombel: "rb_9b", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Kamis", jam_mulai: "07:45", jam_selesai: "08:25" },

    // Jam 2 (08:25 - 09:05)
    { id_jadwal: "jd_thu_2_7a", id_rombel: "rb_7a", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Kamis", jam_mulai: "08:25", jam_selesai: "09:05" },
    { id_jadwal: "jd_thu_2_7b", id_rombel: "rb_7b", id_pegawai: g_dewi, id_mapel: "mp_pai", semester: "Ganjil", hari: "Kamis", jam_mulai: "08:25", jam_selesai: "09:05" },
    { id_jadwal: "jd_thu_2_8a", id_rombel: "rb_8a", id_pegawai: g_bambang, id_mapel: "mp_pjok", semester: "Ganjil", hari: "Kamis", jam_mulai: "08:25", jam_selesai: "09:05" },
    { id_jadwal: "jd_thu_2_8b", id_rombel: "rb_8b", id_pegawai: g_maya, id_mapel: "mp_bind", semester: "Ganjil", hari: "Kamis", jam_mulai: "08:25", jam_selesai: "09:05" },
    { id_jadwal: "jd_thu_2_9b", id_rombel: "rb_9b", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Kamis", jam_mulai: "08:25", jam_selesai: "09:05" },

    // Jam 3 (09:05 - 09:45)
    { id_jadwal: "jd_thu_3_7a", id_rombel: "rb_7a", id_pegawai: g_bambang, id_mapel: "mp_pjok", semester: "Ganjil", hari: "Kamis", jam_mulai: "09:05", jam_selesai: "09:45" },
    { id_jadwal: "jd_thu_3_7b", id_rombel: "rb_7b", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Kamis", jam_mulai: "09:05", jam_selesai: "09:45" },
    { id_jadwal: "jd_thu_3_8a", id_rombel: "rb_8a", id_pegawai: g_maya, id_mapel: "mp_bind", semester: "Ganjil", hari: "Kamis", jam_mulai: "09:05", jam_selesai: "09:45" },
    { id_jadwal: "jd_thu_3_8b", id_rombel: "rb_8b", id_pegawai: g_dewi, id_mapel: "mp_pai", semester: "Ganjil", hari: "Kamis", jam_mulai: "09:05", jam_selesai: "09:45" },
    { id_jadwal: "jd_thu_3_9a", id_rombel: "rb_9a", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Kamis", jam_mulai: "09:05", jam_selesai: "09:45" },

    // Jam 4 (10:15 - 10:55)
    { id_jadwal: "jd_thu_4_7a", id_rombel: "rb_7a", id_pegawai: g_dewi, id_mapel: "mp_pai", semester: "Ganjil", hari: "Kamis", jam_mulai: "10:15", jam_selesai: "10:55" },
    { id_jadwal: "jd_thu_4_7b", id_rombel: "rb_7b", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Kamis", jam_mulai: "10:15", jam_selesai: "10:55" },
    { id_jadwal: "jd_thu_4_8a", id_rombel: "rb_8a", id_pegawai: g_maya, id_mapel: "mp_bind", semester: "Ganjil", hari: "Kamis", jam_mulai: "10:15", jam_selesai: "10:55" },
    { id_jadwal: "jd_thu_4_8b", id_rombel: "rb_8b", id_pegawai: g_bambang, id_mapel: "mp_pjok", semester: "Ganjil", hari: "Kamis", jam_mulai: "10:15", jam_selesai: "10:55" },
    { id_jadwal: "jd_thu_4_9a", id_rombel: "rb_9a", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Kamis", jam_mulai: "10:15", jam_selesai: "10:55" },

    // === JUMAT === (KBM Singkat 07:30 - 11:30)
    // Jam 1 (07:30 - 08:10)
    { id_jadwal: "jd_fri_1_7a", id_rombel: "rb_7a", id_pegawai: g_dewi, id_mapel: "mp_qur", semester: "Ganjil", hari: "Jumat", jam_mulai: "07:30", jam_selesai: "08:10" },
    { id_jadwal: "jd_fri_1_7b", id_rombel: "rb_7b", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Jumat", jam_mulai: "07:30", jam_selesai: "08:10" },
    { id_jadwal: "jd_fri_1_8a", id_rombel: "rb_8a", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Jumat", jam_mulai: "07:30", jam_selesai: "08:10" },
    { id_jadwal: "jd_fri_1_9a", id_rombel: "rb_9a", id_pegawai: g_maya, id_mapel: "mp_bind", semester: "Ganjil", hari: "Jumat", jam_mulai: "07:30", jam_selesai: "08:10" },
    { id_jadwal: "jd_fri_1_9b", id_rombel: "rb_9b", id_pegawai: g_bambang, id_mapel: "mp_ipa", semester: "Ganjil", hari: "Jumat", jam_mulai: "07:30", jam_selesai: "08:10" },

    // Jam 2 (08:10 - 08:50)
    { id_jadwal: "jd_fri_2_7a", id_rombel: "rb_7a", id_pegawai: g_dewi, id_mapel: "mp_qur", semester: "Ganjil", hari: "Jumat", jam_mulai: "08:10", jam_selesai: "08:50" },
    { id_jadwal: "jd_fri_2_7b", id_rombel: "rb_7b", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Jumat", jam_mulai: "08:10", jam_selesai: "08:50" },
    { id_jadwal: "jd_fri_2_8a", id_rombel: "rb_8a", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Jumat", jam_mulai: "08:10", jam_selesai: "08:50" },
    { id_jadwal: "jd_fri_2_9a", id_rombel: "rb_9a", id_pegawai: g_maya, id_mapel: "mp_bind", semester: "Ganjil", hari: "Jumat", jam_mulai: "08:10", jam_selesai: "08:50" },
    { id_jadwal: "jd_fri_2_9b", id_rombel: "rb_9b", id_pegawai: g_bambang, id_mapel: "mp_ipa", semester: "Ganjil", hari: "Jumat", jam_mulai: "08:10", jam_selesai: "08:50" },

    // Jam 3 (08:50 - 09:30)
    { id_jadwal: "jd_fri_3_7a", id_rombel: "rb_7a", id_pegawai: g_maya, id_mapel: "mp_bind", semester: "Ganjil", hari: "Jumat", jam_mulai: "08:50", jam_selesai: "09:30" },
    { id_jadwal: "jd_fri_3_7b", id_rombel: "rb_7b", id_pegawai: g_dewi, id_mapel: "mp_qur", semester: "Ganjil", hari: "Jumat", jam_mulai: "08:50", jam_selesai: "09:30" },
    { id_jadwal: "jd_fri_3_8b", id_rombel: "rb_8b", id_pegawai: g_bambang, id_mapel: "mp_ipa", semester: "Ganjil", hari: "Jumat", jam_mulai: "08:50", jam_selesai: "09:30" },
    { id_jadwal: "jd_fri_3_9a", id_rombel: "rb_9a", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Jumat", jam_mulai: "08:50", jam_selesai: "09:30" },
    { id_jadwal: "jd_fri_3_9b", id_rombel: "rb_9b", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Jumat", jam_mulai: "08:50", jam_selesai: "09:30" },

    // Jam 4 (10:00 - 10:40)
    { id_jadwal: "jd_fri_4_7a", id_rombel: "rb_7a", id_pegawai: g_maya, id_mapel: "mp_bind", semester: "Ganjil", hari: "Jumat", jam_mulai: "10:00", jam_selesai: "10:40" },
    { id_jadwal: "jd_fri_4_7b", id_rombel: "rb_7b", id_pegawai: g_dewi, id_mapel: "mp_qur", semester: "Ganjil", hari: "Jumat", jam_mulai: "10:00", jam_selesai: "10:40" },
    { id_jadwal: "jd_fri_4_8b", id_rombel: "rb_8b", id_pegawai: g_bambang, id_mapel: "mp_ipa", semester: "Ganjil", hari: "Jumat", jam_mulai: "10:00", jam_selesai: "10:40" },
    { id_jadwal: "jd_fri_4_9a", id_rombel: "rb_9a", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Jumat", jam_mulai: "10:00", jam_selesai: "10:40" },
    { id_jadwal: "jd_fri_4_9b", id_rombel: "rb_9b", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Jumat", jam_mulai: "10:00", jam_selesai: "10:40" },

    // === SABTU ===
    // Jam 1 (07:45 - 08:25)
    { id_jadwal: "jd_sat_1_7a", id_rombel: "rb_7a", id_pegawai: g_maya, id_mapel: "mp_bing", semester: "Ganjil", hari: "Sabtu", jam_mulai: "07:45", jam_selesai: "08:25" },
    { id_jadwal: "jd_sat_1_7b", id_rombel: "rb_7b", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Sabtu", jam_mulai: "07:45", jam_selesai: "08:25" },
    { id_jadwal: "jd_sat_1_8a", id_rombel: "rb_8a", id_pegawai: g_dewi, id_mapel: "mp_qur", semester: "Ganjil", hari: "Sabtu", jam_mulai: "07:45", jam_selesai: "08:25" },
    { id_jadwal: "jd_sat_1_8b", id_rombel: "rb_8b", id_pegawai: g_bambang, id_mapel: "mp_pjok", semester: "Ganjil", hari: "Sabtu", jam_mulai: "07:45", jam_selesai: "08:25" },
    { id_jadwal: "jd_sat_1_9a", id_rombel: "rb_9a", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Sabtu", jam_mulai: "07:45", jam_selesai: "08:25" },

    // Jam 2 (08:25 - 09:05)
    { id_jadwal: "jd_sat_2_7a", id_rombel: "rb_7a", id_pegawai: g_maya, id_mapel: "mp_bing", semester: "Ganjil", hari: "Sabtu", jam_mulai: "08:25", jam_selesai: "09:05" },
    { id_jadwal: "jd_sat_2_7b", id_rombel: "rb_7b", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Sabtu", jam_mulai: "08:25", jam_selesai: "09:05" },
    { id_jadwal: "jd_sat_2_8a", id_rombel: "rb_8a", id_pegawai: g_dewi, id_mapel: "mp_qur", semester: "Ganjil", hari: "Sabtu", jam_mulai: "08:25", jam_selesai: "09:05" },
    { id_jadwal: "jd_sat_2_8b", id_rombel: "rb_8b", id_pegawai: g_bambang, id_mapel: "mp_pjok", semester: "Ganjil", hari: "Sabtu", jam_mulai: "08:25", jam_selesai: "09:05" },
    { id_jadwal: "jd_sat_2_9a", id_rombel: "rb_9a", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Sabtu", jam_mulai: "08:25", jam_selesai: "09:05" },

    // Jam 3 (09:05 - 09:45)
    { id_jadwal: "jd_sat_3_7a", id_rombel: "rb_7a", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Sabtu", jam_mulai: "09:05", jam_selesai: "09:45" },
    { id_jadwal: "jd_sat_3_7b", id_rombel: "rb_7b", id_pegawai: g_bambang, id_mapel: "mp_ipa", semester: "Ganjil", hari: "Sabtu", jam_mulai: "09:05", jam_selesai: "09:45" },
    { id_jadwal: "jd_sat_3_8a", id_rombel: "rb_8a", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Sabtu", jam_mulai: "09:05", jam_selesai: "09:45" },
    { id_jadwal: "jd_sat_3_8b", id_rombel: "rb_8b", id_pegawai: g_dewi, id_mapel: "mp_qur", semester: "Ganjil", hari: "Sabtu", jam_mulai: "09:05", jam_selesai: "09:45" },
    { id_jadwal: "jd_sat_3_9b", id_rombel: "rb_9b", id_pegawai: g_maya, id_mapel: "mp_bind", semester: "Ganjil", hari: "Sabtu", jam_mulai: "09:05", jam_selesai: "09:45" },

    // Jam 4 (10:15 - 10:55)
    { id_jadwal: "jd_sat_4_7a", id_rombel: "rb_7a", id_pegawai: g_ahmad, id_mapel: "mp_pai", semester: "Ganjil", hari: "Sabtu", jam_mulai: "10:15", jam_selesai: "10:55" },
    { id_jadwal: "jd_sat_4_7b", id_rombel: "rb_7b", id_pegawai: g_bambang, id_mapel: "mp_ipa", semester: "Ganjil", hari: "Sabtu", jam_mulai: "10:15", jam_selesai: "10:55" },
    { id_jadwal: "jd_sat_4_8a", id_rombel: "rb_8a", id_pegawai: g_syaiful, id_mapel: "mp_mtk", semester: "Ganjil", hari: "Sabtu", jam_mulai: "10:15", jam_selesai: "10:55" },
    { id_jadwal: "jd_sat_4_8b", id_rombel: "rb_8b", id_pegawai: g_dewi, id_mapel: "mp_qur", semester: "Ganjil", hari: "Sabtu", jam_mulai: "10:15", jam_selesai: "10:55" },
    { id_jadwal: "jd_sat_4_9b", id_rombel: "rb_9b", id_pegawai: g_maya, id_mapel: "mp_bind", semester: "Ganjil", hari: "Sabtu", jam_mulai: "10:15", jam_selesai: "10:55" },
  ];

  const surat: Surat[] = [
    { id_surat: "sr_1", nomor_surat: "421/001/MTs.TerpaduNusantara/2026", perihal: "SK Kenaikan Kelas", jenis_surat: "SK", id_template: null, tanggal_surat: todayIso(), tujuan_surat: "Seluruh Siswa MTs Terpadu Nusantara", isi_surat: "Surat keputusan kenaikan kelas tahun ajaran 2026/2027", id_siswa_terkait: null, id_pegawai_terkait: null, status: "Menunggu TTD", dibuat_oleh: "pg_ops", id_penandatangan: "pg_kepala", hasil_ai: false, meta_penandatangan: null },
    { id_surat: "sr_2", nomor_surat: "421/014/MTs.TerpaduNusantara/2026", perihal: "Surat Keterangan Aktif", jenis_surat: "Surat Keterangan", id_template: "tpl_01", tanggal_surat: "2026-07-20", tujuan_surat: "Pihak yang memerlukan", isi_surat: "Keterangan siswa aktif belajar", id_siswa_terkait: null, id_pegawai_terkait: null, status: "Diterbitkan", dibuat_oleh: "pg_ops", id_penandatangan: "pg_kepala", hasil_ai: false, meta_penandatangan: { id_pegawai: "pg_kepala", nama: "Dr. H. Syaiful Rahman, M.Pd.", nip: "19750501200101", jabatan: "Kepala Madrasah", tanggal_ttd: "2026-07-20" } },
    { id_surat: "sr_3", nomor_surat: "DRAFT-AI-003", perihal: "Surat Tugas Mengajar", jenis_surat: "Surat Tugas", id_template: "tpl_02", tanggal_surat: todayIso(), tujuan_surat: "Pimpinan yang berwenang", isi_surat: "Draf AI — perlu verifikasi sebelum ditandatangani", id_siswa_terkait: null, id_pegawai_terkait: null, status: "Draf", dibuat_oleh: "pg_admin", id_penandatangan: null, hasil_ai: true, meta_penandatangan: null },
  ];

  const hariLibur: HariLibur[] = [
    { id_libur: "hl_1", tanggal: "2026-08-17", nama: "Hari Kemerdekaan RI", id_tahun: "ta_2627" },
    { id_libur: "hl_2", tanggal: "2026-09-16", nama: "Maulid Nabi Muhammad SAW", id_tahun: "ta_2627" },
  ];

  const pemetaanKenaikan: PemetaanKenaikan[] = [];

  const auditLog: AuditLog[] = [
    { id_log: "au_1", id_user: "pg_ops", nama_tabel: "anggota_rombel", id_record: "ar_pending_05", aksi: "Create", timestamp: nowIso() },
    { id_log: "au_2", id_user: "pg_ops", nama_tabel: "riwayat_mutasi", id_record: "mt_01", aksi: "Create", timestamp: nowIso() },
  ];

  const pengaturan = {
    ambangToleransiTerlambatMenit: 15,
    ambangFlagDigantikanMendadak: 3,
  };

  const izinGuru: IzinGuru[] = [
    {
      id_izin: "iz_1",
      id_pegawai: "019153a0-f8f2-777b-bb66-6b211a7e28a9",
      tanggal_izin: todayIso(),
      jenis_izin: "Direncanakan H-1",
      alasan: "Acara keluarga",
      id_pegawai_pengganti: "pg_wali_a",
      saluran_pelaporan: "WA Pribadi Kepala Madrasah",
      dilaporkan_pada: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      status_rekonsiliasi: "Tepat Waktu",
      dicatat_oleh: "pg_admin",
    },
    {
      id_izin: "iz_2",
      id_pegawai: "pg_guru_polos",
      tanggal_izin: todayIso(),
      jenis_izin: "Mendesak-Darurat",
      alasan: "Sakit mendadak",
      id_pegawai_pengganti: null,
      saluran_pelaporan: "WA Group",
      dilaporkan_pada: new Date(Date.now() - 25 * 3600 * 1000).toISOString(),
      status_rekonsiliasi: "Terlambat",
      dicatat_oleh: "pg_admin",
    },
  ];

  const sesiTatapMuka: SesiTatapMuka[] = [
    {
      id_sesi: "st_1",
      id_jadwal: "jd_1", // MTK by Dr. H. Syaiful Rahman, M.Pd.
      tanggal: todayIso(),
      id_pegawai_pelaksana: "019153a0-f8f2-777b-bb66-6b211a7e28a5",
      waktu_input: new Date(new Date().setHours(7, 5, 0, 0)).toISOString(),
      is_guru_pengganti: false,
      id_izin_terkait: null,
      status_kehadiran_guru: "Tepat Waktu",
      jurnal_materi: "Membahas Persamaan Kuadrat dan aplikasinya dalam kehidupan sehari-hari.",
    },
    {
      id_sesi: "st_2",
      id_jadwal: "jd_2", // BIN by pg_admin_mengajar -> tapi izin, diganti pg_wali_a
      tanggal: todayIso(),
      id_pegawai_pelaksana: "pg_wali_a",
      waktu_input: new Date(new Date().setHours(8, 30, 0, 0)).toISOString(),
      is_guru_pengganti: true,
      id_izin_terkait: "iz_1",
      status_kehadiran_guru: "Digantikan Terjadwal",
      jurnal_materi: "Latihan menulis teks eksplanasi.",
    },
    {
      id_sesi: "st_3",
      id_jadwal: "jd_3", // QUR by pg_wali_a
      tanggal: todayIso(),
      id_pegawai_pelaksana: "pg_wali_a",
      waktu_input: new Date(new Date().setHours(7, 20, 0, 0)).toISOString(), // 20 minutes late
      is_guru_pengganti: false,
      id_izin_terkait: null,
      status_kehadiran_guru: "Terlambat",
      jurnal_materi: "Murojaah juz 30.",
    },
    {
      id_sesi: "st_4",
      id_jadwal: "jd_4", // IPA by pg_guru_polos (who is sick, replaced by pg_wali_a but mendadak)
      tanggal: todayIso(),
      id_pegawai_pelaksana: "pg_wali_a",
      waktu_input: new Date(new Date().setHours(7, 0, 0, 0)).toISOString(),
      is_guru_pengganti: true,
      id_izin_terkait: "iz_2",
      status_kehadiran_guru: "Digantikan Mendadak",
      jurnal_materi: "Praktikum Hukum Archimedes.",
    }
  ];

  const ekstrakurikuler: Ekstrakurikuler[] = [
    { id_ekstra: "ek_1", id_madrasah: "md_1", nama_ekstra: "Pramuka", id_pembina: "019153a0-f8f2-777b-bb66-6b211a7e28a5", id_tahun: "ta_2627" },
    { id_ekstra: "ek_2", id_madrasah: "md_1", nama_ekstra: "Paskibra", id_pembina: "pg_wali_a", id_tahun: "ta_2627" },
  ];
  const keanggotaanEkstra: KeanggotaanEkstra[] = [
    { id_keanggotaan: "ak_1", id_ekstra: "ek_1", id_siswa: "sw_01", tanggal_mulai: "2026-07-20", tanggal_selesai: null, status: "Aktif" },
    { id_keanggotaan: "ak_2", id_ekstra: "ek_1", id_siswa: "sw_02", tanggal_mulai: "2026-07-20", tanggal_selesai: null, status: "Aktif" },
  ];
  const absensiEkstra: AbsensiEkstra[] = [];
  const penugasanJabatan: PenugasanJabatan[] = [
    { id_penugasan: "pj_1", id_pegawai: "pg_kepala", jenis_jabatan: "Kepala Madrasah", id_tahun: "ta_2627", tanggal_mulai: "2026-07-01", tanggal_selesai: null, status: "Aktif" },
    { id_penugasan: "pj_2", id_pegawai: "pg_admin", jenis_jabatan: "Admin Madrasah", id_tahun: "ta_2627", tanggal_mulai: "2026-07-01", tanggal_selesai: null, status: "Aktif" },
    { id_penugasan: "pj_3", id_pegawai: "pg_ops", jenis_jabatan: "Operator Kesiswaan", id_tahun: "ta_2627", tanggal_mulai: "2026-07-01", tanggal_selesai: null, status: "Aktif" },
    { id_penugasan: "pj_4", id_pegawai: "pg_bk", jenis_jabatan: "Guru BK", id_tahun: "ta_2627", tanggal_mulai: "2026-07-01", tanggal_selesai: null, status: "Aktif" },
  ];
  const profilMadrasah: ProfilMadrasah = {
    id_profil: "prof_01",
    npsn: "10892345",
    nsm: "121152710001",
    nama_madrasah: "MTs Terpadu Nusantara",
    jenjang: "MTs",
    status_akreditasi: "A",
    alamat: "Jl. Pendidikan No. 123, Kompleks Islamic Center",
    kabupaten_kota: "Mataram",
    id_desa: "desa_001",
    telepon: "0370-123456",
    email: "info@mtsterpadu.sch.id",
    website: "www.mtsterpadu.sch.id",
    logo_url: "/logo-madrasah-mock.png",
    id_kepala_madrasah: "pg_kepala", // FK ke pegawai aktif Kamad
    nama_kepala_madrasah: null,      // null = gunakan data dari pegawai via id_kepala_madrasah
    nip_kepala_madrasah: null,
  };

  const templateSurat: TemplateSurat[] = [
    {
      id_template: "tpl_01",
      kode_template: "SK-AKTIF",
      nama_template: "Surat Keterangan Aktif Siswa",
      kategori: "Keterangan",
      header_html: null,
      body_template: `<p>Yang bertanda tangan di bawah ini, Kepala {{NAMA_MADRASAH}}, menerangkan bahwa:</p>
<table>
  <tr><td>Nama</td><td>:</td><td>{{NAMA_SISWA}}</td></tr>
  <tr><td>NISN</td><td>:</td><td>{{NISN}}</td></tr>
  <tr><td>Kelas</td><td>:</td><td>{{NAMA_KELAS}}</td></tr>
</table>
<p>Adalah benar-benar siswa aktif di {{NAMA_MADRASAH}} pada Tahun Ajaran {{TAHUN_AJARAN}}.</p>
<p>Surat keterangan ini dibuat untuk {{KEPERLUAN}}.</p>`,
      // Backward compat aliases
      get format_html() { return this.body_template; },
      variabel_placeholder: ["NAMA_SISWA", "NISN", "NAMA_KELAS", "TAHUN_AJARAN", "KEPERLUAN", "NAMA_MADRASAH"],
      get variabel_dibutuhkan() { return this.variabel_placeholder; },
      aktif: true,
    },
    {
      id_template: "tpl_02",
      kode_template: "ST-TUGAS",
      nama_template: "Surat Tugas Mengajar / Pengawas",
      kategori: "Tugas",
      header_html: null,
      body_template: `<p>Yang bertanda tangan di bawah ini menugaskan:</p>
<table>
  <tr><td>Nama</td><td>:</td><td>{{NAMA_PEGAWAI}}</td></tr>
  <tr><td>NIP/NPK</td><td>:</td><td>{{NIP_NPK}}</td></tr>
  <tr><td>Jabatan</td><td>:</td><td>{{JABATAN}}</td></tr>
</table>
<p>Untuk melaksanakan tugas {{DESKRIPSI_TUGAS}} pada tanggal {{TANGGAL_TUGAS}}.</p>`,
      get format_html() { return this.body_template; },
      variabel_placeholder: ["NAMA_PEGAWAI", "NIP_NPK", "JABATAN", "DESKRIPSI_TUGAS", "TANGGAL_TUGAS"],
      get variabel_dibutuhkan() { return this.variabel_placeholder; },
      aktif: true,
    },
    {
      id_template: "tpl_03",
      kode_template: "SKP-MUTASI",
      nama_template: "Surat Keterangan Pindah (SKP)",
      kategori: "Keterangan",
      header_html: null,
      body_template: `<p>Yang bertanda tangan di bawah ini, Kepala {{NAMA_MADRASAH}}, menerangkan bahwa:</p>
<table>
  <tr><td>Nama</td><td>:</td><td>{{NAMA_SISWA}}</td></tr>
  <tr><td>NISN</td><td>:</td><td>{{NISN}}</td></tr>
  <tr><td>Kelas</td><td>:</td><td>{{NAMA_KELAS}}</td></tr>
</table>
<p>Telah mengajukan pindah ke sekolah {{SEKOLAH_TUJUAN}} dengan alasan {{ALASAN_PINDAH}}.</p>
<p>Demikian surat keterangan pindah ini dibuat agar dapat dipergunakan sebagaimana mestinya.</p>`,
      get format_html() { return this.body_template; },
      variabel_placeholder: ["NAMA_SISWA", "NISN", "NAMA_KELAS", "NAMA_MADRASAH", "SEKOLAH_TUJUAN", "ALASAN_PINDAH"],
      get variabel_dibutuhkan() { return this.variabel_placeholder; },
      aktif: true,
    },
  ];

  const catatanBk: CatatanBk[] = [
    {
      id_catatan: "cbk_1",
      id_madrasah: "md_1",
      id_siswa: "sw_01",
      id_pegawai_bk: "pg_bk",
      tanggal: "2026-07-22",
      kategori: "Perilaku",
      catatan: "Siswa sering datang terlambat",
      tingkat_kerahasiaan: "Umum",
    },
    {
      id_catatan: "cbk_2",
      id_madrasah: "md_1",
      id_siswa: "sw_01",
      id_pegawai_bk: "pg_bk",
      tanggal: "2026-07-23",
      kategori: "Pribadi",
      catatan: "Siswa mengalami masalah keluarga berat, perlu pendampingan intensif",
      tingkat_kerahasiaan: "Rahasia",
    },
  ];

  const komponenNilai: KomponenNilai[] = [
    { id_komponen: "k_1", id_mapel: "mp_pai", nama_komponen: "Tugas Harian", bobot: 30 },
    { id_komponen: "k_2", id_mapel: "mp_pai", nama_komponen: "UTS (Tengah Semester)", bobot: 30 },
    { id_komponen: "k_3", id_mapel: "mp_pai", nama_komponen: "UAS (Akhir Semester)", bobot: 40 },
    { id_komponen: "k_4", id_mapel: "mp_mtk", nama_komponen: "Tugas 1: Aljabar", bobot: 20 },
    { id_komponen: "k_5", id_mapel: "mp_mtk", nama_komponen: "Ulangan Harian 1", bobot: 20 },
    { id_komponen: "k_6", id_mapel: "mp_mtk", nama_komponen: "UTS (Tengah Semester)", bobot: 30 },
    { id_komponen: "k_6b", id_mapel: "mp_mtk", nama_komponen: "UAS (Akhir Semester)", bobot: 30 },
    { id_komponen: "k_7", id_mapel: "mp_bind", nama_komponen: "Tugas Portofolio", bobot: 40 },
    { id_komponen: "k_8", id_mapel: "mp_bind", nama_komponen: "Ulangan Harian", bobot: 60 },
    { id_komponen: "k_9", id_mapel: "mp_bing", nama_komponen: "UTS", bobot: 40 },
    { id_komponen: "k_9b", id_mapel: "mp_bing", nama_komponen: "UAS", bobot: 60 },
    { id_komponen: "k_10", id_mapel: "mp_ipa", nama_komponen: "Praktik Laboratorium", bobot: 40 },
    { id_komponen: "k_10b", id_mapel: "mp_ipa", nama_komponen: "UAS", bobot: 60 },
    { id_komponen: "k_11", id_mapel: "mp_qur", nama_komponen: "Setoran Hafalan", bobot: 50 },
    { id_komponen: "k_11b", id_mapel: "mp_qur", nama_komponen: "UAS", bobot: 50 },
    { id_komponen: "k_12", id_mapel: "mp_pjok", nama_komponen: "Praktik Atletik", bobot: 60 },
    { id_komponen: "k_13", id_mapel: "mp_pjok", nama_komponen: "Teori Kebugaran", bobot: 40 },
  ];

  const nowIsoString = new Date().toISOString();
  const nilaiSiswa: NilaiSiswa[] = [
    { id_nilai: "nl_1", id_siswa: "sw_01", id_komponen: "k_4", id_rombel: "rb_7a", id_tahun: "ta_2627", semester: "Ganjil", nilai: 88, id_pegawai_penilai: "019153a0-f8f2-777b-bb66-6b211a7e28a5", tanggal_input: nowIsoString },
    { id_nilai: "nl_2", id_siswa: "sw_01", id_komponen: "k_5", id_rombel: "rb_7a", id_tahun: "ta_2627", semester: "Ganjil", nilai: 85, id_pegawai_penilai: "019153a0-f8f2-777b-bb66-6b211a7e28a5", tanggal_input: nowIsoString },
    { id_nilai: "nl_3", id_siswa: "sw_01", id_komponen: "k_6", id_rombel: "rb_7a", id_tahun: "ta_2627", semester: "Ganjil", nilai: 90, id_pegawai_penilai: "019153a0-f8f2-777b-bb66-6b211a7e28a5", tanggal_input: nowIsoString },
    { id_nilai: "nl_4", id_siswa: "sw_02", id_komponen: "k_4", id_rombel: "rb_7a", id_tahun: "ta_2627", semester: "Ganjil", nilai: 78, id_pegawai_penilai: "019153a0-f8f2-777b-bb66-6b211a7e28a5", tanggal_input: nowIsoString },
    { id_nilai: "nl_5", id_siswa: "sw_02", id_komponen: "k_5", id_rombel: "rb_7a", id_tahun: "ta_2627", semester: "Ganjil", nilai: 72, id_pegawai_penilai: "019153a0-f8f2-777b-bb66-6b211a7e28a5", tanggal_input: nowIsoString },
    { id_nilai: "nl_6", id_siswa: "sw_02", id_komponen: "k_6", id_rombel: "rb_7a", id_tahun: "ta_2627", semester: "Ganjil", nilai: 80, id_pegawai_penilai: "019153a0-f8f2-777b-bb66-6b211a7e28a5", tanggal_input: nowIsoString },
    { id_nilai: "nl_7", id_siswa: "sw_03", id_komponen: "k_4", id_rombel: "rb_7a", id_tahun: "ta_2627", semester: "Ganjil", nilai: 95, id_pegawai_penilai: "019153a0-f8f2-777b-bb66-6b211a7e28a5", tanggal_input: nowIsoString },
    { id_nilai: "nl_8", id_siswa: "sw_03", id_komponen: "k_5", id_rombel: "rb_7a", id_tahun: "ta_2627", semester: "Ganjil", nilai: 92, id_pegawai_penilai: "019153a0-f8f2-777b-bb66-6b211a7e28a5", tanggal_input: nowIsoString },
    { id_nilai: "nl_9", id_siswa: "sw_04", id_komponen: "k_4", id_rombel: "rb_7a", id_tahun: "ta_2627", semester: "Ganjil", nilai: 68, id_pegawai_penilai: "019153a0-f8f2-777b-bb66-6b211a7e28a5", tanggal_input: nowIsoString },
    { id_nilai: "nl_10", id_siswa: "sw_04", id_komponen: "k_5", id_rombel: "rb_7a", id_tahun: "ta_2627", semester: "Ganjil", nilai: 70, id_pegawai_penilai: "019153a0-f8f2-777b-bb66-6b211a7e28a5", tanggal_input: nowIsoString },
    { id_nilai: "nl_11", id_siswa: "sw_05", id_komponen: "k_4", id_rombel: "rb_7a", id_tahun: "ta_2627", semester: "Ganjil", nilai: 84, id_pegawai_penilai: "019153a0-f8f2-777b-bb66-6b211a7e28a5", tanggal_input: nowIsoString },
  ];

  return {
    madrasah,
    tahunAjaran,
    tingkat,
    mapel,
    hariLibur,
    pegawai,
    rombel,
    siswa,
    anggotaRombel,
    pemetaanKenaikan,
    mutasi,
    pendingMutasiRombel,
    absensi,
    jadwal,
    surat,
    auditLog,
    sesiTatapMuka,
    izinGuru,
    pengaturan,
    ekstrakurikuler,
    keanggotaanEkstra,
    absensiEkstra,
    penugasanJabatan,
    profilMadrasah,
    templateSurat,
    catatanBk,
    komponenNilai,
    nilaiSiswa,
  };
}

let memoryStore: DemoStore | null = null;

export function getSeedStore(): DemoStore {
  return buildSeed();
}

export function loadStore(): DemoStore {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const seed = buildSeed();
        
        const parsedPjIds = new Set((parsed.penugasanJabatan || []).map((p: PenugasanJabatan) => p.id_penugasan));
        const mergedPenugasan = [
          ...(parsed.penugasanJabatan || []),
          ...seed.penugasanJabatan.filter((s) => !parsedPjIds.has(s.id_penugasan)),
        ];

        const parsedJadwalIds = new Set((parsed.jadwal || []).map((j: JadwalPelajaran) => j.id_jadwal));
        const mergedJadwal = [
          ...(parsed.jadwal || []),
          ...seed.jadwal.filter((s) => !parsedJadwalIds.has(s.id_jadwal)),
        ];

        const parsedMapelIds = new Set((parsed.mapel || []).map((m: MataPelajaran) => m.id_mapel));
        const mergedMapel = [
          ...(parsed.mapel || []),
          ...seed.mapel.filter((s) => !parsedMapelIds.has(s.id_mapel)),
        ];

        const parsedTemplateIds = new Set((parsed.templateSurat || []).map((t: TemplateSurat) => t.id_template));
        const mergedTemplate = [
          ...(parsed.templateSurat || []),
          ...seed.templateSurat.filter((s) => !parsedTemplateIds.has(s.id_template)),
        ];

        const parsedEkstraIds = new Set((parsed.ekstrakurikuler || []).map((e: Ekstrakurikuler) => e.id_ekstra));
        const mergedEkstra = [
          ...(parsed.ekstrakurikuler || []),
          ...seed.ekstrakurikuler.filter((s) => !parsedEkstraIds.has(s.id_ekstra)),
        ];

        const parsedKeanggotaanIds = new Set((parsed.keanggotaanEkstra || []).map((k: KeanggotaanEkstra) => k.id_keanggotaan));
        const mergedKeanggotaan = [
          ...(parsed.keanggotaanEkstra || []),
          ...seed.keanggotaanEkstra.filter((s) => !parsedKeanggotaanIds.has(s.id_keanggotaan)),
        ];

        const parsedCatatanBkIds = new Set((parsed.catatanBk || []).map((c: CatatanBk) => c.id_catatan));
        const mergedCatatanBk = [
          ...(parsed.catatanBk || []),
          ...seed.catatanBk.filter((s) => !parsedCatatanBkIds.has(s.id_catatan)),
        ];

        const parsedKomponenIds = new Set((parsed.komponenNilai || []).map((k: KomponenNilai) => k.id_komponen));
        const mergedKomponen = [
          ...(parsed.komponenNilai || []),
          ...seed.komponenNilai.filter((s) => !parsedKomponenIds.has(s.id_komponen)),
        ];

        const parsedNilaiIds = new Set((parsed.nilaiSiswa || []).map((n: NilaiSiswa) => n.id_nilai));
        const mergedNilai = [
          ...(parsed.nilaiSiswa || []),
          ...seed.nilaiSiswa.filter((s) => !parsedNilaiIds.has(s.id_nilai)),
        ];

        const store: DemoStore = {
          ...seed,
          ...parsed,
          madrasah: parsed.madrasah?.length ? parsed.madrasah : seed.madrasah,
          penugasanJabatan: mergedPenugasan,
          jadwal: mergedJadwal,
          mapel: mergedMapel,
          templateSurat: mergedTemplate,
          ekstrakurikuler: mergedEkstra,
          keanggotaanEkstra: mergedKeanggotaan,
          catatanBk: mergedCatatanBk,
          komponenNilai: mergedKomponen,
          nilaiSiswa: mergedNilai,
        };
        memoryStore = store;
        return store;
      }
    } catch {
      // fall through to seed
    }
  }
  if (!memoryStore) {
    memoryStore = buildSeed();
  }
  return memoryStore;
}

export function saveStore(store: DemoStore): void {
  memoryStore = store;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }
}

export function resetStore(): DemoStore {
  memoryStore = buildSeed();
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
  }
  return memoryStore;
}

export function mutateStore(mutator: (store: DemoStore) => void): DemoStore {
  const store = structuredClone(loadStore());
  mutator(store);
  saveStore(store);
  return store;
}
