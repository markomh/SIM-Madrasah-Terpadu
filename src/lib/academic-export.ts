import type { KomponenNilai, NilaiSiswa } from "@/types/nilai";
import type { Siswa, Rombel, MataPelajaran, Pegawai, ProfilMadrasah } from "@/types";

export interface GradebookRow {
  siswa: Siswa;
  scores: Record<string, number | null>; // id_komponen -> score
  weightedAverage: number | null;
  statusKetuntasan: "Tuntas" | "Belum Tuntas" | "Belum Ada Nilai";
}

/**
 * Menghitung rata-rata berbobot dari nilai komponen siswa.
 */
export function calculateWeightedAverage(
  scores: Record<string, number | null>,
  komponenList: KomponenNilai[]
): number | null {
  if (komponenList.length === 0) return null;

  let totalWeightedScore = 0;
  let totalBobot = 0;
  let hasAnyScore = false;

  for (const k of komponenList) {
    const score = scores[k.id_komponen];
    if (score !== null && score !== undefined && !isNaN(score)) {
      hasAnyScore = true;
      totalWeightedScore += (score * k.bobot) / 100;
      totalBobot += k.bobot;
    }
  }

  if (!hasAnyScore || totalBobot === 0) return null;

  // Normalisasi jika total bobot komponen yang terisi belum 100%
  const normalizedAverage = (totalWeightedScore / totalBobot) * 100;
  return Math.round(normalizedAverage * 10) / 10;
}

/**
 * Mengonversi data matriks nilai ke format CSV Standar RDM (Rapor Digital Madrasah) Kemenag.
 */
export function generateRdmCsv({
  rows,
  komponenList,
  rombel,
  mapel,
  semester,
  tahunAjaran,
}: {
  rows: GradebookRow[];
  komponenList: KomponenNilai[];
  rombel?: Rombel;
  mapel?: MataPelajaran;
  semester: string;
  tahunAjaran?: string;
}): string {
  const headers = [
    "No",
    "NISN",
    "Nama Siswa",
    ...komponenList.map((k) => `"${k.nama_komponen} (${k.bobot}%)"`),
    "Nilai Akhir Operasional",
    "Status",
  ];

  const metaLines = [
    `# FORMAT EKSPOR RAPOR DIGITAL MADRASAH (RDM) KEMENAG`,
    `# Madrasah: MTs Terpadu Nusantara`,
    `# Rombel: ${rombel?.nama_rombel ?? "-"}`,
    `# Mata Pelajaran: ${mapel?.nama_mapel ?? "-"} (${mapel?.kode_mapel ?? "-"})`,
    `# Semester / Tahun: ${semester} / ${tahunAjaran ?? "2026/2027"}`,
    `# Tanggal Ekspor: ${new Date().toLocaleDateString("id-ID")}`,
    "",
  ];

  const dataLines = rows.map((r, idx) => {
    const scoreCols = komponenList.map((k) => {
      const val = r.scores[k.id_komponen];
      return val !== null && val !== undefined ? val : "";
    });

    return [
      idx + 1,
      `'${r.siswa.nisn}`,
      `"${r.siswa.nama_lengkap}"`,
      ...scoreCols,
      r.weightedAverage !== null ? r.weightedAverage : "",
      r.statusKetuntasan,
    ].join(",");
  });

  return [...metaLines, headers.join(","), ...dataLines].join("\n");
}

/**
 * Mengonversi data nilai harian ke format CSV Mentah (Raw Scores).
 */
export function generateRawScoreCsv({
  nilaiList,
  siswaMap,
  komponenMap,
  rombelMap,
  mapelMap,
}: {
  nilaiList: NilaiSiswa[];
  siswaMap: Record<string, Siswa>;
  komponenMap: Record<string, KomponenNilai>;
  rombelMap: Record<string, Rombel>;
  mapelMap: Record<string, MataPelajaran>;
}): string {
  const headers = [
    "ID Nilai",
    "NISN",
    "Nama Siswa",
    "Rombel",
    "Mata Pelajaran",
    "Aktivitas Penilaian",
    "Bobot (%)",
    "Nilai Angka",
    "Semester",
    "Tanggal Input",
  ];

  const lines = nilaiList.map((n) => {
    const s = siswaMap[n.id_siswa];
    const k = komponenMap[n.id_komponen];
    const r = rombelMap[n.id_rombel];
    const m = k ? mapelMap[k.id_mapel] : null;

    return [
      n.id_nilai,
      `'${s?.nisn ?? "-"}`,
      `"${s?.nama_lengkap ?? "-"}"`,
      `"${r?.nama_rombel ?? n.id_rombel}"`,
      `"${m?.nama_mapel ?? "-"}"`,
      `"${k?.nama_komponen ?? n.id_komponen}"`,
      k?.bobot ?? "-",
      n.nilai,
      n.semester,
      n.tanggal_input?.slice(0, 10) ?? "-",
    ].join(",");
  });

  return [headers.join(","), ...lines].join("\n");
}

/**
 * Men-trigger download file CSV langsung di browser klien.
 */
export function triggerCsvDownload(csvContent: string, fileName: string): void {
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName.endsWith(".csv") ? fileName : `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
