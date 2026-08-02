import type { WawasanService } from "./wawasan.service";
import { loadStore, maybeThrowSimulatedError, simulateLatency } from "./store";

export const wawasanMock: WawasanService = {
  async getSiswaBerisiko(minScore = 50) {
    await simulateLatency();
    maybeThrowSimulatedError();
    return loadStore()
      .siswa.filter((s) => s.skor_risiko_ai != null && s.skor_risiko_ai >= minScore && s.status_siswa === "Aktif")
      .sort((a, b) => (b.skor_risiko_ai ?? 0) - (a.skor_risiko_ai ?? 0));
  },
  async getRekomendasiJadwal() {
    await simulateLatency();
    maybeThrowSimulatedError();
    return {
      id: "ai_jadwal_1",
      ringkasan: "Usulan awal meminimalkan bentrok guru dan jam kosong di Kelas 10.",
      label: "Hasil AI — perlu verifikasi" as const,
      usulan: [
        {
          id_rombel: "rb_10a",
          id_pegawai: "pg_guru_2",
          id_mapel: "mp_mtk",
          hari: "Kamis",
          jam_mulai: "07:00",
          jam_selesai: "08:30",
        },
        {
          id_rombel: "rb_10b",
          id_pegawai: "pg_guru_1",
          id_mapel: "mp_bind",
          hari: "Kamis",
          jam_mulai: "07:00",
          jam_selesai: "08:30",
        },
      ],
    };
  },
};
