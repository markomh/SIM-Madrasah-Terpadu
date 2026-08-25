"use client";

import {
  isAdminMadrasah,
  isKepalaMadrasah,
  isOperatorKesiswaan,
  isGuruBk,
  isWaliKelas,
  isPembinaEkstrakurikuler,
  isPengajarAktif,
} from "@/lib/access";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion } from "@/components/app-providers";
import {
  ErrorBlock,
  LoadingBlock,
  PageHeader,
} from "@/components/ui/primitives";
import { services } from "@/services";
import type { PersetujuanItem } from "@/services/persetujuan.service";
import type { Siswa } from "@/types";

import { ExecutiveDashboard } from "@/components/dashboard/executive-dashboard";
import { OperationalDashboard } from "@/components/dashboard/operational-dashboard";

export default function DashboardPage() {
  const { currentUser, penugasanList, rombelList, ekstraList, jadwalList, isLoading: authLoading } = useAuth();
  const { version } = useDataVersion();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [pending, setPending] = useState<PersetujuanItem[]>([]);
  const [risiko, setRisiko] = useState<Siswa[]>([]);
  const [siswaCount, setSiswaCount] = useState(0);
  const [rekapPagi, setRekapPagi] = useState<Awaited<ReturnType<typeof services.sesiTatapMuka.getRekapTanggal>> | null>(null);
  const [flaggedCount, setFlaggedCount] = useState(0);
  
  const [activeTab, setActiveTab] = useState<"eksekutif" | "administrasi">("eksekutif");

  useEffect(() => {
    if (authLoading || !currentUser) return;

    let cancelled = false;
    setLoading(true);
    Promise.all([
      services.persetujuan.getPending(),
      services.wawasan.getSiswaBerisiko(50),
      services.siswa.getAll({ status_siswa: "Aktif" }),
      services.sesiTatapMuka.getRekapTanggal(new Date().toISOString().slice(0, 10)),
      services.sesiTatapMuka.getRekapKedisiplinan(new Date().toISOString().slice(0, 7)),
    ])
      .then(([p, r, s, rekap, rekapKedisiplinan]) => {
        if (cancelled) return;
        setPending(Array.isArray(p) ? p : []);
        setRisiko(Array.isArray(r) ? r : []);
        setSiswaCount(Array.isArray(s) ? s.filter((x) => !x.id_siswa.includes("pending")).length : 0);
        setRekapPagi(
          rekap && Array.isArray(rekap.daftarDetail)
            ? rekap
            : {
                terjadwal: rekap?.terjadwal ?? 0,
                diinput: rekap?.diinput ?? 0,
                tepatWaktu: rekap?.tepatWaktu ?? 0,
                terlambat: rekap?.terlambat ?? 0,
                digantikan: rekap?.digantikan ?? 0,
                daftarDetail: Array.isArray(rekap?.daftarDetail) ? rekap.daftarDetail : [],
              }
        );
        setFlaggedCount(Array.isArray(rekapKedisiplinan) ? rekapKedisiplinan.filter((k) => k?.isFlagged).length : 0);
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
  }, [version, authLoading, currentUser]);

  // Set default tab based on role
  useEffect(() => {
    if (currentUser && !authLoading) {
      const isExec = isKepalaMadrasah(currentUser.id_pegawai, penugasanList);
      if (!isExec) {
        setActiveTab("administrasi");
      }
    }
  }, [currentUser, authLoading, penugasanList]);

  if (loading) {
    return (
      <AppShell title="Beranda">
        <LoadingBlock />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Beranda">
        <ErrorBlock message={error} />
      </AppShell>
    );
  }

  const hasExecutive = currentUser && (isAdminMadrasah(currentUser.id_pegawai, penugasanList) || isKepalaMadrasah(currentUser.id_pegawai, penugasanList));
  const hasOperational = currentUser && (
    isAdminMadrasah(currentUser.id_pegawai, penugasanList) ||
    isOperatorKesiswaan(currentUser.id_pegawai, penugasanList) ||
    isGuruBk(currentUser.id_pegawai, penugasanList) ||
    isWaliKelas(currentUser.id_pegawai, rombelList) ||
    isPembinaEkstrakurikuler(currentUser.id_pegawai, ekstraList) ||
    isPengajarAktif(currentUser.id_pegawai, jadwalList) ||
    (currentUser.tugas_utama === "Tendik" && !isKepalaMadrasah(currentUser.id_pegawai, penugasanList))
  );

  return (
    <AppShell title="Beranda">
      <PageHeader
        title={`Halo, ${currentUser?.nama_lengkap_gelar ?? "Pegawai"}`}
        description="Dashboard analitik & ringkasan operasional sesuai jabatan & penugasan aktif."
      />

      {/* Tabs */}
      {hasExecutive && hasOperational && (
        <div className="mb-6 border-b border-border flex gap-4">
          <button
            onClick={() => setActiveTab("eksekutif")}
            className={`pb-2 text-sm font-bold uppercase tracking-wider transition-colors ${
              activeTab === "eksekutif"
                ? "border-b-2 border-primary text-primary"
                : "text-muted hover:text-ink"
            }`}
          >
            Tab Eksekutif
          </button>
          <button
            onClick={() => setActiveTab("administrasi")}
            className={`pb-2 text-sm font-bold uppercase tracking-wider transition-colors ${
              activeTab === "administrasi"
                ? "border-b-2 border-primary text-primary"
                : "text-muted hover:text-ink"
            }`}
          >
            Tab Administrasi
          </button>
        </div>
      )}

      {/* Content */}
      <div className="mt-4">
        {(activeTab === "eksekutif" && hasExecutive) || (!hasOperational) ? (
          <ExecutiveDashboard
            pending={pending}
            risiko={risiko}
            siswaCount={siswaCount}
            rekapPagi={rekapPagi}
            flaggedCount={flaggedCount}
          />
        ) : null}

        {(activeTab === "administrasi" && hasOperational) || (!hasExecutive) ? (
          <OperationalDashboard
            pending={pending}
            risiko={risiko}
            isAdminMadrasah={currentUser ? isAdminMadrasah(currentUser.id_pegawai, penugasanList) : false}
            isOperatorKesiswaan={currentUser ? isOperatorKesiswaan(currentUser.id_pegawai, penugasanList) : false}
            isWaliKelas={currentUser ? isWaliKelas(currentUser.id_pegawai, rombelList) : false}
            isPembinaEkstrakurikuler={currentUser ? isPembinaEkstrakurikuler(currentUser.id_pegawai, ekstraList) : false}
            isPengajarAktif={currentUser ? isPengajarAktif(currentUser.id_pegawai, jadwalList) : false}
            isTendik={currentUser?.tugas_utama === "Tendik"}
            isGuruBk={currentUser ? isGuruBk(currentUser.id_pegawai, penugasanList) : false}
          />
        ) : null}
      </div>
    </AppShell>
  );
}
