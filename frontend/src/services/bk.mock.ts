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
  }
};
