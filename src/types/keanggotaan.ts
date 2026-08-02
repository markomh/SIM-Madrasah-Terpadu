export type StatusKeanggotaan =
  | "Aktif"
  | "Pindah Rombel"
  | "Naik Kelas"
  | "Tinggal Kelas"
  | "Lulus"
  | "Keluar";

export type JenisPerpindahan =
  | "Awal Masuk"
  | "Pindah Rombel"
  | "Kenaikan Tingkat"
  | "Mutasi Masuk";

export type StatusPersetujuan =
  | "Tidak Perlu"
  | "Menunggu Persetujuan"
  | "Disetujui"
  | "Ditolak";

export type AnggotaRombel = {
  id_anggota: string;
  id_siswa: string;
  id_rombel: string;
  tanggal_mulai: string;
  tanggal_selesai: string | null;
  status_keanggotaan: StatusKeanggotaan;
  jenis_perpindahan: JenisPerpindahan;
  status_persetujuan: StatusPersetujuan;
  diajukan_oleh: string | null;
  disetujui_oleh: string | null;
  tanggal_persetujuan: string | null;
};

export type PemetaanKenaikan = {
  id_pemetaan: string;
  id_rombel_asal: string;
  id_rombel_tujuan: string;
  id_tahun: string;
};
