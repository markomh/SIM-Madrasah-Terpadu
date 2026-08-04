import { z } from "zod";

export const siswaFormSchema = z.object({
  nik: z.string().regex(/^\d{16}$/, "NIK wajib 16 digit angka"),
  nisn: z.string().min(10, "NISN minimal 10 digit").max(10, "NISN maksimal 10 digit").regex(/^\d+$/, "NISN harus angka"),
  nama_lengkap: z.string().min(3, "Nama wajib diisi"),
  tempat_lahir: z.string().min(2, "Tempat lahir wajib"),
  tanggal_lahir: z.string().min(1, "Tanggal lahir wajib"),
  jenis_kelamin: z.enum(["L", "P"]),
  agama: z.string().min(1, "Agama wajib"),
  nama_ibu_kandung: z.string().min(2, "Nama ibu kandung wajib"),
  status_siswa: z.enum(["Aktif", "Lulus", "Mutasi Keluar", "Drop Out"]),
  jalur_masuk: z.enum(["PPDB Reguler", "Mutasi Masuk"]),
  alamat_detail: z.string().min(5, "Detail alamat wajib diisi"),
  id_desa: z.string().min(1, "Desa wajib diisi"),
});

export type SiswaFormValues = z.infer<typeof siswaFormSchema>;

export const mutasiMasukSchema = z.object({
  nik: z.string().regex(/^\d{16}$/, "NIK wajib 16 digit"),
  nisn: z.string().regex(/^\d{10}$/, "NISN wajib 10 digit"),
  nama_lengkap: z.string().min(3),
  tempat_lahir: z.string().min(2),
  tanggal_lahir: z.string().min(1),
  jenis_kelamin: z.enum(["L", "P"]),
  agama: z.string().min(1),
  nama_ibu_kandung: z.string().min(2),
  sekolah_asal: z.string().min(3),
  tanggal_mutasi: z.string().min(1),
  no_surat_mutasi: z.string().min(3),
  alasan: z.string().min(5),
  id_rombel_tujuan: z.string().min(1),
});

export const mutasiKeluarSchema = z.object({
  id_siswa: z.string().min(1),
  sekolah_tujuan: z.string().min(3),
  tanggal_mutasi: z.string().min(1),
  no_surat_mutasi: z.string().min(3, "Nomor surat wajib untuk mutasi keluar"),
  alasan: z.string().min(5),
});

export const pindahRombelSchema = z.object({
  id_siswa: z.string().min(1),
  id_rombel_tujuan: z.string().min(1),
  tanggal_efektif: z.string().min(1),
});
