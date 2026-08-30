import type { Siswa } from "@/types";
import type { WawasanService, RekomendasiJadwal } from "./wawasan.service";
import { apiClient } from "./api-client";

export const wawasanApi: WawasanService = {
  async getSiswaBerisiko(minScore = 50, idRombel?: string): Promise<Siswa[]> {
    let url = `/wawasan/siswa-berisiko?min_score=${minScore}`;
    if (idRombel) url += `&id_rombel=${idRombel}`;
    return apiClient.get<Siswa[]>(url);
  },

  async getRekomendasiJadwal(): Promise<RekomendasiJadwal> {
    return apiClient.get<RekomendasiJadwal>("/wawasan/rekomendasi-jadwal");
  },
};
