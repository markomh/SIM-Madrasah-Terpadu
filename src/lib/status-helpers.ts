import type { StatusPersetujuan } from "@/types";

export type Tone = "primary" | "amber" | "danger" | "ai" | "neutral";

/**
 * Maps a domain status string (e.g. "Disetujui", "Aktif", "Ditolak", "Hasil AI")
 * to a design system tone ("primary" | "amber" | "danger" | "ai" | "neutral").
 */
export function statusToTone(status: StatusPersetujuan | string): Tone {
  if (!status) return "neutral";
  if (status === "Disetujui" || status === "Aktif" || status === "Ditandatangani" || status === "Tepat Waktu") return "primary";
  if (status === "Menunggu Persetujuan" || status === "Menunggu Tanda Tangan" || status === "Terlambat" || status === "Sakit" || status === "Izin") return "amber";
  if (status === "Ditolak" || status === "Drop Out" || status === "Alpa" || status === "Digantikan Mendadak" || status === "Tidak Terlaksana") return "danger";
  if (status === "Hasil AI" || status.includes("AI")) return "ai";
  return "neutral";
}
