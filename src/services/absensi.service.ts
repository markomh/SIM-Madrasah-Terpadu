import type { AbsensiSiswa, StatusAbsensi } from "@/types";

export interface AbsensiService {
  getByTanggal(tanggal: string, id_rombel?: string): Promise<AbsensiSiswa[]>;
  ensureDefaults(tanggal: string, id_rombel: string): Promise<AbsensiSiswa[]>;
  updateStatus(id_absensi: string, status: StatusAbsensi, catatan?: string | null): Promise<AbsensiSiswa>;
}
