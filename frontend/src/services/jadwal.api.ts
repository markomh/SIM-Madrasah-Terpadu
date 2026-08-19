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

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/jadwal/${id}`);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/jadwal/${id}`);
  },

  detectConflicts: async (candidate: Omit<JadwalPelajaran, "id_jadwal">, excludeId?: string): Promise<JadwalPelajaran[]> => {
    let url = `/jadwal/check-conflict?id_pegawai=${candidate.id_pegawai}&hari=${candidate.hari}&semester=${candidate.semester}&jam_mulai=${candidate.jam_mulai}&jam_selesai=${candidate.jam_selesai}`;
    if (excludeId) {
      url += `&exclude_id=${excludeId}`;
    }
    return apiClient.get<JadwalPelajaran[]>(url);
  },

  getJtmTerjadwal: async (idPegawai: string, semester: "Ganjil" | "Genap"): Promise<number> => {
    const res = await apiClient.get<{ total_jtm: number }>(`/jadwal/jtm-terjadwal?id_pegawai=${idPegawai}&semester=${semester}`);
    return res.total_jtm;
  },
};
