"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Pegawai, PenugasanJabatan, Rombel, Ekstrakurikuler, JadwalPelajaran, AuthUser } from "@/types";
import { services } from "@/services";

type AuthContextValue = {
  currentUser: AuthUser | null;
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
      return window.localStorage.getItem(USER_STORAGE_KEY) || "pg_kepala";
    }
    return "pg_kepala";
  });
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
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
        const activeUser = (user || (await services.pegawai.getById("pg_kepala").catch(() => null))) as AuthUser | null;
        const activeId = activeUser?.id_pegawai || userId;

        if (activeUser) {
          const isKepalaMadrasah = (penugasan || []).some((j) => j.id_pegawai === activeId && j.jenis_jabatan === "Kepala Madrasah" && j.status === "Aktif");
          const isAdminMadrasah = (penugasan || []).some((j) => j.id_pegawai === activeId && j.jenis_jabatan === "Admin Madrasah" && j.status === "Aktif");
          const isOperatorKesiswaan = (penugasan || []).some((j) => j.id_pegawai === activeId && j.jenis_jabatan === "Operator Kesiswaan" && j.status === "Aktif");
          const isGuruBk = (penugasan || []).some((j) => j.id_pegawai === activeId && j.jenis_jabatan === "Guru BK" && j.status === "Aktif");
          const isWaliKelas = (rombel || []).some((r) => r.id_wali_kelas === activeId);
          const isPembinaEkstrakurikuler = (ekstra || []).some((e) => e.id_pembina === activeId);
          const isPengajarAktif = (jadwal || []).some((j) => j.id_pegawai === activeId);

          activeUser.capabilities = {
            isKepalaMadrasah,
            isAdminMadrasah,
            isOperatorKesiswaan,
            isGuruBk,
            isWaliKelas,
            isPembinaEkstrakurikuler,
            isPengajarAktif,
          };
        }

        setCurrentUser(activeUser);
        setPenugasanList((penugasan || []).filter((p) => p.id_pegawai === activeId && p.status === "Aktif"));
        setRombelList(rombel || []);
        setEkstraList(ekstra || []);
        setJadwalList(jadwal || []);
        setIsLoading(false);
      });
    } else {
      services.auth.getMe().then(async (meData) => {
        if (cancelled) return;
        const loggedInPegawai = meData as Pegawai & { penugasan_aktif?: PenugasanJabatan[] };
        
        const isUuid = (id: string) => /^[0-9a-fA-F-]{36}$/.test(id);
        if (userId && userId !== loggedInPegawai.id_pegawai && isUuid(userId)) {
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
          if (typeof window !== "undefined" && loggedInPegawai.id_pegawai) {
            window.localStorage.setItem(USER_STORAGE_KEY, loggedInPegawai.id_pegawai);
          }
        }

        // Selesaikan auth loading dulu SEBELUM fetch data sekunder.
        // Ini mencegah dashboard menembak 5+ request paralel berbarengan
        // dengan auth context, yang menyebabkan backend saturasi.
        if (!cancelled) setIsLoading(false);

        // Fetch data sekunder (non-blocking, tidak mempengaruhi auth state)
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

