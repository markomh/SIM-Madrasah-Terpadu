export type { MataPelajaran } from "./mata-pelajaran";

export type TingkatPendidikan = {
  id_tingkat: string;
  nama_tingkat: string;
  urutan: number;
};

export type TahunAjaran = {
  id_tahun: string;
  id_madrasah: string;
  nama_tahun: string;
  status_aktif: boolean;
};

export type Rombel = {
  id_rombel: string;
  id_madrasah: string;
  nama_rombel: string;
  id_tingkat: string;
  id_tahun: string;
  id_wali_kelas: string | null;
};

export type HariLibur = {
  id_libur: string;
  tanggal: string;
  nama: string;
  id_tahun: string;
};
