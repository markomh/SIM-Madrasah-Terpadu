import type { RiwayatMutasi } from "@/types";

export type MutasiMasukInput = {
  nik: string;
  nisn: string;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: "L" | "P";
  agama: string;
  nama_ibu_kandung: string;
  sekolah_asal: string;
  tanggal_mutasi: string;
  no_surat_mutasi: string;
  alasan: string;
  id_rombel_tujuan: string;
  id_tahun: string;
  diajukan_oleh: string;
};

export type MutasiKeluarInput = {
  id_siswa: string;
  sekolah_tujuan: string;
  tanggal_mutasi: string;
  no_surat_mutasi: string;
  alasan: string;
  id_tahun: string;
  diajukan_oleh: string;
};

export interface MutasiService {
  getAll(filter?: { status?: RiwayatMutasi["status_persetujuan"] }): Promise<RiwayatMutasi[]>;
  getById(id_mutasi: string): Promise<RiwayatMutasi | null>;
  ajukanMasuk(data: MutasiMasukInput): Promise<RiwayatMutasi>;
  ajukanKeluar(data: MutasiKeluarInput): Promise<RiwayatMutasi>;
}
