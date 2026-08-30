import { MasterProvinsi, MasterKabupaten, MasterKecamatan, MasterDesa } from "@/types/wilayah";
import { apiClient } from "./api-client";

export const wilayahApi = {
  getProvinsi: async (search?: string): Promise<MasterProvinsi[]> => {
    return apiClient.get<MasterProvinsi[]>(`/wilayah/provinsi${search ? `?search=${search}` : ""}`);
  },
  getKabupaten: async (idProvinsi: string, search?: string): Promise<MasterKabupaten[]> => {
    return apiClient.get<MasterKabupaten[]>(`/wilayah/kabupaten?id_provinsi=${idProvinsi}${search ? `&search=${search}` : ""}`);
  },
  getKecamatan: async (idKabupaten: string, search?: string): Promise<MasterKecamatan[]> => {
    return apiClient.get<MasterKecamatan[]>(`/wilayah/kecamatan?id_kabupaten=${idKabupaten}${search ? `&search=${search}` : ""}`);
  },
  getDesa: async (idKecamatan: string, search?: string): Promise<MasterDesa[]> => {
    return apiClient.get<MasterDesa[]>(`/wilayah/desa?id_kecamatan=${idKecamatan}${search ? `&search=${search}` : ""}`);
  },
};
