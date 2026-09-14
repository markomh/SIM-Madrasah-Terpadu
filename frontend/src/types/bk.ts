export type KategoriCatatanBk = "Akademik" | "Perilaku" | "Pribadi" | "Sosial";
export type TingkatKerahasiaan = "Umum" | "Rahasia";

export type CatatanBk = {
  id_catatan: string;
  id_madrasah: string;
  id_siswa: string;
  id_pegawai_bk: string; // id_pegawai yang memiliki PlottingBKTIK untuk id_rombel siswa tersebut
  tanggal: string;
  kategori: KategoriCatatanBk;
  catatan: string;
  tingkat_kerahasiaan: TingkatKerahasiaan;
};
