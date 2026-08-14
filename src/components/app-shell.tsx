"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Home,
  Menu,
  School,
  Settings2,
  Shield,
  Sparkles,
  Users,
  ArrowLeftRight,
  Inbox,
  UserCog,
} from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { useTahunAjaran } from "@/components/app-providers";
import { services } from "@/services";
import type { Pegawai } from "@/types";
import {
  isAdminMadrasah,
  isKepalaMadrasah,
  isOperatorKesiswaan,
  isWaliKelas,
  isPembinaEkstrakurikuler,
  isGuruBk,
  isPengajarAktif,
} from "@/lib/access";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  visible: (ctx: ReturnType<typeof useAuth>) => boolean;
};

type NavGroup = { group: string; items: NavItem[] };

const navigation: NavGroup[] = [
  {
    group: "MADRASAH",
    items: [
      { href: "/", label: "Beranda", icon: Home, visible: () => true },
      { href: "/persetujuan", label: "Kotak Persetujuan", icon: Inbox, visible: (ctx) => isKepalaMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) },
    ],
  },
  {
    group: "KESISWAAN",
    items: [
      { href: "/kesiswaan/siswa", label: "Data Siswa Induk", icon: Users, visible: (ctx) => isAdminMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) || isKepalaMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) || isOperatorKesiswaan(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) || isWaliKelas(ctx.currentUser?.id_pegawai ?? "", ctx.rombelList) || isGuruBk(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) },
      { href: "/kesiswaan/kenaikan-kelas", label: "Kenaikan Kelas", icon: BookOpen, visible: (ctx) => isAdminMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) || isOperatorKesiswaan(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) },
      { href: "/kesiswaan/pindah-rombel", label: "Pindah Rombel", icon: ArrowLeftRight, visible: (ctx) => isAdminMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) || isOperatorKesiswaan(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) || isKepalaMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) },
      { href: "/kesiswaan/mutasi", label: "Mutasi", icon: Shield, visible: (ctx) => isAdminMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) || isOperatorKesiswaan(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) || isKepalaMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) },
    ],
  },
  {
    group: "AKADEMIK",
    items: [
      { href: "/akademik/jadwal", label: "Penjadwalan", icon: CalendarDays, visible: (ctx) => isAdminMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) || isKepalaMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) || ctx.currentUser?.tugas_utama === "Guru" },
      { href: "/akademik/presensi-siswa", label: "Presensi Siswa (Sesi)", icon: ClipboardCheck, visible: (ctx) => isAdminMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) || isWaliKelas(ctx.currentUser?.id_pegawai ?? "", ctx.rombelList) || isPengajarAktif(ctx.currentUser?.id_pegawai ?? "", ctx.jadwalList) },
      { href: "/akademik/rekap-presensi", label: "Rekap Presensi", icon: ClipboardCheck, visible: (ctx) => isAdminMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) || isKepalaMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) || isWaliKelas(ctx.currentUser?.id_pegawai ?? "", ctx.rombelList) || isPengajarAktif(ctx.currentUser?.id_pegawai ?? "", ctx.jadwalList) },
      { href: "/akademik/nilai", label: "Nilai Harian", icon: FileText, visible: (ctx) => isAdminMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) || isKepalaMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) || isWaliKelas(ctx.currentUser?.id_pegawai ?? "", ctx.rombelList) || isPengajarAktif(ctx.currentUser?.id_pegawai ?? "", ctx.jadwalList) },
    ],
  },
  {
    group: "KEPEGAWAIAN",
    items: [
      { href: "/kepegawaian/pegawai", label: "Data Pegawai", icon: Users, visible: (ctx) => isAdminMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) || isKepalaMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) },
      { href: "/kepegawaian/izin", label: "Izin Guru", icon: FileText, visible: (ctx) => isAdminMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) || isKepalaMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) },
      { href: "/kepegawaian/kedisiplinan", label: "Kedisiplinan & JTM", icon: Shield, visible: (ctx) => isAdminMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) || isKepalaMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) },
    ],
  },
  {
    group: "EKSTRAKURIKULER & BK",
    items: [
      { href: "/ekstrakurikuler", label: "Ekstrakurikuler", icon: Users, visible: (ctx) => isAdminMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) || isPembinaEkstrakurikuler(ctx.currentUser?.id_pegawai ?? "", ctx.ekstraList) },
      { href: "/bk", label: "Bimbingan Konseling", icon: Shield, visible: (ctx) => isKepalaMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) || isGuruBk(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) },
    ],
  },
  {
    group: "PERSURATAN",
    items: [
      { href: "/persuratan", label: "Buat & Arsip Surat", icon: FileText, visible: (ctx) => isAdminMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) || isOperatorKesiswaan(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) || isKepalaMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) },
    ],
  },
  {
    group: "WAWASAN",
    items: [
      { href: "/wawasan", label: "Dashboard AI", icon: Sparkles, visible: (ctx) => isAdminMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) || isKepalaMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) || isWaliKelas(ctx.currentUser?.id_pegawai ?? "", ctx.rombelList) },
    ],
  },
  {
    group: "REFERENSI",
    items: [
      { href: "/referensi", label: "Mapel, Tingkat, Libur", icon: Settings2, visible: (ctx) => isAdminMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) },
    ],
  },
  {
    group: "AKUN",
    items: [
      { href: "/akun", label: "Kelola Akun & Penugasan", icon: UserCog, visible: (ctx) => isAdminMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) },
      { href: "/portal-ortu", label: "Portal Orang Tua", icon: School, visible: () => true },
    ],
  },
];

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const pathname = usePathname() || "/";
  const authCtx = useAuth();
  const { currentUser, setCurrentUserId, penugasanList, rombelList, ekstraList } = authCtx;
  const { list: tahunList, selected, setSelectedId, selectedSemester, setSelectedSemester } = useTahunAjaran();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [allPegawai, setAllPegawai] = useState<Pegawai[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [namaMadrasah, setNamaMadrasah] = useState<string>("MTs Terpadu Nusantara");

  useEffect(() => {
    services.pegawai.getAll().then((data) => setAllPegawai(data));
    services.persetujuan.getPending().then((items) => setPendingCount(items.length)).catch(() => {});
    services.madrasah.getCurrent().then((m) => {
      if (m?.nama_madrasah) setNamaMadrasah(m.nama_madrasah);
    }).catch(() => {});
  }, [pathname]);

  const visible = navigation
    .map((g) => ({ ...g, items: g.items.filter((i) => i.visible(authCtx)) }))
    .filter((g) => g.items.length > 0);

  const navContent = (
    <nav className="space-y-5">
      {visible.map((group) => (
        <div key={group.group}>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{group.group}</p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              const showBadge = item.href === "/persetujuan" && pendingCount > 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between rounded-[4px] px-3 py-2 text-sm transition ${
                    active ? "bg-primary text-white" : "text-ink hover:bg-primary-soft"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon size={16} />
                    {item.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {showBadge && (
                      <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${active ? "bg-white text-primary" : "bg-amber text-white"}`}>
                        {pendingCount}
                      </span>
                    )}
                    <ChevronRight size={14} className="opacity-50" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-paper text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-[4px] focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-none"
      >
        Skip to main content
      </a>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-surface px-4 py-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col print:hidden">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-primary text-white">
              <School size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{namaMadrasah}</p>
              <p className="text-xs text-muted">SIM Madrasah Terpadu</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {navContent}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-border bg-surface print:hidden">
            <div className="flex flex-col gap-3 px-4 py-3 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-border lg:hidden"
                    onClick={() => setMobileOpen(true)}
                  >
                    <Menu size={18} />
                  </button>
                  <div>
                    <p className="text-xs text-muted">{namaMadrasah}</p>
                    <p className="text-base font-semibold">{title ?? "SIM Madrasah Terpadu"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/persetujuan"
                    title={pendingCount > 0 ? `${pendingCount} pengajuan menunggu persetujuan` : "Tidak ada notifikasi"}
                    className="relative flex h-9 w-9 items-center justify-center rounded-[4px] border border-border hover:bg-paper transition text-ink"
                  >
                    <Bell size={16} />
                    {pendingCount > 0 ? (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white shadow-sm">
                        {pendingCount}
                      </span>
                    ) : (
                      <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-border" />
                    )}
                  </Link>
                  <div className="hidden items-center gap-2 rounded-[4px] border border-border px-2 py-1.5 sm:flex">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-primary-soft text-xs font-bold text-primary">
                      {currentUser?.nama_lengkap_gelar?.slice(0, 2).toUpperCase() ?? "P"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">{currentUser?.nama_lengkap_gelar ?? "Pegawai"}</p>
                      <p className="text-[10px] text-muted">{currentUser?.tugas_utama}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-[6px] border border-border bg-paper px-3 py-2 text-sm">
                <label className="flex items-center gap-2">
                  <span className="text-xs text-muted">Tahun Ajaran</span>
                  <select
                    className="rounded-[4px] border border-border bg-surface px-2 py-1 text-sm"
                    value={selected?.id_tahun ?? ""}
                    onChange={(e) => setSelectedId(e.target.value)}
                  >
                    {tahunList.map((t) => (
                      <option key={t.id_tahun} value={t.id_tahun}>
                        {t.nama_tahun}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <span className="text-xs text-muted">Semester</span>
                  <select
                    className="rounded-[4px] border border-border bg-surface px-2 py-1 text-sm"
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value as "Ganjil" | "Genap")}
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </label>
                <label className="ml-auto flex items-center gap-1.5 rounded-[4px] border border-amber/40 bg-amber-soft px-2 py-1 max-w-full sm:max-w-[260px] min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-amber shrink-0 whitespace-nowrap">Simulasi Akun</span>
                  <select
                    className="bg-transparent text-xs sm:text-sm outline-none truncate w-full min-w-0 cursor-pointer"
                    value={currentUser?.id_pegawai ?? ""}
                    onChange={(e) => setCurrentUserId(e.target.value)}
                  >
                    {allPegawai.map((p) => {
                      const jabatanStruktural = penugasanList
                        .filter((j) => j.id_pegawai === p.id_pegawai && j.status === "Aktif")
                        .map((j) => {
                          if (j.jenis_jabatan === "Kepala Madrasah") return "Kamad";
                          if (j.jenis_jabatan === "Admin Madrasah") return "Admin";
                          if (j.jenis_jabatan === "Operator Kesiswaan") return "Ops";
                          if (j.jenis_jabatan === "Guru BK") return "BK";
                          return j.jenis_jabatan;
                        });
                      const isWK = isWaliKelas(p.id_pegawai, rombelList);
                      const isPembina = isPembinaEkstrakurikuler(p.id_pegawai, ekstraList);
                      
                      const parts: string[] = [];
                      if (jabatanStruktural.length > 0) parts.push(...jabatanStruktural);
                      if (isWK) parts.push("WK");
                      if (isPembina) parts.push("Pembina");

                      if (parts.length === 0) {
                        parts.push(p.tugas_utama === "Tendik" ? "Tendik" : "Guru Mapel");
                      }

                      const cleanName = p.nama_lengkap_gelar.replace(" (Demo Terpadu)", "");
                      
                      return (
                        <option key={p.id_pegawai} value={p.id_pegawai}>
                          {cleanName} ({parts.join(", ")})
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>
            </div>
          </header>

          <main id="main-content" className="flex-1 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto w-full">{children}</div>
          </main>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} aria-label="Tutup" />
          <div className="absolute left-0 top-0 h-full w-72 overflow-y-auto bg-surface p-4 shadow-lg">
            <p className="mb-4 text-sm font-semibold">Menu</p>
            {navContent}
          </div>
        </div>
      ) : null}
    </div>
  );
}

