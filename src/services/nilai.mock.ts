import type { NilaiService } from "./nilai.service";
import type { KomponenNilai, NilaiSiswa } from "@/types/nilai";
import { loadStore, simulateLatency, maybeThrowSimulatedError, createId, nowIso } from "./store";

const mockKomponen: KomponenNilai[] = [
  { id_komponen: "k_1", id_mapel: "mp_pai", nama_komponen: "Tugas", bobot: 30 },
  { id_komponen: "k_2", id_mapel: "mp_pai", nama_komponen: "UTS", bobot: 30 },
  { id_komponen: "k_3", id_mapel: "mp_pai", nama_komponen: "UAS", bobot: 40 },
  { id_komponen: "k_4", id_mapel: "mp_mtk", nama_komponen: "Tugas", bobot: 30 },
  { id_komponen: "k_5", id_mapel: "mp_mtk", nama_komponen: "UTS", bobot: 30 },
  { id_komponen: "k_6", id_mapel: "mp_mtk", nama_komponen: "UAS", bobot: 40 },
  { id_komponen: "k_7", id_mapel: "mp_bind", nama_komponen: "Tugas", bobot: 40 },
  { id_komponen: "k_8", id_mapel: "mp_bind", nama_komponen: "Ulangan Harian", bobot: 60 },
  { id_komponen: "k_9", id_mapel: "mp_bing", nama_komponen: "UAS", bobot: 100 },
  { id_komponen: "k_10", id_mapel: "mp_ipa", nama_komponen: "UAS", bobot: 100 },
  { id_komponen: "k_11", id_mapel: "mp_qur", nama_komponen: "UAS", bobot: 100 },
];

let mockNilai: NilaiSiswa[] = [];

export const mockNilaiService: NilaiService = {
  getKomponen: async (id_mapel) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    return mockKomponen.filter((k) => k.id_mapel === id_mapel);
  },

  getNilai: async (filter) => {
    await simulateLatency();
    maybeThrowSimulatedError();
    let result = mockNilai.filter(n => n.id_rombel === filter.id_rombel && n.semester === filter.semester);
    if (filter.id_mapel) {
      const komp = mockKomponen.filter(k => k.id_mapel === filter.id_mapel).map(k => k.id_komponen);
      result = result.filter(n => komp.includes(n.id_komponen));
    }
    return result;
  },

  inputNilai: async (data) => {
    await simulateLatency();
    maybeThrowSimulatedError();

    const komponen = mockKomponen.find((k) => k.id_komponen === data.id_komponen);
    if (!komponen) throw new Error("Komponen nilai tidak ditemukan.");

    const store = loadStore();
    
    // Validasi penilai ada di jadwal
    const hasJadwal = store.jadwal.some((j) => 
      j.id_pegawai === data.id_pegawai_penilai && 
      j.id_mapel === komponen.id_mapel && 
      j.id_rombel === data.id_rombel
    );

    if (!hasJadwal) {
      throw new Error(`Anda tidak memiliki jadwal mengajar mata pelajaran ini di rombel tersebut.`);
    }

    const rombel = store.rombel.find(r => r.id_rombel === data.id_rombel);
    if (!rombel) throw new Error("Rombel tidak ditemukan.");
    
    const tahunAjaran = store.tahunAjaran.find(t => t.id_tahun === rombel.id_tahun);
    if (!tahunAjaran || tahunAjaran.semester !== data.semester) {
      throw new Error(`Semester tidak sesuai dengan tahun ajaran rombel (Aktif: ${tahunAjaran?.semester}).`);
    }

    const existingIdx = mockNilai.findIndex(n => n.id_siswa === data.id_siswa && n.id_komponen === data.id_komponen && n.semester === data.semester && n.id_tahun === data.id_tahun);

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
  }
};
