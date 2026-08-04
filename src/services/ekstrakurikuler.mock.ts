import type { EkstrakurikulerService } from "./ekstrakurikuler.service";
import type { Ekstrakurikuler, KeanggotaanEkstra, AbsensiEkstra } from "@/types/ekstrakurikuler";
import { simulateLatency, maybeThrowSimulatedError, createId, nowIso, loadStore } from "./store";

let mockEkstra: Ekstrakurikuler[] = [
  { id_ekstra: "ek_1", nama_ekstra: "Pramuka", id_pembina: "pg_pembina", id_tahun: "ta_2627" },
  { id_ekstra: "ek_2", nama_ekstra: "Paskibra", id_pembina: "pg_wali_a", id_tahun: "ta_2627" },
];

let mockKeanggotaan: KeanggotaanEkstra[] = [
  { id_keanggotaan: "ak_1", id_ekstra: "ek_1", id_siswa: "sw_01", tanggal_mulai: "2026-07-20", tanggal_selesai: null, status: "Aktif" },
  { id_keanggotaan: "ak_2", id_ekstra: "ek_1", id_siswa: "sw_02", tanggal_mulai: "2026-07-20", tanggal_selesai: null, status: "Aktif" },
];

let mockAbsensi: AbsensiEkstra[] = [];

export const mockEkstrakurikulerService: EkstrakurikulerService = {
  getAll: async (filter) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    if (filter?.id_pembina) {
      return mockEkstra.filter(e => e.id_pembina === filter.id_pembina);
    }
    return [...mockEkstra];
  },
  
  create: async (data) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    const newEkstra: Ekstrakurikuler = {
      ...data,
      id_ekstra: createId("ek")
    };
    mockEkstra.push(newEkstra);
    return { ...newEkstra };
  },

  update: async (id, data) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    const idx = mockEkstra.findIndex(e => e.id_ekstra === id);
    if (idx === -1) throw new Error("Ekstrakurikuler tidak ditemukan");
    mockEkstra[idx] = { ...mockEkstra[idx], ...data };
    return { ...mockEkstra[idx] };
  },

  getKeanggotaan: async (id_ekstra) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    return mockKeanggotaan.filter(k => k.id_ekstra === id_ekstra);
  },

  addAnggota: async (data) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    const exist = mockKeanggotaan.find(k => k.id_ekstra === data.id_ekstra && k.id_siswa === data.id_siswa && k.status === "Aktif");
    if (exist) throw new Error("Siswa sudah aktif di ekstrakurikuler ini");
    
    const newAnggota: KeanggotaanEkstra = {
      ...data,
      id_keanggotaan: createId("ak"),
      tanggal_mulai: nowIso().split("T")[0],
      tanggal_selesai: null,
      status: "Aktif"
    };
    mockKeanggotaan.push(newAnggota);
    return { ...newAnggota };
  },

  removeAnggota: async (id_keanggotaan) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    const idx = mockKeanggotaan.findIndex(k => k.id_keanggotaan === id_keanggotaan);
    if (idx === -1) throw new Error("Keanggotaan tidak ditemukan");
    
    mockKeanggotaan[idx].status = "Keluar";
    mockKeanggotaan[idx].tanggal_selesai = nowIso().split("T")[0];
    return { ...mockKeanggotaan[idx] };
  },

  getAbsensi: async (id_ekstra, tanggal) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    // Get all keanggotaan for this ekstra to filter the absensi
    const keanggotaanIds = mockKeanggotaan.filter(k => k.id_ekstra === id_ekstra).map(k => k.id_keanggotaan);
    return mockAbsensi.filter(a => keanggotaanIds.includes(a.id_keanggotaan) && a.tanggal === tanggal);
  },

  catatAbsensi: async (data) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    const idx = mockAbsensi.findIndex(a => a.id_keanggotaan === data.id_keanggotaan && a.tanggal === data.tanggal);
    if (idx >= 0) {
      mockAbsensi[idx].status = data.status;
      return { ...mockAbsensi[idx] };
    }
    const newAbsensi: AbsensiEkstra = {
      ...data,
      id_absensi_ekstra: createId("ae")
    };
    mockAbsensi.push(newAbsensi);
    return { ...newAbsensi };
  }
};
