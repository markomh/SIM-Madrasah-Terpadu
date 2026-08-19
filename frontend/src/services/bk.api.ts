import { CatatanBk } from "@/types/bk";
import { apiClient } from "./api-client";
import { BkService } from "./bk.service";

export const bkApi: BkService = {
  getBySiswa: async (id_siswa: string, _requesterId?: string): Promise<CatatanBk[]> => {
    return apiClient.get<CatatanBk[]>(`/bk/catatan?id_siswa=${id_siswa}`);
  },

  create: async (data: Omit<CatatanBk, "id_catatan" | "id_madrasah"> & { id_madrasah?: string }): Promise<CatatanBk> => {
    return apiClient.post<CatatanBk>("/bk/catatan", { id_madrasah: "md_1", ...data });
  },
};
