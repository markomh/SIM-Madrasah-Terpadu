import { MasterProvinsi, MasterKabupaten, MasterKecamatan, MasterDesa } from "@/types/wilayah";
import { PenugasanJabatan } from "@/types/penugasan-jabatan";
import { ProfilMadrasah, TemplateSurat } from "@/types/lembaga";
import { RiwayatMutasi } from "@/types/mutasi";
import { AnggotaRombel, PemetaanKenaikan } from "@/types/keanggotaan";
import { KeanggotaanService } from "./keanggotaan.service";
import { MutasiService, MutasiMasukInput, MutasiKeluarInput } from "./mutasi.service";
import { apiClient } from "./api-client";

export const wilayahApi = {
  getProvinsi: async (search?: string): Promise<MasterProvinsi[]> => {
    return apiClient.get<MasterProvinsi[]>(`/wilayah/provinsi${search ? `?search=${search}` : ""}`);
  },
  getKabupaten: async (idProvinsi: string, search?: string): Promise<MasterKabupaten[]> => {
    return apiClient.get<MasterKabupaten[]>(`/wilayah/kabupaten?id_provinsi=${idProvinsi}${search ? `&search=${search}` : ""}`);
  },
  getKecamatan: async (idKabupaten: string, search?: string): Promise<MasterKecamatan[]> => {
    return apiClient.get<MasterKecamatan[]>(`/wilayah/kecamatan?id_kabupaten=${idKabupaten}${search ? `&search=${search}` : ""}`);
  },
  getDesa: async (idKecamatan: string, search?: string): Promise<MasterDesa[]> => {
    return apiClient.get<MasterDesa[]>(`/wilayah/desa?id_kecamatan=${idKecamatan}${search ? `&search=${search}` : ""}`);
  },
};

export const penugasanJabatanApi = {
  getAll: async (): Promise<PenugasanJabatan[]> => {
    return apiClient.get<PenugasanJabatan[]>("/penugasan-jabatan");
  },
  getByPegawai: async (idPegawai: string): Promise<PenugasanJabatan[]> => {
    return apiClient.get<PenugasanJabatan[]>(`/penugasan-jabatan?id_pegawai=${idPegawai}`);
  },
  create: async (data: Omit<PenugasanJabatan, "id_penugasan" | "status" | "tanggal_selesai">): Promise<PenugasanJabatan> => {
    return apiClient.post<PenugasanJabatan>("/penugasan-jabatan", data);
  },
  akhiri: async (idPenugasan: string, _tanggalSelesai: string): Promise<void> => {
    await apiClient.delete(`/penugasan-jabatan/${idPenugasan}`);
  },
  endPenugasan: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/penugasan-jabatan/${id}`);
    return true;
  },
};

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

export const mutasiApi: MutasiService = {
  getAll: async (filter?: { status?: RiwayatMutasi["status_persetujuan"] }): Promise<RiwayatMutasi[]> => {
    let result = await apiClient.get<RiwayatMutasi[]>("/mutasi");
    if (filter?.status) {
      result = result.filter((m) => m.status_persetujuan === filter.status);
    }
    return result;
  },

  getById: async (id_mutasi: string): Promise<RiwayatMutasi | null> => {
    try {
      return await apiClient.get<RiwayatMutasi>(`/mutasi/${id_mutasi}`);
    } catch {
      return null;
    }
  },

  ajukanMasuk: async (data: MutasiMasukInput): Promise<RiwayatMutasi> => {
    return apiClient.post<RiwayatMutasi>("/mutasi", {
      jenis_mutasi: "Masuk",
      sekolah_asal: data.sekolah_asal,
      tanggal_mutasi: data.tanggal_mutasi,
      no_surat_mutasi: data.no_surat_mutasi,
      alasan: data.alasan,
      id_tahun_ajaran: data.id_tahun,
      nama_lengkap: data.nama_lengkap,
      tempat_lahir: data.tempat_lahir,
      tanggal_lahir: data.tanggal_lahir,
      jenis_kelamin: data.jenis_kelamin,
      agama: data.agama,
      nama_ibu_kandung: data.nama_ibu_kandung,
      id_rombel_tujuan: data.id_rombel_tujuan,
      nik: data.nik,
      nisn: data.nisn,
    });
  },

  ajukanKeluar: async (data: MutasiKeluarInput): Promise<RiwayatMutasi> => {
    return apiClient.post<RiwayatMutasi>("/mutasi", {
      jenis_mutasi: "Keluar",
      id_siswa: data.id_siswa,
      sekolah_tujuan: data.sekolah_tujuan,
      tanggal_mutasi: data.tanggal_mutasi,
      no_surat_mutasi: data.no_surat_mutasi,
      alasan: data.alasan,
      id_tahun_ajaran: data.id_tahun,
    });
  },
};

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
