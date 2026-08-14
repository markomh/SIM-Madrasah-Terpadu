import { Siswa } from "@/types/siswa";
import { apiClient } from "./api-client";

export const siswaApi = {
  getAll: async (filter?: { status_siswa?: string; id_rombel?: string; query?: string }): Promise<Siswa[]> => {
    const params = new URLSearchParams();
    if (filter?.status_siswa) params.append("status_siswa", filter.status_siswa);
    if (filter?.id_rombel) params.append("id_rombel", filter.id_rombel);
    if (filter?.query) params.append("query", filter.query);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<Siswa[]>(`/siswa${queryString}`);
  },

  getById: async (id: string): Promise<Siswa | null> => {
    try {
      return await apiClient.get<Siswa>(`/siswa/${id}`);
    } catch {
      return null;
    }
  },

  create: async (data: Omit<Siswa, "id_siswa" | "status_siswa" | "id_madrasah"> & { id_madrasah?: string }): Promise<Siswa> => {
    return apiClient.post<Siswa>("/siswa", { id_madrasah: "md_1", ...data });
  },

  update: async (id: string, data: Partial<Siswa>): Promise<Siswa> => {
    return apiClient.put<Siswa>(`/siswa/${id}`, data);
  },

  delete: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/siswa/${id}`);
    return true;
  },
};
