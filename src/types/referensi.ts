export type TingkatPendidikan = {
  id_tingkat: string;
  nama_tingkat: string;
  urutan: number;
};

export type TahunAjaran = {
  id_tahun: string;
  nama_tahun: string;
  semester: "Ganjil" | "Genap";
  status_aktif: boolean;
};

export type Rombel = {
  id_rombel: string;
  nama_rombel: string;
  id_tingkat: string;
  id_tahun: string;
  id_wali_kelas: string | null;
};

export type MataPelajaran = {
  id_mapel: string;
  kode_mapel: string;
  nama_mapel: string;
  kelompok_mapel: string;
};

export type HariLibur = {
  id_libur: string;
  tanggal: string;
  nama: string;
  id_tahun: string;
};
