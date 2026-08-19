import { KomponenNilai, NilaiSiswa } from "@/types/nilai";
import { apiClient } from "./api-client";

export const nilaiApi = {
  getKomponen: async (idMapel?: string): Promise<KomponenNilai[]> => {
    const query = idMapel ? `?id_mapel=${idMapel}` : "";
    return apiClient.get<KomponenNilai[]>(`/nilai/komponen${query}`);
  },

  addKomponen: async (data: Omit<KomponenNilai, "id_komponen">): Promise<KomponenNilai> => {
    return apiClient.post<KomponenNilai>("/nilai/komponen", data);
  },

  createKomponen: async (data: Omit<KomponenNilai, "id_komponen">): Promise<KomponenNilai> => {
    return apiClient.post<KomponenNilai>("/nilai/komponen", data);
  },

  updateKomponen: async (id: string, data: Partial<KomponenNilai>): Promise<KomponenNilai> => {
    return apiClient.put<KomponenNilai>(`/nilai/komponen/${id}`, data);
  },

  deleteKomponen: async (id: string): Promise<void> => {
    await apiClient.delete(`/nilai/komponen/${id}`);
  },

  getNilai: async (filter: { id_rombel?: string; semester?: string; id_mapel?: string; id_siswa?: string }): Promise<NilaiSiswa[]> => {
    const params = new URLSearchParams();
    if (filter.id_siswa) params.append("id_siswa", filter.id_siswa);
    if (filter.id_rombel) params.append("id_rombel", filter.id_rombel);
    if (filter.semester) params.append("semester", filter.semester);
    if (filter.id_mapel) params.append("id_mapel", filter.id_mapel);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<NilaiSiswa[]>(`/nilai${query}`);
  },

  inputNilai: async (data: Omit<NilaiSiswa, "id_nilai" | "tanggal_input">): Promise<NilaiSiswa> => {
    return apiClient.post<NilaiSiswa>("/nilai", data);
  },

  saveNilai: async (data: Omit<NilaiSiswa, "id_nilai" | "tanggal_input">): Promise<NilaiSiswa> => {
    return apiClient.post<NilaiSiswa>("/nilai", data);
  },

  batchInputNilai: async (items: Array<Omit<NilaiSiswa, "id_nilai" | "tanggal_input">>): Promise<NilaiSiswa[]> => {
    const results: NilaiSiswa[] = [];
    for (const item of items) {
      const res = await apiClient.post<NilaiSiswa>("/nilai", item);
      results.push(res);
    }
    return results;
  },
};
