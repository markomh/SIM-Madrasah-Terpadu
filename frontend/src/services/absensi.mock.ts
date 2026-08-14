import type { AbsensiSiswa } from "@/types";
import type { AbsensiService } from "./absensi.service";
import { loadStore, maybeThrowSimulatedError, simulateLatency } from "./store";

export const absensiMock: AbsensiService = {
  async getRekapHarian(id_rombel, tanggal) {
    await simulateLatency();
    maybeThrowSimulatedError();
    return loadStore().absensi.filter((a) => a.tanggal === tanggal && a.id_rombel === id_rombel);
  },
};
