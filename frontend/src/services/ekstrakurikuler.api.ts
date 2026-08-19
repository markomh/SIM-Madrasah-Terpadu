import { Ekstrakurikuler, KeanggotaanEkstra, AbsensiEkstra } from "@/types/ekstrakurikuler";
import { apiClient } from "./api-client";

export const ekstrakurikulerApi = {
  getAll: async (filter?: { id_pembina?: string }): Promise<Ekstrakurikuler[]> => {
    const list = await apiClient.get<Ekstrakurikuler[]>("/ekstrakurikuler");
    if (filter?.id_pembina) {
      return list.filter((e) => e.id_pembina === filter.id_pembina);
    }
    return list;
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

  addAnggota: async (
    data: Omit<KeanggotaanEkstra, "id_keanggotaan" | "tanggal_mulai" | "tanggal_selesai" | "status">
  ): Promise<KeanggotaanEkstra> => {
    return apiClient.post<KeanggotaanEkstra>(`/ekstrakurikuler/${data.id_ekstra}/anggota`, {
      id_siswa: data.id_siswa,
      tanggal_mulai: new Date().toISOString().split("T")[0],
    });
  },

  removeAnggota: async (id_keanggotaan: string): Promise<KeanggotaanEkstra> => {
    const ekskulList = await ekstrakurikulerApi.getAll();
    let foundEkstraId: string | null = null;
    let targetAnggota: KeanggotaanEkstra | null = null;

    for (const ekskul of ekskulList) {
      const anggotaList = await ekstrakurikulerApi.getKeanggotaan(ekskul.id_ekstra);
      const match = anggotaList.find((a) => a.id_keanggotaan === id_keanggotaan);
      if (match) {
        foundEkstraId = ekskul.id_ekstra;
        targetAnggota = match;
        break;
      }
    }

    if (!foundEkstraId || !targetAnggota) {
      throw new Error("Keanggotaan tidak ditemukan");
    }

    await apiClient.delete(`/ekstrakurikuler/${foundEkstraId}/anggota/${id_keanggotaan}`);

    return {
      ...targetAnggota,
      status: "Keluar",
      tanggal_selesai: new Date().toISOString().split("T")[0],
    };
  },

  getAbsensi: async (id_ekstra: string, tanggal: string): Promise<AbsensiEkstra[]> => {
    const list = await apiClient.get<AbsensiEkstra[]>(`/ekstrakurikuler/${id_ekstra}/absensi`);
    return list.filter((a) => a.tanggal === tanggal);
  },

  catatAbsensi: async (data: Omit<AbsensiEkstra, "id_absensi_ekstra">): Promise<AbsensiEkstra> => {
    const ekskulList = await ekstrakurikulerApi.getAll();
    let foundEkstraId: string | null = null;

    for (const ekskul of ekskulList) {
      const anggotaList = await ekstrakurikulerApi.getKeanggotaan(ekskul.id_ekstra);
      if (anggotaList.some((a) => a.id_keanggotaan === data.id_keanggotaan)) {
        foundEkstraId = ekskul.id_ekstra;
        break;
      }
    }

    if (!foundEkstraId) throw new Error("Keanggotaan tidak ditemukan");

    const res = await apiClient.post<AbsensiEkstra[]>(`/ekstrakurikuler/${foundEkstraId}/absensi`, {
      tanggal: data.tanggal,
      absensi: [
        {
          id_keanggotaan: data.id_keanggotaan,
          status: data.status,
        },
      ],
    });

    return res[0];
  },
};
