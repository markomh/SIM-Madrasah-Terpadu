import type { StatusPersetujuan } from "./keanggotaan";

export type JenisMutasi = "Masuk" | "Keluar";

export type RiwayatMutasi = {
  id_mutasi: string;
  id_siswa: string;
  jenis_mutasi: JenisMutasi;
  sekolah_asal: string | null;
  sekolah_tujuan: string | null;
  tanggal_mutasi: string;
  no_surat_mutasi: string;
  alasan: string;
  status_persetujuan: Exclude<StatusPersetujuan, "Tidak Perlu">;
  diajukan_oleh: string;
  disetujui_oleh: string | null;
  tanggal_persetujuan: string | null;
  id_tahun: string;
  id_surat_skp?: string | null;
};
