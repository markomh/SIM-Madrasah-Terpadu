import type {
  HariLibur,
  MataPelajaran,
  Rombel,
  TahunAjaran,
  TingkatPendidikan,
} from "@/types";

export interface ReferensiService {
  getTahunAjaran(): Promise<TahunAjaran[]>;
  getTahunAktif(): Promise<TahunAjaran | null>;
  getTingkat(): Promise<TingkatPendidikan[]>;
  createTingkat(data: Omit<TingkatPendidikan, "id_tingkat">): Promise<TingkatPendidikan>;
  getRombel(filter?: { id_tahun?: string; id_tingkat?: string }): Promise<Rombel[]>;
  createRombel(data: Omit<Rombel, "id_rombel" | "id_madrasah"> & { id_madrasah?: string }): Promise<Rombel>;
  updateRombel(id_rombel: string, data: Partial<Rombel>): Promise<Rombel>;
  getMapel(): Promise<MataPelajaran[]>;
  createMapel(data: Omit<MataPelajaran, "id_mapel" | "id_madrasah"> & { id_madrasah?: string }): Promise<MataPelajaran>;
  getHariLibur(): Promise<HariLibur[]>;
  createHariLibur(data: Omit<HariLibur, "id_libur">): Promise<HariLibur>;
}
