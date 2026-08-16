import { Siswa } from "@/types";
import { SiswaService } from "./siswa.service";
import { apiClient } from "./api-client";

export const siswaApi: SiswaService = {
  async getAll(filter?: { status_siswa?: string; id_rombel?: string; query?: string }): Promise<Siswa[]> {
    const params = new URLSearchParams();
    if (filter?.status_siswa) params.append("status_siswa", filter.status_siswa);
    if (filter?.id_rombel) params.append("id_rombel", filter.id_rombel);
    if (filter?.query) params.append("query", filter.query);
    // Request per_page=100 to ensure we load enough students in the listing
    params.append("per_page", "100");
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<Siswa[]>(`/siswa${queryString}`);
  },

  async getById(id_siswa: string): Promise<Siswa | null> {
    try {
      return await apiClient.get<Siswa>(`/siswa/${id_siswa}`);
    } catch {
      return null;
    }
  },

  async create(data: Omit<Siswa, "id_siswa" | "skor_risiko_ai" | "id_madrasah"> & { id_madrasah?: string }): Promise<Siswa> {
    return apiClient.post<Siswa>("/siswa", data);
  },

  async update(id_siswa: string, data: Partial<Siswa>): Promise<Siswa> {
    return apiClient.put<Siswa>(`/siswa/${id_siswa}`, data);
  },
};
