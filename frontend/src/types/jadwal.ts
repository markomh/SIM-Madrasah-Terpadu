export type JadwalPelajaran = {
  id_jadwal: string;
  id_rombel: string;
  id_pegawai: string;
  id_mapel: string;
  semester: "Ganjil" | "Genap";
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  id_ruang?: string;
  id_pengajar_tambahan?: string[];
};
