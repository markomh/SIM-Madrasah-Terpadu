import type { JadwalPelajaran } from "@/types";

export interface JadwalService {
  getAll(filter?: { id_rombel?: string; id_pegawai?: string }): Promise<JadwalPelajaran[]>;
  create(data: Omit<JadwalPelajaran, "id_jadwal">): Promise<JadwalPelajaran>;
  remove(id_jadwal: string): Promise<void>;
  detectConflicts(candidate: Omit<JadwalPelajaran, "id_jadwal">, excludeId?: string): Promise<JadwalPelajaran[]>;
}
