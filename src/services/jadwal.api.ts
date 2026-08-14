import { JadwalPelajaran } from "@/types/jadwal";
import { apiClient } from "./api-client";

export const jadwalApi = {
  getAll: async (): Promise<JadwalPelajaran[]> => {
    return apiClient.get<JadwalPelajaran[]>("/jadwal");
  },

  getByRombel: async (idRombel: string): Promise<JadwalPelajaran[]> => {
    return apiClient.get<JadwalPelajaran[]>(`/jadwal?id_rombel=${idRombel}`);
  },

  getByPegawai: async (idPegawai: string): Promise<JadwalPelajaran[]> => {
    return apiClient.get<JadwalPelajaran[]>(`/jadwal?id_pegawai=${idPegawai}`);
  },

  create: async (data: Omit<JadwalPelajaran, "id_jadwal">): Promise<JadwalPelajaran> => {
    return apiClient.post<JadwalPelajaran>("/jadwal", data);
  },

  update: async (id: string, data: Partial<JadwalPelajaran>): Promise<JadwalPelajaran> => {
    return apiClient.put<JadwalPelajaran>(`/jadwal/${id}`, data);
  },

  remove: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/jadwal/${id}`);
    return true;
  },

  delete: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/jadwal/${id}`);
    return true;
  },

  detectConflicts: async (): Promise<Array<{ id_pegawai: string; id_jadwal_1: string; id_jadwal_2: string }>> => {
    return apiClient.get<Array<{ id_pegawai: string; id_jadwal_1: string; id_jadwal_2: string }>>("/jadwal/konflik");
  },

  getJtmTerjadwal: async (idPegawai: string, semester: "Ganjil" | "Genap"): Promise<number> => {
    const res = await apiClient.get<{ total_jtm: number }>(`/jadwal/jtm-terjadwal?id_pegawai=${idPegawai}&semester=${semester}`);
    return res.total_jtm;
  },
};
