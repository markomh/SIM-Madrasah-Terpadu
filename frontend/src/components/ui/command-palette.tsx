"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Command, ArrowRight, Shield, Users, CalendarDays, FileText, Home, LogOut } from "lucide-react";
import { useAuth } from "@/components/auth-context";

interface CommandItem {
  id: string;
  title: string;
  category: "Navigasi" | "Aksi Cepat" | "Kategori";
  icon: typeof Home;
  action: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const authCtx = useAuth();

  // Shortcut key listener (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navigateTo = useCallback(
    (path: string) => {
      router.push(path);
      setOpen(false);
      setQuery("");
    },
    [router]
  );

  const items: CommandItem[] = [
    { id: "nav-home", title: "Beranda Utama", category: "Navigasi", icon: Home, action: () => navigateTo("/") },
    { id: "nav-siswa", title: "Data Siswa Induk", category: "Navigasi", icon: Users, action: () => navigateTo("/kesiswaan/siswa") },
    { id: "nav-jadwal", title: "Penjadwalan Pelajaran", category: "Navigasi", icon: CalendarDays, action: () => navigateTo("/akademik/jadwal") },
    { id: "nav-presensi", title: "Presensi Siswa", category: "Navigasi", icon: CalendarDays, action: () => navigateTo("/akademik/presensi-siswa") },
    { id: "nav-surat", title: "Persuratan & E-Arsip", category: "Navigasi", icon: FileText, action: () => navigateTo("/persuratan") },
    { id: "nav-bk", title: "Bimbingan Konseling (BK)", category: "Navigasi", icon: Shield, action: () => navigateTo("/bk") },
    { id: "nav-persetujuan", title: "Kotak Persetujuan Kamad", category: "Navigasi", icon: Shield, action: () => navigateTo("/persetujuan") },
    { id: "act-siswa-baru", title: "Tambah Data Siswa Baru", category: "Aksi Cepat", icon: Users, action: () => navigateTo("/kesiswaan/siswa") },
    { id: "act-surat-baru", title: "Draft Surat Keluar Baru", category: "Aksi Cepat", icon: FileText, action: () => navigateTo("/persuratan") },
  ];

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  // Keyboard navigation inside Command Palette
  const handleKeyDownInPalette = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault();
      filteredItems[selectedIndex].action();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-ink/50 backdrop-blur-xs">
      <div
        className="w-full max-w-xl overflow-hidden rounded-[8px] border border-border bg-surface shadow-2xl animate-in fade-in zoom-in-95 duration-100"
        onKeyDown={handleKeyDownInPalette}
      >
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-border px-3.5 py-3">
          <Search className="mr-2.5 h-4 w-4 shrink-0 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Ketik perintah atau cari navigasi (mis. 'Siswa', 'Presensi')..."
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border bg-paper px-1.5 text-[10px] font-semibold text-muted">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted">
              Tidak ditemukan hasil untuk <span className="font-semibold text-ink">"{query}"</span>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex cursor-pointer items-center justify-between rounded-[4px] px-3 py-2.5 text-sm transition ${
                    isSelected ? "bg-primary text-white" : "text-ink hover:bg-paper"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isSelected ? "text-white" : "text-muted"}`} />
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-semibold tracking-wider ${isSelected ? "text-white/80" : "text-muted"}`}>
                      {item.category}
                    </span>
                    <ArrowRight className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "opacity-0"}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Command Palette Footer */}
        <div className="flex items-center justify-between border-t border-border bg-paper px-3.5 py-2 text-[11px] text-muted">
          <div className="flex items-center gap-3">
            <span><kbd className="font-semibold">↑↓</kbd> Navigasi</span>
            <span><kbd className="font-semibold">↵</kbd> Pilih</span>
          </div>
          <span>SIM Madrasah Terpadu</span>
        </div>
      </div>
    </div>
  );
}
