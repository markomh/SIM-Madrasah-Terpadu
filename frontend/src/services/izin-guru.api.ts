import { IzinGuru } from "@/types/kehadiran-guru";
import { apiClient } from "./api-client";

export const izinGuruApi = {
  getAll: async (): Promise<IzinGuru[]> => {
    return apiClient.get<IzinGuru[]>("/izin-guru");
  },

  getById: async (id: string): Promise<IzinGuru | null> => {
    try {
      return await apiClient.get<IzinGuru>(`/izin-guru/${id}`);
    } catch {
      return null;
    }
  },

  create: async (data: Omit<IzinGuru, "id_izin" | "status_rekonsiliasi" | "dicatat_oleh">): Promise<IzinGuru> => {
    return apiClient.post<IzinGuru>("/izin-guru", data);
  },
};
