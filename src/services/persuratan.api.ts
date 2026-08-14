import { Surat } from "@/types/persuratan";
import { TemplateSurat } from "@/types/lembaga";
import { apiClient } from "./api-client";

export const persuratanApi = {
  getAll: async (): Promise<Surat[]> => {
    return apiClient.get<Surat[]>("/surat");
  },

  getSurat: async (): Promise<Surat[]> => {
    return apiClient.get<Surat[]>("/surat");
  },

  getById: async (id: string): Promise<Surat | null> => {
    try {
      return await apiClient.get<Surat>(`/surat/${id}`);
    } catch {
      return null;
    }
  },

  getSuratById: async (id: string): Promise<Surat | null> => {
    try {
      return await apiClient.get<Surat>(`/surat/${id}`);
    } catch {
      return null;
    }
  },

  create: async (data: Omit<Surat, "id_surat" | "nomor_surat" | "status" | "dibuat_oleh">): Promise<Surat> => {
    return apiClient.post<Surat>("/surat", data);
  },

  createSurat: async (data: Omit<Surat, "id_surat" | "nomor_surat" | "status" | "dibuat_oleh">): Promise<Surat> => {
    return apiClient.post<Surat>("/surat", data);
  },

  requestSign: async (id: string): Promise<Surat> => {
    return apiClient.post<Surat>(`/surat/${id}/aju-ttd`);
  },

  sign: async (id: string): Promise<Surat> => {
    return apiClient.post<Surat>(`/surat/${id}/tandatangani`);
  },

  tandatanganiSurat: async (id: string): Promise<Surat> => {
    return apiClient.post<Surat>(`/surat/${id}/tandatangani`);
  },

  reject: async (id: string): Promise<Surat> => {
    return apiClient.post<Surat>(`/surat/${id}/tolak`);
  },

  tolakSurat: async (id: string): Promise<Surat> => {
    return apiClient.post<Surat>(`/surat/${id}/tolak`);
  },

  getTemplates: async (): Promise<TemplateSurat[]> => {
    return apiClient.get<TemplateSurat[]>("/template-surat");
  },

  getTemplate: async (): Promise<TemplateSurat[]> => {
    return apiClient.get<TemplateSurat[]>("/template-surat");
  },

  createTemplate: async (data: Omit<TemplateSurat, "id_template">): Promise<TemplateSurat> => {
    return apiClient.post<TemplateSurat>("/template-surat", data);
  },
};
