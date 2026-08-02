"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import {
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  StatusBadge,
  SurfaceCard,
} from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import { services } from "@/services";
import type { AbsensiSiswa, Siswa } from "@/types";

export default function PortalOrtuPage() {
  const { peran } = useAuth();
  const [siswa, setSiswa] = useState<Siswa | null>(null);
  const [absensi, setAbsensi] = useState<AbsensiSiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    // Demo: orang tua melihat anak sw_01
    Promise.all([
      services.siswa.getById("sw_01"),
      services.absensi.getByTanggal(new Date().toISOString().slice(0, 10)),
    ])
      .then(([s, a]) => {
        setSiswa(s);
        setAbsensi(a.filter((x) => x.id_siswa === "sw_01"));
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (peran !== "Orang Tua Wali" && peran !== "Admin Madrasah") {
    return (
      <AppShell title="Portal Orang Tua">
        <ErrorBlock message="Portal read-only untuk peran Orang Tua/Wali (fase lanjutan)." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Portal Orang Tua">
      <PageHeader
        title="Portal Informasi Anak"
        description="Placeholder fase lanjutan — read-only absensi & pengumuman. Notifikasi WhatsApp belum aktif (mock)."
      />
      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {!loading && siswa ? (
        <div className="space-y-4">
          <SurfaceCard title="Profil anak">
            <p className="text-lg font-semibold">{siswa.nama_lengkap}</p>
            <p className="tabular text-sm text-muted">NISN {siswa.nisn}</p>
            <div className="mt-2">
              <StatusBadge status={siswa.status_siswa} />
            </div>
          </SurfaceCard>
          <SurfaceCard title="Absensi hari ini">
            <DataTable
              data={absensi}
              emptyTitle="Belum ada absensi hari ini"
              emptyDescription="Data akan muncul setelah wali kelas mengisi absensi."
              columns={[
                { key: "tgl", header: "Tanggal", render: (a) => a.tanggal },
                { key: "st", header: "Status", render: (a) => <StatusBadge status={a.status} /> },
              ]}
            />
          </SurfaceCard>
          <SurfaceCard title="Pengumuman">
            <p className="text-sm text-muted">
              Belum ada pengumuman. Gateway WhatsApp/Email akan diintegrasikan pada Tahap 2 / Fase 4 roadmap.
            </p>
          </SurfaceCard>
        </div>
      ) : null}
    </AppShell>
  );
}
