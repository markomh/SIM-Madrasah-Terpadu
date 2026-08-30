import { ProfilMadrasah, TemplateSurat } from "@/types/lembaga";
import { apiClient } from "./api-client";

export const lembagaApi = {
  getProfil: async (): Promise<ProfilMadrasah> => {
    return apiClient.get<ProfilMadrasah>("/profil-madrasah");
  },
  updateProfil: async (data: Partial<ProfilMadrasah>): Promise<ProfilMadrasah> => {
    return apiClient.put<ProfilMadrasah>("/profil-madrasah", data);
  },
  getTemplates: async (): Promise<TemplateSurat[]> => {
    const data = await apiClient.get<any[]>("/template-surat");
    return data.map((t) => {
      const body = t.body_template || t.isi_template || "";
      const placeholders = t.variabel_placeholder ?? Array.from(
        new Set((body.match(/\{\{([A-Z_]+)\}\}/g) || []).map((m: string) => m.replace(/[{}]/g, "")))
      );
      return {
        id_template: t.id_template,
        kode_template: t.kode_template,
        nama_template: t.nama_template,
        kategori: t.kategori || t.jenis_surat || "Keterangan",
        header_html: t.header_html ?? null,
        body_template: body,
        format_html: body,
        variabel_placeholder: placeholders,
        variabel_dibutuhkan: placeholders,
        aktif: t.aktif ?? true,
      } as TemplateSurat;
    });
  },
  getTemplateSurat: async (): Promise<TemplateSurat[]> => {
    return lembagaApi.getTemplates();
  },
};
