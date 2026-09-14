import { BebanMengajar, KetersediaanGuru, RuangFasilitas } from "../types/master-jadwal";
import { apiClient } from "./api-client";

export const bebanMengajarApi = {
  getAll: async (params?: { semester?: string; id_tahun?: string }): Promise<BebanMengajar[]> => {
    let url = "/beban-mengajar";
    const queryParts = [];
    if (params?.semester) queryParts.push(`semester=${params.semester}`);
    if (params?.id_tahun) queryParts.push(`id_tahun=${params.id_tahun}`);
    if (queryParts.length > 0) url += "?" + queryParts.join("&");
    return apiClient.get<BebanMengajar[]>(url);
  },
  create: async (data: Omit<BebanMengajar, "id_beban">): Promise<BebanMengajar> => {
    return apiClient.post<BebanMengajar>("/beban-mengajar", data);
  },
  update: async (id: string, data: Partial<BebanMengajar>): Promise<BebanMengajar> => {
    return apiClient.put<BebanMengajar>(`/beban-mengajar/${id}`, data);
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/beban-mengajar/${id}`);
  },
};

export const ruangFasilitasApi = {
  getAll: async (): Promise<RuangFasilitas[]> => {
    return apiClient.get<RuangFasilitas[]>("/ruang-fasilitas");
  },
  create: async (data: Omit<RuangFasilitas, "id_ruang">): Promise<RuangFasilitas> => {
    return apiClient.post<RuangFasilitas>("/ruang-fasilitas", data);
  },
  update: async (id: string, data: Partial<RuangFasilitas>): Promise<RuangFasilitas> => {
    return apiClient.put<RuangFasilitas>(`/ruang-fasilitas/${id}`, data);
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/ruang-fasilitas/${id}`);
  },
};

export const ketersediaanGuruApi = {
  getAll: async (params?: { id_pegawai?: string }): Promise<KetersediaanGuru[]> => {
    const url = params?.id_pegawai ? `/ketersediaan-guru?id_pegawai=${params.id_pegawai}` : "/ketersediaan-guru";
    return apiClient.get<KetersediaanGuru[]>(url);
  },
  create: async (data: Omit<KetersediaanGuru, "id_ketersediaan">): Promise<KetersediaanGuru> => {
    return apiClient.post<KetersediaanGuru>("/ketersediaan-guru", data);
  },
  update: async (id: string, data: Partial<KetersediaanGuru>): Promise<KetersediaanGuru> => {
    return apiClient.put<KetersediaanGuru>(`/ketersediaan-guru/${id}`, data);
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/ketersediaan-guru/${id}`);
  },
};
