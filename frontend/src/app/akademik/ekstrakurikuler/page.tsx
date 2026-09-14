"use client";

import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan, isPembinaBk, isWaliKelas, isPembinaEkstrakurikuler, isPengajar } from "@/lib/access";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { PageHeader, SurfaceCard, LoadingBlock, ErrorBlock, PrimaryButton, StatusBadge } from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/components/toast-context";
import { services } from "@/services";
import type { Ekstrakurikuler, KeanggotaanEkstra } from "@/types/ekstrakurikuler";
import type { Pegawai, Siswa } from "@/types";

export default function EkstrakurikulerPage() {
  const { currentUser, penugasanList, rombelList, ekstraList, jadwalList } = useAuth();
  const { toast } = useToast();
  const canAccess = (currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList)) || (currentUser && isPembinaEkstrakurikuler(currentUser.id_pegawai, ekstraList));

  const [ekstra, setEkstra] = useState<Ekstrakurikuler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pegawaiMap, setPegawaiMap] = useState<Record<string, string>>({});
  
  const [selectedEkstra, setSelectedEkstra] = useState<Ekstrakurikuler | null>(null);

  useEffect(() => {
    if (!canAccess || !currentUser) return;
    let cancelled = false;
    setLoading(true);

    const isAdmin = currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList);
    const isPembina = currentUser && isPembinaEkstrakurikuler(currentUser.id_pegawai, ekstraList);
    const isOnlyPembina = isPembina && !isAdmin;

    const filter = (isOnlyPembina && currentUser) ? { id_pembina: currentUser.id_pegawai } : undefined;

    Promise.all([
      services.ekstrakurikuler.getAll(filter),
      services.pegawai.getAll()
    ]).then(([ek, pg]) => {
      if (cancelled) return;
      setEkstra(ek);
      const pm: Record<string, string> = {};
      pg.forEach(p => pm[p.id_pegawai] = p.nama_lengkap_gelar);
      setPegawaiMap(pm);
    }).catch(e => {
      if (!cancelled) setError(e.message);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [canAccess, currentUser]);

  if (!canAccess) {
    return (
      <AppShell title="Ekstrakurikuler">
        <ErrorBlock message="Halaman ini khusus untuk Admin Madrasah dan Pembina Ekstrakurikuler." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Ekstrakurikuler">
      <PageHeader 
        title="Ekstrakurikuler" 
        description="Kelola program ekstrakurikuler, keanggotaan, dan presensi." 
        action={
          (currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList)) && (
            <PrimaryButton type="button" onClick={() => toast("Fitur Tambah Ekstrakurikuler belum tersedia", "info")}>
              Tambah Ekstrakurikuler
            </PrimaryButton>
          )
        }
      />

      {error && <ErrorBlock message={error} />}

      {selectedEkstra ? (
        <EkstraDetail 
          ekstra={selectedEkstra} 
          pembinaName={pegawaiMap[selectedEkstra.id_pembina]} 
          onBack={() => setSelectedEkstra(null)}
          canManage={(currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList)) || currentUser?.id_pegawai === selectedEkstra.id_pembina}
        />
      ) : (
        <SurfaceCard title="Daftar Ekstrakurikuler">
          {loading ? <LoadingBlock /> : (
            <DataTable
              data={ekstra}
              columns={[
                { key: "nama", header: "Nama Ekstrakurikuler", render: (e) => <span className="font-semibold">{e.nama_ekstra}</span> },
                { key: "pembina", header: "Pembina", render: (e) => pegawaiMap[e.id_pembina] || "-" },
                { key: "tahun", header: "Tahun Ajaran", render: (e) => e.id_tahun },
                { key: "aksi", header: "Aksi", render: (e) => (
                  <PrimaryButton type="button" onClick={() => setSelectedEkstra(e)}>Kelola</PrimaryButton>
                ) }
              ]}
            />
          )}
        </SurfaceCard>
      )}
    </AppShell>
  );
}

function EkstraDetail({ ekstra, pembinaName, onBack, canManage }: { ekstra: Ekstrakurikuler, pembinaName: string, onBack: () => void, canManage: boolean }) {
  const [keanggotaan, setKeanggotaan] = useState<KeanggotaanEkstra[]>([]);
  const [siswaMap, setSiswaMap] = useState<Record<string, Siswa>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      services.ekstrakurikuler.getKeanggotaan(ekstra.id_ekstra),
      services.siswa.getAll()
    ]).then(([ang, sw]) => {
      if (cancelled) return;
      setKeanggotaan(ang);
      const sm: Record<string, Siswa> = {};
      sw.forEach(s => sm[s.id_siswa] = s);
      setSiswaMap(sm);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [ekstra.id_ekstra]);

  return (
    <div className="space-y-4">
      <PrimaryButton size="sm" onClick={onBack}>&larr; Kembali ke daftar</PrimaryButton>
      
      <SurfaceCard title={`Detail: ${ekstra.nama_ekstra}`}>
        <div className="text-sm mb-4">
          <p><span className="text-muted">Pembina:</span> {pembinaName}</p>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-ink">Anggota Aktif</h2>
          {canManage && (
            <PrimaryButton type="button" onClick={() => toast("Fitur Tambah Anggota belum tersedia", "info")}>+ Tambah Anggota</PrimaryButton>
          )}
        </div>
        
        {loading ? <LoadingBlock /> : (
          <DataTable
            data={keanggotaan}
            columns={[
              { key: "nama", header: "Nama Siswa", render: (a) => siswaMap[a.id_siswa]?.nama_lengkap || "-" },
              { key: "nisn", header: "NISN", render: (a) => siswaMap[a.id_siswa]?.nisn || "-" },
              { key: "tgl_mulai", header: "Tgl Bergabung", render: (a) => a.tanggal_mulai },
              { key: "status", header: "Status", render: (a) => <StatusBadge status={a.status} /> },
            ]}
            emptyTitle="Belum ada anggota"
            emptyDescription="Ekstrakurikuler ini belum memiliki anggota aktif."
            emptyAction={
              canManage ? (
                <PrimaryButton type="button" onClick={() => toast("Fitur Tambah Anggota belum tersedia", "info")}>
                  + Tambah Anggota Pertama
                </PrimaryButton>
              ) : undefined
            }
          />
        )}
      </SurfaceCard>
    </div>
  );
}
