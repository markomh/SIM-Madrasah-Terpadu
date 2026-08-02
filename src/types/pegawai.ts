export type Peran =
  | "Admin Madrasah"
  | "Kepala Madrasah"
  | "Operator Kesiswaan"
  | "Wali Kelas"
  | "Guru Mapel"
  | "Orang Tua Wali";

export type Pegawai = {
  id_pegawai: string;
  nik: string;
  nip: string | null;
  npk: string | null;
  nama_lengkap_gelar: string;
  status_kepegawaian: string;
  tugas_utama: string;
  peran: Peran;
};
