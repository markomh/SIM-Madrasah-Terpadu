import type { Madrasah } from "@/types";
import type { MadrasahService } from "./madrasah.service";
import { apiClient } from "./api-client";

export const madrasahApi: MadrasahService = {
  async getCurrent(): Promise<Madrasah> {
    return apiClient.get<Madrasah>("/madrasah/current");
  },
};
