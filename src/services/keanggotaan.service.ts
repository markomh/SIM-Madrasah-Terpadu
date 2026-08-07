import type { AnggotaRombel, PemetaanKenaikan } from "@/types";

export interface KeanggotaanService {
  getAnggotaAktif(filter?: { id_rombel?: string; id_siswa?: string }): Promise<AnggotaRombel[]>;
  getPending(): Promise<AnggotaRombel[]>;
  getPemetaan(id_tahun?: string): Promise<PemetaanKenaikan[]>;
  setPemetaan(items: Omit<PemetaanKenaikan, "id_pemetaan">[]): Promise<PemetaanKenaikan[]>;
  prosesKenaikanMassal(id_tahun_tujuan: string, diajukanOleh: string): Promise<{ processed: number }>;
  ajukanPindahRombel(input: {
    id_siswa: string;
    id_rombel_tujuan: string;
    tanggal_efektif: string;
    diajukan_oleh: string;
  }): Promise<AnggotaRombel>;
  pindahRombelMassal(input: {
    id_siswa_list: string[];
    id_rombel_tujuan: string;
    tanggal_efektif: string;
    diajukan_oleh: string;
  }): Promise<{ processed: number }>;
}
