import { HariLibur, MataPelajaran, Rombel, TahunAjaran, TingkatPendidikan } from "@/types";
import { ReferensiService } from "./referensi.service";
import { apiClient } from "./api-client";

export const referensiApi: ReferensiService = {
  async getTahunAjaran(): Promise<TahunAjaran[]> {
    return apiClient.get<TahunAjaran[]>("/referensi/tahun-ajaran");
  },

  async getTahunAktif(): Promise<TahunAjaran | null> {
    const list = await this.getTahunAjaran();
    return list.find((t) => t.status_aktif) ?? null;
  },

  async getTingkat(): Promise<TingkatPendidikan[]> {
    return apiClient.get<TingkatPendidikan[]>("/referensi/tingkat");
  },

  async createTingkat(data: Omit<TingkatPendidikan, "id_tingkat">): Promise<TingkatPendidikan> {
    return apiClient.post<TingkatPendidikan>("/referensi/tingkat", data);
  },

  async getRombel(filter?: { id_tahun?: string; id_tingkat?: string }): Promise<Rombel[]> {
    let url = "/rombel";
    const params = new URLSearchParams();
    if (filter?.id_tahun) params.append("id_tahun", filter.id_tahun);
    if (filter?.id_tingkat) params.append("id_tingkat", filter.id_tingkat);
    const query = params.toString();
    if (query) url += `?${query}`;
    return apiClient.get<Rombel[]>(url);
  },

  async createRombel(data: Omit<Rombel, "id_rombel" | "id_madrasah"> & { id_madrasah?: string }): Promise<Rombel> {
    return apiClient.post<Rombel>("/rombel", data);
  },

  async updateRombel(id_rombel: string, data: Partial<Rombel>): Promise<Rombel> {
    return apiClient.put<Rombel>(`/rombel/${id_rombel}`, data);
  },

  async getMapel(): Promise<MataPelajaran[]> {
    return apiClient.get<MataPelajaran[]>("/referensi/mata-pelajaran");
  },

  async createMapel(data: Omit<MataPelajaran, "id_mapel" | "id_madrasah"> & { id_madrasah?: string }): Promise<MataPelajaran> {
    return apiClient.post<MataPelajaran>("/referensi/mata-pelajaran", data);
  },

  async getHariLibur(): Promise<HariLibur[]> {
    return apiClient.get<HariLibur[]>("/referensi/hari-libur");
  },

  async createHariLibur(data: Omit<HariLibur, "id_libur">): Promise<HariLibur> {
    return apiClient.post<HariLibur>("/referensi/hari-libur", data);
  },
};
