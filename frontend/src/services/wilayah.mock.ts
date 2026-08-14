import type { WilayahService } from "./wilayah.service";
import type { MasterProvinsi, MasterKabupaten, MasterKecamatan, MasterDesa } from "@/types/wilayah";
import { simulateLatency, maybeThrowSimulatedError } from "./store";

const mockProvinsi: MasterProvinsi[] = [
  { id_provinsi: "prov_1", kode_provinsi: "31", nama_provinsi: "DKI JAKARTA" },
  { id_provinsi: "prov_2", kode_provinsi: "32", nama_provinsi: "JAWA BARAT" },
];

const mockKabupaten: MasterKabupaten[] = [
  { id_kabupaten: "kab_1", id_provinsi: "prov_1", kode_kabupaten: "3171", nama_kabupaten: "JAKARTA PUSAT" },
  { id_kabupaten: "kab_2", id_provinsi: "prov_1", kode_kabupaten: "3172", nama_kabupaten: "JAKARTA UTARA" },
  { id_kabupaten: "kab_3", id_provinsi: "prov_2", kode_kabupaten: "3273", nama_kabupaten: "KOTA BANDUNG" },
];

const mockKecamatan: MasterKecamatan[] = [
  { id_kecamatan: "kec_1", id_kabupaten: "kab_1", kode_kecamatan: "317101", nama_kecamatan: "GAMBIR" },
  { id_kecamatan: "kec_2", id_kabupaten: "kab_1", kode_kecamatan: "317102", nama_kecamatan: "SAWAH BESAR" },
  { id_kecamatan: "kec_3", id_kabupaten: "kab_3", kode_kecamatan: "327301", nama_kecamatan: "SUKASARI" },
];

const mockDesa: MasterDesa[] = [
  { id_desa: "desa_1", id_kecamatan: "kec_1", kode_desa: "3171011001", nama_desa: "GAMBIR" },
  { id_desa: "desa_2", id_kecamatan: "kec_1", kode_desa: "3171011002", nama_desa: "CIDENG" },
  { id_desa: "desa_3", id_kecamatan: "kec_2", kode_desa: "3171021001", nama_desa: "PASAR BARU" },
  { id_desa: "desa_4", id_kecamatan: "kec_3", kode_desa: "3273011001", nama_desa: "SARIJADI" },
];

export const mockWilayahService: WilayahService = {
  getProvinsi: async () => {
    await simulateLatency();
    maybeThrowSimulatedError();
    return [...mockProvinsi];
  },
  getKabupaten: async (id_provinsi: string) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    return mockKabupaten.filter(k => k.id_provinsi === id_provinsi);
  },
  getKecamatan: async (id_kabupaten: string) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    return mockKecamatan.filter(k => k.id_kabupaten === id_kabupaten);
  },
  getDesa: async (id_kecamatan: string) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    return mockDesa.filter(d => d.id_kecamatan === id_kecamatan);
  },
  getAncestors: async (id_desa: string) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    const d = mockDesa.find(x => x.id_desa === id_desa);
    if (!d) return null;
    const k = mockKecamatan.find(x => x.id_kecamatan === d.id_kecamatan);
    if (!k) return null;
    return { id_provinsi: k.id_kabupaten ? mockKabupaten.find(x => x.id_kabupaten === k.id_kabupaten)?.id_provinsi ?? "" : "", id_kabupaten: k.id_kabupaten, id_kecamatan: k.id_kecamatan };
  }
};
