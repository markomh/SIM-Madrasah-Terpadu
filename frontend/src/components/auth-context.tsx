"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  isLoading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_STORAGE_KEY = "sim-madrasah-userid";

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userId, setUserId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem(USER_STORAGE_KEY) || "pg_demo_terpadu";
    }
    return "pg_demo_terpadu";
  });
  const [currentUser, setCurrentUser] = useState<Pegawai | null>(null);
  const [penugasanList, setPenugasanList] = useState<PenugasanJabatan[]>([]);
  const [rombelList, setRombelList] = useState<Rombel[]>([]);
  const [ekstraList, setEkstraList] = useState<Ekstrakurikuler[]>([]);
  const [jadwalList, setJadwalList] = useState<JadwalPelajaran[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
    
    setIsLoading(true);

    if (USE_MOCK) {
      Promise.all([
        services.pegawai.getById(userId).catch(() => null),
        services.penugasanJabatan.getAll().catch(() => []),
        services.referensi.getRombel().catch(() => []),
        services.ekstrakurikuler.getAll().catch(() => []),
        services.jadwal.getAll().catch(() => []),
      ]).then(async ([user, penugasan, rombel, ekstra, jadwal]) => {
        if (cancelled) return;
        if (!user && userId !== "pg_demo_terpadu") {
          const fallbackUser = await services.pegawai.getById("pg_demo_terpadu").catch(() => null);
          setCurrentUser(fallbackUser);
        } else {
          setCurrentUser(user);
        }
        setPenugasanList(penugasan || []);
        setRombelList(rombel || []);
        setEkstraList(ekstra || []);
        setJadwalList(jadwal || []);
        setIsLoading(false);
      });
    } else {
      // LIVE MODE
      services.auth.getMe().then(meData => {
        if (cancelled) return;
        setCurrentUser(meData as Pegawai);
        setPenugasanList(meData.penugasan_aktif || []);
        setIsLoading(false);
      }).catch(() => {
        if (!cancelled) {
          setCurrentUser(null);
          setIsLoading(false);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Handle redirect if not authenticated in LIVE mode
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_MOCK !== "true" && !isLoading && !currentUser && pathname !== "/auth/login") {
      router.push("/auth/login");
    }
  }, [isLoading, currentUser, pathname, router]);

  const setCurrentUserId = (id: string) => {
    setUserId(id);
    window.localStorage.setItem(USER_STORAGE_KEY, id);
  };

  const logout = async () => {
    if (process.env.NEXT_PUBLIC_USE_MOCK !== "true") {
      await services.auth.logout();
    }
    setCurrentUser(null);
    window.localStorage.removeItem(USER_STORAGE_KEY);
    router.push("/auth/login");
  };

  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUserId,
      penugasanList,
      rombelList,
      ekstraList,
      jadwalList,
      isLoading,
      logout,
    }),
    [currentUser, penugasanList, rombelList, ekstraList, jadwalList, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

