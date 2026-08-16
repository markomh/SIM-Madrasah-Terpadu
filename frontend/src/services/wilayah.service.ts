import type { MasterProvinsi, MasterKabupaten, MasterKecamatan, MasterDesa } from "@/types/wilayah";

export interface WilayahService {
  getProvinsi(search?: string): Promise<MasterProvinsi[]>;
  getKabupaten(id_provinsi: string, search?: string): Promise<MasterKabupaten[]>;
  getKecamatan(id_kabupaten: string, search?: string): Promise<MasterKecamatan[]>;
  getDesa(id_kecamatan: string, search?: string): Promise<MasterDesa[]>;
  getAncestors(id_desa: string): Promise<{ id_provinsi: string; id_kabupaten: string; id_kecamatan: string } | null>;
}
