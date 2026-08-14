import type { Siswa } from "@/types";
import type { WawasanService, RekomendasiJadwal } from "./wawasan.service";
import { apiClient } from "./api-client";

export const wawasanApi: WawasanService = {
  async getSiswaBerisiko(minScore = 50): Promise<Siswa[]> {
    return apiClient.get<Siswa[]>(`/wawasan/siswa-berisiko?min_score=${minScore}`);
  },

  async getRekomendasiJadwal(): Promise<RekomendasiJadwal> {
    return apiClient.get<RekomendasiJadwal>("/wawasan/rekomendasi-jadwal");
  },
};
