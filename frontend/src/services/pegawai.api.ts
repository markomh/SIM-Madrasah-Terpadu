import { Pegawai } from "@/types";
import { PegawaiService } from "./pegawai.service";
import { apiClient } from "./api-client";

export const pegawaiApi: PegawaiService = {
  async getAll(filter?: { query?: string; tugas_utama?: "Guru" | "Tendik" }): Promise<Pegawai[]> {
    const params = new URLSearchParams();
    if (filter?.query) params.append("query", filter.query);
    if (filter?.tugas_utama) params.append("tugas_utama", filter.tugas_utama);
    params.append("per_page", "100"); // Load a larger list to prevent truncation
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<Pegawai[]>(`/pegawai${queryString}`);
  },

  async getById(id_pegawai: string): Promise<Pegawai | null> {
    try {
      return await apiClient.get<Pegawai>(`/pegawai/${id_pegawai}`);
    } catch {
      return null;
    }
  },

  async getByTugasUtama(tugas_utama: "Guru" | "Tendik"): Promise<Pegawai[]> {
    return this.getAll({ tugas_utama });
  },
};
