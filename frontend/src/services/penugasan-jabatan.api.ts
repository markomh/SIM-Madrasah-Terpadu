import { PenugasanJabatan } from "@/types/penugasan-jabatan";
import { apiClient } from "./api-client";

export const penugasanJabatanApi = {
  getAll: async (): Promise<PenugasanJabatan[]> => {
    return apiClient.get<PenugasanJabatan[]>("/penugasan-jabatan");
  },
  getByPegawai: async (idPegawai: string): Promise<PenugasanJabatan[]> => {
    return apiClient.get<PenugasanJabatan[]>(`/penugasan-jabatan?id_pegawai=${idPegawai}`);
  },
  create: async (data: Omit<PenugasanJabatan, "id_penugasan" | "status" | "tanggal_selesai">): Promise<PenugasanJabatan> => {
    return apiClient.post<PenugasanJabatan>("/penugasan-jabatan", data);
  },
  akhiri: async (idPenugasan: string, _tanggalSelesai: string): Promise<void> => {
    await apiClient.delete(`/penugasan-jabatan/${idPenugasan}`);
  },
  endPenugasan: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/penugasan-jabatan/${id}`);
    return true;
  },
};
