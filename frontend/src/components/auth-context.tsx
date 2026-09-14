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
  plottingBkList: any[];
  isLoading: boolean;
  logout: () => Promise<void>;
  isConnectionError: boolean;
  isImpersonating: boolean;
  impersonate: (targetUserId: string) => void;
  stopImpersonating: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_STORAGE_KEY = "sim-madrasah-userid";
const IMPERSONATOR_STORAGE_KEY = "sim-madrasah-impersonator";

/**
 * Mengecek apakah error yang terjadi adalah benar-benar network error
 * (koneksi putus, timeout, DNS gagal, server crash) vs error otorisasi (403/401).
 * Hanya network error sesungguhnya yang boleh mengeset isConnectionError = true.
 */
function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError && err.message.includes("fetch")) return true; // Network failure
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    // ERR_EMPTY_RESPONSE, timeout, network error sesungguhnya
    if (msg.includes("network") || msg.includes("timeout") || msg.includes("koneksi terputus") || msg.includes("failed to fetch") || msg.includes("err_empty")) return true;
    // HTTP 5xx dari api-client
    if (msg.includes("http error 5")) return true;
  }
  return false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userId, setUserId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem(USER_STORAGE_KEY) || "pg_kepala";
    }
    return "pg_kepala";
  });
  const [impersonatorId, setImpersonatorId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem(IMPERSONATOR_STORAGE_KEY);
    }
    return null;
  });
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [penugasanList, setPenugasanList] = useState<PenugasanJabatan[]>([]);
  const [rombelList, setRombelList] = useState<Rombel[]>([]);
  const [ekstraList, setEkstraList] = useState<Ekstrakurikuler[]>([]);
  const [jadwalList, setJadwalList] = useState<JadwalPelajaran[]>([]);
  const [plottingBkList, setPlottingBkList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnectionError, setIsConnectionError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
    
    if (pathname === "/auth/login") {
      setIsLoading(false);
      return;
    }

    // Reset connection error pada setiap pergantian user agar error lama tidak menempel
    setIsConnectionError(false);
    setIsLoading(true);

    if (USE_MOCK) {
      Promise.all([
        services.pegawai.getById(userId).catch((e) => { if (isNetworkError(e)) setIsConnectionError(true); return null; }),
        services.penugasanJabatan.getAll().catch((e) => { if (isNetworkError(e)) setIsConnectionError(true); return []; }),
        services.referensi.getRombel().catch((e) => { if (isNetworkError(e)) setIsConnectionError(true); return []; }),
        services.ekstrakurikuler.getAll().catch((e) => { if (isNetworkError(e)) setIsConnectionError(true); return []; }),
        services.jadwal.getAll().catch((e) => { if (isNetworkError(e)) setIsConnectionError(true); return []; }),
        (services as any).penugasanDomain?.getPlottingBK?.().catch((e: any) => { return []; }) || Promise.resolve([]),
      ]).then(async ([user, penugasan, rombel, ekstra, jadwal, plottingBk]) => {
        if (cancelled) return;
        const activeUser = (user || (await services.pegawai.getById("pg_kepala").catch(() => null))) as AuthUser | null;
        const activeId = activeUser?.id_pegawai || userId;

        if (activeUser) {
          const isKepalaMadrasah = (penugasan || []).some((j) => j.id_pegawai === activeId && j.jenis_jabatan === "Kepala Madrasah" && j.status === "Aktif");
          const isAdminMadrasah = (penugasan || []).some((j) => j.id_pegawai === activeId && j.jenis_jabatan === "Admin Madrasah" && j.status === "Aktif");
          const isOperatorKesiswaan = (penugasan || []).some((j) => j.id_pegawai === activeId && j.jenis_jabatan === "Operator Kesiswaan" && j.status === "Aktif");
          const isPembinaBk = (plottingBk || []).some((p: any) => p.id_pegawai === activeId);
          const isWaliKelas = (rombel || []).some((r) => r.id_wali_kelas === activeId);
          const isPembinaEkstrakurikuler = (ekstra || []).some((e) => e.id_pembina === activeId);
          const isPengajarAktif = (jadwal || []).some((j) => j.id_pegawai === activeId);

          activeUser.capabilities = {
            isKepalaMadrasah,
            isAdminMadrasah,
            isOperatorKesiswaan,
            isPembinaBk,
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
        setPlottingBkList(plottingBk || []);
        setIsLoading(false);
      });
    } else {
      services.auth.getMe().then(async (meData) => {
        if (cancelled) return;
        const loggedInPegawai = meData as Pegawai & { penugasan_aktif?: PenugasanJabatan[] };
        
        const isUuid = (id: string) => /^[0-9a-fA-F-]{36}$/.test(id);
        if (userId && userId !== loggedInPegawai.id_pegawai && isUuid(userId)) {
          // ================================================================
          // PERSONA SIMULATOR di Live Backend
          // ================================================================
          // Ambil detail pegawai yang disimulasikan via GET /api/v1/pegawai/{id}
          // Endpoint ini sudah eager-load relasi penugasan_jabatan (semua status),
          // sehingga TIDAK perlu memanggil GET /api/v1/penugasan-jabatan
          // yang dibatasi Policy (hanya Admin/Kamad).
          // ================================================================
          try {
            const simulated = await services.pegawai.getById(userId);
            if (simulated && !cancelled) {
              // Backend PegawaiController@show mengembalikan pegawai dengan
              // relasi penugasan_jabatan (semua histori) dalam JSON key "penugasan_jabatan".
              // Kita ambil penugasan aktif dari situ.
              const simulatedAny = simulated as Pegawai & { penugasan_jabatan?: PenugasanJabatan[] };
              const simulatedPenugasanAktif = (simulatedAny.penugasan_jabatan || [])
                .filter(p => p.status === "Aktif");
              
              setCurrentUser(simulated);
              setPenugasanList(simulatedPenugasanAktif);
            }
          } catch (err) {
            if (!cancelled) {
              if (isNetworkError(err)) {
                setIsConnectionError(true);
              }
              // Fallback ke akun yang benar-benar login
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
            services.referensi.getRombel().catch((e) => { if (isNetworkError(e)) setIsConnectionError(true); return []; }),
            services.ekstrakurikuler.getAll().catch((e) => { if (isNetworkError(e)) setIsConnectionError(true); return []; }),
            services.jadwal.getAll().catch((e) => { if (isNetworkError(e)) setIsConnectionError(true); return []; }),
          ]);
          if (!cancelled) {
            setRombelList(rombel || []);
            setEkstraList(ekstra || []);
            setJadwalList(jadwal || []);
          }
        } catch (err) {
          if (isNetworkError(err)) setIsConnectionError(true);
        }
      }).catch((err) => {
        if (!cancelled) {
          if (isNetworkError(err)) setIsConnectionError(true);
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
    if (process.env.NEXT_PUBLIC_USE_MOCK === "false" && !isLoading && !currentUser && pathname !== "/auth/login") {
      router.push("/auth/login");
    }
  }, [isLoading, currentUser, pathname, router]);

  const setCurrentUserId = (id: string) => {
    setUserId(id);
    window.localStorage.setItem(USER_STORAGE_KEY, id);
  };

  const logout = async () => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === "false") {
      await services.auth.logout();
    }
    setCurrentUser(null);
    window.localStorage.removeItem(USER_STORAGE_KEY);
    window.localStorage.removeItem(IMPERSONATOR_STORAGE_KEY);
    setImpersonatorId(null);
    router.push("/auth/login");
  };

  const impersonate = (targetUserId: string) => {
    if (!impersonatorId) {
      setImpersonatorId(userId);
      window.localStorage.setItem(IMPERSONATOR_STORAGE_KEY, userId);
    }
    setCurrentUserId(targetUserId);
  };

  const stopImpersonating = () => {
    if (impersonatorId) {
      setCurrentUserId(impersonatorId);
    }
    setImpersonatorId(null);
    window.localStorage.removeItem(IMPERSONATOR_STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUserId,
      penugasanList,
      rombelList,
      ekstraList,
      jadwalList,
      plottingBkList,
      isLoading,
      logout,
      isConnectionError,
      isImpersonating: !!impersonatorId,
      impersonate,
      stopImpersonating,
    }),
    [currentUser, penugasanList, rombelList, ekstraList, jadwalList, plottingBkList, isLoading, isConnectionError, impersonatorId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
