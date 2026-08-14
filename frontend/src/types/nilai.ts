export type KomponenNilai = {
  id_komponen: string;
  id_mapel: string;
  nama_komponen: string;
  bobot: number;
};

export type NilaiSiswa = {
  id_nilai: string;
  id_siswa: string;
  id_komponen: string;
  id_rombel: string;
  id_tahun: string;
  semester: "Ganjil" | "Genap";
  nilai: number;
  id_pegawai_penilai: string;
  tanggal_input: string;
};
