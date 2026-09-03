"use client";

import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan } from "@/lib/access";
import { useEffect, useState, useMemo } from "react";
import { Clock } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion, useTahunAjaran } from "@/components/app-providers";
import {
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  SurfaceCard,
  Button,
} from "@/components/ui/primitives";
import { services } from "@/services";
import { MutasiApprovalDrawer } from "@/components/persuratan/MutasiApprovalDrawer";
import { AuditTimelineDrawer } from "@/components/audit-timeline-drawer";
import type { AnggotaRombel, ProfilMadrasah, RiwayatMutasi, Rombel, Siswa } from "@/types";
import { MutasiMasukForm } from "@/components/mutasi/MutasiMasukForm";
import { MutasiKeluarForm } from "@/components/mutasi/MutasiKeluarForm";
import { MutasiRiwayatTable } from "@/components/mutasi/MutasiRiwayatTable";

export default function MutasiPage() {
  const { currentUser, penugasanList } = useAuth();
  const { selected } = useTahunAjaran();
  const { version, bump } = useDataVersion();
  const [tab, setTab] = useState<"masuk" | "keluar" | "daftar">("daftar");
  const [mutasi, setMutasi] = useState<RiwayatMutasi[]>([]);
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [allSiswaList, setAllSiswaList] = useState<Siswa[]>([]);
  const [anggotaList, setAnggotaList] = useState<AnggotaRombel[]>([]);
  const [rombel, setRombel] = useState<Rombel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [profil, setProfil] = useState<ProfilMadrasah | null>(null);
  const [approvalDrawerOpen, setApprovalDrawerOpen] = useState<RiwayatMutasi | null>(null);

  // Enterprise Feature 3: Visual Audit Log Timeline State
  const [timelineTarget, setTimelineTarget] = useState<{
    recordId: string;
    title: string;
    metadata?: Record<string, unknown>;
  } | null>(null);

  // Table Filters State
  const [filterQuery, setFilterQuery] = useState("");
  const [filterJenis, setFilterJenis] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const canAjukan =
    (currentUser && isOperatorKesiswaan(currentUser.id_pegawai, penugasanList)) ||
    (currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList));
  const isKamad = currentUser && isKepalaMadrasah(currentUser.id_pegawai, penugasanList);
  const canAccess = canAjukan || isKamad;

  useEffect(() => {
    if (!canAccess) return;
    setLoading(true);
    Promise.all([
      services.mutasi.getAll(),
      services.siswa.getAll({}), // Load all siswa for lookup table
      services.referensi.getRombel({ id_tahun: selected?.id_tahun }),
      services.keanggotaan.getAnggotaAktif(),
      services.lembaga.getProfil(),
    ])
      .then(([m, s, r, a, p]) => {
        const aktifSet = new Set(a.map((x: any) => x.id_siswa));
        setMutasi(m);
        setAllSiswaList(s);
        setSiswa(s.filter((x: any) => aktifSet.has(x.id_siswa) && x.status_siswa === "Aktif"));
        setRombel(r);
        setAnggotaList(a);
        setProfil(p as ProfilMadrasah);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selected?.id_tahun, version, canAccess]);

  useEffect(() => {
    const handleMutate = () => bump();
    window.addEventListener("mutate-mutasi", handleMutate);
    return () => window.removeEventListener("mutate-mutasi", handleMutate);
  }, [bump]);

  const siswaMap = useMemo(() => new Map(allSiswaList.map((s) => [s.id_siswa, s])), [allSiswaList]);

  const filteredMutasi = useMemo(() => {
    return mutasi.filter((m) => {
      const q = filterQuery.toLowerCase();
      const s = siswaMap.get(m.id_siswa);
      const matchQ =
        !q ||
        m.id_siswa.toLowerCase().includes(q) ||
        (m.no_surat_mutasi && m.no_surat_mutasi.toLowerCase().includes(q)) ||
        (s?.nama_lengkap && s.nama_lengkap.toLowerCase().includes(q)) ||
        (s?.nisn && s.nisn.includes(q));
      const matchJenis = filterJenis === "all" || m.jenis_mutasi === filterJenis;
      const matchStatus = filterStatus === "all" || m.status_persetujuan === filterStatus;
      return matchQ && matchJenis && matchStatus;
    });
  }, [mutasi, filterQuery, filterJenis, filterStatus, siswaMap]);

  if (!canAccess) {
    return (
      <AppShell title="Mutasi">
        <ErrorBlock message="Halaman mutasi hanya untuk Operator Kesiswaan, Admin, dan Kepala Madrasah." />
      </AppShell>
    );
  }

  const handleFormSuccess = (msg: string) => {
    setInfo(msg);
    bump();
    setTab("daftar");
  };

  const handleFormError = (msg: string) => {
    setError(msg);
  };

  return (
    <AppShell title="Mutasi">
      <PageHeader
        title="Mutasi Siswa (Masuk / Keluar)"
        description="Setiap mutasi wajib menunggu persetujuan Kepala Madrasah."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {(["daftar", ...(canAjukan ? ["masuk", "keluar"] : [])] as ("daftar" | "masuk" | "keluar")[]).map((t) => (
          <Button
            key={t}
            type="button"
            variant={tab === t ? "primary" : "secondary"}
            size="sm"
            onClick={() => {
              setTab(t);
              setError(null);
              setInfo(null);
            }}
            className="font-bold flex items-center gap-1.5"
          >
            {t === "daftar" ? "Riwayat & Daftar Mutasi" : t === "masuk" ? "+ Ajukan Mutasi Masuk" : "+ Ajukan Mutasi Keluar"}
          </Button>
        ))}
      </div>

      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {info ? (
        <p className="mb-3 rounded-[4px] border border-primary/30 bg-primary-soft px-3 py-2 text-sm text-primary">
          {info}
        </p>
      ) : null}

      {!loading && tab === "daftar" ? (
        <SurfaceCard title="Riwayat mutasi">
          <MutasiRiwayatTable
            filteredMutasi={filteredMutasi}
            siswaMap={siswaMap}
            isKamad={isKamad}
            filterQuery={filterQuery}
            setFilterQuery={setFilterQuery}
            filterJenis={filterJenis}
            setFilterJenis={setFilterJenis}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            onTimelineClick={(m) => {
              const s = siswaMap.get(m.id_siswa);
              setTimelineTarget({
                recordId: m.id_mutasi,
                title: `Timeline Mutasi: ${s?.nama_lengkap ?? m.id_siswa}`,
                metadata: {
                  nama_siswa: s?.nama_lengkap,
                  nisn: s?.nisn,
                  asal: m.sekolah_asal ?? undefined,
                  tujuan: m.sekolah_tujuan ?? undefined,
                  no_surat: m.no_surat_mutasi,
                  status_terkini: m.status_persetujuan,
                },
              });
            }}
          />
        </SurfaceCard>
      ) : null}

      {!loading && tab === "masuk" && canAjukan ? (
        <SurfaceCard title="Form Mutasi Masuk">
          <MutasiMasukForm
            currentUser={currentUser}
            selectedTahun={selected}
            mutasi={mutasi}
            rombel={rombel}
            onSuccess={handleFormSuccess}
            onError={handleFormError}
            onCancel={() => setTab("daftar")}
          />
        </SurfaceCard>
      ) : null}

      {!loading && tab === "keluar" && canAjukan ? (
        <SurfaceCard title="Form Mutasi Keluar">
          <MutasiKeluarForm
            currentUser={currentUser}
            selectedTahun={selected}
            mutasi={mutasi}
            rombel={rombel}
            siswa={siswa}
            anggotaList={anggotaList}
            onSuccess={handleFormSuccess}
            onError={handleFormError}
            onCancel={() => setTab("daftar")}
          />
        </SurfaceCard>
      ) : null}

      {/* Drawer Persetujuan & e-Signature untuk Kepala Madrasah */}
      {approvalDrawerOpen && profil && currentUser && (
        <MutasiApprovalDrawer
          mutasi={approvalDrawerOpen}
          profil={profil}
          currentUser={currentUser}
          onClose={() => setApprovalDrawerOpen(null)}
          onSuccess={() => {
            setApprovalDrawerOpen(null);
            setInfo("Mutasi disetujui dan SKP resmi telah diterbitkan.");
            import("@/lib/event-bus").then(({ mutateEvent }) => mutateEvent("mutasi"));
          }}
        />
      )}

      {/* Visual Audit Log Timeline Drawer */}
      {timelineTarget && (
        <AuditTimelineDrawer
          isOpen={true}
          onClose={() => setTimelineTarget(null)}
          recordId={timelineTarget.recordId}
          recordType="riwayat_mutasi"
          title={timelineTarget.title}
          metadata={timelineTarget.metadata}
        />
      )}
    </AppShell>
  );
}
