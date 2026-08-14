"use client";

import { isAdminMadrasah, isKepalaMadrasah, isWaliKelas, isPengajarAktif } from "@/lib/access";
import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion, useTahunAjaran } from "@/components/app-providers";
import {
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  SurfaceCard,
  Button,
  Tooltip,
} from "@/components/ui/primitives";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { services } from "@/services";
import type { AbsensiSiswa, AnggotaRombel, Rombel, Siswa, SesiTatapMuka, JadwalPelajaran, MataPelajaran, StatusAbsensi } from "@/types";

// ── Helpers ──────────────────────────────────────────────────────────────────
const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function formatTanggalPanjang(isoDate: string): string {
  const d = new Date(isoDate);
  const hari = dayNames[d.getDay()];
  const tgl = d.getDate();
  const bulan = monthNames[d.getMonth()];
  const tahun = d.getFullYear();
  return `${hari}, ${tgl} ${bulan} ${tahun}`;
}

function shiftDate(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

type StatusKey = StatusAbsensi | "Belum";
type StatusFilterKey = "Semua" | StatusKey;

const STATUS_CONFIG: Record<StatusKey, { label: string; letter: string; className: string; bgClass: string; iconClass: string }> = {
  Hadir:  { label: "Hadir",  letter: "H", className: "text-primary",  bgClass: "bg-primary-soft text-primary", iconClass: "text-primary" },
  Izin:   { label: "Izin",   letter: "I", className: "text-amber",    bgClass: "bg-amber-soft text-amber",     iconClass: "text-amber" },
  Sakit:  { label: "Sakit",  letter: "S", className: "text-amber",    bgClass: "bg-amber-soft text-amber",     iconClass: "text-amber" },
  Alpa:   { label: "Alpa",   letter: "A", className: "text-danger",   bgClass: "bg-danger-soft text-danger",   iconClass: "text-danger" },
  Belum:  { label: "Belum",  letter: "—", className: "text-muted",    bgClass: "bg-paper text-muted",          iconClass: "text-muted" },
};

// ── Main Component ───────────────────────────────────────────────────────────

export default function RekapPresensiPage() {
  const { currentUser, penugasanList, rombelList: contextRombel, jadwalList: contextJadwal } = useAuth();
  const { selected } = useTahunAjaran();
  const { version, bump } = useDataVersion();

  const [rombelList, setRombelList] = useState<Rombel[]>([]);
  const [idRombel, setIdRombel] = useState<string>("");
  const [tanggal, setTanggal] = useState<string>(todayIso());

  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [sesiList, setSesiList] = useState<SesiTatapMuka[]>([]);
  const [absensiList, setAbsensiList] = useState<AbsensiSiswa[]>([]);
  const [jadwalList, setJadwalList] = useState<JadwalPelajaran[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter / Search state
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const canAccess = currentUser && (
    isAdminMadrasah(currentUser.id_pegawai, penugasanList) ||
    isKepalaMadrasah(currentUser.id_pegawai, penugasanList) ||
    isWaliKelas(currentUser.id_pegawai, contextRombel) ||
    isPengajarAktif(currentUser.id_pegawai, contextJadwal)
  );

  // ── Load rombel list ──────────────────────────────────────────────
  useEffect(() => {
    services.referensi.getRombel({ id_tahun: selected?.id_tahun }).then(r => {
      setRombelList(r);
      if (r.length > 0 && !idRombel) setIdRombel(r[0].id_rombel);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id_tahun]);

  // ── Load main data ────────────────────────────────────────────────
  useEffect(() => {
    if (!idRombel || !canAccess) return;
    queueMicrotask(() => setLoading(true));

    Promise.all([
      services.sesiTatapMuka.getByRombelTanggal(idRombel, tanggal),
      services.absensi.getRekapHarian(idRombel, tanggal),
      services.siswa.getAll({ id_rombel: idRombel }),
      services.jadwal.getAll(),
      services.referensi.getMapel(),
      services.keanggotaan.getAnggotaAktif(),
    ])
      .then(([sesi, abs, siswa, jadwal, mapel, anggota]) => {
        setSesiList(sesi);
        setAbsensiList(abs);
        setJadwalList(jadwal);
        setMapelList(mapel);

        const activeIds = anggota.map((a: AnggotaRombel) => a.id_siswa);
        setSiswaList(siswa.filter((s: Siswa) => activeIds.includes(s.id_siswa)));

        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [idRombel, tanggal, version, canAccess]);

  // ── Derive sesi columns with enriched data ────────────────────────
  const sesiColumns = useMemo(() => {
    return sesiList.map(sesi => {
      const jadwal = jadwalList.find(j => j.id_jadwal === sesi.id_jadwal);
      const mapel = mapelList.find(m => m.id_mapel === jadwal?.id_mapel);
      const isFilled = sesi.status_kehadiran_guru !== "Tidak Terlaksana";

      // Count statuses for this sesi
      let filledCount = 0;
      for (const s of siswaList) {
        const abs = absensiList.find(a => a.id_siswa === s.id_siswa && a.id_sesi === sesi.id_sesi);
        if (abs) filledCount++;
      }

      return {
        sesi,
        jadwal,
        mapel,
        isFilled,
        filledCount,
        totalSiswa: siswaList.length,
      };
    });
  }, [sesiList, jadwalList, mapelList, absensiList, siswaList]);

  // ── Summary counts ────────────────────────────────────────────────
  const summaryCounts = useMemo(() => {
    const counts = { Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0, Belum: 0 };
    const totalSlots = siswaList.length * sesiColumns.length;

    for (const col of sesiColumns) {
      for (const s of siswaList) {
        const abs = absensiList.find(a => a.id_siswa === s.id_siswa && a.id_sesi === col.sesi.id_sesi);
        if (!abs || !col.isFilled) {
          counts.Belum++;
        } else {
          counts[abs.status]++;
        }
      }
    }

    return { ...counts, total: siswaList.length, totalSlots };
  }, [siswaList, sesiColumns, absensiList]);

  // ── Filter + Search siswa ─────────────────────────────────────────
  const filteredSiswa = useMemo(() => {
    let list = [...siswaList];

    // Search by name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.nama_lengkap.toLowerCase().includes(q));
    }

    // Filter by status
    if (statusFilter !== "Semua") {
      list = list.filter(s => {
        // A siswa matches the filter if ANY of their sesi statuses match
        return sesiColumns.some(col => {
          const abs = absensiList.find(a => a.id_siswa === s.id_siswa && a.id_sesi === col.sesi.id_sesi);
          if (statusFilter === "Belum") return !abs || !col.isFilled;
          return abs?.status === statusFilter;
        });
      });
    }

    return list;
  }, [siswaList, searchQuery, statusFilter, sesiColumns, absensiList]);

  // ── CSV Export ─────────────────────────────────────────────────────
  const handleExportCsv = useCallback(() => {
    const rombelObj = rombelList.find(r => r.id_rombel === idRombel);
    const header = ["No", "Nama Siswa"];
    for (const col of sesiColumns) {
      header.push(col.mapel?.nama_mapel ?? "—");
    }

    const rows = siswaList.map((s, idx) => {
      const row = [String(idx + 1), s.nama_lengkap];
      for (const col of sesiColumns) {
        const abs = absensiList.find(a => a.id_siswa === s.id_siswa && a.id_sesi === col.sesi.id_sesi);
        row.push(!col.isFilled ? "-" : abs ? abs.status : "Belum");
      }
      return row;
    });

    const csvContent = [header, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rekap-presensi_${rombelObj?.nama_rombel ?? idRombel}_${tanggal}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [siswaList, sesiColumns, absensiList, idRombel, rombelList, tanggal]);

  // ── Access denied ─────────────────────────────────────────────────
  if (!canAccess) {
    return (
      <AppShell title="Rekap Presensi">
        <ErrorBlock message="Rekap Presensi tersedia untuk Wali Kelas, Guru Mapel, atau Admin." />
      </AppShell>
    );
  }

  const isToday = tanggal === todayIso();
  const currentRombel = rombelList.find(r => r.id_rombel === idRombel);

  return (
    <AppShell title="Rekap Presensi">
      <PageHeader
        title="Rekap Presensi Siswa"
        description="Melihat rekap kehadiran siswa per sesi mata pelajaran."
      />

      {/* ── Date Navigation + Kelas + Export ── */}
      <SurfaceCard className="mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Date navigator */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTanggal(shiftDate(tanggal, -1))}
              className="inline-flex items-center justify-center rounded-[4px] border border-border bg-surface p-1.5 text-muted hover:bg-paper hover:text-ink transition-colors"
              aria-label="Hari sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-sm font-semibold text-ink min-w-[200px] text-center">
              {formatTanggalPanjang(tanggal)}
            </span>

            <button
              type="button"
              onClick={() => setTanggal(shiftDate(tanggal, 1))}
              className="inline-flex items-center justify-center rounded-[4px] border border-border bg-surface p-1.5 text-muted hover:bg-paper hover:text-ink transition-colors"
              aria-label="Hari berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Date picker (calendar icon) */}
            <label className="relative cursor-pointer" aria-label="Pilih tanggal">
              <span className="inline-flex items-center justify-center rounded-[4px] border border-border bg-surface p-1.5 text-muted hover:bg-paper hover:text-ink transition-colors">
                <Calendar className="h-4 w-4" />
              </span>
              <input
                type="date"
                value={tanggal}
                onChange={e => setTanggal(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>

            {/* Today button */}
            {!isToday && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTanggal(todayIso())}
              >
                Hari ini
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Rombel selector */}
            <Select
              value={idRombel}
              onChange={e => setIdRombel(e.target.value)}
              className="min-w-[130px] max-w-[160px]"
              options={rombelList.map(r => ({
                label: r.nama_rombel,
                value: r.id_rombel,
              }))}
            />

            {/* Export dropdown */}
            <div className="relative group">
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<Download className="h-3.5 w-3.5" />}
                onClick={handleExportCsv}
                disabled={loading || sesiColumns.length === 0}
              >
                Ekspor
              </Button>
            </div>
          </div>
        </div>
      </SurfaceCard>

      {/* ── Summary strip ── */}
      {!loading && !error && sesiColumns.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-ink">
            {summaryCounts.total} Siswa
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <SummaryPill
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
              count={summaryCounts.Hadir}
              label="Hadir"
              tone="primary"
            />
            <SummaryPill
              icon={<Clock className="h-3.5 w-3.5" />}
              count={summaryCounts.Izin}
              label="Izin"
              tone="amber"
            />
            <SummaryPill
              icon={<AlertTriangle className="h-3.5 w-3.5" />}
              count={summaryCounts.Sakit}
              label="Sakit"
              tone="amber"
            />
            <SummaryPill
              icon={<XCircle className="h-3.5 w-3.5" />}
              count={summaryCounts.Alpa}
              label="Alpa"
              tone="danger"
            />
            {summaryCounts.Belum > 0 && (
              <SummaryPill
                icon={<span className="text-xs font-bold">⚠</span>}
                count={summaryCounts.Belum}
                label="Belum"
                tone="neutral"
              />
            )}
          </div>
        </div>
      )}

      {/* ── Filter row ── */}
      {!loading && !error && sesiColumns.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as StatusFilterKey)}
            className="max-w-[170px]"
            options={[
              { label: "Semua Status", value: "Semua" },
              { label: "✓ Hadir", value: "Hadir" },
              { label: "I  Izin", value: "Izin" },
              { label: "S  Sakit", value: "Sakit" },
              { label: "A  Alpa", value: "Alpa" },
              { label: "⚠ Belum", value: "Belum" },
            ]}
          />
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Cari siswa..."
            className="max-w-[220px]"
          />
        </div>
      )}

      {/* ── Content ── */}
      {loading ? <LoadingBlock label="Memuat rekap presensi..." /> : null}
      {error ? <ErrorBlock message={error} onRetry={() => bump()} /> : null}

      {!loading && !error && sesiColumns.length === 0 ? (
        <SurfaceCard>
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Calendar className="h-10 w-10 text-muted/40" />
            <p className="text-sm font-semibold text-ink">Tidak ada jadwal</p>
            <p className="text-xs text-muted">
              Tidak ada jadwal sesi tatap muka untuk {currentRombel?.nama_rombel ?? "rombel ini"} pada {formatTanggalPanjang(tanggal)}.
            </p>
          </div>
        </SurfaceCard>
      ) : null}

      {!loading && !error && sesiColumns.length > 0 ? (
        <SurfaceCard className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              {/* ── Table Head ── */}
              <thead>
                <tr className="bg-paper text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="sticky left-0 z-10 bg-paper px-3 py-2.5 w-[200px] min-w-[180px]">
                    Nama Siswa
                  </th>
                  {sesiColumns.map(col => {
                    const allFilled = col.isFilled && col.filledCount === col.totalSiswa;

                    return (
                      <th
                        key={col.sesi.id_sesi}
                        className="px-3 py-2.5 text-center min-w-[140px] border-l border-border/40"
                      >
                        <div className="flex flex-col gap-1 items-center">
                          <span className="font-bold text-ink normal-case">
                            {col.mapel?.nama_mapel ?? "—"}
                          </span>
                          <span className="text-[10px] text-muted tabular">
                            {col.jadwal?.jam_mulai} – {col.jadwal?.jam_selesai}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold tabular ${
                            !col.isFilled
                              ? "text-muted"
                              : allFilled
                                ? "text-primary"
                                : "text-amber"
                          }`}>
                            {!col.isFilled ? (
                              <>— Belum diisi</>
                            ) : allFilled ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                {col.filledCount}/{col.totalSiswa}
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="h-3 w-3" />
                                {col.filledCount}/{col.totalSiswa}
                              </>
                            )}
                          </span>
                          {!col.isFilled && (
                            <Link
                              href={`/akademik/presensi-siswa?rombel=${idRombel}&tanggal=${tanggal}&sesi=${col.sesi.id_sesi}`}
                              className="mt-0.5 inline-flex items-center gap-1 rounded-[4px] border border-primary/30 bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/10"
                            >
                              Isi Presensi
                            </Link>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* ── Table Body ── */}
              <tbody className="divide-y divide-border/60">
                {filteredSiswa.length === 0 ? (
                  <tr>
                    <td
                      colSpan={1 + sesiColumns.length}
                      className="px-3 py-8 text-center text-sm text-muted"
                    >
                      {searchQuery || statusFilter !== "Semua"
                        ? "Tidak ada siswa yang cocok dengan filter."
                        : "Belum ada siswa terdaftar di rombel ini."}
                    </td>
                  </tr>
                ) : (
                  filteredSiswa.map(siswa => (
                    <tr
                      key={siswa.id_siswa}
                      className="hover:bg-paper/60 transition-colors"
                    >
                      {/* Nama siswa — sticky left */}
                      <td className="sticky left-0 z-10 bg-surface px-3 py-2.5 font-semibold text-ink">
                        <span className="truncate block max-w-[200px]" title={siswa.nama_lengkap}>
                          {siswa.nama_lengkap}
                        </span>
                      </td>

                      {/* Status cells */}
                      {sesiColumns.map(col => {
                        const abs = absensiList.find(
                          a => a.id_siswa === siswa.id_siswa && a.id_sesi === col.sesi.id_sesi
                        );

                        if (!col.isFilled) {
                          return (
                            <td
                              key={col.sesi.id_sesi}
                              className="px-3 py-2.5 text-center border-l border-border/40"
                            >
                              <span className="text-muted text-xs">—</span>
                            </td>
                          );
                        }

                        const status: StatusKey = abs ? abs.status : "Belum";
                        const config = STATUS_CONFIG[status];

                        return (
                          <td
                            key={col.sesi.id_sesi}
                            className="px-3 py-2.5 text-center border-l border-border/40"
                          >
                            <Tooltip
                              content={
                                abs
                                  ? `${config.label}${abs.catatan ? ` — ${abs.catatan}` : ""}`
                                  : "Presensi belum diisi"
                              }
                            >
                              <span
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-[4px] text-xs font-bold transition-colors ${config.bgClass}`}
                              >
                                {config.letter}
                              </span>
                            </Tooltip>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      ) : null}
    </AppShell>
  );
}

// ── Summary Pill sub-component ───────────────────────────────────────────────

function SummaryPill({
  icon,
  count,
  label,
  tone,
}: {
  icon: React.ReactNode;
  count: number;
  label: string;
  tone: "primary" | "amber" | "danger" | "neutral";
}) {
  const toneClasses: Record<string, string> = {
    primary: "text-primary bg-primary-soft border-primary/20",
    amber: "text-amber bg-amber-soft border-amber/20",
    danger: "text-danger bg-danger-soft border-danger/20",
    neutral: "text-muted bg-paper border-border",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-xs font-semibold tabular ${toneClasses[tone]}`}
    >
      {icon}
      <span>{count}</span>
      <span className="font-medium">{label}</span>
    </span>
  );
}
