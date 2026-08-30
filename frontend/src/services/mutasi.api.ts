import { RiwayatMutasi } from "@/types/mutasi";
import { MutasiService, MutasiMasukInput, MutasiKeluarInput } from "./mutasi.service";
import { apiClient } from "./api-client";

export const mutasiApi: MutasiService = {
  getAll: async (filter?: { status?: RiwayatMutasi["status_persetujuan"] }): Promise<RiwayatMutasi[]> => {
    let result = await apiClient.get<RiwayatMutasi[]>("/mutasi");
    if (filter?.status) {
      result = result.filter((m) => m.status_persetujuan === filter.status);
    }
    return result;
  },

  getById: async (id_mutasi: string): Promise<RiwayatMutasi | null> => {
    try {
      return await apiClient.get<RiwayatMutasi>(`/mutasi/${id_mutasi}`);
    } catch {
      return null;
    }
  },

  ajukanMasuk: async (data: MutasiMasukInput): Promise<RiwayatMutasi> => {
    return apiClient.post<RiwayatMutasi>("/mutasi", {
      jenis_mutasi: "Masuk",
      sekolah_asal: data.sekolah_asal,
      tanggal_mutasi: data.tanggal_mutasi,
      no_surat_mutasi: data.no_surat_mutasi,
      alasan: data.alasan,
      id_tahun_ajaran: data.id_tahun,
      nama_lengkap: data.nama_lengkap,
      tempat_lahir: data.tempat_lahir,
      tanggal_lahir: data.tanggal_lahir,
      jenis_kelamin: data.jenis_kelamin,
      agama: data.agama,
      nama_ibu_kandung: data.nama_ibu_kandung,
      id_rombel_tujuan: data.id_rombel_tujuan,
      nik: data.nik,
      nisn: data.nisn,
    });
  },

  ajukanKeluar: async (data: MutasiKeluarInput): Promise<RiwayatMutasi> => {
    return apiClient.post<RiwayatMutasi>("/mutasi", {
      jenis_mutasi: "Keluar",
      id_siswa: data.id_siswa,
      sekolah_tujuan: data.sekolah_tujuan,
      tanggal_mutasi: data.tanggal_mutasi,
      no_surat_mutasi: data.no_surat_mutasi,
      alasan: data.alasan,
      id_tahun_ajaran: data.id_tahun,
    });
  },
};
