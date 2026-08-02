import type { AnggotaRombel, RiwayatMutasi } from "@/types";

export type PersetujuanItem =
  | { jenis: "pindah_rombel"; data: AnggotaRombel }
  | { jenis: "mutasi"; data: RiwayatMutasi };

export interface PersetujuanService {
  getPending(): Promise<PersetujuanItem[]>;
  approvePindahRombel(id_anggota: string, disetujui_oleh: string): Promise<AnggotaRombel>;
  rejectPindahRombel(id_anggota: string, disetujui_oleh: string, alasan: string): Promise<AnggotaRombel>;
  approveMutasi(id_mutasi: string, disetujui_oleh: string): Promise<RiwayatMutasi>;
  rejectMutasi(id_mutasi: string, disetujui_oleh: string, alasan: string): Promise<RiwayatMutasi>;
}
