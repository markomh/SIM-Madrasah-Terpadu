import { z } from "zod";
import { RiwayatMutasi } from "@/types/mutasi";
import { MutasiService, MutasiMasukInput, MutasiKeluarInput } from "./mutasi.service";
import { apiClient } from "./api-client";

// ─── Zod Response Schema (SSoT Contract Gate) ───────────────────────────────
// Memastikan setiap field yang dibutuhkan frontend benar-benar ada di response backend.
// Jika backend berubah dan field hilang, akan muncul error "SSoT Violation" yg eksplisit.

const RiwayatMutasiSchema = z.object({
  id_mutasi: z.string().uuid(),
  id_siswa: z.string().uuid(),
  jenis_mutasi: z.enum(["Masuk", "Keluar"]),
  sekolah_asal: z.string().nullable(),
  sekolah_tujuan: z.string().nullable(),
  tanggal_mutasi: z.string(),
  no_surat_mutasi: z.string(),
  alasan: z.string(),
  status_persetujuan: z.enum([
    "Menunggu Persetujuan",
    "Disetujui",
    "Ditolak",
  ]),
  diajukan_oleh: z.string(),
  disetujui_oleh: z.string().nullable(),
  tanggal_persetujuan: z.string().nullable(),
  id_tahun: z.string().optional(),
  id_tahun_ajaran: z.string().optional(),
  id_surat_skp: z.string().nullable().optional(),
  siswa: z
    .object({
      id_siswa: z.string(),
      nama_lengkap: z.string(),
      nisn: z.string(),
    })
    .nullable()
    .optional(),
});

const RiwayatMutasiArraySchema = z.array(RiwayatMutasiSchema);

// ─── API Implementation ──────────────────────────────────────────────────────

export const mutasiApi: MutasiService = {
  getAll: async (filter?: { status?: RiwayatMutasi["status_persetujuan"] }): Promise<RiwayatMutasi[]> => {
    let result = await apiClient.get<RiwayatMutasi[]>("/mutasi", RiwayatMutasiArraySchema as z.ZodType<RiwayatMutasi[]>);
    if (filter?.status) {
      result = result.filter((m) => m.status_persetujuan === filter.status);
    }
    return result;
  },

  getById: async (id_mutasi: string): Promise<RiwayatMutasi | null> => {
    try {
      return await apiClient.get<RiwayatMutasi>(`/mutasi/${id_mutasi}`, RiwayatMutasiSchema as z.ZodType<RiwayatMutasi>);
    } catch {
      return null;
    }
  },

  ajukanMasuk: async (data: MutasiMasukInput): Promise<RiwayatMutasi> => {
    return apiClient.post<RiwayatMutasi>(
      "/mutasi",
      {
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
      },
      RiwayatMutasiSchema as z.ZodType<RiwayatMutasi>
    );
  },

  ajukanKeluar: async (data: MutasiKeluarInput): Promise<RiwayatMutasi> => {
    return apiClient.post<RiwayatMutasi>(
      "/mutasi",
      {
        jenis_mutasi: "Keluar",
        id_siswa: data.id_siswa,
        sekolah_tujuan: data.sekolah_tujuan,
        tanggal_mutasi: data.tanggal_mutasi,
        no_surat_mutasi: data.no_surat_mutasi,
        alasan: data.alasan,
        id_tahun_ajaran: data.id_tahun,
      },
      RiwayatMutasiSchema as z.ZodType<RiwayatMutasi>
    );
  },
};
