import { AnggotaRombel, PemetaanKenaikan } from "@/types/keanggotaan";
import { KeanggotaanService } from "./keanggotaan.service";
import { apiClient } from "./api-client";

export const keanggotaanApi: KeanggotaanService = {
  async getAnggotaAktif(filter?: { id_rombel?: string; id_siswa?: string }): Promise<AnggotaRombel[]> {
    let url = "/keanggotaan/aktif";
    const params = new URLSearchParams();
    if (filter?.id_rombel) params.append("id_rombel", filter.id_rombel);
    if (filter?.id_siswa) params.append("id_siswa", filter.id_siswa);
    const query = params.toString();
    if (query) url += `?${query}`;
    return apiClient.get<AnggotaRombel[]>(url);
  },

  async getPending(): Promise<AnggotaRombel[]> {
    return apiClient.get<AnggotaRombel[]>("/keanggotaan/pending");
  },

  async getPemetaan(id_tahun?: string): Promise<PemetaanKenaikan[]> {
    const list = await apiClient.get<PemetaanKenaikan[]>("/kenaikan-kelas");
    return id_tahun ? list.filter((p) => p.id_tahun === id_tahun) : list;
  },

  async setPemetaan(items: Omit<PemetaanKenaikan, "id_pemetaan">[]): Promise<PemetaanKenaikan[]> {
    return apiClient.post<PemetaanKenaikan[]>("/kenaikan-kelas/pemetaan", { items });
  },

  async prosesKenaikanMassal(id_tahun_tujuan: string, diajukanOleh: string): Promise<{ processed: number }> {
    return apiClient.post<{ processed: number }>("/kenaikan-kelas/proses-massal", {
      id_tahun_tujuan,
      diajukan_oleh: diajukanOleh,
    });
  },

  async ajukanPindahRombel(input: {
    id_siswa: string;
    id_rombel_tujuan: string;
    tanggal_efektif: string;
    diajukan_oleh: string;
  }): Promise<AnggotaRombel> {
    return apiClient.post<AnggotaRombel>("/pindah-rombel", {
      id_siswa: input.id_siswa,
      id_rombel_tujuan: input.id_rombel_tujuan,
    });
  },

  async pindahRombelMassal(input: {
    id_siswa_list: string[];
    id_rombel_tujuan: string;
    tanggal_efektif: string;
    diajukan_oleh: string;
  }): Promise<{ processed: number }> {
    return apiClient.post<{ processed: number }>("/pindah-rombel/massal", {
      id_siswa_list: input.id_siswa_list,
      id_rombel_tujuan: input.id_rombel_tujuan,
      tanggal_efektif: input.tanggal_efektif,
      diajukan_oleh: input.diajukan_oleh,
    });
  },
};
