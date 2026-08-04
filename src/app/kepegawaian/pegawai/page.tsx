"use client";

import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan, isGuruBk, isWaliKelas, isPembinaEkstrakurikuler, isPengajar } from "@/lib/access";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion } from "@/components/app-providers";
import { ErrorBlock, LoadingBlock, PageHeader, StatusBadge, SurfaceCard, inputClass } from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import { maskNik, services } from "@/services";
import type { Pegawai } from "@/types";

export default function PegawaiPage() {
  const { currentUser, penugasanList, rombelList, ekstraList, jadwalList } = useAuth();
  const { version } = useDataVersion();
  const [rows, setRows] = useState<Pegawai[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    services.pegawai
      .getAll({ query: query || undefined })
      .then((data) => {
        setRows(data);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [query, version]);

  if (!(currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList)) && !(currentUser && isKepalaMadrasah(currentUser.id_pegawai, penugasanList))) {
    return (
      <AppShell title="Pegawai">
        <ErrorBlock message="Akses data pegawai terbatas untuk Admin dan Kepala Madrasah." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Guru & Tendik">
      <PageHeader title="Data Pegawai" description="Profil PTK dari kontrak Pegawai Bab 4." />
      <div className="mb-4">
        <input className={`${inputClass} max-w-sm`} placeholder="Cari nama / NIP / NPK" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {!loading && !error ? (
        <SurfaceCard>
          <DataTable
            data={rows}
            columns={[
              {
                key: "nama",
                header: "Nama",
                render: (p) => (
                  <div>
                    <p className="font-semibold">{p.nama_lengkap_gelar}</p>
                    <p className="tabular text-xs text-muted">NIK {maskNik(p.nik)}</p>
                  </div>
                ),
              },
              { key: "nip", header: "NIP/NPK", render: (p) => p.nip ?? p.npk ?? "—" },
              { key: "status", header: "Kepegawaian", render: (p) => p.status_kepegawaian },
              { key: "tugas", header: "Tugas", render: (p) => p.tugas_utama },
            ]}
          />
        </SurfaceCard>
      ) : null}
    </AppShell>
  );
}
