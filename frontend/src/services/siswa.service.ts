import type { StatusSiswa, Siswa } from "@/types";

export interface SiswaService {
  getAll(filter?: {
    id_rombel?: string;
    status_siswa?: StatusSiswa;
    query?: string;
  }): Promise<Siswa[]>;
  getById(id_siswa: string): Promise<Siswa | null>;
  create(data: Omit<Siswa, "id_siswa" | "skor_risiko_ai" | "id_madrasah"> & { id_madrasah?: string }): Promise<Siswa>;
  update(id_siswa: string, data: Partial<Siswa>): Promise<Siswa>;
}
