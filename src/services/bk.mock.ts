import type { BkService } from "./bk.service";
import type { CatatanBk } from "@/types/bk";
import { simulateLatency, maybeThrowSimulatedError, createId, loadStore, mutateStore } from "./store";
import { isKepalaMadrasah } from "@/lib/access";

export const mockBkService: BkService = {
  getBySiswa: async (id_siswa, requesterId) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    const store = loadStore();
    const isKamad = isKepalaMadrasah(requesterId, store.penugasanJabatan);

    return store.catatanBk.filter(c => {
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
    mutateStore(s => {
      s.catatanBk.push(newCatatan);
    });
    return { ...newCatatan };
  }
};
