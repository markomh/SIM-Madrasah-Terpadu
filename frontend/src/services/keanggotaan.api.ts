import { z } from "zod";
import { AnggotaRombel, PemetaanKenaikan } from "@/types/keanggotaan";
import { KeanggotaanService } from "./keanggotaan.service";
import { apiClient } from "./api-client";

// ─── Zod Response Schemas (SSoT Contract Gate) ──────────────────────────────
// Endpoint kenaikan-kelas/proses-massal dan pindah-rombel/massal berdampak besar
// pada data. Schema ini memastikan response yang diterima sesuai kontrak SSoT,
// dan mencegah silent bug jika backend response berubah tanpa pemberitahuan.

const AnggotaRombelSchema = z.object({
  id_anggota: z.string().uuid(),
  id_siswa: z.string().uuid(),
  id_rombel: z.string().uuid(),
  tanggal_mulai: z.string(),
  tanggal_selesai: z.string().nullable(),
  status_keanggotaan: z.enum(["Aktif", "Pindah Rombel", "Naik Kelas", "Tinggal Kelas", "Lulus", "Keluar"]),
  jenis_perpindahan: z.enum(["Awal Masuk", "Pindah Rombel", "Kenaikan Tingkat", "Mutasi Masuk"]),
  status_persetujuan: z.enum(["Tidak Perlu", "Menunggu Persetujuan", "Disetujui", "Ditolak"]),
  diajukan_oleh: z.string().nullable(),
  disetujui_oleh: z.string().nullable(),
  tanggal_persetujuan: z.string().nullable(),
  siswa: z
    .object({ id_siswa: z.string(), nama_lengkap: z.string(), nisn: z.string() })
    .nullable()
    .optional(),
});

const PemetaanKenaikanSchema = z.object({
  id_pemetaan: z.string().uuid(),
  id_rombel_asal: z.string().uuid(),
  id_rombel_tujuan: z.string().uuid(),
  id_tahun: z.string(),
});

const MassalResultSchema = z.object({ processed: z.number() });

// ─── API Implementation ──────────────────────────────────────────────────────

export const keanggotaanApi: KeanggotaanService = {
  async getAnggotaAktif(filter?: { id_rombel?: string; id_siswa?: string }): Promise<AnggotaRombel[]> {
    let url = "/keanggotaan/aktif";
    const params = new URLSearchParams();
    if (filter?.id_rombel) params.append("id_rombel", filter.id_rombel);
    if (filter?.id_siswa) params.append("id_siswa", filter.id_siswa);
    const query = params.toString();
    if (query) url += `?${query}`;
    return apiClient.get<AnggotaRombel[]>(url, z.array(AnggotaRombelSchema) as z.ZodType<AnggotaRombel[]>);
  },

  async getPending(): Promise<AnggotaRombel[]> {
    return apiClient.get<AnggotaRombel[]>("/keanggotaan/pending", z.array(AnggotaRombelSchema) as z.ZodType<AnggotaRombel[]>);
  },

  async getPemetaan(id_tahun?: string): Promise<PemetaanKenaikan[]> {
    const list = await apiClient.get<PemetaanKenaikan[]>(
      "/kenaikan-kelas",
      z.array(PemetaanKenaikanSchema) as z.ZodType<PemetaanKenaikan[]>
    );
    return id_tahun ? list.filter((p) => p.id_tahun === id_tahun) : list;
  },

  async setPemetaan(items: Omit<PemetaanKenaikan, "id_pemetaan">[]): Promise<PemetaanKenaikan[]> {
    return apiClient.post<PemetaanKenaikan[]>(
      "/kenaikan-kelas/pemetaan",
      { items },
      z.array(PemetaanKenaikanSchema) as z.ZodType<PemetaanKenaikan[]>
    );
  },

  async prosesKenaikanMassal(id_tahun_tujuan: string, diajukanOleh: string): Promise<{ processed: number }> {
    return apiClient.post<{ processed: number }>(
      "/kenaikan-kelas/proses-massal",
      { id_tahun_tujuan, diajukan_oleh: diajukanOleh },
      MassalResultSchema
    );
  },

  async ajukanPindahRombel(input: {
    id_siswa: string;
    id_rombel_tujuan: string;
    tanggal_efektif: string;
    diajukan_oleh: string;
  }): Promise<AnggotaRombel> {
    return apiClient.post<AnggotaRombel>(
      "/pindah-rombel",
      { id_siswa: input.id_siswa, id_rombel_tujuan: input.id_rombel_tujuan },
      AnggotaRombelSchema as z.ZodType<AnggotaRombel>
    );
  },

  async pindahRombelMassal(input: {
    id_siswa_list: string[];
    id_rombel_tujuan: string;
    tanggal_efektif: string;
    diajukan_oleh: string;
  }): Promise<{ processed: number }> {
    return apiClient.post<{ processed: number }>(
      "/pindah-rombel/massal",
      {
        id_siswa_list: input.id_siswa_list,
        id_rombel_tujuan: input.id_rombel_tujuan,
        tanggal_efektif: input.tanggal_efektif,
        diajukan_oleh: input.diajukan_oleh,
      },
      MassalResultSchema
    );
  },
};
