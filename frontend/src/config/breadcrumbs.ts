export type BreadcrumbConfig = {
  label: string;
  href?: string;
};

export const BREADCRUMB_MAP: Record<string, BreadcrumbConfig> = {
  // Group Kesiswaan
  kesiswaan: { label: "Kesiswaan" },
  siswa: { label: "Data Siswa", href: "/kesiswaan/siswa" },
  rombel: { label: "Rombongan Belajar", href: "/kesiswaan/rombel" },
  "pindah-rombel": { label: "Pindah Rombel", href: "/kesiswaan/pindah-rombel" },
  "kenaikan-kelas": { label: "Kenaikan Kelas", href: "/kesiswaan/kenaikan-kelas" },
  mutasi: { label: "Mutasi Siswa", href: "/kesiswaan/mutasi" },
  bk: { label: "Bimbingan Konseling", href: "/kesiswaan/bk" },
  tambah: { label: "Tambah Data" },

  // Group Kepegawaian
  kepegawaian: { label: "Kepegawaian" },
  pegawai: { label: "Data PTK", href: "/kepegawaian/pegawai" },
  penugasan: { label: "Penugasan & SK", href: "/penugasan" },
  kedisiplinan: { label: "Kedisiplinan & Kehadiran", href: "/kepegawaian/kedisiplinan" },
  izin: { label: "Izin PTK", href: "/kepegawaian/izin" },

  // Group Akademik
  akademik: { label: "Akademik" },
  jadwal: { label: "Jadwal Pelajaran", href: "/akademik/jadwal" },
  nilai: { label: "Penilaian & Gradebook", href: "/akademik/nilai" },
  "presensi-siswa": { label: "Absensi Siswa", href: "/akademik/presensi-siswa" },
  "rekap-presensi": { label: "Rekap Kehadiran", href: "/akademik/rekap-presensi" },
  ekstrakurikuler: { label: "Ekstrakurikuler", href: "/akademik/ekstrakurikuler" },
  "master-data": { label: "Master Data" },

  // Group Administrasi
  persuratan: { label: "Persuratan", href: "/persuratan" },

  // Group Monitoring & Laporan
  wawasan: { label: "Laporan & Wawasan", href: "/wawasan" },

  // Group Sistem & Profil
  referensi: { label: "Referensi Master Data", href: "/referensi" },
  wilayah: { label: "Wilayah & Alamat", href: "/referensi/wilayah" },
  pengaturan: { label: "Pengaturan" },
  sistem: { label: "Sistem & Integrasi", href: "/pengaturan/sistem" },
  persetujuan: { label: "Kotak Persetujuan", href: "/persetujuan" },
  "portal-ortu": { label: "Portal Orang Tua", href: "/portal-ortu" },
  akun: { label: "Profil Akun", href: "/akun" },
};
