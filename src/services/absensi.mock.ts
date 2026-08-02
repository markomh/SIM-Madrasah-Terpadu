import type { AbsensiSiswa } from "@/types";
import type { AbsensiService } from "./absensi.service";
import { createId, loadStore, maybeThrowSimulatedError, mutateStore, simulateLatency } from "./store";

export const absensiMock: AbsensiService = {
  async getByTanggal(tanggal, id_rombel) {
    await simulateLatency();
    maybeThrowSimulatedError();
    let result = loadStore().absensi.filter((a) => a.tanggal === tanggal);
    if (id_rombel) result = result.filter((a) => a.id_rombel === id_rombel);
    return result;
  },
  async ensureDefaults(tanggal, id_rombel) {
    await simulateLatency();
    maybeThrowSimulatedError();
    mutateStore((store) => {
      const aktif = store.anggotaRombel.filter(
        (a) =>
          a.id_rombel === id_rombel &&
          a.tanggal_selesai === null &&
          a.status_persetujuan !== "Menunggu Persetujuan",
      );
      for (const row of aktif) {
        const siswa = store.siswa.find((s) => s.id_siswa === row.id_siswa);
        if (!siswa || siswa.status_siswa !== "Aktif") continue;
        const exists = store.absensi.some(
          (a) => a.tanggal === tanggal && a.id_siswa === row.id_siswa && a.id_rombel === id_rombel,
        );
        if (!exists) {
          store.absensi.push({
            id_absensi: createId("ab"),
            tanggal,
            id_siswa: row.id_siswa,
            id_rombel,
            status: "Hadir",
            catatan: null,
          });
        }
      }
    });
    return this.getByTanggal(tanggal, id_rombel);
  },
  async updateStatus(id_absensi, status, catatan = null) {
    await simulateLatency();
    maybeThrowSimulatedError();
    let updated: AbsensiSiswa | null = null;
    mutateStore((store) => {
      const idx = store.absensi.findIndex((a) => a.id_absensi === id_absensi);
      if (idx < 0) throw new Error("Absensi tidak ditemukan");
      store.absensi[idx] = { ...store.absensi[idx], status, catatan };
      updated = store.absensi[idx];
    });
    if (!updated) throw new Error("Absensi tidak ditemukan");
    return updated;
  },
};
