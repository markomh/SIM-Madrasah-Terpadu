export type StatusKeanggotaanEkstra = "Aktif" | "Keluar";
export type StatusAbsensiEkstra = "Hadir" | "Tidak Hadir";

export type Ekstrakurikuler = {
  id_ekstra: string;
  id_madrasah: string;
  nama_ekstra: string;
  id_pembina: string; // id_pegawai mana pun (tugas_utama = "Guru") — status Pembina DIDEFINISIKAN oleh FK ini sendiri
  id_tahun: string;
};

export type KeanggotaanEkstra = {
  id_keanggotaan: string;
  id_siswa: string;
  id_ekstra: string;
  tanggal_mulai: string;
  tanggal_selesai: string | null;
  status: StatusKeanggotaanEkstra;
};

export type AbsensiEkstra = {
  id_absensi_ekstra: string;
  id_keanggotaan: string;
  tanggal: string;
  status: StatusAbsensiEkstra;
};
