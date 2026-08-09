import type { AnggotaRombel, RiwayatMutasi, Surat } from "@/types";

export type PersetujuanItem =
  | { jenis: "pindah_rombel"; data: AnggotaRombel }
  | { jenis: "mutasi"; data: RiwayatMutasi };

export interface PersetujuanService {
  getPending(): Promise<PersetujuanItem[]>;
  approvePindahRombel(id_anggota: string, disetujui_oleh: string): Promise<AnggotaRombel>;
  rejectPindahRombel(id_anggota: string, disetujui_oleh: string, alasan: string): Promise<AnggotaRombel>;
  approveMutasi(id_mutasi: string, disetujui_oleh: string): Promise<RiwayatMutasi>;
  rejectMutasi(id_mutasi: string, disetujui_oleh: string, alasan: string): Promise<RiwayatMutasi>;
  
  /**
   * Menghasilkan draf Surat SKP sementara di memori untuk keperluan Pratinjau (Preview).
   * Surat ini BELUM disimpan ke dalam database.
   */
  previewMutasiSkp(id_mutasi: string): Promise<Surat>;
  
  /**
   * Melakukan persetujuan mutasi, pembuatan draf SKP, dan penandatanganan (e-Sign) 
   * secara serentak dalam satu transaksi atomik.
   */
  approveAndSignMutasiSkp(id_mutasi: string, id_penandatangan: string): Promise<{ mutasi: RiwayatMutasi; surat: Surat }>;

  /**
   * Otorisasi persetujuan massal (Batch Approval) untuk efisiensi eksekutif.
   */
  batchApprove(
    input: { id_anggota_list?: string[]; id_mutasi_list?: string[] },
    disetujui_oleh: string
  ): Promise<{ approved_pindah: number; approved_mutasi: number }>;

  /**
   * Penolakan massal (Batch Reject) untuk efisiensi eksekutif.
   */
  batchReject(
    input: { id_anggota_list?: string[]; id_mutasi_list?: string[] },
    disetujui_oleh: string,
    alasan: string
  ): Promise<{ rejected_pindah: number; rejected_mutasi: number }>;
}
