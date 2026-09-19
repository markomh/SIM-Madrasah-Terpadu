"use client";

import { SurfaceCard } from "@/components/ui/primitives";
import { Users, CheckCircle2, Inbox, Shield, BookOpen, UserCheck, Trophy } from "lucide-react";
import type { CapabilitiesMap } from "./widget-registry";
import type { PresentationContextFilter } from "./ContextFilterBar";
import type { PersetujuanItem } from "@/services/persetujuan.service";
import type { Siswa, Rombel, JadwalPelajaran, Ekstrakurikuler } from "@/types";

interface AdaptiveMetricsRegionProps {
  capabilities: CapabilitiesMap;
  activeFilter: PresentationContextFilter;
  pending: PersetujuanItem[];
  risiko: Siswa[];
  siswaCount: number;
  rekapPagi: any;
  flaggedCount: number;
  currentUserId?: string;
  rombelList?: Rombel[];
  jadwalList?: JadwalPelajaran[];
  ekstraList?: Ekstrakurikuler[];
  onOpenDrawer?: (drawerType: any) => void;
}

interface MetricCardData {
  id: string;
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  tone: "primary" | "amber" | "danger" | "ai" | "info";
  tag?: string;
  context: ("pengajar" | "walikelas" | "ekstrakurikuler" | "bk" | "manajerial")[];
}

export function AdaptiveMetricsRegion({
  capabilities,
  activeFilter,
  pending,
  risiko,
  siswaCount,
  rekapPagi,
  flaggedCount,
  currentUserId,
  rombelList = [],
  jadwalList = [],
  ekstraList = [],
  onOpenDrawer,
}: AdaptiveMetricsRegionProps) {
  const allCards: MetricCardData[] = [];

  // Card 1: Kotak Persetujuan (Kamad / Admin)
  if (capabilities.isKepalaMadrasah || capabilities.isAdminMadrasah) {
    allCards.push({
      id: "metric-pending",
      title: "KOTAK PERSETUJUAN",
      value: pending.length,
      subtitle: "Antrean surat & pengesahan mutasi",
      icon: Inbox,
      tone: pending.length > 0 ? "amber" : "info",
      tag: pending.length > 0 ? "Perlu Tindakan" : undefined,
      context: ["manajerial"],
    });
  }

  // Card 2: Kehadiran / Kedisiplinan Jurnal Hari Ini (Pengajar / Wali Kelas / Kamad / Admin)
  if (
    capabilities.isPengajar ||
    capabilities.isWaliKelas ||
    capabilities.isKepalaMadrasah ||
    capabilities.isAdminMadrasah
  ) {
    const hasJadwal = rekapPagi && rekapPagi.terjadwal > 0;
    const pctNumber = hasJadwal
      ? Math.round(((rekapPagi.tepatWaktu + rekapPagi.terlambat) / rekapPagi.terjadwal) * 100)
      : 0;
    const pct = hasJadwal ? `${pctNumber}%` : "0%";

    const contexts: ("pengajar" | "manajerial" | "walikelas" | "ekstrakurikuler" | "bk")[] = [];
    if (capabilities.isPengajar) contexts.push("pengajar");
    if (capabilities.isWaliKelas) contexts.push("walikelas");
    if (capabilities.isAdminMadrasah || capabilities.isKepalaMadrasah) contexts.push("manajerial");

    allCards.push({
      id: "metric-attendance",
      title: "KEDISIPLINAN JURNAL",
      value: pct,
      subtitle: hasJadwal ? "Jurnal terisi hari ini" : "Tidak ada sesi terjadwal",
      icon: CheckCircle2,
      tone: pctNumber === 0 ? "danger" : pctNumber < 80 ? "amber" : "primary",
      context: contexts,
    });
  }

  // Card 3: Siswa Berisiko & BK (Guru BK / Wali Kelas / Kamad)
  if (capabilities.isGuruBk || capabilities.isWaliKelas || capabilities.isKepalaMadrasah) {
    allCards.push({
      id: "metric-bk-risk",
      title: capabilities.isGuruBk ? "Kasus BK Aktif" : "Siswa Pantauan AI",
      value: risiko.length,
      subtitle: flaggedCount > 0 ? `${flaggedCount} siswa ada catatan kedisiplinan` : "Siswa perlu bimbingan & konseling",
      icon: Shield,
      tone: risiko.length > 0 ? "danger" : "info",
      tag: flaggedCount > 0 ? `${flaggedCount} Perhatian` : undefined,
      context: capabilities.isGuruBk ? ["bk"] : ["walikelas"],
    });
  }

  // Card 4: Total Siswa Aktif (Admin / Operator / Kamad)
  if (capabilities.isAdminMadrasah || capabilities.isOperatorKesiswaan || capabilities.isKepalaMadrasah) {
    allCards.push({
      id: "metric-siswa-count",
      title: "TOTAL SISWA AKTIF",
      value: siswaCount > 0 ? siswaCount : "—",
      subtitle: "Terdaftar aktif tahun ajaran ini",
      icon: Users,
      tone: "primary",
      context: ["manajerial"],
    });
  }

  // Card 5: Sesi Mengajar Hari Ini (Pengajar / Guru Mapel) - AKURAT UNTUK HARI INI
  if (capabilities.isPengajar && !allCards.some((c) => c.id === "metric-jtm")) {
    const userJadwal = jadwalList.filter(
      (j) => j.id_pegawai === currentUserId || (j.id_pengajar_tambahan && j.id_pengajar_tambahan.includes(currentUserId ?? ""))
    );
    const dayNamesIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const todayDayName = dayNamesIndo[new Date().getDay()];
    const teacherTodayJadwal = userJadwal.filter((j) => j.hari === todayDayName);
    const sesiHariIniCount = teacherTodayJadwal.length;

    const activeSlot = teacherTodayJadwal[0];
    const rombelObj = activeSlot ? rombelList.find((r) => r.id_rombel === activeSlot.id_rombel) : null;
    const activeRombelName = rombelObj ? `Kelas ${rombelObj.nama_rombel}` : "";

    const subtitleText = activeSlot
      ? `${activeRombelName ? `${activeRombelName} (${activeSlot.jam_mulai}–${activeSlot.jam_selesai})` : "Sesi Mengajar Hari Ini"}`
      : "Tidak ada sesi KBM hari ini";

    allCards.push({
      id: "metric-jtm",
      title: "SESI MENGAJAR HARI INI",
      value: `${sesiHariIniCount} Sesi`,
      subtitle: subtitleText,
      icon: BookOpen,
      tone: sesiHariIniCount > 0 ? "info" : "primary",
      context: ["pengajar"],
    });
  }

  // Card 6: Pembina Ekstrakurikuler Hari Ini
  if (capabilities.isPembinaEkstrakurikuler && !allCards.some((c) => c.id === "metric-ekstra-pembina")) {
    const userExtras = ekstraList.filter((e) => e.id_pembina === currentUserId);
    const namaEkstraList = userExtras.map((e) => e.nama_ekstra).join(", ");

    allCards.push({
      id: "metric-ekstra-pembina",
      title: "PEMBINAAN EKSTRAKURIKULER",
      value: `${userExtras.length || 1} Ekstra`,
      subtitle: namaEkstraList ? `Pembina: ${namaEkstraList}` : "Kelola kegiatan & presensi ekskul",
      icon: Trophy,
      tone: "primary",
      context: ["ekstrakurikuler"],
    });
  }

  // Card 7: Rombel Binaan (Wali Kelas Spesifik)
  if (capabilities.isWaliKelas && !allCards.some((c) => c.id === "metric-rombel")) {
    const userRombel = rombelList.find((r) => r.id_wali_kelas === currentUserId);
    const namaRombelVal = userRombel ? `Kelas ${userRombel.nama_rombel}` : "1 Rombel";
    const subtitleRombel = userRombel
      ? `Wali Kelas ${userRombel.nama_rombel} (Binaan Aktif)`
      : "Monitoring presensi & nilai rombel";

    allCards.push({
      id: "metric-rombel",
      title: "Rombel Binaan",
      value: namaRombelVal,
      subtitle: subtitleRombel,
      icon: UserCheck,
      tone: "primary",
      context: ["walikelas"],
    });
  }

  // Filter cards strictly by active presentation context filter (No leaky fallback)
  const displayCards =
    activeFilter === "semua"
      ? allCards
      : allCards.filter((c) => c.context.includes(activeFilter));

  if (displayCards.length === 0) {
    return null;
  }


  const gridColsClass =
    displayCards.length === 1
      ? "grid-cols-1"
      : displayCards.length === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : displayCards.length === 3
          ? "grid-cols-1 sm:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={`grid gap-4 mb-6 ${gridColsClass}`}>
      {displayCards.map((card) => {
        const Icon = card.icon;
        const isAiCard = card.id === "metric-bk-risk" && (capabilities.isWaliKelas || capabilities.isKepalaMadrasah);
        const clickableClasses = isAiCard && onOpenDrawer ? "cursor-pointer hover:border-ai" : "";

        return (
          <SurfaceCard
            key={card.id}
            className={`p-4 sm:p-5 shadow-xs border border-border/80 rounded-xl transition-all hover:shadow-sm ${clickableClasses}`}
            onClick={isAiCard && onOpenDrawer ? () => onOpenDrawer("ai-risiko") : undefined}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">{card.title}</span>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-[6px] ${
                  card.tone === "amber"
                    ? "bg-amber-soft text-amber"
                    : card.tone === "danger"
                    ? "bg-danger-soft text-danger"
                    : card.tone === "ai"
                    ? "bg-ai-soft text-ai"
                    : "bg-primary-soft text-primary"
                }`}
              >
                <Icon size={18} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <p
                className={`text-2xl sm:text-3xl font-bold tabular ${
                  card.tone === "amber"
                    ? "text-amber"
                    : card.tone === "danger"
                    ? "text-danger"
                    : "text-ink"
                }`}
              >
                {card.value}
              </p>
              {card.tag && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    card.tone === "danger"
                      ? "bg-danger-soft text-danger border border-danger/30"
                      : "bg-amber-soft text-amber border border-amber/30"
                  }`}
                >
                  {card.tag}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted truncate">{card.subtitle}</p>
          </SurfaceCard>
        );
      })}
    </div>
  );
}
