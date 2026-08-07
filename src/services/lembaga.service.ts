import type { ProfilMadrasah, TemplateSurat } from "@/types/lembaga";

export interface LembagaServiceInterface {
  getProfil(): Promise<ProfilMadrasah>;
  updateProfil(data: Partial<ProfilMadrasah>): Promise<ProfilMadrasah>;
  getTemplates(): Promise<TemplateSurat[]>;
}
