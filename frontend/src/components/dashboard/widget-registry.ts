import type { ElementType } from "react";

export interface CapabilitiesMap {
  isAdminMadrasah?: boolean;
  isKepalaMadrasah?: boolean;
  isOperatorKesiswaan?: boolean;
  isGuruBk?: boolean;
  isWaliKelas?: boolean;
  isPembinaEkstrakurikuler?: boolean;
  isPengajar?: boolean;
  isTendik?: boolean;
}

export interface PriorityTaskItem {
  id: string;
  title: string;
  subtitle: string;
  tone: "danger" | "warning" | "info" | "success";
  actionLabel: string;
  drawerType: "presensi" | "bk" | "approval" | "izin" | "link";
  linkHref?: string;
  capabilityRequired?: keyof CapabilitiesMap;
  contextCategory?: "pengajar" | "walikelas" | "ekstrakurikuler" | "bk" | "manajerial";
  contextBadge?: string;
}

export interface WidgetDefinition {
  id: string;
  title: string;
  category: "executive" | "operational" | "monitoring" | "bk" | "operator";
  requiredCapabilities: (keyof CapabilitiesMap)[];
}

/**
 * Resolves the list of priority tasks for Tier 3 based on user capabilities & current system state
 */
export function resolvePriorityTasks(
  capabilities: CapabilitiesMap,
  pendingCount: number,
  risikoCount: number,
  flaggedCount: number
): PriorityTaskItem[] {
  const tasks: PriorityTaskItem[] = [];

  // 1. Kepala Madrasah & Admin - Approval Pending
  if ((capabilities.isKepalaMadrasah || capabilities.isAdminMadrasah) && pendingCount > 0) {
    tasks.push({
      id: "task-approval-pending",
      title: "Antrean Persetujuan / TTD Dokumen",
      subtitle: `Ada ${pendingCount} berkas (surat/mutasi) menunggu pengesahan Anda.`,
      tone: "danger",
      actionLabel: "Tinjau & Setujui",
      drawerType: "approval",
      linkHref: "/persetujuan",
      capabilityRequired: "isKepalaMadrasah",
      contextCategory: "manajerial",
      contextBadge: "Manajerial",
    });
  }

  // 2. Guru Pengajar - Sesi Mengajar Hari Ini
  if (capabilities.isPengajar) {
    tasks.push({
      id: "task-presensi-kbm",
      title: "Jadwal & Presensi Sesi Mengajar",
      subtitle: "Pastikan jurnal KBM & presensi siswa sesi hari ini telah terisi.",
      tone: "warning",
      actionLabel: "Isi Jurnal & Presensi",
      drawerType: "presensi",
      linkHref: "/akademik/presensi-siswa",
      capabilityRequired: "isPengajar",
      contextCategory: "pengajar",
      contextBadge: "Pengajar",
    });
  }

  // 3. Wali Kelas - Peringatan Kehadiran Rombel Binaan
  if (capabilities.isWaliKelas) {
    tasks.push({
      id: "task-walikelas-absensi",
      title: "Monitoring Kehadiran Rombel Binaan",
      subtitle: flaggedCount > 0 ? `${flaggedCount} siswa binaan memiliki catatan kedisiplinan/alpa.` : "Pantau rekap kehadiran harian kelas binaan Anda.",
      tone: flaggedCount > 0 ? "danger" : "info",
      actionLabel: "Cek Rekap Rombel",
      drawerType: "link",
      linkHref: "/kesiswaan/rombel",
      capabilityRequired: "isWaliKelas",
      contextCategory: "walikelas",
      contextBadge: "Wali Kelas",
    });
  }

  // 4. Guru BK - Siswa Poin Kritis / Rujukan
  if (capabilities.isGuruBk) {
    tasks.push({
      id: "task-bk-risiko",
      title: "Buku Kasus & Poin Kritis BK",
      subtitle: risikoCount > 0 ? `${risikoCount} siswa perlu perhatian & bimbingan konseling.` : "Catat jurnal layanan bimbingan & konseling siswa.",
      tone: risikoCount > 0 ? "danger" : "info",
      actionLabel: "+ Catatan BK",
      drawerType: "bk",
      linkHref: "/kesiswaan/bk",
      capabilityRequired: "isGuruBk",
      contextCategory: "bk",
      contextBadge: "Guru BK",
    });
  }

  // 5. Pembina Ekstrakurikuler - Kelola Kegiatan & Presensi
  if (capabilities.isPembinaEkstrakurikuler) {
    tasks.push({
      id: "task-ekstra",
      title: "Pembinaan Ekstrakurikuler",
      subtitle: "Kelola kegiatan & presensi ekstrakurikuler binaan Anda.",
      tone: "info",
      actionLabel: "Kelola Ekstra",
      drawerType: "link",
      linkHref: "/akademik/ekstrakurikuler",
      capabilityRequired: "isPembinaEkstrakurikuler",
      contextCategory: "ekstrakurikuler",
      contextBadge: "Ekstrakurikuler",
    });
  }

  // 6. Operator Kesiswaan / Admin - Sync & Transaksi Siswa
  if (capabilities.isOperatorKesiswaan || capabilities.isAdminMadrasah) {
    tasks.push({
      id: "task-operator-sync",
      title: "Validasi Data & Verval EMIS",
      subtitle: "Pastikan kelengkapan NISN dan data induk siswa valid.",
      tone: "info",
      actionLabel: "Kelola Data Siswa",
      drawerType: "link",
      linkHref: "/kesiswaan/siswa",
      capabilityRequired: "isOperatorKesiswaan",
      contextCategory: "manajerial",
      contextBadge: "Kesiswaan & Ops",
    });
  }

  return tasks;
}
