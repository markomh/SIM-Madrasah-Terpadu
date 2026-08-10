import type { NilaiService } from "./nilai.service";
import type { KomponenNilai, NilaiSiswa } from "@/types/nilai";
import { loadStore, simulateLatency, maybeThrowSimulatedError, createId, nowIso } from "./store";

let mockKomponen: KomponenNilai[] = [
  { id_komponen: "k_1", id_mapel: "mp_pai", nama_komponen: "Tugas Harian", bobot: 30 },
  { id_komponen: "k_2", id_mapel: "mp_pai", nama_komponen: "UTS (Tengah Semester)", bobot: 30 },
  { id_komponen: "k_3", id_mapel: "mp_pai", nama_komponen: "UAS (Akhir Semester)", bobot: 40 },
  { id_komponen: "k_4", id_mapel: "mp_mtk", nama_komponen: "Tugas 1: Aljabar", bobot: 20 },
  { id_komponen: "k_5", id_mapel: "mp_mtk", nama_komponen: "Ulangan Harian 1", bobot: 20 },
  { id_komponen: "k_6", id_mapel: "mp_mtk", nama_komponen: "UTS (Tengah Semester)", bobot: 30 },
  { id_komponen: "k_6b", id_mapel: "mp_mtk", nama_komponen: "UAS (Akhir Semester)", bobot: 30 },
  { id_komponen: "k_7", id_mapel: "mp_bind", nama_komponen: "Tugas Portofolio", bobot: 40 },
  { id_komponen: "k_8", id_mapel: "mp_bind", nama_komponen: "Ulangan Harian", bobot: 60 },
  { id_komponen: "k_9", id_mapel: "mp_bing", nama_komponen: "UTS", bobot: 40 },
  { id_komponen: "k_9b", id_mapel: "mp_bing", nama_komponen: "UAS", bobot: 60 },
  { id_komponen: "k_10", id_mapel: "mp_ipa", nama_komponen: "Praktik Laboratorium", bobot: 40 },
  { id_komponen: "k_10b", id_mapel: "mp_ipa", nama_komponen: "UAS", bobot: 60 },
  { id_komponen: "k_11", id_mapel: "mp_qur", nama_komponen: "Setoran Hafalan", bobot: 50 },
  { id_komponen: "k_11b", id_mapel: "mp_qur", nama_komponen: "UAS", bobot: 50 },
  { id_komponen: "k_12", id_mapel: "mp_pjok", nama_komponen: "Praktik Atletik", bobot: 60 },
  { id_komponen: "k_13", id_mapel: "mp_pjok", nama_komponen: "Teori Kebugaran", bobot: 40 },
];

let mockNilai: NilaiSiswa[] = [
  // Seed sample grades for Kelas 10A Matematika (pg_demo_terpadu)
  { id_nilai: "nl_1", id_siswa: "sw_01", id_komponen: "k_4", id_rombel: "rb_10a", id_tahun: "ta_2627", semester: "Ganjil", nilai: 88, id_pegawai_penilai: "pg_demo_terpadu", tanggal_input: nowIso() },
  { id_nilai: "nl_2", id_siswa: "sw_01", id_komponen: "k_5", id_rombel: "rb_10a", id_tahun: "ta_2627", semester: "Ganjil", nilai: 85, id_pegawai_penilai: "pg_demo_terpadu", tanggal_input: nowIso() },
  { id_nilai: "nl_3", id_siswa: "sw_01", id_komponen: "k_6", id_rombel: "rb_10a", id_tahun: "ta_2627", semester: "Ganjil", nilai: 90, id_pegawai_penilai: "pg_demo_terpadu", tanggal_input: nowIso() },
  { id_nilai: "nl_4", id_siswa: "sw_02", id_komponen: "k_4", id_rombel: "rb_10a", id_tahun: "ta_2627", semester: "Ganjil", nilai: 78, id_pegawai_penilai: "pg_demo_terpadu", tanggal_input: nowIso() },
  { id_nilai: "nl_5", id_siswa: "sw_02", id_komponen: "k_5", id_rombel: "rb_10a", id_tahun: "ta_2627", semester: "Ganjil", nilai: 72, id_pegawai_penilai: "pg_demo_terpadu", tanggal_input: nowIso() },
  { id_nilai: "nl_6", id_siswa: "sw_02", id_komponen: "k_6", id_rombel: "rb_10a", id_tahun: "ta_2627", semester: "Ganjil", nilai: 80, id_pegawai_penilai: "pg_demo_terpadu", tanggal_input: nowIso() },
  { id_nilai: "nl_7", id_siswa: "sw_03", id_komponen: "k_4", id_rombel: "rb_10a", id_tahun: "ta_2627", semester: "Ganjil", nilai: 95, id_pegawai_penilai: "pg_demo_terpadu", tanggal_input: nowIso() },
  { id_nilai: "nl_8", id_siswa: "sw_03", id_komponen: "k_5", id_rombel: "rb_10a", id_tahun: "ta_2627", semester: "Ganjil", nilai: 92, id_pegawai_penilai: "pg_demo_terpadu", tanggal_input: nowIso() },
  { id_nilai: "nl_9", id_siswa: "sw_04", id_komponen: "k_4", id_rombel: "rb_10a", id_tahun: "ta_2627", semester: "Ganjil", nilai: 68, id_pegawai_penilai: "pg_demo_terpadu", tanggal_input: nowIso() },
  { id_nilai: "nl_10", id_siswa: "sw_04", id_komponen: "k_5", id_rombel: "rb_10a", id_tahun: "ta_2627", semester: "Ganjil", nilai: 70, id_pegawai_penilai: "pg_demo_terpadu", tanggal_input: nowIso() },
  { id_nilai: "nl_11", id_siswa: "sw_05", id_komponen: "k_4", id_rombel: "rb_10a", id_tahun: "ta_2627", semester: "Ganjil", nilai: 84, id_pegawai_penilai: "pg_demo_terpadu", tanggal_input: nowIso() },
];

export const mockNilaiService: NilaiService = {
  getKomponen: async (id_mapel) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    return mockKomponen.filter((k) => k.id_mapel === id_mapel);
  },

  addKomponen: async (data) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    const newKomp: KomponenNilai = {
      ...data,
      id_komponen: createId("k"),
    };
    mockKomponen.push(newKomp);
    return newKomp;
  },

  updateKomponen: async (id_komponen, data) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    const idx = mockKomponen.findIndex((k) => k.id_komponen === id_komponen);
    if (idx === -1) throw new Error("Komponen nilai tidak ditemukan");
    mockKomponen[idx] = { ...mockKomponen[idx], ...data };
    return mockKomponen[idx];
  },

  deleteKomponen: async (id_komponen) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    mockKomponen = mockKomponen.filter((k) => k.id_komponen !== id_komponen);
    mockNilai = mockNilai.filter((n) => n.id_komponen !== id_komponen);
  },

  getNilai: async (filter) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    let result = mockNilai.filter((n) => n.id_rombel === filter.id_rombel && n.semester === filter.semester);
    if (filter.id_mapel) {
      const komp = mockKomponen.filter((k) => k.id_mapel === filter.id_mapel).map((k) => k.id_komponen);
      result = result.filter((n) => komp.includes(n.id_komponen));
    }
    return result;
  },

  inputNilai: async (data) => {
    await simulateLatency();
    maybeThrowSimulatedError();

    const komponen = mockKomponen.find((k) => k.id_komponen === data.id_komponen);
    if (!komponen) throw new Error("Komponen nilai tidak ditemukan.");

    const store = loadStore();

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

    const existingIdx = mockNilai.findIndex(
      (n) =>
        n.id_siswa === data.id_siswa &&
        n.id_komponen === data.id_komponen &&
        n.semester === data.semester &&
        n.id_tahun === data.id_tahun
    );

    if (existingIdx !== -1) {
      mockNilai[existingIdx].nilai = data.nilai;
      mockNilai[existingIdx].id_pegawai_penilai = data.id_pegawai_penilai;
      mockNilai[existingIdx].tanggal_input = nowIso();
      return { ...mockNilai[existingIdx] };
    }

    const newNilai: NilaiSiswa = {
      ...data,
      id_nilai: createId("nl"),
      tanggal_input: nowIso(),
    };
    mockNilai.push(newNilai);
    return { ...newNilai };
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
