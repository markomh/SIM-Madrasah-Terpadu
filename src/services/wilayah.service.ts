import type { MasterProvinsi, MasterKabupaten, MasterKecamatan, MasterDesa } from "@/types/wilayah";

export interface WilayahService {
  getProvinsi(): Promise<MasterProvinsi[]>;
  getKabupaten(id_provinsi: string): Promise<MasterKabupaten[]>;
  getKecamatan(id_kabupaten: string): Promise<MasterKecamatan[]>;
  getDesa(id_kecamatan: string): Promise<MasterDesa[]>;
  getAncestors(id_desa: string): Promise<{ id_provinsi: string; id_kabupaten: string; id_kecamatan: string } | null>;
}
