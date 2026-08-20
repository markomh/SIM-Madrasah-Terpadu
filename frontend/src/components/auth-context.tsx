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
      return window.localStorage.getItem(USER_STORAGE_KEY) || "019153a0-f8f2-777b-bb66-6b211a7e28a5";
    }
    return "019153a0-f8f2-777b-bb66-6b211a7e28a5";
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
    
    if (pathname === "/auth/login") {
      setIsLoading(false);
      return;
    }

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
        if (!user && userId !== "019153a0-f8f2-777b-bb66-6b211a7e28a5") {
          const fallbackUser = await services.pegawai.getById("019153a0-f8f2-777b-bb66-6b211a7e28a5").catch(() => null);
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
      services.auth.getMe().then(async (meData) => {
        if (cancelled) return;
        const loggedInPegawai = meData as Pegawai & { penugasan_aktif?: PenugasanJabatan[] };
        
        if (userId && userId !== loggedInPegawai.id_pegawai) {
          try {
            const simulated = await services.pegawai.getById(userId);
            if (simulated && !cancelled) {
              setCurrentUser(simulated);
              const penugasans = await services.penugasanJabatan.getAll().catch(() => []);
              if (!cancelled) {
                setPenugasanList(penugasans.filter(p => p.id_pegawai === userId && p.status === "Aktif"));
              }
            }
          } catch {
            if (!cancelled) {
              setCurrentUser(loggedInPegawai);
              setPenugasanList(loggedInPegawai.penugasan_aktif || []);
            }
          }
        } else {
          setCurrentUser(loggedInPegawai);
          setPenugasanList(loggedInPegawai.penugasan_aktif || []);
        }

        try {
          const [rombel, ekstra, jadwal] = await Promise.all([
            services.referensi.getRombel().catch(() => []),
            services.ekstrakurikuler.getAll().catch(() => []),
            services.jadwal.getAll().catch(() => []),
          ]);
          if (!cancelled) {
            setRombelList(rombel || []);
            setEkstraList(ekstra || []);
            setJadwalList(jadwal || []);
          }
        } catch {
          // Ignore secondary fetch error
        }

        if (!cancelled) setIsLoading(false);
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

