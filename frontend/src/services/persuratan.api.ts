import { Surat } from "@/types/persuratan";
import { TemplateSurat } from "@/types/lembaga";
import { apiClient } from "./api-client";

export const persuratanApi = {
  getAll: async (): Promise<Surat[]> => {
    return apiClient.get<Surat[]>("/surat");
  },

  getSurat: async (): Promise<Surat[]> => {
    return apiClient.get<Surat[]>("/surat");
  },

  getById: async (id: string): Promise<Surat | null> => {
    try {
      return await apiClient.get<Surat>(`/surat/${id}`);
    } catch {
      return null;
    }
  },

  getSuratById: async (id: string): Promise<Surat | null> => {
    try {
      return await apiClient.get<Surat>(`/surat/${id}`);
    } catch {
      return null;
    }
  },

  create: async (data: Omit<Surat, "id_surat" | "nomor_surat" | "status" | "dibuat_oleh">): Promise<Surat> => {
    return apiClient.post<Surat>("/surat", data);
  },

  createSurat: async (data: Omit<Surat, "id_surat" | "nomor_surat" | "status" | "dibuat_oleh">): Promise<Surat> => {
    return apiClient.post<Surat>("/surat", data);
  },

  requestSign: async (id: string, id_penandatangan: string): Promise<Surat> => {
    return apiClient.post<Surat>(`/surat/${id}/aju-ttd`, { id_penandatangan });
  },

  sign: async (id: string, id_penandatangan: string): Promise<Surat> => {
    return apiClient.post<Surat>(`/surat/${id}/tandatangani`);
  },

  tandatanganiSurat: async (id: string): Promise<Surat> => {
    return apiClient.post<Surat>(`/surat/${id}/tandatangani`);
  },

  reject: async (id: string): Promise<Surat> => {
    return apiClient.post<Surat>(`/surat/${id}/tolak`);
  },

  tolakSurat: async (id: string): Promise<Surat> => {
    return apiClient.post<Surat>(`/surat/${id}/tolak`);
  },

  getTemplates: async (): Promise<TemplateSurat[]> => {
    return apiClient.get<TemplateSurat[]>("/template-surat");
  },

  getTemplate: async (): Promise<TemplateSurat[]> => {
    return apiClient.get<TemplateSurat[]>("/template-surat");
  },

  createTemplate: async (data: Omit<TemplateSurat, "id_template">): Promise<TemplateSurat> => {
    return apiClient.post<TemplateSurat>("/template-surat", data);
  },

  generateAiDraft: async (instruksi: string, dibuat_oleh: string): Promise<Surat> => {
    return apiClient.post<Surat>("/surat", {
      perihal: `Draf AI: ${instruksi.slice(0, 40)}`,
      jenis_surat: "Surat Tugas",
      id_template: null,
      tujuan_surat: "",
      isi_surat: `Hasil AI — perlu verifikasi. Instruksi: ${instruksi}`,
      id_siswa_terkait: null,
      id_pegawai_terkait: null,
      dibuat_oleh,
    });
  },

  buildDraftFromTemplate: async (params: {
    kodeTemplate: string;
    placeholders: Record<string, string>;
    perihal: string;
    jenisSurat: string;
    idSiswaTerkait?: string | null;
    idPegawaiTerkait?: string | null;
    tujuanSurat?: string;
    dibuatOleh: string;
  }): Promise<Surat> => {
    const templates = await apiClient.get<TemplateSurat[]>("/template-surat");
    const tpl = templates.find((t) => t.kode_template === params.kodeTemplate);
    if (!tpl) throw new Error(`Template surat ${params.kodeTemplate} tidak ditemukan.`);

    let isi = tpl.body_template;
    for (const [key, value] of Object.entries(params.placeholders)) {
      isi = isi.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }

    return {
      id_surat: "sr_preview_only",
      nomor_surat: "PREVIEW",
      perihal: params.perihal,
      jenis_surat: params.jenisSurat,
      id_template: tpl.id_template,
      tanggal_surat: new Date().toISOString().split("T")[0],
      tujuan_surat: params.tujuanSurat ?? "Tujuan Surat",
      isi_surat: isi,
      id_siswa_terkait: params.idSiswaTerkait ?? null,
      id_pegawai_terkait: params.idPegawaiTerkait ?? null,
      status: "Draf",
      dibuat_oleh: params.dibuatOleh,
      id_penandatangan: null,
      hasil_ai: false,
      meta_penandatangan: null,
    };
  },

  createAndSign: async (params: {
    kodeTemplate: string;
    placeholders: Record<string, string>;
    perihal: string;
    jenisSurat: string;
    idSiswaTerkait?: string | null;
    idPegawaiTerkait?: string | null;
    tujuanSurat?: string;
    dibuatOleh: string;
    idPenandatangan: string;
  }): Promise<Surat> => {
    const draft = await persuratanApi.buildDraftFromTemplate(params);
    const created = await persuratanApi.create({
      perihal: draft.perihal,
      jenis_surat: draft.jenis_surat,
      id_template: draft.id_template,
      tujuan_surat: draft.tujuan_surat,
      isi_surat: draft.isi_surat,
      id_siswa_terkait: draft.id_siswa_terkait,
      id_pegawai_terkait: draft.id_pegawai_terkait,
      tanggal_surat: draft.tanggal_surat,
      id_penandatangan: draft.id_penandatangan,
      hasil_ai: draft.hasil_ai,
      meta_penandatangan: draft.meta_penandatangan,
    });
    await persuratanApi.requestSign(created.id_surat, params.idPenandatangan);
    return persuratanApi.sign(created.id_surat, params.idPenandatangan);
  },
};
