import { CatatanBk } from "@/types/bk";
import { apiClient } from "./api-client";

export const bkApi = {
  getCatatan: async (idSiswa?: string): Promise<CatatanBk[]> => {
    const query = idSiswa ? `?id_siswa=${idSiswa}` : "";
    return apiClient.get<CatatanBk[]>(`/bk/catatan${query}`);
  },

  getBySiswa: async (idSiswa: string): Promise<CatatanBk[]> => {
    return apiClient.get<CatatanBk[]>(`/bk/catatan?id_siswa=${idSiswa}`);
  },

  getCatatanById: async (id: string): Promise<CatatanBk | null> => {
    try {
      return await apiClient.get<CatatanBk>(`/bk/catatan/${id}`);
    } catch {
      return null;
    }
  },

  create: async (data: Omit<CatatanBk, "id_catatan" | "id_madrasah"> & { id_madrasah?: string }): Promise<CatatanBk> => {
    return apiClient.post<CatatanBk>("/bk/catatan", { id_madrasah: "md_1", ...data });
  },

  createCatatan: async (data: Omit<CatatanBk, "id_catatan" | "id_madrasah"> & { id_madrasah?: string }): Promise<CatatanBk> => {
    return apiClient.post<CatatanBk>("/bk/catatan", { id_madrasah: "md_1", ...data });
  },
};
