"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Pegawai, PenugasanJabatan, Rombel, Ekstrakurikuler, JadwalPelajaran } from "@/types";
import { services } from "@/services";

type AuthContextValue = {
  currentUser: Pegawai | null;
  setCurrentUserId: (id: string) => void;
  // Arrays for role checks
  penugasanList: PenugasanJabatan[];
  rombelList: Rombel[];
  ekstraList: Ekstrakurikuler[];
  jadwalList: JadwalPelajaran[];
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_STORAGE_KEY = "sim-madrasah-userid";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string>("pg_demo_terpadu"); // Default user
  const [currentUser, setCurrentUser] = useState<Pegawai | null>(null);
  
  const [penugasanList, setPenugasanList] = useState<PenugasanJabatan[]>([]);
  const [rombelList, setRombelList] = useState<Rombel[]>([]);
  const [ekstraList, setEkstraList] = useState<Ekstrakurikuler[]>([]);
  const [jadwalList, setJadwalList] = useState<JadwalPelajaran[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem(USER_STORAGE_KEY);
    if (saved) {
      setUserId(saved);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    
    Promise.all([
      services.pegawai.getById(userId).catch(() => null),
      services.penugasanJabatan.getAll(),
      services.referensi.getRombel(),
      services.ekstrakurikuler.getAll(),
      services.jadwal.getAll(),
    ]).then(async ([user, penugasan, rombel, ekstra, jadwal]) => {
      if (cancelled) return;
      if (!user && userId !== "pg_demo_terpadu") {
        const fallbackUser = await services.pegawai.getById("pg_demo_terpadu");
        setCurrentUser(fallbackUser);
      } else {
        setCurrentUser(user);
      }
      setPenugasanList(penugasan || []);
      setRombelList(rombel || []);
      setEkstraList(ekstra || []);
      setJadwalList(jadwal || []);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const setCurrentUserId = (id: string) => {
    setUserId(id);
    window.localStorage.setItem(USER_STORAGE_KEY, id);
  };

  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUserId,
      penugasanList,
      rombelList,
      ekstraList,
      jadwalList,
    }),
    [currentUser, penugasanList, rombelList, ekstraList, jadwalList]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

