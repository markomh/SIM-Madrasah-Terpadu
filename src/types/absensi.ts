export type StatusAbsensi = "Hadir" | "Sakit" | "Izin" | "Alpa";

export type AbsensiSiswa = {
  id_absensi: string;
  tanggal: string;
  id_siswa: string;
  id_rombel: string;
  status: StatusAbsensi;
  catatan: string | null;
};
