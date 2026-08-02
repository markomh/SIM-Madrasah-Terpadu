import type { MataPelajaran, Rombel, TingkatPendidikan, HariLibur } from "@/types";
import type { ReferensiService } from "./referensi.service";
import { createId, loadStore, maybeThrowSimulatedError, mutateStore, simulateLatency } from "./store";

export const referensiMock: ReferensiService = {
  async getTahunAjaran() {
    await simulateLatency();
    maybeThrowSimulatedError();
    return loadStore().tahunAjaran;
  },
  async getTahunAktif() {
    await simulateLatency();
    maybeThrowSimulatedError();
    return loadStore().tahunAjaran.find((t) => t.status_aktif) ?? null;
  },
  async getTingkat() {
    await simulateLatency();
    maybeThrowSimulatedError();
    return [...loadStore().tingkat].sort((a, b) => a.urutan - b.urutan);
  },
  async createTingkat(data) {
    await simulateLatency();
    maybeThrowSimulatedError();
    const created: TingkatPendidikan = { ...data, id_tingkat: createId("t") };
    mutateStore((s) => s.tingkat.push(created));
    return created;
  },
  async getRombel(filter) {
    await simulateLatency();
    maybeThrowSimulatedError();
    let result = [...loadStore().rombel];
    if (filter?.id_tahun) result = result.filter((r) => r.id_tahun === filter.id_tahun);
    if (filter?.id_tingkat) result = result.filter((r) => r.id_tingkat === filter.id_tingkat);
    return result;
  },
  async createRombel(data) {
    await simulateLatency();
    maybeThrowSimulatedError();
    const created: Rombel = { ...data, id_rombel: createId("rb") };
    mutateStore((s) => s.rombel.push(created));
    return created;
  },
  async updateRombel(id_rombel, data) {
    await simulateLatency();
    maybeThrowSimulatedError();
    let updated: Rombel | null = null;
    mutateStore((store) => {
      const idx = store.rombel.findIndex((r) => r.id_rombel === id_rombel);
      if (idx < 0) throw new Error("Rombel tidak ditemukan");
      store.rombel[idx] = { ...store.rombel[idx], ...data };
      updated = store.rombel[idx];
    });
    if (!updated) throw new Error("Rombel tidak ditemukan");
    return updated;
  },
  async getMapel() {
    await simulateLatency();
    maybeThrowSimulatedError();
    return loadStore().mapel;
  },
  async createMapel(data) {
    await simulateLatency();
    maybeThrowSimulatedError();
    const created: MataPelajaran = { ...data, id_mapel: createId("mp") };
    mutateStore((s) => s.mapel.push(created));
    return created;
  },
  async getHariLibur() {
    await simulateLatency();
    maybeThrowSimulatedError();
    return loadStore().hariLibur;
  },
  async createHariLibur(data) {
    await simulateLatency();
    maybeThrowSimulatedError();
    const created: HariLibur = { ...data, id_libur: createId("hl") };
    mutateStore((s) => s.hariLibur.push(created));
    return created;
  },
};
