import { Ekstrakurikuler, KeanggotaanEkstra, AbsensiEkstra } from "@/types/ekstrakurikuler";
import { apiClient } from "./api-client";

export const ekstrakurikulerApi = {
  getAll: async (): Promise<Ekstrakurikuler[]> => {
    return apiClient.get<Ekstrakurikuler[]>("/ekstrakurikuler");
  },

  getById: async (id: string): Promise<Ekstrakurikuler | null> => {
    try {
      return await apiClient.get<Ekstrakurikuler>(`/ekstrakurikuler/${id}`);
    } catch {
      return null;
    }
  },

  create: async (data: Omit<Ekstrakurikuler, "id_ekstra">): Promise<Ekstrakurikuler> => {
    return apiClient.post<Ekstrakurikuler>("/ekstrakurikuler", data);
  },

  update: async (id: string, data: Partial<Ekstrakurikuler>): Promise<Ekstrakurikuler> => {
    return apiClient.put<Ekstrakurikuler>(`/ekstrakurikuler/${id}`, data);
  },

  getKeanggotaan: async (idEkstra: string): Promise<KeanggotaanEkstra[]> => {
    return apiClient.get<KeanggotaanEkstra[]>(`/ekstrakurikuler/${idEkstra}/anggota`);
  },

  getAnggota: async (idEkstra: string): Promise<KeanggotaanEkstra[]> => {
    return apiClient.get<KeanggotaanEkstra[]>(`/ekstrakurikuler/${idEkstra}/anggota`);
  },

  addAnggota: async (idEkstra: string, idSiswa: string): Promise<KeanggotaanEkstra> => {
    return apiClient.post<KeanggotaanEkstra>(`/ekstrakurikuler/${idEkstra}/anggota`, { id_siswa: idSiswa });
  },

  removeAnggota: async (idKeanggotaan: string): Promise<boolean> => {
    await apiClient.delete(`/ekstrakurikuler/anggota/${idKeanggotaan}`);
    return true;
  },

  getAbsensi: async (idEkstra: string): Promise<AbsensiEkstra[]> => {
    return apiClient.get<AbsensiEkstra[]>(`/ekstrakurikuler/${idEkstra}/absensi`);
  },

  catatAbsensi: async (idEkstra: string, items: Array<{ id_keanggotaan: string; tanggal: string; status: "Hadir" | "Tidak Hadir" }>): Promise<AbsensiEkstra[]> => {
    return apiClient.post<AbsensiEkstra[]>(`/ekstrakurikuler/${idEkstra}/absensi`, { items });
  },
};
