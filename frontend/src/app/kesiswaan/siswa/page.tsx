"use client";

/**
 * /kesiswaan/siswa — Daftar Siswa Induk
 *
 * Polish (2026-08-05):
 *  • Hapus GlobalContextFilter — filter Tahun Ajaran & Semester sudah ada di top bar (app-shell).
 *  • Gunakan <DataTable> agar footer "Menampilkan X-Y dari Z | Prev | Next" aktif kembali.
 *  • Signature Element: kolom render dibungkus StatusStrip sesuai status/AI risk.
 *  • Smart Default Rombel: jika isWaliKelas, rombelFilter otomatis ke rombel milik currentUser.
 */

import {
  isAdminMadrasah,
  isKepalaMadrasah,
  isOperatorKesiswaan,
  isWaliKelas,
  isPembinaBk,
} from "@/lib/access";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion, useTahunAjaran } from "@/components/app-providers";
import { DataTable } from "@/components/ui/data-table";
import {
  AiLabel,
  Alert,
  Button,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  SearchInput,
  Select,
  StatusBadge,
  SurfaceCard,
} from "@/components/ui/primitives";
import { maskNik, services } from "@/services";
import type { AnggotaRombel, Rombel, Siswa, TingkatPendidikan } from "@/types";

type Row = Siswa & {
  rombel_nama: string;
  id_rombel: string | null;
  pending_approval: boolean;
};

/**
 * Kelas border kiri 3px (Signature Element — FRONTEND.md Bab 3).
 * Diterapkan pada level <tr> via prop rowClassName di DataTable.
 */
function rowTone(row: Row): string {
  if (row.skor_risiko_ai != null && row.skor_risiko_ai >= 50)
    return "border-l-[3px] border-l-ai";  // AI risk — ungu
  if (row.status_siswa === "Mutasi Keluar" || row.status_siswa === "Drop Out")
    return "border-l-[3px] border-l-danger";       // Keluar — merah
  if (row.jalur_masuk === "Mutasi Masuk" || row.pending_approval)
    return "border-l-[3px] border-l-amber";        // Mutasi/Pending — amber
  return "border-l-[3px] border-l-primary";        // Aktif — hijau
}

export default function SiswaListPage() {
  const { currentUser, penugasanList, rombelList, plottingBkList } = useAuth();
  const { selected } = useTahunAjaran();          // Tahun Ajaran dari top-bar (app-shell)
  const { version } = useDataVersion();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [rombel, setRombel] = useState<Rombel[]>([]);
  const [tingkat, setTingkat] = useState<TingkatPendidikan[]>([]);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Aktif");
  const [rombelFilter, setRombelFilter] = useState("all");
  const [tingkatFilter, setTingkatFilter] = useState("all");

  // Hak akses — via lib/access.ts
  const canEdit =
    (currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList)) ||
    (currentUser && isOperatorKesiswaan(currentUser.id_pegawai, penugasanList));

  const isWK = currentUser ? isWaliKelas(currentUser.id_pegawai, rombelList) : false;
  const isKamad = currentUser ? isKepalaMadrasah(currentUser.id_pegawai, penugasanList) : false;
  const isBK = currentUser ? isPembinaBk(currentUser.id_pegawai, plottingBkList) : false;
  
  const canAccess = canEdit || isWK || isKamad || isBK;
  const isOnlyWK = isWK && !canEdit && !isKamad;

  // ── Smart Default: auto-pilih rombel Wali Kelas ──────────────────────────
  useEffect(() => {
    if (!currentUser || !isOnlyWK) {
      // Reset ke "all" saat ganti user ke non-WK
      setRombelFilter("all");
      return;
    }
    const myRombel = rombelList.find(
      (r) => r.id_wali_kelas === currentUser.id_pegawai
    );
    if (myRombel) setRombelFilter(myRombel.id_rombel);
  }, [currentUser?.id_pegawai, isWK]);

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      services.siswa.getAll({
        status_siswa:
          statusFilter === "all"
            ? undefined
            : (statusFilter as Siswa["status_siswa"]),
      }),
      services.referensi.getRombel({ id_tahun: selected.id_tahun }),
      services.referensi.getTingkat(),
      services.keanggotaan.getAnggotaAktif(),
    ])
      .then(([siswa, rb, tk, anggota]) => {
        if (cancelled) return;

        const anggotaBySiswa = new Map<string, AnggotaRombel>();
        for (const a of anggota) anggotaBySiswa.set(a.id_siswa, a);
        const rombelMap = new Map(rb.map((r) => [r.id_rombel, r]));

        let mapped: Row[] = siswa
          .filter((s) => {
            if (
              s.jalur_masuk === "Mutasi Masuk" &&
              !anggotaBySiswa.has(s.id_siswa) &&
              s.status_siswa === "Aktif"
            ) return false;
            return true;
          })
          .map((s) => {
            const a = anggotaBySiswa.get(s.id_siswa);
            return {
              ...s,
              id_rombel: a?.id_rombel ?? null,
              rombel_nama: a ? (rombelMap.get(a.id_rombel)?.nama_rombel ?? "—") : "—",
              pending_approval: a?.status_persetujuan === "Menunggu Persetujuan",
            };
          });

        // Wali Kelas (murni) hanya melihat siswa rombelnya sendiri
        if (isOnlyWK && currentUser) {
          const myRombels = rb
            .filter((r) => r.id_wali_kelas === currentUser.id_pegawai)
            .map((r) => r.id_rombel);
          mapped = mapped.filter(
            (s) => s.id_rombel && myRombels.includes(s.id_rombel)
          );
        }

        setRows(mapped);
        setRombel(rb);
        setTingkat(tk);
        setError(null);
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [statusFilter, selected?.id_tahun, version, currentUser?.id_pegawai, isWK]);

  // ── Client-side filter ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = query.toLowerCase();
      const matchQ =
        !q ||
        r.nama_lengkap.toLowerCase().includes(q) ||
        r.nisn.includes(q) ||
        r.rombel_nama.toLowerCase().includes(q);
      const matchRb = rombelFilter === "all" || r.id_rombel === rombelFilter;
      const matchTk =
        tingkatFilter === "all" ||
        (r.id_rombel != null &&
          rombel.find((rb) => rb.id_rombel === r.id_rombel)?.id_tingkat === tingkatFilter);
      return matchQ && matchRb && matchTk;
    });
  }, [rows, query, rombelFilter, tingkatFilter, rombel]);

  const riskCount = filtered.filter(
    (r) => r.skor_risiko_ai != null && r.skor_risiko_ai >= 50
  ).length;

  if (!canAccess) {
    return (
      <AppShell title="Data Siswa Induk">
        <ErrorBlock message="Anda tidak memiliki akses ke halaman ini. Halaman ini hanya untuk Admin, Operator, Kepala Madrasah, Wali Kelas, dan Guru BK." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Data Siswa Induk">
      <PageHeader
        title="Data Siswa Induk"
        description="Kelola data induk siswa terdaftar, status keaktifan, dan rekam akademis."
        action={
          canEdit ? (
            <>
              <Button variant="secondary">Import Excel</Button>
              <Button variant="secondary">Export Verval/EMIS</Button>
              <Link href="/kesiswaan/siswa/tambah">
                <Button variant="primary">+ Tambah Siswa</Button>
              </Link>
            </>
          ) : null
        }
      />

      {/* ── Banner AI risk ────────────────────────────────────────────────── */}
      {riskCount > 0 && (
        <Alert variant="ai" icon={<AiLabel />} className="mb-4">
          <span>{riskCount} siswa terindikasi berisiko — perlu tinjauan Wali Kelas</span>
        </Alert>
      )}

      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} onRetry={() => setError(null)} /> : null}

      {!loading && !error ? (
        <SurfaceCard>
          {/* ── Filter bar ──────────────────────────────────────────────── */}
          <div className="mb-4 flex flex-wrap gap-2">
            <SearchInput
              id="siswa-search"
              className="max-w-xs"
              placeholder="Cari Nama Lengkap / NISN / Rombel..."
              value={query}
              onChange={setQuery}
            />
            <Select
              id="siswa-filter-tingkat"
              className="max-w-[160px]"
              value={tingkatFilter}
              onChange={(e) => setTingkatFilter(e.target.value)}
            >
              <option value="all">— Semua Tingkat —</option>
              {tingkat.map((t) => (
                <option key={t.id_tingkat} value={t.id_tingkat}>
                  {t.nama_tingkat}
                </option>
              ))}
            </Select>
            <Select
              id="siswa-filter-rombel"
              className="max-w-[160px]"
              value={rombelFilter}
              onChange={(e) => setRombelFilter(e.target.value)}
            >
              <option value="all">— Semua Rombel —</option>
              {rombel.map((r) => (
                <option key={r.id_rombel} value={r.id_rombel}>
                  {r.nama_rombel}
                  {r.id_wali_kelas === currentUser?.id_pegawai ? " (rombel Anda)" : ""}
                </option>
              ))}
            </Select>
            <Select
              id="siswa-filter-status"
              className="max-w-[160px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Lulus">Lulus</option>
              <option value="Mutasi Keluar">Mutasi Keluar</option>
              <option value="Drop Out">Drop Out</option>
            </Select>
          </div>

          {/* ── Legenda signature element ────────────────────────────────── */}
          <div className="mb-3 flex flex-wrap gap-3 text-[10px] text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-[3px] rounded-sm bg-primary inline-block" />
              Aktif
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-[3px] rounded-sm bg-amber inline-block" />
              Mutasi Masuk / Menunggu
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-[3px] rounded-sm bg-danger inline-block" />
              Keluar / Drop Out
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-[3px] rounded-sm bg-ai inline-block" />
              Risiko AI
            </span>
          </div>

          {/* ── DataTable (dengan footer paginasi Prev/Next bawaan) ──────── */}
          <DataTable
            data={filtered}
            pageSize={10}
            rowClassName={(s) => rowTone(s)}   // Signature Element di level <tr>
            emptyTitle="Tidak ada siswa ditemukan"
            emptyDescription="Coba ubah filter atau kata kunci pencarian."
            columns={[
              {
                key: "nama",
                header: "Nama Lengkap",
                render: (s) => (
                  <div>
                    <p className="font-semibold text-ink">{s.nama_lengkap}</p>
                    <p className="tabular text-xs text-muted">NIK {maskNik(s.nik)}</p>
                    {s.jalur_masuk === "Mutasi Masuk" && (
                      <span className="mt-0.5 inline-block rounded-sm bg-amber/10 px-1 py-0.5 text-[10px] font-medium text-amber">
                        Mutasi Masuk
                      </span>
                    )}
                    {s.pending_approval && (
                      <span className="mt-0.5 ml-1 inline-block rounded-sm bg-amber/10 px-1 py-0.5 text-[10px] font-medium text-amber">
                        Menunggu
                      </span>
                    )}
                  </div>
                ),
              },
              {
                key: "nisn",
                header: "NISN",
                className: "tabular",
                render: (s) => <span className="tabular text-sm">{s.nisn}</span>,
              },
              {
                key: "rombel",
                header: "Rombel",
                render: (s) => s.rombel_nama,
              },
              {
                key: "status",
                header: "Status",
                render: (s) => <StatusBadge status={s.status_siswa} />,
              },
              {
                key: "risiko",
                header: "Risiko AI",
                render: (s) =>
                  s.skor_risiko_ai != null ? (
                    <span
                      className={`tabular text-sm font-semibold ${
                        s.skor_risiko_ai >= 50 ? "text-ai" : "text-muted"
                      }`}
                    >
                      {s.skor_risiko_ai}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  ),
              },
              {
                key: "aksi",
                header: "Aksi",
                render: (s) => (
                  <div className="flex gap-3">
                    <Link
                      href={`/kesiswaan/siswa/${s.id_siswa}`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Detail
                    </Link>
                    {canEdit && (
                      <Link
                        href={`/kesiswaan/siswa/${s.id_siswa}?mode=edit`}
                        className="text-xs font-semibold text-ink hover:underline"
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </SurfaceCard>
      ) : null}
    </AppShell>
  );
}
