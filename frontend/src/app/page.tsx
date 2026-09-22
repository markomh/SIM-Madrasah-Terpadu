"use client";

import {
  isAdminMadrasah,
  isKepalaMadrasah,
  isOperatorKesiswaan,
  isPembinaBk,
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
  SurfaceCard,
} from "@/components/ui/primitives";
import { services } from "@/services";
import type { PersetujuanItem } from "@/services/persetujuan.service";
import type { Siswa } from "@/types";

import { ContextualIdentityStrip } from "@/components/dashboard/ContextualIdentityStrip";
import { ContextFilterBar, type PresentationContextFilter } from "@/components/dashboard/ContextFilterBar";
import { AdaptiveMetricsRegion } from "@/components/dashboard/AdaptiveMetricsRegion";
import { QuickActionBar } from "@/components/dashboard/QuickActionBar";
import { UniversalAnnouncement } from "@/components/dashboard/UniversalAnnouncement";
import { DashboardDrawers } from "@/components/dashboard/DashboardDrawers";
import { MultiRoleWorkAreaHub } from "@/components/dashboard/MultiRoleWorkAreaHub";
import { resolvePriorityTasks, type CapabilitiesMap } from "@/components/dashboard/widget-registry";


function EmptyAssignmentState() {
  return (
    <SurfaceCard className="p-8 text-center max-w-xl mx-auto border border-dashed border-border rounded-lg mt-8">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-soft text-amber">
          <span className="text-xl font-bold">!</span>
        </div>
        <div className="space-y-1.5">
          <h3 className="text-sm font-bold text-ink">Penugasan Belum Aktif</h3>
          <p className="text-xs text-muted leading-relaxed">
            Penugasan Anda belum aktif. Beberapa fitur mungkin belum tersedia — silakan hubungi Admin Madrasah jika ini tidak sesuai.
          </p>
        </div>
      </div>
    </SurfaceCard>
  );
}

export default function DashboardPage() {
  const { currentUser, penugasanList, rombelList, ekstraList, jadwalList, plottingBkList, isLoading: authLoading } = useAuth();
  const { version } = useDataVersion();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pending, setPending] = useState<PersetujuanItem[]>([]);
  const [risiko, setRisiko] = useState<Siswa[]>([]);
  const [siswaCount, setSiswaCount] = useState(0);
  const [rekapPagi, setRekapPagi] = useState<Awaited<ReturnType<typeof services.sesiTatapMuka.getRekapTanggal>> | null>(null);
  const [flaggedCount, setFlaggedCount] = useState(0);  const [activeContextFilter, setActiveContextFilter] = useState<PresentationContextFilter>("semua");
  const [activeDrawer, setActiveDrawer] = useState<"presensi" | "bk" | "approval" | "izin" | "rekap-pagi" | "ai-risiko" | "jadwal-hari-ini" | null>(null);

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
        setRekapPagi(rekap);
        if (rekapKedisiplinan) {
          setFlaggedCount(rekapKedisiplinan.filter((x) => x.isFlagged).length);
        }
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

  // Derive Capabilities Map from SSoT authorization helpers
  const capabilities: CapabilitiesMap = {
    isAdminMadrasah: currentUser ? isAdminMadrasah(currentUser.id_pegawai, penugasanList) : false,
    isKepalaMadrasah: currentUser ? isKepalaMadrasah(currentUser.id_pegawai, penugasanList) : false,
    isOperatorKesiswaan: currentUser ? isOperatorKesiswaan(currentUser.id_pegawai, penugasanList) : false,
    isWaliKelas: currentUser ? isWaliKelas(currentUser.id_pegawai, rombelList) : false,
    isPembinaEkstrakurikuler: currentUser ? isPembinaEkstrakurikuler(currentUser.id_pegawai, ekstraList) : false,
    isPengajar: currentUser ? isPengajarAktif(currentUser.id_pegawai, jadwalList) : false,
    isGuruBk: currentUser ? isPembinaBk(currentUser.id_pegawai, plottingBkList) : false,
    isTendik: currentUser?.tugas_utama === "Tendik",
  };

  const priorityTasks = resolvePriorityTasks(capabilities, pending.length, risiko.length, flaggedCount);

  // Filter tasks based on active context filter
  const filteredTasks =
    activeContextFilter === "semua"
      ? priorityTasks
      : priorityTasks.filter((t) => t.contextCategory === activeContextFilter);

  if (loading) {
    return (
      <AppShell title="Beranda">
        <LoadingBlock label="Menyiapkan Beranda Unified Adaptive..." />
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

  const hasAnyCapability =
    capabilities.isAdminMadrasah ||
    capabilities.isKepalaMadrasah ||
    capabilities.isOperatorKesiswaan ||
    capabilities.isGuruBk ||
    capabilities.isWaliKelas ||
    capabilities.isPembinaEkstrakurikuler ||
    capabilities.isPengajar ||
    capabilities.isTendik;


  return (
    <AppShell title="Beranda">
      {!hasAnyCapability ? (
        <EmptyAssignmentState />
      ) : (
        <>
          {/* ZONA 2: USER ORIENTATION & IDENTITY STRIP */}
          <ContextualIdentityStrip
            nama={currentUser?.nama_lengkap_gelar ?? "Pegawai"}
            nip={currentUser?.nip}
            capabilities={capabilities}
          />

          {/* ZONA 2: PRESENTATION CONTEXT FILTER BAR & QUICK ACTIONS */}
          <ContextFilterBar
            capabilities={capabilities}
            activeFilter={activeContextFilter}
            onFilterChange={setActiveContextFilter}
            jadwalCount={
              jadwalList.filter(
                (j) =>
                  (j.id_pegawai === currentUser?.id_pegawai ||
                    (j.id_pengajar_tambahan && j.id_pengajar_tambahan.includes(currentUser?.id_pegawai ?? ""))) &&
                  j.hari === ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][new Date().getDay()]
              ).length
            }
            rombelLabel={rombelList.find((r) => r.id_wali_kelas === currentUser?.id_pegawai)?.nama_rombel}
            ekstraLabel={ekstraList.find((e) => e.id_pembina === currentUser?.id_pegawai)?.nama_ekstra}
            risikoBkCount={risiko.length}
          />

          <QuickActionBar
            capabilities={capabilities}
            activeFilter={activeContextFilter}
            onOpenDrawer={(type) => setActiveDrawer(type)}
          />

          {/* ZONA 3: ADAPTIVE METRICS REGION */}
          <AdaptiveMetricsRegion
            capabilities={capabilities}
            activeFilter={activeContextFilter}
            pending={pending}
            risiko={risiko}
            siswaCount={siswaCount}
            rekapPagi={rekapPagi}
            flaggedCount={flaggedCount}
            currentUserId={currentUser?.id_pegawai}
            rombelList={rombelList}
            jadwalList={jadwalList}
            ekstraList={ekstraList}
            onOpenDrawer={setActiveDrawer}
          />

          {/* ZONA 4: PRIMARY WORK AREA (65%) & SECONDARY UTILITIES (35%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Primary Work Area (Col-span 8 / ~65%) */}
            <div className="lg:col-span-8 space-y-6">
              <MultiRoleWorkAreaHub
                capabilities={capabilities}
                activeFilter={activeContextFilter}
                onFilterChange={setActiveContextFilter}
                filteredTasks={filteredTasks}
                jadwalList={jadwalList}
                rombelList={rombelList}
                ekstraList={ekstraList}
                risiko={risiko}
                siswaCount={siswaCount}
                currentUserId={currentUser?.id_pegawai}
                onOpenDrawer={(drawer) => setActiveDrawer(drawer)}
              />
            </div>

            {/* Secondary Utilities Area (Col-span 4 / ~35%) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Universal Announcement & Information */}
              <UniversalAnnouncement />
            </div>
          </div>
        </>
      )}

      {/* Frictionless In-place Drawers */}
      <DashboardDrawers
        activeDrawer={activeDrawer}
        onClose={() => setActiveDrawer(null)}
        pendingItems={pending}
        rekapPagi={rekapPagi}
        risiko={risiko}
        jadwalList={jadwalList}
        ekstraList={ekstraList}
        rombelList={rombelList}
        currentUserId={currentUser?.id_pegawai}
        onOpenPresensi={() => setActiveDrawer("presensi")}
      />
    </AppShell>
  );
}
