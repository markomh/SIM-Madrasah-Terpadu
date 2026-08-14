import { MasterProvinsi, MasterKabupaten, MasterKecamatan, MasterDesa } from "@/types/wilayah";
import { PenugasanJabatan } from "@/types/penugasan-jabatan";
import { ProfilMadrasah, TemplateSurat } from "@/types/lembaga";
import { RiwayatMutasi } from "@/types/mutasi";
import { AnggotaRombel } from "@/types/keanggotaan";
import { apiClient } from "./api-client";

export const wilayahApi = {
  getProvinsi: async (): Promise<MasterProvinsi[]> => {
    return apiClient.get<MasterProvinsi[]>("/wilayah/provinsi");
  },
  getKabupaten: async (idProvinsi: string): Promise<MasterKabupaten[]> => {
    return apiClient.get<MasterKabupaten[]>(`/wilayah/kabupaten?id_provinsi=${idProvinsi}`);
  },
  getKecamatan: async (idKabupaten: string): Promise<MasterKecamatan[]> => {
    return apiClient.get<MasterKecamatan[]>(`/wilayah/kecamatan?id_kabupaten=${idKabupaten}`);
  },
  getDesa: async (idKecamatan: string): Promise<MasterDesa[]> => {
    return apiClient.get<MasterDesa[]>(`/wilayah/desa?id_kecamatan=${idKecamatan}`);
  },
};

export const penugasanJabatanApi = {
  getAll: async (): Promise<PenugasanJabatan[]> => {
    return apiClient.get<PenugasanJabatan[]>("/penugasan-jabatan");
  },
  getByPegawai: async (idPegawai: string): Promise<PenugasanJabatan[]> => {
    return apiClient.get<PenugasanJabatan[]>(`/penugasan-jabatan?id_pegawai=${idPegawai}`);
  },
  create: async (data: Omit<PenugasanJabatan, "id_penugasan" | "status" | "tanggal_selesai">): Promise<PenugasanJabatan> => {
    return apiClient.post<PenugasanJabatan>("/penugasan-jabatan", data);
  },
  akhiri: async (idPenugasan: string, _tanggalSelesai: string): Promise<void> => {
    await apiClient.delete(`/penugasan-jabatan/${idPenugasan}`);
  },
  endPenugasan: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/penugasan-jabatan/${id}`);
    return true;
  },
};

export const lembagaApi = {
  getProfil: async (): Promise<ProfilMadrasah> => {
    return apiClient.get<ProfilMadrasah>("/profil-madrasah");
  },
  updateProfil: async (data: Partial<ProfilMadrasah>): Promise<ProfilMadrasah> => {
    return apiClient.put<ProfilMadrasah>("/profil-madrasah", data);
  },
  getTemplates: async (): Promise<TemplateSurat[]> => {
    return apiClient.get<TemplateSurat[]>("/template-surat");
  },
  getTemplateSurat: async (): Promise<TemplateSurat[]> => {
    return apiClient.get<TemplateSurat[]>("/template-surat");
  },
};

export const mutasiApi = {
  getAll: async (): Promise<RiwayatMutasi[]> => {
    return apiClient.get<RiwayatMutasi[]>("/mutasi");
  },
  create: async (data: Omit<RiwayatMutasi, "id_mutasi" | "status_persetujuan">): Promise<RiwayatMutasi> => {
    return apiClient.post<RiwayatMutasi>("/mutasi", data);
  },
  setujui: async (id: string): Promise<RiwayatMutasi> => {
    return apiClient.post<RiwayatMutasi>(`/mutasi/${id}/setujui`);
  },
  tolak: async (id: string): Promise<RiwayatMutasi> => {
    return apiClient.post<RiwayatMutasi>(`/mutasi/${id}/tolak`);
  },
};

export const keanggotaanApi = {
  getPindahRombel: async (): Promise<AnggotaRombel[]> => {
    return apiClient.get<AnggotaRombel[]>("/pindah-rombel");
  },
  createPindahRombel: async (idSiswa: string, idRombelTujuan: string): Promise<AnggotaRombel> => {
    return apiClient.post<AnggotaRombel>("/pindah-rombel", { id_siswa: idSiswa, id_rombel_tujuan: idRombelTujuan });
  },
  setujuiPindahRombel: async (id: string): Promise<AnggotaRombel> => {
    return apiClient.post<AnggotaRombel>(`/pindah-rombel/${id}/setujui`);
  },
  tolakPindahRombel: async (id: string): Promise<AnggotaRombel> => {
    return apiClient.post<AnggotaRombel>(`/pindah-rombel/${id}/tolak`);
  },
  prosesKenaikanKelas: async (payload: {
    id_rombel_asal: string;
    id_rombel_tujuan: string;
    id_tahun_tujuan: string;
    daftar_siswa: Array<{ id_siswa: string; status: "Naik Kelas" | "Tinggal Kelas" | "Lulus" }>;
  }): Promise<{ message: string; jumlah_diproses: number }> => {
    return apiClient.post("/kenaikan-kelas/proses", payload);
  },
};
