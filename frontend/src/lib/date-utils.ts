/**
 * date-utils.ts
 *
 * Utilitas untuk manipulasi dan format tanggal berbahasa Indonesia (Standard id-ID).
 */

export const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

export const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export function formatTanggalPanjang(isoDate: string): string {
  if (!isoDate) return "—";
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "—";
  const hari = dayNames[d.getDay()];
  const tgl = d.getDate();
  const bulan = monthNames[d.getMonth()];
  const tahun = d.getFullYear();
  return `${hari}, ${tgl} ${bulan} ${tahun}`;
}

export function shiftDate(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}
