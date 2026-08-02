import type { PegawaiService } from "./pegawai.service";
import { loadStore, maybeThrowSimulatedError, simulateLatency } from "./store";

export const pegawaiMock: PegawaiService = {
  async getAll(filter) {
    await simulateLatency();
    maybeThrowSimulatedError();
    let result = [...loadStore().pegawai];
    if (filter?.peran) result = result.filter((p) => p.peran === filter.peran);
    if (filter?.query) {
      const q = filter.query.toLowerCase();
      result = result.filter(
        (p) =>
          p.nama_lengkap_gelar.toLowerCase().includes(q) ||
          (p.nip ?? "").includes(q) ||
          (p.npk ?? "").includes(q),
      );
    }
    return result;
  },
  async getById(id_pegawai) {
    await simulateLatency();
    maybeThrowSimulatedError();
    return loadStore().pegawai.find((p) => p.id_pegawai === id_pegawai) ?? null;
  },
  async getByPeran(peran) {
    return this.getAll({ peran });
  },
};
