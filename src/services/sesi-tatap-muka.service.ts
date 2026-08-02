import type { SesiTatapMuka, AbsensiSiswa } from "@/types";

export type RekapKehadiranDetail = {
  id_sesi: string;
  nama_guru_seharusnya: string;
  nama_guru_pelaksana: string | null;
  status: string;
  mapel: string;
  rombel: string;
};

export interface SesiTatapMukaService {
  getByRombelTanggal(id_rombel: string, tanggal: string): Promise<SesiTatapMuka[]>;
  catatPresensi(
    id_sesi: string,
    id_pegawai_pelaksana: string,
    absensiSiswa: Array<Omit<AbsensiSiswa, "id_absensi" | "tanggal">>
  ): Promise<SesiTatapMuka>;
  getRekapTanggal(tanggal: string): Promise<{
    terjadwal: number;
    diinput: number;
    tepatWaktu: number;
    terlambat: number;
    digantikan: number;
    daftarDetail: RekapKehadiranDetail[];
  }>;
}
