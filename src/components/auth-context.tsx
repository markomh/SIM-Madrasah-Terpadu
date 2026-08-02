"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Pegawai, Peran } from "@/types";
import { services } from "@/services";

const ROLE_STORAGE_KEY = "sim-madrasah-peran";

const ROLE_TO_PEGAWAI: Record<Peran, string> = {
  "Admin Madrasah": "pg_admin",
  "Kepala Madrasah": "pg_kepala",
  "Operator Kesiswaan": "pg_ops",
  "Wali Kelas": "pg_wali_a",
  "Guru Mapel": "pg_guru_1",
  "Orang Tua Wali": "pg_ortu",
};

type AuthContextValue = {
  peran: Peran;
  setPeran: (peran: Peran) => void;
  currentUser: Pegawai | null;
  canAccess: (allowed: Peran[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ALL_PERAN: Peran[] = [
  "Admin Madrasah",
  "Kepala Madrasah",
  "Operator Kesiswaan",
  "Wali Kelas",
  "Guru Mapel",
  "Orang Tua Wali",
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [peran, setPeranState] = useState<Peran>("Admin Madrasah");
  const [currentUser, setCurrentUser] = useState<Pegawai | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(ROLE_STORAGE_KEY) as Peran | null;
    if (saved && ALL_PERAN.includes(saved)) {
      setPeranState(saved);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const id = ROLE_TO_PEGAWAI[peran];
    services.pegawai.getById(id).then((user) => {
      if (!cancelled) setCurrentUser(user);
    });
    return () => {
      cancelled = true;
    };
  }, [peran]);

  const setPeran = (next: Peran) => {
    setPeranState(next);
    window.localStorage.setItem(ROLE_STORAGE_KEY, next);
  };

  const value = useMemo(
    () => ({
      peran,
      setPeran,
      currentUser,
      canAccess: (allowed: Peran[]) => allowed.includes(peran),
    }),
    [peran, currentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function getAllPeran(): Peran[] {
  return ALL_PERAN;
}
