import type { ProfilMadrasah, TemplateSurat } from "@/types/lembaga";
import type { LembagaServiceInterface } from "./lembaga.service";
import { simulateLatency, loadStore, mutateStore } from "./store";

export const lembagaMock: LembagaServiceInterface = {
  async getProfil() {
    await simulateLatency();
    return loadStore().profilMadrasah;
  },
  async updateProfil(data: Partial<ProfilMadrasah>) {
    await simulateLatency();
    const updated = { ...loadStore().profilMadrasah, ...data };
    mutateStore(s => { s.profilMadrasah = updated; });
    return updated;
  },
  async getTemplates() {
    await simulateLatency();
    return loadStore().templateSurat;
  },
};
