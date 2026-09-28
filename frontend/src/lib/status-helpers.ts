import type { StatusPersetujuan } from "@/types";

export type Tone = "primary" | "amber" | "danger" | "ai" | "neutral";

/**
 * Maps a domain status string (e.g. "Disetujui", "Aktif", "Ditolak", "Hasil AI")
 * to a design system tone ("primary" | "amber" | "danger" | "ai" | "neutral").
 */
// export function statusToTone(status: StatusPersetujuan | string): Tone {
//   if (!status) return "neutral";
//   if (status === "Disetujui" || status === "Aktif" || status === "Ditandatangani" || status === "Diterbitkan" || status === "Tepat Waktu") return "primary";
//   if (status === "Menunggu Persetujuan" || status === "Menunggu Tanda Tangan" || status === "Terlambat" || status === "Sakit" || status === "Izin") return "amber";
//   if (status === "Ditolak" || status === "Drop Out" || status === "Alpa" || status === "Digantikan Mendadak" || status === "Tidak Terlaksana") return "danger";
//   if (status === "Hasil AI" || status.includes("AI")) return "ai";
//   return "neutral";
// }

// import type { StatusPersetujuan } from "@/types";

// export type Tone = "primary" | "amber" | "danger" | "ai" | "neutral";

/**
 * Maps a domain status string (e.g. "Disetujui", "Aktif", "Ditolak", "Hasil AI")
 * to a design system tone ("primary" | "amber" | "danger" | "ai" | "neutral").
 *
 * CATATAN (fix 2026 — audit temuan HIGH): "Diterbitkan" dan "Menunggu TTD"
 * adalah 2 dari 5 nilai KANONIK resmi StatusSurat (lihat komentar di
 * types/persuratan.ts: "5 nilai kanonik resmi sesuai DDL Backend Enum").
 * Sebelumnya fungsi ini hanya mengecek alias LEGACY-nya
 * ("Ditandatangani", "Menunggu Tanda Tangan"), sehingga surat dengan nilai
 * kanonik jatuh ke default "neutral" — termasuk status paling actionable
 * di modul Persuratan (surat menunggu tanda tangan Kepala Madrasah).
 * Kedua alias legacy TETAP dipertahankan untuk data mock lama yang belum
 * dimigrasikan (lihat StatusSuratLegacyAlias di types/persuratan.ts).
 */
export function statusToTone(status: StatusPersetujuan | string): Tone {
  if (!status) return "neutral";
  if (status === "Disetujui" || status === "Aktif" || status === "Diterbitkan" || status === "Ditandatangani" || status === "Tepat Waktu") return "primary";
  if (status === "Menunggu Persetujuan" || status === "Menunggu TTD" || status === "Menunggu Tanda Tangan" || status === "Terlambat" || status === "Sakit" || status === "Izin") return "amber";
  if (status === "Ditolak" || status === "Drop Out" || status === "Alpa" || status === "Digantikan Mendadak" || status === "Tidak Terlaksana") return "danger";
  if (status === "Hasil AI" || status.includes("AI")) return "ai";
  return "neutral";
}