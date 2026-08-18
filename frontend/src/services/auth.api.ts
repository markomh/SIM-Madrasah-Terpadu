import { apiClient } from "./api-client";
import { setAuthToken, removeAuthToken } from "./api-client";

export const authApi = {
  login: async (email: string, password: string) => {
    const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
    if (USE_MOCK) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("sim-madrasah-userid", "pg_demo_terpadu");
      }
      return {
        id_pegawai: "pg_demo_terpadu",
        nama_lengkap_gelar: "Dra. Siti Aminah, M.Pd",
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
      return {
        id_pegawai: "pg_demo_terpadu",
        id_madrasah: "mdr_01",
        nama_madrasah: "MTs Terpadu Nusantara",
        nama_lengkap_gelar: "Dra. Siti Aminah, M.Pd",
        nip: "197805122005012003",
        npk: "987654321098",
        tugas_utama: "Guru",
        status_kepegawaian: "PNS",
        penugasan_aktif: [],
        capabilities: {
          isKepalaMadrasah: false,
          isAdminMadrasah: true,
          isOperatorKesiswaan: false,
          isGuruBk: false,
          isWaliKelas: true,
          isPembinaEkstrakurikuler: false,
          isPengajarAktif: true,
        },
      };
    }
    return apiClient.get<unknown>("/me");
  },
};
