import { SesiTatapMuka } from "@/types/kehadiran-guru";
import { AbsensiSiswa } from "@/types/absensi";
import { apiClient } from "./api-client";

export type CatatPresensiPayload = {
  id_jadwal: string;
  tanggal: string;
  id_pegawai_pelaksana: string;
  absensi_siswa: Array<{ id_siswa: string; status: "Hadir" | "Sakit" | "Izin" | "Alpa" }>;
  jurnal_materi?: string;
};

export const sesiTatapMukaApi = {
  getAll: async (): Promise<SesiTatapMuka[]> => {
    return apiClient.get<SesiTatapMuka[]>("/sesi-tatap-muka");
  },

  getById: async (id: string): Promise<SesiTatapMuka | null> => {
    try {
      return await apiClient.get<SesiTatapMuka>(`/sesi-tatap-muka/${id}`);
    } catch {
      return null;
    }
  },

  catatPresensi: async (payload: CatatPresensiPayload): Promise<SesiTatapMuka> => {
    return apiClient.post<SesiTatapMuka>("/sesi-tatap-muka", payload);
  },

  getByRombelTanggal: async (idRombel: string, tanggal: string): Promise<SesiTatapMuka[]> => {
    return apiClient.get<SesiTatapMuka[]>(`/sesi-tatap-muka?id_rombel=${idRombel}&tanggal=${tanggal}`);
  },

  getRekapTanggal: async (tanggal: string): Promise<SesiTatapMuka[]> => {
    return apiClient.get<SesiTatapMuka[]>(`/sesi-tatap-muka?tanggal=${tanggal}`);
  },

  getRekapKedisiplinan: async (bulan: string) => {
    return apiClient.get(`/kedisiplinan/rekap?bulan=${bulan}`);
  },
};

export const absensiApi = {
  getBySiswa: async (idSiswa: string): Promise<AbsensiSiswa[]> => {
    return apiClient.get<AbsensiSiswa[]>(`/absensi-siswa?id_siswa=${idSiswa}`);
  },

  getBySesi: async (idSesi: string): Promise<AbsensiSiswa[]> => {
    return apiClient.get<AbsensiSiswa[]>(`/absensi-siswa?id_sesi=${idSesi}`);
  },

  getRekapHarian: async (tanggal: string): Promise<AbsensiSiswa[]> => {
    return apiClient.get<AbsensiSiswa[]>(`/absensi-siswa?tanggal=${tanggal}`);
  },
};
