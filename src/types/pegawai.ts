export type Pegawai = {
  id_pegawai: string;
  nik: string;
  nip: string | null;
  npk: string | null;
  nama_lengkap_gelar: string;
  status_kepegawaian: string;
  tugas_utama: "Guru" | "Tendik";
  alamat_detail: string | null;
  id_desa: string | null;
  mapel_sertifikasi: string[];
};
