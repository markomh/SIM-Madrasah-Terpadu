import type { Surat } from "@/types";
import type { PersuratanService } from "./persuratan.service";
import { createId, loadStore, maybeThrowSimulatedError, mutateStore, simulateLatency, todayIso } from "./store";

export const persuratanMock: PersuratanService = {
  async getAll() {
    await simulateLatency();
    maybeThrowSimulatedError();
    return loadStore().surat;
  },
  async create(data) {
    await simulateLatency();
    maybeThrowSimulatedError();
    const created: Surat = {
      ...data,
      id_surat: createId("sr"),
      nomor_surat: `421/${String(loadStore().surat.length + 1).padStart(3, "0")}/${data.jenis.slice(0, 3).toUpperCase()}/2026`,
      status: "Draft",
      ditandatangani_oleh: null,
      tanggal_dibuat: todayIso(),
    };
    mutateStore((s) => s.surat.unshift(created));
    return created;
  },
  async requestSign(id_surat) {
    await simulateLatency();
    maybeThrowSimulatedError();
    let updated: Surat | null = null;
    mutateStore((store) => {
      const idx = store.surat.findIndex((s) => s.id_surat === id_surat);
      if (idx < 0) throw new Error("Surat tidak ditemukan");
      store.surat[idx] = { ...store.surat[idx], status: "Menunggu Tanda Tangan" };
      updated = store.surat[idx];
    });
    if (!updated) throw new Error("Surat tidak ditemukan");
    return updated;
  },
  async sign(id_surat, ditandatangani_oleh) {
    await simulateLatency();
    maybeThrowSimulatedError();
    let updated: Surat | null = null;
    mutateStore((store) => {
      const idx = store.surat.findIndex((s) => s.id_surat === id_surat);
      if (idx < 0) throw new Error("Surat tidak ditemukan");
      store.surat[idx] = {
        ...store.surat[idx],
        status: "Ditandatangani",
        ditandatangani_oleh,
      };
      updated = store.surat[idx];
    });
    if (!updated) throw new Error("Surat tidak ditemukan");
    return updated;
  },
  async generateAiDraft(instruksi, dibuat_oleh) {
    await simulateLatency();
    maybeThrowSimulatedError();
    return this.create({
      judul: `Draf AI: ${instruksi.slice(0, 40)}`,
      jenis: "Surat Tugas",
      dibuat_oleh,
      isi_ringkas: `Hasil AI — perlu verifikasi. Instruksi: ${instruksi}`,
      hasil_ai: true,
    });
  },
};
