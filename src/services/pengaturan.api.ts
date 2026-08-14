import type { PengaturanService } from "./pengaturan.service";
import { apiClient } from "./api-client";

export const pengaturanApi: PengaturanService = {
  async get(): Promise<{ ambangToleransiTerlambatMenit: number; ambangFlagDigantikanMendadak: number }> {
    return apiClient.get<{ ambangToleransiTerlambatMenit: number; ambangFlagDigantikanMendadak: number }>("/pengaturan");
  },

  async update(data: { ambangToleransiTerlambatMenit: number; ambangFlagDigantikanMendadak: number }): Promise<void> {
    await apiClient.put("/pengaturan", data);
  },
};
