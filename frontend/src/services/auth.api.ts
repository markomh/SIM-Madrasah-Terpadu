import { apiClient } from "./api-client";
import { setAuthToken, removeAuthToken } from "./api-client";
import { loadStore } from "./store";

export const authApi = {
  login: async (email: string, password: string) => {
    const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
    if (USE_MOCK) {
      let mockUserId = "pg_kepala";
      if (email.includes("admin")) mockUserId = "pg_admin";
      else if (email.includes("ops") || email.includes("operator")) mockUserId = "pg_ops";
      else if (email.includes("bk")) mockUserId = "pg_bk";
      else if (email.includes("guru")) mockUserId = "019153a0-f8f2-777b-bb66-6b211a7e28a9";
      else if (email.includes("walikelas")) mockUserId = "pg_wali_a";

      if (typeof window !== "undefined") {
        window.localStorage.setItem("sim-madrasah-userid", mockUserId);
      }
      const storeData = loadStore();
      const userObj = storeData.pegawai.find((p) => p.id_pegawai === mockUserId) ?? storeData.pegawai[0];
      return {
        id_pegawai: userObj.id_pegawai,
        nama_lengkap_gelar: userObj.nama_lengkap_gelar,
        tugas_utama: userObj.tugas_utama,
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
      const storeData = loadStore();
      const userObj = storeData.pegawai.find((p) => p.id_pegawai === activeId) ?? storeData.pegawai[0];
      
      const activePenugasan = storeData.penugasanJabatan.filter((j) => j.id_pegawai === userObj.id_pegawai && j.status === "Aktif");

      const isKepalaMadrasah = activePenugasan.some((j) => j.jenis_jabatan === "Kepala Madrasah");
      const isAdminMadrasah = activePenugasan.some((j) => j.jenis_jabatan === "Admin Madrasah");
      const isOperatorKesiswaan = activePenugasan.some((j) => j.jenis_jabatan === "Operator Kesiswaan");
      const isGuruBk = activePenugasan.some((j) => j.jenis_jabatan === "Guru BK");
      const isWaliKelas = storeData.rombel.some((r) => r.id_wali_kelas === userObj.id_pegawai);
      const isPembinaEkstrakurikuler = storeData.ekstrakurikuler.some((e) => e.id_pembina === userObj.id_pegawai);
      const isPengajarAktif = storeData.jadwal.some((j) => j.id_pegawai === userObj.id_pegawai);

      return {
        id_pegawai: userObj.id_pegawai,
        id_madrasah: userObj.id_madrasah,
        nama_madrasah: "MTs Terpadu Nusantara",
        nama_lengkap_gelar: userObj.nama_lengkap_gelar,
        nip: userObj.nip,
        npk: userObj.npk,
        tugas_utama: userObj.tugas_utama,
        status_kepegawaian: userObj.status_kepegawaian,
        penugasan_aktif: activePenugasan,
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
