export type RuangFasilitas = {
  id_ruang: string;
  nama_ruang: string;
  tipe_fasilitas: "Reguler" | "Terbatas";
};

export type KetersediaanGuru = {
  id_ketersediaan: string;
  id_pegawai: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  is_mandatory: boolean;
  alasan?: string;
};

export type BebanMengajar = {
  id_beban: string;
  id_tahun: string;
  semester: "Ganjil" | "Genap";
  id_rombel: string;
  id_mapel: string;
  id_pegawai: string;
  jtm_total: number;
};
