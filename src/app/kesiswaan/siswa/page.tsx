"use client";

import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan, isGuruBk, isWaliKelas, isPembinaEkstrakurikuler, isPengajar } from "@/lib/access";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion, useTahunAjaran } from "@/components/app-providers";
import { DataTable } from "@/components/ui/data-table";
import {
  AiLabel,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  SurfaceCard,
  inputClass,
} from "@/components/ui/primitives";
import { maskNik, services } from "@/services";
import type { AnggotaRombel, Rombel, Siswa, TingkatPendidikan } from "@/types";

type Row = Siswa & { rombel_nama: string; id_rombel: string | null };

export default function SiswaListPage() {
  const { currentUser, penugasanList, rombelList, ekstraList, jadwalList } = useAuth();
  const { selected } = useTahunAjaran();
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

  const canEdit = (currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList)) || (currentUser && isOperatorKesiswaan(currentUser.id_pegawai, penugasanList));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      services.siswa.getAll({ status_siswa: statusFilter === "all" ? undefined : (statusFilter as Siswa["status_siswa"]) }),
      services.referensi.getRombel({ id_tahun: selected?.id_tahun }),
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
            // hide pending mutasi-masuk drafts without keanggotaan
            if (s.id_siswa.includes("pending") && !anggotaBySiswa.has(s.id_siswa)) return false;
            if (s.jalur_masuk === "Mutasi Masuk" && !anggotaBySiswa.has(s.id_siswa) && s.status_siswa === "Aktif") {
              // still pending approval
              return false;
            }
            return true;
          })
          .map((s) => {
            const a = anggotaBySiswa.get(s.id_siswa);
            return {
              ...s,
              id_rombel: a?.id_rombel ?? null,
              rombel_nama: a ? rombelMap.get(a.id_rombel)?.nama_rombel ?? "—" : "—",
            };
          });

        if ((currentUser && isWaliKelas(currentUser.id_pegawai, rombelList)) && currentUser) {
          const myRombel = rb.filter((r) => r.id_wali_kelas === currentUser.id_pegawai).map((r) => r.id_rombel);
          mapped = mapped.filter((s) => s.id_rombel && myRombel.includes(s.id_rombel));
        }

        setRows(mapped);
        setRombel(rb);
        setTingkat(tk);
        setError(null);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [statusFilter, selected?.id_tahun, version, currentUser]);

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
        (r.id_rombel != null && rombel.find((rb) => rb.id_rombel === r.id_rombel)?.id_tingkat === tingkatFilter);
      return matchQ && matchRb && matchTk;
    });
  }, [rows, query, rombelFilter, tingkatFilter, rombel]);

  const riskCount = filtered.filter((r) => r.skor_risiko_ai != null && r.skor_risiko_ai >= 50).length;

  return (
    <AppShell title="Data Siswa Induk">
      <PageHeader
        title="Data Siswa Induk"
        description="Pencarian instan, filter, dan aksi detail/edit sesuai RBAC demo."
        action={
          canEdit ? (
            <>
              <SecondaryButton type="button">Import Excel</SecondaryButton>
              <SecondaryButton type="button">Export Verval/EMIS</SecondaryButton>
              <Link href="/kesiswaan/siswa/tambah">
                <PrimaryButton type="button">+ Tambah Siswa</PrimaryButton>
              </Link>
            </>
          ) : null
        }
      />

      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}

      {!loading && !error ? (
        <div className="space-y-4">
          {riskCount > 0 ? (
            <div className="flex flex-wrap items-center gap-3 rounded-[6px] border border-ai/30 bg-[#EDE9F4] p-3 text-sm text-ai">
              <AiLabel />
              <span>
                {riskCount} siswa terindikasi berisiko — perlu tinjauan Wali Kelas
              </span>
            </div>
          ) : null}

          <SurfaceCard>
            <div className="mb-4 flex flex-wrap gap-2">
              <input
                className={`${inputClass} max-w-xs`}
                placeholder="Cari nama / NISN / rombel..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select className={inputClass + " max-w-[160px]"} value={tingkatFilter} onChange={(e) => setTingkatFilter(e.target.value)}>
                <option value="all">Semua Tingkat</option>
                {tingkat.map((t) => (
                  <option key={t.id_tingkat} value={t.id_tingkat}>
                    {t.nama_tingkat}
                  </option>
                ))}
              </select>
              <select className={inputClass + " max-w-[160px]"} value={rombelFilter} onChange={(e) => setRombelFilter(e.target.value)}>
                <option value="all">Semua Rombel</option>
                {rombel.map((r) => (
                  <option key={r.id_rombel} value={r.id_rombel}>
                    {r.nama_rombel}
                  </option>
                ))}
              </select>
              <select className={inputClass + " max-w-[160px]"} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Lulus">Lulus</option>
                <option value="Mutasi Keluar">Mutasi Keluar</option>
                <option value="Drop Out">Drop Out</option>
              </select>
            </div>

            <DataTable
              data={filtered}
              columns={[
                {
                  key: "nama",
                  header: "Nama Lengkap",
                  render: (s) => (
                    <div>
                      <p className="font-semibold">{s.nama_lengkap}</p>
                      <p className="tabular text-xs text-muted">NIK {maskNik(s.nik)}</p>
                    </div>
                  ),
                },
                { key: "nisn", header: "NISN", className: "tabular", render: (s) => s.nisn },
                { key: "rombel", header: "Rombel", render: (s) => s.rombel_nama },
                { key: "status", header: "Status", render: (s) => <StatusBadge status={s.status_siswa} /> },
                {
                  key: "risiko",
                  header: "Risiko AI",
                  render: (s) =>
                    s.skor_risiko_ai != null ? (
                      <span className="tabular text-ai">{s.skor_risiko_ai}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    ),
                },
                {
                  key: "aksi",
                  header: "Aksi",
                  render: (s) => (
                    <div className="flex gap-2">
                      <Link href={`/kesiswaan/siswa/${s.id_siswa}`} className="text-xs font-semibold text-primary">
                        Detail
                      </Link>
                      {canEdit ? (
                        <Link href={`/kesiswaan/siswa/${s.id_siswa}`} className="text-xs font-semibold text-ink">
                          Edit
                        </Link>
                      ) : null}
                    </div>
                  ),
                },
              ]}
            />
          </SurfaceCard>
        </div>
      ) : null}
    </AppShell>
  );
}
