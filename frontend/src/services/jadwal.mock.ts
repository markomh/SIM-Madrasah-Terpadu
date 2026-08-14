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
  async update(id_jadwal, data) {
    await simulateLatency();
    maybeThrowSimulatedError();
    const store = loadStore();
    const existing = store.jadwal.find((j) => j.id_jadwal === id_jadwal);
    if (!existing) throw new Error("Slot jadwal tidak ditemukan.");

    const merged: Omit<JadwalPelajaran, "id_jadwal"> = {
      id_rombel: data.id_rombel ?? existing.id_rombel,
      id_pegawai: data.id_pegawai ?? existing.id_pegawai,
      id_mapel: data.id_mapel ?? existing.id_mapel,
      semester: data.semester ?? existing.semester,
      hari: data.hari ?? existing.hari,
      jam_mulai: data.jam_mulai ?? existing.jam_mulai,
      jam_selesai: data.jam_selesai ?? existing.jam_selesai,
    };

    const conflicts = await this.detectConflicts(merged, id_jadwal);
    if (conflicts.length > 0) {
      throw new Error("Bentrok jadwal: perubahan menyebabkan tabrakan waktu mengajar guru.");
    }

    let updated: JadwalPelajaran | null = null;
    mutateStore((s) => {
      const idx = s.jadwal.findIndex((j) => j.id_jadwal === id_jadwal);
      if (idx !== -1) {
        s.jadwal[idx] = { ...s.jadwal[idx], ...merged };
        updated = s.jadwal[idx];
      }
    });

    if (!updated) throw new Error("Gagal memperbarui jadwal.");
    return updated;
  },
  async remove(id_jadwal) {
    await simulateLatency();
    maybeThrowSimulatedError();
    mutateStore((s) => {
      s.jadwal = s.jadwal.filter((j) => j.id_jadwal !== id_jadwal);
    });
  },
};
