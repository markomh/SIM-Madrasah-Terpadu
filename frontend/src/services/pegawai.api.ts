import { Pegawai } from "@/types/pegawai";
import { apiClient } from "./api-client";

export const pegawaiApi = {
  getAll: async (filter?: { query?: string; status_kepegawaian?: string }): Promise<Pegawai[]> => {
    const params = new URLSearchParams();
    if (filter?.query) params.append("query", filter.query);
    if (filter?.status_kepegawaian) params.append("status_kepegawaian", filter.status_kepegawaian);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<Pegawai[]>(`/pegawai${queryString}`);
  },

  getById: async (id: string): Promise<Pegawai | null> => {
    try {
      return await apiClient.get<Pegawai>(`/pegawai/${id}`);
    } catch {
      return null;
    }
  },

  create: async (data: Omit<Pegawai, "id_pegawai">): Promise<Pegawai> => {
    return apiClient.post<Pegawai>("/pegawai", data);
  },

  update: async (id: string, data: Partial<Pegawai>): Promise<Pegawai> => {
    return apiClient.put<Pegawai>(`/pegawai/${id}`, data);
  },

  delete: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/pegawai/${id}`);
    return true;
  },
};
