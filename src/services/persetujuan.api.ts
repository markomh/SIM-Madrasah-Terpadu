import type { AnggotaRombel, RiwayatMutasi, Surat } from "@/types";
import type { PersetujuanItem, PersetujuanService, BatchResult, BatchRejectResult } from "./persetujuan.service";
import { apiClient } from "./api-client";

export const persetujuanApi: PersetujuanService = {
  async getPending(): Promise<PersetujuanItem[]> {
    return apiClient.get<PersetujuanItem[]>("/persetujuan/pending");
  },

  async approvePindahRombel(id_anggota: string, disetujui_oleh: string): Promise<AnggotaRombel> {
    return apiClient.post<AnggotaRombel>(`/persetujuan/pindah-rombel/${id_anggota}/setujui`, { disetujui_oleh });
  },

  async rejectPindahRombel(id_anggota: string, disetujui_oleh: string, alasan: string): Promise<AnggotaRombel> {
    return apiClient.post<AnggotaRombel>(`/persetujuan/pindah-rombel/${id_anggota}/tolak`, { disetujui_oleh, alasan });
  },

  async approveMutasi(id_mutasi: string, disetujui_oleh: string): Promise<RiwayatMutasi> {
    return apiClient.post<RiwayatMutasi>(`/persetujuan/mutasi/${id_mutasi}/setujui`, { disetujui_oleh });
  },

  async rejectMutasi(id_mutasi: string, disetujui_oleh: string, alasan: string): Promise<RiwayatMutasi> {
    return apiClient.post<RiwayatMutasi>(`/persetujuan/mutasi/${id_mutasi}/tolak`, { disetujui_oleh, alasan });
  },

  async previewMutasiSkp(id_mutasi: string): Promise<Surat> {
    return apiClient.get<Surat>(`/persetujuan/mutasi/${id_mutasi}/preview-skp`);
  },

  async approveAndSignMutasiSkp(id_mutasi: string, id_penandatangan: string): Promise<{ mutasi: RiwayatMutasi; surat: Surat }> {
    return apiClient.post<{ mutasi: RiwayatMutasi; surat: Surat }>(`/persetujuan/mutasi/${id_mutasi}/approve-sign-skp`, { id_penandatangan });
  },

  async batchApprove(input: { id_anggota_list?: string[]; id_mutasi_list?: string[] }, disetujui_oleh: string): Promise<BatchResult> {
    return apiClient.post<BatchResult>("/persetujuan/batch-approve", { ...input, disetujui_oleh });
  },

  async batchReject(input: { id_anggota_list?: string[]; id_mutasi_list?: string[] }, disetujui_oleh: string, alasan: string): Promise<BatchRejectResult> {
    return apiClient.post<BatchRejectResult>("/persetujuan/batch-reject", { ...input, disetujui_oleh, alasan });
  },
};
