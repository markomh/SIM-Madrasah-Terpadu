import { TahunAjaran, MataPelajaran, Rombel } from "@/types/referensi";
import { apiClient } from "./api-client";

export const referensiApi = {
  getTahunAjaran: async (): Promise<TahunAjaran[]> => {
    return apiClient.get<TahunAjaran[]>("/referensi/tahun-ajaran");
  },

  createTahunAjaran: async (data: Omit<TahunAjaran, "id_tahun" | "status_aktif" | "id_madrasah"> & { id_madrasah?: string }): Promise<TahunAjaran> => {
    return apiClient.post<TahunAjaran>("/referensi/tahun-ajaran", { id_madrasah: "md_1", ...data });
  },

  aktifkanTahunAjaran: async (id: string): Promise<TahunAjaran> => {
    return apiClient.patch<TahunAjaran>(`/referensi/tahun-ajaran/${id}/aktifkan`);
  },

  getMataPelajaran: async (): Promise<MataPelajaran[]> => {
    return apiClient.get<MataPelajaran[]>("/referensi/mata-pelajaran");
  },

  createMataPelajaran: async (data: Omit<MataPelajaran, "id_mapel" | "id_madrasah"> & { id_madrasah?: string }): Promise<MataPelajaran> => {
    return apiClient.post<MataPelajaran>("/referensi/mata-pelajaran", { id_madrasah: "md_1", ...data });
  },

  updateMataPelajaran: async (id: string, data: Partial<MataPelajaran>): Promise<MataPelajaran> => {
    return apiClient.put<MataPelajaran>(`/referensi/mata-pelajaran/${id}`, data);
  },

  deleteMataPelajaran: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/referensi/mata-pelajaran/${id}`);
    return true;
  },

  getRombel: async (): Promise<Rombel[]> => {
    return apiClient.get<Rombel[]>("/rombel");
  },

  createRombel: async (data: Omit<Rombel, "id_rombel" | "id_madrasah"> & { id_madrasah?: string }): Promise<Rombel> => {
    return apiClient.post<Rombel>("/rombel", { id_madrasah: "md_1", ...data });
  },

  updateRombel: async (id: string, data: Partial<Rombel>): Promise<Rombel> => {
    return apiClient.put<Rombel>(`/rombel/${id}`, data);
  },

  deleteRombel: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/rombel/${id}`);
    return true;
  },
};
