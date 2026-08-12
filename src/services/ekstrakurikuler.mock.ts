import type { EkstrakurikulerService } from "./ekstrakurikuler.service";
import type { Ekstrakurikuler, KeanggotaanEkstra, AbsensiEkstra } from "@/types/ekstrakurikuler";
import { simulateLatency, maybeThrowSimulatedError, createId, nowIso, loadStore, mutateStore } from "./store";

export const mockEkstrakurikulerService: EkstrakurikulerService = {
  getAll: async (filter) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    const store = loadStore();
    if (filter?.id_pembina) {
      return store.ekstrakurikuler.filter(e => e.id_pembina === filter.id_pembina);
    }
    return [...store.ekstrakurikuler];
  },
  
  create: async (data) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    const newEkstra: Ekstrakurikuler = {
      ...data,
      id_ekstra: createId("ek")
    };
    mutateStore(s => { s.ekstrakurikuler.push(newEkstra); });
    return { ...newEkstra };
  },

  update: async (id, data) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    let updated: Ekstrakurikuler | undefined;
    mutateStore(s => {
      const idx = s.ekstrakurikuler.findIndex(e => e.id_ekstra === id);
      if (idx === -1) throw new Error("Ekstrakurikuler tidak ditemukan");
      s.ekstrakurikuler[idx] = { ...s.ekstrakurikuler[idx], ...data };
      updated = s.ekstrakurikuler[idx];
    });
    return { ...updated! };
  },

  getKeanggotaan: async (id_ekstra) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    const store = loadStore();
    return store.keanggotaanEkstra.filter(k => k.id_ekstra === id_ekstra);
  },

  addAnggota: async (data) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    const store = loadStore();
    const exist = store.keanggotaanEkstra.find(k => k.id_ekstra === data.id_ekstra && k.id_siswa === data.id_siswa && k.status === "Aktif");
    if (exist) throw new Error("Siswa sudah aktif di ekstrakurikuler ini");
    
    const newAnggota: KeanggotaanEkstra = {
      ...data,
      id_keanggotaan: createId("ak"),
      tanggal_mulai: nowIso().split("T")[0],
      tanggal_selesai: null,
      status: "Aktif"
    };
    mutateStore(s => { s.keanggotaanEkstra.push(newAnggota); });
    return { ...newAnggota };
  },

  removeAnggota: async (id_keanggotaan) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    let updated: KeanggotaanEkstra | undefined;
    mutateStore(s => {
      const idx = s.keanggotaanEkstra.findIndex(k => k.id_keanggotaan === id_keanggotaan);
      if (idx === -1) throw new Error("Keanggotaan tidak ditemukan");
      s.keanggotaanEkstra[idx].status = "Keluar";
      s.keanggotaanEkstra[idx].tanggal_selesai = nowIso().split("T")[0];
      updated = s.keanggotaanEkstra[idx];
    });
    return { ...updated! };
  },

  getAbsensi: async (id_ekstra, tanggal) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    const store = loadStore();
    const keanggotaanIds = store.keanggotaanEkstra.filter(k => k.id_ekstra === id_ekstra).map(k => k.id_keanggotaan);
    return store.absensiEkstra.filter(a => keanggotaanIds.includes(a.id_keanggotaan) && a.tanggal === tanggal);
  },

  catatAbsensi: async (data) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    let result: AbsensiEkstra | undefined;
    mutateStore(s => {
      const idx = s.absensiEkstra.findIndex(a => a.id_keanggotaan === data.id_keanggotaan && a.tanggal === data.tanggal);
      if (idx >= 0) {
        s.absensiEkstra[idx].status = data.status;
        result = s.absensiEkstra[idx];
      } else {
        const newAbsensi: AbsensiEkstra = {
          ...data,
          id_absensi_ekstra: createId("ae")
        };
        s.absensiEkstra.push(newAbsensi);
        result = newAbsensi;
      }
    });
    return { ...result! };
  }
};
