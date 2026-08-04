export type StatusSiswa = "Aktif" | "Lulus" | "Mutasi Keluar" | "Drop Out";
export type JalurMasuk = "PPDB Reguler" | "Mutasi Masuk";

export type Siswa = {
  id_siswa: string;
  nik: string;
  nisn: string;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: "L" | "P";
  agama: string;
  nama_ibu_kandung: string;
  status_siswa: StatusSiswa;
  jalur_masuk: JalurMasuk;
  alamat_detail: string | null;
  id_desa: string | null;
  skor_risiko_ai: number | null;
};
