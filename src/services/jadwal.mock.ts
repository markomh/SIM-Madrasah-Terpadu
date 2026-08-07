import type { JadwalPelajaran } from "@/types";
import type { JadwalService } from "./jadwal.service";
import { createId, loadStore, maybeThrowSimulatedError, mutateStore, simulateLatency } from "./store";

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export const jadwalMock: JadwalService = {
  async getAll(filter) {
    await simulateLatency();
    maybeThrowSimulatedError();
    let result = [...loadStore().jadwal];
    if (filter?.id_rombel) result = result.filter((j) => j.id_rombel === filter.id_rombel);
    if (filter?.id_pegawai) result = result.filter((j) => j.id_pegawai === filter.id_pegawai);
    return result;
  },
  async detectConflicts(candidate, excludeId) {
    await simulateLatency();
    const all = loadStore().jadwal.filter((j) => j.id_jadwal !== excludeId);
    return all.filter(
      (j) =>
        j.id_pegawai === candidate.id_pegawai &&
        j.semester === candidate.semester &&
        j.hari === candidate.hari &&
        overlaps(j.jam_mulai, j.jam_selesai, candidate.jam_mulai, candidate.jam_selesai),
    );
  },
  async create(data) {
    await simulateLatency();
    maybeThrowSimulatedError();
    const conflicts = await this.detectConflicts(data);
    if (conflicts.length > 0) {
      throw new Error("Bentrok jadwal: kombinasi guru + hari + jam sudah terpakai.");
    }
    const created: JadwalPelajaran = { ...data, id_jadwal: createId("jd") };
    mutateStore((s) => s.jadwal.push(created));
    return created;
  },
  async remove(id_jadwal) {
    await simulateLatency();
    maybeThrowSimulatedError();
    mutateStore((s) => {
      s.jadwal = s.jadwal.filter((j) => j.id_jadwal !== id_jadwal);
    });
  },
};
