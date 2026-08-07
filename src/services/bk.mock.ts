import type { BkService } from "./bk.service";
import type { CatatanBk } from "@/types/bk";
import { simulateLatency, maybeThrowSimulatedError, createId, loadStore } from "./store";
import { isKepalaMadrasah } from "@/lib/access";

let mockCatatan: CatatanBk[] = [
  {
    id_catatan: "cbk_1",
    id_siswa: "sw_01",
    id_pegawai_bk: "pg_bk",
    tanggal: "2026-07-22",
    kategori: "Perilaku",
    catatan: "Siswa sering datang terlambat",
    tingkat_kerahasiaan: "Umum",
  },
  {
    id_catatan: "cbk_2",
    id_siswa: "sw_01",
    id_pegawai_bk: "pg_bk",
    tanggal: "2026-07-23",
    kategori: "Pribadi",
    catatan: "Siswa mengalami masalah keluarga berat, perlu pendampingan intensif",
    tingkat_kerahasiaan: "Rahasia",
  },
];

export const mockBkService: BkService = {
  getBySiswa: async (id_siswa, requesterId) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    const penugasanList = loadStore().penugasanJabatan;
    const isKamad = isKepalaMadrasah(requesterId, penugasanList);

    return mockCatatan.filter(c => {
      if (c.id_siswa !== id_siswa) return false;
      if (c.tingkat_kerahasiaan === "Rahasia") {
        return c.id_pegawai_bk === requesterId || isKamad;
      }
      return true;
    });
  },

  create: async (data) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    const newCatatan: CatatanBk = {
      ...data,
      id_catatan: createId("cbk"),
    };
    mockCatatan.push(newCatatan);
    return { ...newCatatan };
  }
};
