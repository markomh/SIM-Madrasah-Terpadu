import type { Siswa } from "@/types";
import type { SiswaService } from "./siswa.service";
import {
  createId,
  loadStore,
  maybeThrowSimulatedError,
  mutateStore,
  nowIso,
  simulateLatency,
} from "./store";

export const siswaMock: SiswaService = {
  async getAll(filter) {
    await simulateLatency();
    maybeThrowSimulatedError();
    const { siswa, anggotaRombel } = loadStore();
    let result = [...siswa];

    if (filter?.status_siswa) {
      result = result.filter((s) => s.status_siswa === filter.status_siswa);
    }
    if (filter?.id_rombel) {
      const ids = new Set(
        anggotaRombel
          .filter(
            (a) =>
              a.id_rombel === filter.id_rombel &&
              a.tanggal_selesai === null &&
              a.status_persetujuan !== "Menunggu Persetujuan",
          )
          .map((a) => a.id_siswa),
      );
      result = result.filter((s) => ids.has(s.id_siswa));
    }
    if (filter?.query) {
      const q = filter.query.toLowerCase();
      result = result.filter(
        (s) =>
          s.nama_lengkap.toLowerCase().includes(q) ||
          s.nisn.includes(q) ||
          s.nik.includes(q),
      );
    }
    return result;
  },

  async getById(id_siswa) {
    await simulateLatency();
    maybeThrowSimulatedError();
    return loadStore().siswa.find((s) => s.id_siswa === id_siswa) ?? null;
  },

  async create(data) {
    await simulateLatency();
    maybeThrowSimulatedError();
    const created: Siswa = {
      ...data,
      id_siswa: createId("sw"),
      id_madrasah: data.id_madrasah ?? "md_1",
      skor_risiko_ai: null,
    };
    mutateStore((store) => {
      store.siswa.push(created);
      store.auditLog.unshift({
        id_log: createId("au"),
        id_user: "pg_ops",
        nama_tabel: "siswa",
        id_record: created.id_siswa,
        aksi: "Create",
        timestamp: nowIso(),
      });
    });
    return created;
  },

  async update(id_siswa, data) {
    await simulateLatency();
    maybeThrowSimulatedError();
    let updated: Siswa | null = null;
    mutateStore((store) => {
      const idx = store.siswa.findIndex((s) => s.id_siswa === id_siswa);
      if (idx < 0) throw new Error("Siswa tidak ditemukan");
      const { skor_risiko_ai: _ignore, ...safe } = data;
      void _ignore;
      store.siswa[idx] = { ...store.siswa[idx], ...safe, skor_risiko_ai: store.siswa[idx].skor_risiko_ai };
      updated = store.siswa[idx];
      store.auditLog.unshift({
        id_log: createId("au"),
        id_user: "pg_ops",
        nama_tabel: "siswa",
        id_record: id_siswa,
        aksi: "Update",
        timestamp: nowIso(),
      });
    });
    if (!updated) throw new Error("Siswa tidak ditemukan");
    return updated;
  },
};
