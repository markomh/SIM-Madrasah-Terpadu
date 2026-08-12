import type { NilaiService } from "./nilai.service";
import type { KomponenNilai, NilaiSiswa } from "@/types/nilai";
import { loadStore, mutateStore, simulateLatency, maybeThrowSimulatedError, createId, nowIso } from "./store";

export const mockNilaiService: NilaiService = {
  getKomponen: async (id_mapel) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    const store = loadStore();
    return store.komponenNilai.filter((k) => k.id_mapel === id_mapel);
  },

  addKomponen: async (data) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    const newKomp: KomponenNilai = {
      ...data,
      id_komponen: createId("k"),
    };
    mutateStore((s) => {
      s.komponenNilai.push(newKomp);
    });
    return newKomp;
  },

  updateKomponen: async (id_komponen, data) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    let updated: KomponenNilai | undefined;
    mutateStore((s) => {
      const idx = s.komponenNilai.findIndex((k) => k.id_komponen === id_komponen);
      if (idx === -1) throw new Error("Komponen nilai tidak ditemukan");
      s.komponenNilai[idx] = { ...s.komponenNilai[idx], ...data };
      updated = s.komponenNilai[idx];
    });
    return updated!;
  },

  deleteKomponen: async (id_komponen) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    mutateStore((s) => {
      s.komponenNilai = s.komponenNilai.filter((k) => k.id_komponen !== id_komponen);
      s.nilaiSiswa = s.nilaiSiswa.filter((n) => n.id_komponen !== id_komponen);
    });
  },

  getNilai: async (filter) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    const store = loadStore();
    let result = store.nilaiSiswa.filter((n) => n.id_rombel === filter.id_rombel && n.semester === filter.semester);
    if (filter.id_mapel) {
      const komp = store.komponenNilai.filter((k) => k.id_mapel === filter.id_mapel).map((k) => k.id_komponen);
      result = result.filter((n) => komp.includes(n.id_komponen));
    }
    return result;
  },

  inputNilai: async (data) => {
    await simulateLatency();
    maybeThrowSimulatedError();

    const store = loadStore();
    const komponen = store.komponenNilai.find((k) => k.id_komponen === data.id_komponen);
    if (!komponen) throw new Error("Komponen nilai tidak ditemukan.");

    // Validasi penilai ada di jadwal untuk semester terkait
    const jadwalCocok = store.jadwal.find(
      (j) =>
        j.id_pegawai === data.id_pegawai_penilai &&
        j.id_mapel === komponen.id_mapel &&
        j.id_rombel === data.id_rombel &&
        j.semester === data.semester
    );

    if (!jadwalCocok) {
      throw new Error(`Anda tidak memiliki jadwal mengajar mata pelajaran ini di rombel dan semester tersebut.`);
    }

    const rombel = store.rombel.find((r) => r.id_rombel === data.id_rombel);
    if (!rombel) throw new Error("Rombel tidak ditemukan.");

    let result: NilaiSiswa | undefined;
    mutateStore((s) => {
      const existingIdx = s.nilaiSiswa.findIndex(
        (n) =>
          n.id_siswa === data.id_siswa &&
          n.id_komponen === data.id_komponen &&
          n.semester === data.semester &&
          n.id_tahun === data.id_tahun
      );

      if (existingIdx !== -1) {
        s.nilaiSiswa[existingIdx].nilai = data.nilai;
        s.nilaiSiswa[existingIdx].id_pegawai_penilai = data.id_pegawai_penilai;
        s.nilaiSiswa[existingIdx].tanggal_input = nowIso();
        result = s.nilaiSiswa[existingIdx];
      } else {
        const newNilai: NilaiSiswa = {
          ...data,
          id_nilai: createId("nl"),
          tanggal_input: nowIso(),
        };
        s.nilaiSiswa.push(newNilai);
        result = newNilai;
      }
    });

    return { ...result! };
  },

  batchInputNilai: async (entries) => {
    await simulateLatency();
    maybeThrowSimulatedError();

    const results: NilaiSiswa[] = [];
    for (const entry of entries) {
      const saved = await mockNilaiService.inputNilai(entry);
      results.push(saved);
    }
    return results;
  },
};
