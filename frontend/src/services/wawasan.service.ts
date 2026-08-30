import type { Siswa, JadwalPelajaran } from "@/types";

export type RekomendasiJadwal = {
  id: string;
  ringkasan: string;
  usulan: Omit<JadwalPelajaran, "id_jadwal">[];
  label: "Hasil AI — perlu verifikasi";
};

export interface WawasanService {
  getSiswaBerisiko(minScore?: number, idRombel?: string): Promise<Siswa[]>;
  getRekomendasiJadwal(): Promise<RekomendasiJadwal>;
}
