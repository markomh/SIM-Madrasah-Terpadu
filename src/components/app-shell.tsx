"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
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
import { getAllPeran, useAuth } from "@/components/auth-context";
import { useTahunAjaran } from "@/components/app-providers";
import type { Peran } from "@/types";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  roles: Peran[];
};

type NavGroup = { group: string; items: NavItem[] };

const navigation: NavGroup[] = [
  {
    group: "MADRASAH",
    items: [
      { href: "/", label: "Beranda", icon: Home, roles: ["Admin Madrasah", "Kepala Madrasah", "Operator Kesiswaan", "Wali Kelas", "Guru Mapel", "Orang Tua Wali"] },
    ],
  },
  {
    group: "KESISWAAN",
    items: [
      { href: "/kesiswaan/siswa", label: "Data Siswa Induk", icon: Users, roles: ["Admin Madrasah", "Operator Kesiswaan", "Wali Kelas", "Kepala Madrasah"] },
      { href: "/kesiswaan/absensi", label: "Absensi", icon: ClipboardCheck, roles: ["Wali Kelas", "Guru Mapel", "Admin Madrasah"] },
      { href: "/kesiswaan/kenaikan-kelas", label: "Kenaikan Kelas", icon: BookOpen, roles: ["Admin Madrasah", "Operator Kesiswaan"] },
      { href: "/kesiswaan/pindah-rombel", label: "Pindah Rombel", icon: ArrowLeftRight, roles: ["Operator Kesiswaan", "Kepala Madrasah", "Admin Madrasah"] },
      { href: "/kesiswaan/mutasi", label: "Mutasi", icon: Shield, roles: ["Operator Kesiswaan", "Kepala Madrasah", "Admin Madrasah"] },
    ],
  },
  {
    group: "GURU & TENDIK",
    items: [
      { href: "/guru-tendik/pegawai", label: "Data Pegawai", icon: Users, roles: ["Admin Madrasah", "Kepala Madrasah"] },
      { href: "/guru-tendik/jadwal", label: "Penjadwalan", icon: CalendarDays, roles: ["Admin Madrasah", "Guru Mapel", "Kepala Madrasah"] },
    ],
  },
  {
    group: "PERSURATAN",
    items: [
      { href: "/persuratan", label: "Buat & Arsip Surat", icon: FileText, roles: ["Admin Madrasah", "Operator Kesiswaan", "Kepala Madrasah"] },
    ],
  },
  {
    group: "WAWASAN",
    items: [
      { href: "/wawasan", label: "Dashboard AI", icon: Sparkles, roles: ["Kepala Madrasah", "Wali Kelas", "Admin Madrasah"] },
      { href: "/persetujuan", label: "Kotak Persetujuan", icon: Inbox, roles: ["Kepala Madrasah"] },
    ],
  },
  {
    group: "REFERENSI",
    items: [
      { href: "/referensi", label: "Mapel, Tingkat, Libur", icon: Settings2, roles: ["Admin Madrasah"] },
    ],
  },
  {
    group: "AKUN",
    items: [
      { href: "/akun", label: "Kelola Akun & Demo", icon: UserCog, roles: ["Admin Madrasah"] },
      { href: "/portal-ortu", label: "Portal Orang Tua", icon: School, roles: ["Orang Tua Wali", "Admin Madrasah"] },
    ],
  },
];

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const pathname = usePathname() || "/";
  const { peran, setPeran, currentUser } = useAuth();
  const { list: tahunList, selected, setSelectedId } = useTahunAjaran();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visible = navigation
    .map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(peran)) }))
    .filter((g) => g.items.length > 0);

  const Nav = () => (
    <nav className="space-y-5">
      {visible.map((group) => (
        <div key={group.group}>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{group.group}</p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
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
                  <ChevronRight size={14} className="opacity-50" />
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
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-surface px-4 py-5 lg:flex lg:flex-col">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-primary text-white">
              <School size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">SIM Madrasah</p>
              <p className="text-xs text-muted">Terpadu</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Nav />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-border bg-surface">
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
                    <p className="text-xs text-muted">Sistem Informasi Manajemen</p>
                    <p className="text-base font-semibold">{title ?? "SIM Madrasah Terpadu"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="relative flex h-9 w-9 items-center justify-center rounded-[4px] border border-border">
                    <Bell size={16} />
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
                  </button>
                  <div className="hidden items-center gap-2 rounded-[4px] border border-border px-2 py-1.5 sm:flex">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-primary-soft text-xs font-bold text-primary">
                      {(currentUser?.nama_lengkap_gelar ?? peran).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">{currentUser?.nama_lengkap_gelar ?? peran}</p>
                      <p className="text-[10px] text-muted">{peran}</p>
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
                <span className="rounded-[4px] border border-border bg-surface px-2 py-1 text-xs">
                  Semester: {selected?.semester ?? "—"}
                </span>
                <label className="ml-auto flex items-center gap-2 rounded-[4px] border border-amber/40 bg-[#F5EADF] px-2 py-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-amber">Demo Role</span>
                  <select
                    className="bg-transparent text-sm outline-none"
                    value={peran}
                    onChange={(e) => setPeran(e.target.value as Peran)}
                  >
                    {getAllPeran().map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} aria-label="Tutup" />
          <div className="absolute left-0 top-0 h-full w-72 overflow-y-auto bg-surface p-4 shadow-lg">
            <p className="mb-4 text-sm font-semibold">Menu</p>
            <Nav />
          </div>
        </div>
      ) : null}
    </div>
  );
}
