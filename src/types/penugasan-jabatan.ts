export type JenisJabatan =
  | "Kepala Madrasah"
  | "Admin Madrasah"
  | "Operator Kesiswaan"
  | "Guru BK";

export type StatusPenugasan = "Aktif" | "Berakhir";

export type PenugasanJabatan = {
  id_penugasan: string;
  id_pegawai: string;
  jenis_jabatan: JenisJabatan;
  id_tahun: string;
  tanggal_mulai: string;
  tanggal_selesai: string | null;
  status: StatusPenugasan;
};
