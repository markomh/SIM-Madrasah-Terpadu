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
} from "@/types";

export const STORAGE_KEY = "sim-madrasah-demo-store-v1";
export const SIMULATE_ERROR_KEY = "sim-madrasah-simulate-error";

export type DemoStore = {
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

export function maskNik(nik: string): string {
  if (nik.length < 6) return nik;
  return `${nik.slice(0, 2)}${"*".repeat(Math.max(0, nik.length - 4))}${nik.slice(-2)}`;
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
  const tahunAjaran: TahunAjaran[] = [
    { id_tahun: "ta_2526", nama_tahun: "2025/2026", semester: "Genap", status_aktif: false },
    { id_tahun: "ta_2627", nama_tahun: "2026/2027", semester: "Ganjil", status_aktif: true },
  ];

  const tingkat: TingkatPendidikan[] = [
    { id_tingkat: "t_10", nama_tingkat: "Kelas 10", urutan: 10 },
    { id_tingkat: "t_11", nama_tingkat: "Kelas 11", urutan: 11 },
    { id_tingkat: "t_12", nama_tingkat: "Kelas 12", urutan: 12 },
  ];

  const mapel: MataPelajaran[] = [
    { id_mapel: "mp_pai", kode_mapel: "PAI", nama_mapel: "Pendidikan Agama Islam", kelompok_mapel: "Agama" },
    { id_mapel: "mp_mtk", kode_mapel: "MTK", nama_mapel: "Matematika", kelompok_mapel: "Umum" },
    { id_mapel: "mp_bind", kode_mapel: "BIN", nama_mapel: "Bahasa Indonesia", kelompok_mapel: "Umum" },
    { id_mapel: "mp_bing", kode_mapel: "BIG", nama_mapel: "Bahasa Inggris", kelompok_mapel: "Umum" },
    { id_mapel: "mp_ipa", kode_mapel: "IPA", nama_mapel: "Ilmu Pengetahuan Alam", kelompok_mapel: "Umum" },
    { id_mapel: "mp_qur", kode_mapel: "QUR", nama_mapel: "Al-Qur'an Hadis", kelompok_mapel: "Agama" },
  ];

  const pegawai: Pegawai[] = [
    { id_pegawai: "pg_kepala", nik: "3175010101800001", nip: "197801012005011001", npk: null, nama_lengkap_gelar: "Dra. Nurul Hidayah, M.Pd.", status_kepegawaian: "PNS", tugas_utama: "Kepala Madrasah", peran: "Kepala Madrasah" },
    { id_pegawai: "pg_admin", nik: "3175010201850002", nip: "198502022010011002", npk: null, nama_lengkap_gelar: "Ahmad Firdaus, S.Kom.", status_kepegawaian: "PNS", tugas_utama: "Admin Sistem", peran: "Admin Madrasah" },
    { id_pegawai: "pg_ops", nik: "3175010301900003", nip: null, npk: "NPK-003", nama_lengkap_gelar: "Lina Safitri, S.Pd.", status_kepegawaian: "Non-PNS", tugas_utama: "Operator Kesiswaan", peran: "Operator Kesiswaan" },
    { id_pegawai: "pg_wali_a", nik: "3175010401880004", nip: "198804042008011003", npk: null, nama_lengkap_gelar: "Budi Santoso, S.Pd.", status_kepegawaian: "PNS", tugas_utama: "Guru Mapel", peran: "Wali Kelas" },
    { id_pegawai: "pg_wali_b", nik: "3175010501870005", nip: "198705052009012004", npk: null, nama_lengkap_gelar: "Suci Rahmawati, S.Pd.", status_kepegawaian: "PNS", tugas_utama: "Guru Mapel", peran: "Wali Kelas" },
    { id_pegawai: "pg_wali_c", nik: "3175010601860006", nip: null, npk: "NPK-006", nama_lengkap_gelar: "Rangga Pratama, S.Pd.", status_kepegawaian: "Honorer", tugas_utama: "Guru Mapel", peran: "Wali Kelas" },
    { id_pegawai: "pg_guru_1", nik: "3175010701910007", nip: null, npk: "NPK-007", nama_lengkap_gelar: "Dewi Kartika, S.Pd.", status_kepegawaian: "Non-PNS", tugas_utama: "Guru Mapel", peran: "Guru Mapel" },
    { id_pegawai: "pg_guru_2", nik: "3175010801890008", nip: "198908082011011005", npk: null, nama_lengkap_gelar: "Hendra Wijaya, M.Pd.", status_kepegawaian: "PNS", tugas_utama: "Guru Mapel", peran: "Guru Mapel" },
    { id_pegawai: "pg_tendik", nik: "3175010901920009", nip: null, npk: "NPK-009", nama_lengkap_gelar: "Maya Anggraini", status_kepegawaian: "Honorer", tugas_utama: "Tendik", peran: "Admin Madrasah" },
    { id_pegawai: "pg_ortu", nik: "3175011001750010", nip: null, npk: null, nama_lengkap_gelar: "Suryani (Wali)", status_kepegawaian: "—", tugas_utama: "Orang Tua/Wali", peran: "Orang Tua Wali" },
  ];

  const rombel: Rombel[] = [
    { id_rombel: "rb_10a", nama_rombel: "10-A", id_tingkat: "t_10", id_tahun: "ta_2627", id_wali_kelas: "pg_wali_a" },
    { id_rombel: "rb_10b", nama_rombel: "10-B", id_tingkat: "t_10", id_tahun: "ta_2627", id_wali_kelas: "pg_wali_b" },
    { id_rombel: "rb_11a", nama_rombel: "11-A", id_tingkat: "t_11", id_tahun: "ta_2627", id_wali_kelas: "pg_wali_c" },
    { id_rombel: "rb_11b", nama_rombel: "11-B", id_tingkat: "t_11", id_tahun: "ta_2627", id_wali_kelas: "pg_guru_1" },
    { id_rombel: "rb_12a", nama_rombel: "12-A", id_tingkat: "t_12", id_tahun: "ta_2627", id_wali_kelas: "pg_guru_2" },
    { id_rombel: "rb_12b", nama_rombel: "12-B", id_tingkat: "t_12", id_tahun: "ta_2627", id_wali_kelas: "pg_wali_a" },
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
    const risk = i % 7 === 0 ? 72 + (i % 20) : i % 11 === 0 ? 55 + (i % 10) : null;
    return {
      id_siswa: `sw_${String(i + 1).padStart(2, "0")}`,
      nik: `3175${String(100000000000 + i).slice(0, 12)}`,
      nisn: `${3000000000 + i * 17}`,
      nama_lengkap: `${fn} ${lastNames[i]}`.toUpperCase(),
      tempat_lahir: i % 3 === 0 ? "Jakarta" : i % 3 === 1 ? "Bogor" : "Depok",
      tanggal_lahir: `20${8 + (i % 5)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`,
      jenis_kelamin: jk,
      agama: "Islam",
      nama_ibu_kandung: `Ibu ${lastNames[i]}`,
      status_siswa: i === 3 ? "Mutasi Keluar" : "Aktif",
      jalur_masuk: i % 9 === 0 ? "Mutasi Masuk" : "PPDB Reguler",
      skor_risiko_ai: risk,
    };
  });

  const rombelIds = ["rb_10a", "rb_10b", "rb_11a", "rb_11b", "rb_12a", "rb_12b"];
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
      id_rombel: "rb_11a",
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
    nik: "3175999900000031",
    nisn: "3099990031",
    nama_lengkap: "RAFIQ ALFARIZI",
    tempat_lahir: "Bogor",
    tanggal_lahir: "2010-03-12",
    jenis_kelamin: "L",
    agama: "Islam",
    nama_ibu_kandung: "Ibu Alfarizi",
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
    mt_01: "rb_10a",
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

  const jadwal: JadwalPelajaran[] = [
    { id_jadwal: "jd_1", id_rombel: "rb_10a", id_pegawai: "pg_guru_2", id_mapel: "mp_mtk", hari: "Senin", jam_mulai: "07:00", jam_selesai: "08:30" },
    { id_jadwal: "jd_2", id_rombel: "rb_10a", id_pegawai: "pg_guru_1", id_mapel: "mp_bind", hari: "Senin", jam_mulai: "08:30", jam_selesai: "10:00" },
    { id_jadwal: "jd_3", id_rombel: "rb_10b", id_pegawai: "pg_wali_a", id_mapel: "mp_qur", hari: "Senin", jam_mulai: "07:00", jam_selesai: "08:30" },
    { id_jadwal: "jd_4", id_rombel: "rb_11a", id_pegawai: "pg_guru_2", id_mapel: "mp_ipa", hari: "Selasa", jam_mulai: "07:00", jam_selesai: "08:30" },
    { id_jadwal: "jd_5", id_rombel: "rb_11a", id_pegawai: "pg_wali_c", id_mapel: "mp_pai", hari: "Selasa", jam_mulai: "08:30", jam_selesai: "10:00" },
    { id_jadwal: "jd_6", id_rombel: "rb_12a", id_pegawai: "pg_guru_1", id_mapel: "mp_bing", hari: "Rabu", jam_mulai: "10:00", jam_selesai: "11:30" },
  ];

  const surat: Surat[] = [
    { id_surat: "sr_1", nomor_surat: "421/001/SK/2026", judul: "SK Kenaikan Kelas", jenis: "SK", status: "Menunggu Tanda Tangan", dibuat_oleh: "pg_ops", ditandatangani_oleh: null, tanggal_dibuat: todayIso(), isi_ringkas: "Surat keputusan kenaikan kelas tahun ajaran 2026/2027", hasil_ai: false },
    { id_surat: "sr_2", nomor_surat: "421/014/SKT/2026", judul: "Surat Keterangan Aktif", jenis: "Surat Keterangan", status: "Ditandatangani", dibuat_oleh: "pg_ops", ditandatangani_oleh: "pg_kepala", tanggal_dibuat: "2026-07-20", isi_ringkas: "Keterangan siswa aktif belajar", hasil_ai: false },
    { id_surat: "sr_3", nomor_surat: "DRAFT-AI-003", judul: "Surat Tugas Mengajar", jenis: "Surat Tugas", status: "Draft", dibuat_oleh: "pg_admin", ditandatangani_oleh: null, tanggal_dibuat: todayIso(), isi_ringkas: "Draf AI — perlu verifikasi sebelum ditandatangani", hasil_ai: true },
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
      id_pegawai: "pg_guru_1",
      tanggal_izin: todayIso(),
      jenis_izin: "Direncanakan H-1",
      alasan: "Acara keluarga",
      id_pegawai_pengganti: "pg_wali_c",
      saluran_pelaporan: "WA Pribadi Kepala Madrasah",
      dilaporkan_pada: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      status_rekonsiliasi: "Tepat Waktu",
      dicatat_oleh: "pg_admin",
    },
    {
      id_izin: "iz_2",
      id_pegawai: "pg_guru_2",
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
      id_jadwal: "jd_1", // MTK by pg_guru_2
      tanggal: todayIso(),
      id_pegawai_pelaksana: "pg_guru_2",
      waktu_input: new Date(new Date().setHours(7, 5, 0, 0)).toISOString(),
      is_guru_pengganti: false,
      id_izin_terkait: null,
      status_kehadiran_guru: "Tepat Waktu",
    },
    {
      id_sesi: "st_2",
      id_jadwal: "jd_2", // BIN by pg_guru_1 -> tapi izin, diganti pg_wali_c
      tanggal: todayIso(),
      id_pegawai_pelaksana: "pg_wali_c",
      waktu_input: new Date(new Date().setHours(8, 30, 0, 0)).toISOString(),
      is_guru_pengganti: true,
      id_izin_terkait: "iz_1",
      status_kehadiran_guru: "Digantikan Terjadwal",
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
    },
    {
      id_sesi: "st_4",
      id_jadwal: "jd_4", // IPA by pg_guru_2 (who is sick, replaced by pg_wali_b but mendadak)
      tanggal: todayIso(),
      id_pegawai_pelaksana: "pg_wali_b",
      waktu_input: new Date(new Date().setHours(7, 0, 0, 0)).toISOString(),
      is_guru_pengganti: true,
      id_izin_terkait: null,
      status_kehadiran_guru: "Digantikan Mendadak",
    }
  ];

  return {
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
        memoryStore = JSON.parse(raw) as DemoStore;
        return memoryStore;
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
