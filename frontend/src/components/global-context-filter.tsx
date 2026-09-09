"use client";

/**
 * GlobalContextFilter
 *
 * Sebuah bar filter global yang menempel di seluruh halaman operasional.
 * Membaca & mengubah state `TahunAjaran` dan `Semester` dari TahunAjaranProvider.
 * Seluruh tabel/form di bawahnya bereaksi terhadap perubahan di sini.
 *
 * Letakkan komponen ini tepat di bawah `<PageHeader>` pada halaman yang butuh
 * filter global (Siswa, Presensi, Nilai, Rekap Presensi).
 */

import { usePathname } from "next/navigation";
import { useTahunAjaran } from "@/components/app-providers";
import { inputClass } from "@/components/ui/primitives";

interface GlobalContextFilterProps {
  /** Label deskriptif singkat (misal: "Konteks Data"). Default: "Filter Global". */
  label?: string;
  /** Sembunyikan selector semester (untuk halaman yang tidak butuh filter semester). */
  hideSemester?: boolean;
}

export function GlobalContextFilter({
  label = "Filter Tahun Ajaran",
  hideSemester = false,
}: GlobalContextFilterProps) {
  const pathname = usePathname();
  const {
    list,
    selected,
    setSelectedId,
    selectedSemester,
    setSelectedSemester,
    loading,
  } = useTahunAjaran();

  // Route-aware logic: Data Kesiswaan, Kepegawaian, dan Referensi Master terikat pada Tahun Ajaran penuh (3NF), bukan semesteran.
  const isMasterOrKesiswaanRoute =
    !!pathname &&
    (pathname.startsWith("/kesiswaan") ||
      pathname.startsWith("/kepegawaian") ||
      pathname.startsWith("/pegawai") ||
      pathname.startsWith("/referensi") ||
      pathname.startsWith("/sarpras") ||
      pathname.startsWith("/master"));

  const shouldShowSemester = !hideSemester && !isMasterOrKesiswaanRoute;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[4px] border border-border/70 bg-paper px-3 py-2">
      {/* Label */}
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-muted">
        {label}
      </span>

      {/* Separator */}
      <span className="shrink-0 text-border">|</span>

      {/* Tahun Ajaran selector */}
      <div className="flex items-center gap-1.5">
        <span className="shrink-0 text-xs text-muted">Tahun Ajaran:</span>
        <select
          id="gcf-tahun"
          className={`${inputClass} w-auto py-1 text-xs`}
          value={selected?.id_tahun ?? ""}
          onChange={(e) => setSelectedId(e.target.value)}
          disabled={loading || list.length === 0}
          aria-label="Tahun Ajaran"
        >
          {list.map((t) => (
            <option key={t.id_tahun} value={t.id_tahun}>
              {t.nama_tahun}
            </option>
          ))}
        </select>
      </div>

      {/* Semester selector */}
      {shouldShowSemester && (
        <div className="flex items-center gap-1.5">
          <span className="shrink-0 text-xs text-muted">Semester:</span>
          <select
            id="gcf-semester"
            className={`${inputClass} w-auto py-1 text-xs`}
            value={selectedSemester}
            onChange={(e) =>
              setSelectedSemester(e.target.value as "Ganjil" | "Genap")
            }
            aria-label="Semester"
          >
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        </div>
      )}

      {/* Indikator aktif */}
      {selected?.status_aktif && (
        <span className="ml-auto shrink-0 inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Tahun Ajaran Aktif
        </span>
      )}
    </div>
  );
}
