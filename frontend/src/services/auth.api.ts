import { apiClient } from "./api-client";
import { setAuthToken, removeAuthToken } from "./api-client";

export const authApi = {
  login: async (email: string, password: string) => {
    const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
    if (USE_MOCK) {
      let mockUserId = "pg_kepala";
      if (email.includes("admin")) mockUserId = "pg_admin";
      else if (email.includes("bk")) mockUserId = "pg_bk";
      else if (email.includes("guru")) mockUserId = "pg_guru_1";
      else if (email.includes("walikelas")) mockUserId = "pg_walikelas";

      if (typeof window !== "undefined") {
        window.localStorage.setItem("sim-madrasah-userid", mockUserId);
      }
      return {
        id_pegawai: mockUserId,
        nama_lengkap_gelar: "Mock User",
        tugas_utama: mockUserId === "pg_admin" ? "Tendik" : "Guru",
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
      
      const isKepalaMadrasah = activeId === "pg_kepala";
      const isAdminMadrasah = activeId === "pg_admin";
      const isOperatorKesiswaan = false;
      const isGuruBk = activeId === "pg_bk";
      const isWaliKelas = activeId === "pg_walikelas";
      const isPembinaEkstrakurikuler = false;
      const isPengajarAktif = activeId === "pg_guru_1" || activeId === "pg_walikelas";

      const tugasUtama = isAdminMadrasah ? "Tendik" : "Guru";
      const jenisJabatan = isKepalaMadrasah ? "Kepala Madrasah" : (isAdminMadrasah ? "Admin Madrasah" : (isGuruBk ? "Guru BK" : "Guru"));

      return {
        id_pegawai: activeId,
        id_madrasah: "md_1",
        nama_madrasah: "MTs Terpadu Nusantara",
        nama_lengkap_gelar: "Mock " + activeId,
        nip: "199002022015011002",
        npk: null,
        tugas_utama: tugasUtama,
        status_kepegawaian: "PNS",
        penugasan_aktif: [
          {
            id_penugasan: "pj_1",
            id_pegawai: activeId,
            jenis_jabatan: jenisJabatan,
            id_tahun: "ta_2627",
            tanggal_mulai: "2026-07-01",
            tanggal_selesai: null,
            status: "Aktif",
          },
        ],
        capabilities: {
          isKepalaMadrasah,
          isAdminMadrasah,
          isOperatorKesiswaan,
          isGuruBk,
          isWaliKelas,
          isPembinaEkstrakurikuler,
          isPengajarAktif,
        },
      };
    }
    return apiClient.get<unknown>("/me");
  },
};
