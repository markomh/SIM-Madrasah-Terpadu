import { SesiTatapMuka } from "@/types/kehadiran-guru";
import { AbsensiSiswa } from "@/types/absensi";
import { apiClient } from "./api-client";

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

  catatPresensi: async (
    id_sesi: string,
    id_pegawai_pelaksana: string,
    absensiSiswa: Array<Omit<AbsensiSiswa, "id_absensi" | "tanggal" | "id_sesi">>,
    jurnal_materi: string | null
  ): Promise<SesiTatapMuka> => {
    const sesi = await sesiTatapMukaApi.getById(id_sesi);
    if (!sesi) throw new Error("Sesi tidak ditemukan");

    const payload = {
      id_jadwal: sesi.id_jadwal,
      tanggal: sesi.tanggal,
      id_pegawai_pelaksana,
      absensi_siswa: absensiSiswa.map((a) => ({
        id_siswa: a.id_siswa,
        status: a.status,
      })),
      jurnal_materi: jurnal_materi ?? undefined,
    };

    return apiClient.post<SesiTatapMuka>("/sesi-tatap-muka", payload);
  },

  getByRombelTanggal: async (idRombel: string, tanggal: string): Promise<SesiTatapMuka[]> => {
    return apiClient.get<SesiTatapMuka[]>(`/sesi-tatap-muka?id_rombel=${idRombel}&tanggal=${tanggal}`);
  },

  getRekapTanggal: async (tanggal: string) => {
    return apiClient.get<{
      terjadwal: number;
      diinput: number;
      tepatWaktu: number;
      terlambat: number;
      digantikan: number;
      daftarDetail: Array<{
        id_sesi: string;
        nama_guru_seharusnya: string;
        nama_guru_pelaksana: string | null;
        status: string;
        mapel: string;
        rombel: string;
      }>;
    }>(`/sesi-tatap-muka/rekap-tanggal?tanggal=${tanggal}`);
  },

  getRekapKedisiplinan: async (bulan: string) => {
    return apiClient.get<any[]>(`/kedisiplinan/rekap?bulan=${bulan}`);
  },
};

export const absensiApi = {
  getBySiswa: async (idSiswa: string): Promise<AbsensiSiswa[]> => {
    return apiClient.get<AbsensiSiswa[]>(`/absensi-siswa?id_siswa=${idSiswa}`);
  },

  getBySesi: async (idSesi: string): Promise<AbsensiSiswa[]> => {
    return apiClient.get<AbsensiSiswa[]>(`/absensi-siswa?id_sesi=${idSesi}`);
  },

  getRekapHarian: async (id_rombel: string, tanggal: string): Promise<AbsensiSiswa[]> => {
    return apiClient.get<AbsensiSiswa[]>(`/absensi-siswa?id_rombel=${id_rombel}&tanggal=${tanggal}`);
  },
};
