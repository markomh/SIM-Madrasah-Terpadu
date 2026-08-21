import { apiClient } from "./api-client";
import { setAuthToken, removeAuthToken } from "./api-client";

export const authApi = {
  login: async (email: string, password: string) => {
    const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
    if (USE_MOCK) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("sim-madrasah-userid", "pg_kepala");
      }
      return {
        id_pegawai: "pg_kepala",
        nama_lengkap_gelar: "Drs. H. Ahmad Dahlan, M.Pd.",
        tugas_utama: "Guru",
      };
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Login failed");
    if (json.token) setAuthToken(json.token);
    if (json.data?.id_pegawai && typeof window !== "undefined") {
      window.localStorage.setItem("sim-madrasah-userid", json.data.id_pegawai);
    }
    return json.data;
  },
  logout: async () => {
    try {
      await apiClient.post("/logout");
    } catch {
      // Ignore
    } finally {
      removeAuthToken();
    }
  },
  getMe: async () => {
    const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
    if (USE_MOCK) {
      const activeId = (typeof window !== "undefined" && window.localStorage.getItem("sim-madrasah-userid")) || "pg_kepala";
      const isAdmin = activeId === "pg_admin";
      return {
        id_pegawai: isAdmin ? "pg_admin" : "pg_kepala",
        id_madrasah: "md_1",
        nama_madrasah: "MTs Terpadu Nusantara",
        nama_lengkap_gelar: isAdmin ? "Rizky Pratama, S.Kom." : "Drs. H. Ahmad Dahlan, M.Pd.",
        nip: isAdmin ? "199002022015011002" : "197501012000031001",
        npk: null,
        tugas_utama: isAdmin ? "Tendik" : "Guru",
        status_kepegawaian: "PNS",
        penugasan_aktif: [
          {
            id_penugasan: isAdmin ? "pj_2" : "pj_1",
            id_pegawai: isAdmin ? "pg_admin" : "pg_kepala",
            jenis_jabatan: isAdmin ? "Admin Madrasah" : "Kepala Madrasah",
            id_tahun: "ta_2627",
            tanggal_mulai: "2026-07-01",
            tanggal_selesai: null,
            status: "Aktif",
          },
        ],
        capabilities: {
          isKepalaMadrasah: !isAdmin,
          isAdminMadrasah: isAdmin,
          isOperatorKesiswaan: false,
          isGuruBk: false,
          isWaliKelas: false,
          isPembinaEkstrakurikuler: false,
          isPengajarAktif: false,
        },
      };
    }
    return apiClient.get<unknown>("/me");
  },
};
