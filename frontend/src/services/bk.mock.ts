import type { BkService } from "./bk.service";
import type { CatatanBk } from "@/types/bk";
import { simulateLatency, maybeThrowSimulatedError, createId, loadStore, mutateStore } from "./store";

export const mockBkService: BkService = {
  getBySiswa: async (id_siswa, requesterId) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    const store = loadStore();

    // Menghapus filter kosmetik di frontend, kita asumsikan backend/mock backend
    // sudah mengirim data yang bersih.
    return store.catatanBk.filter(c => c.id_siswa === id_siswa);
  },

  create: async (data) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    const newCatatan: CatatanBk = {
      ...data,
      id_catatan: createId("cbk"),
      id_madrasah: data.id_madrasah ?? "md_1",
    };
    mutateStore(s => {
      s.catatanBk.push(newCatatan);
    });
    return { ...newCatatan };
  },

  update: async (id, data) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    let updatedCatatan: CatatanBk | null = null;
    mutateStore(s => {
      const idx = s.catatanBk.findIndex(c => c.id_catatan === id);
      if (idx !== -1) {
        s.catatanBk[idx] = { ...s.catatanBk[idx], ...data };
        updatedCatatan = s.catatanBk[idx];
      }
    });
    if (!updatedCatatan) throw new Error("Catatan BK not found");
    return updatedCatatan as CatatanBk;
  },

  delete: async (id) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    mutateStore(s => {
      s.catatanBk = s.catatanBk.filter(c => c.id_catatan !== id);
    });
  }
};
