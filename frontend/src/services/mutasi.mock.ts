import type { RiwayatMutasi, Siswa } from "@/types";
import type { MutasiService } from "./mutasi.service";
import {
  createId,
  loadStore,
  maybeThrowSimulatedError,
  mutateStore,
  nowIso,
  simulateLatency,
} from "./store";

export const mutasiMock: MutasiService = {
  async getAll(filter) {
    await simulateLatency();
    maybeThrowSimulatedError();
    let result = [...loadStore().mutasi];
    if (filter?.status) result = result.filter((m) => m.status_persetujuan === filter.status);
    return result;
  },
  async getById(id_mutasi) {
    await simulateLatency();
    maybeThrowSimulatedError();
    return loadStore().mutasi.find((m) => m.id_mutasi === id_mutasi) ?? null;
  },
  async ajukanMasuk(data) {
    await simulateLatency();
    maybeThrowSimulatedError();
    const id_siswa = createId("sw");
    const draft: Siswa = {
      id_siswa,
      id_madrasah: "md_1",
      nik: data.nik,
      nisn: data.nisn,
      nama_lengkap: data.nama_lengkap.toUpperCase(),
      tempat_lahir: data.tempat_lahir,
      tanggal_lahir: data.tanggal_lahir,
      jenis_kelamin: data.jenis_kelamin,
      agama: data.agama,
      nama_ibu_kandung: data.nama_ibu_kandung,
      alamat_detail: "",
      id_desa: "",
      status_siswa: "Aktif",
      jalur_masuk: "Mutasi Masuk",
      skor_risiko_ai: null,
    };
    const mutasi: RiwayatMutasi = {
      id_mutasi: createId("mt"),
      id_siswa,
      jenis_mutasi: "Masuk",
      sekolah_asal: data.sekolah_asal,
      sekolah_tujuan: null,
      tanggal_mutasi: data.tanggal_mutasi,
      no_surat_mutasi: data.no_surat_mutasi,
      alasan: data.alasan,
      status_persetujuan: "Menunggu Persetujuan",
      diajukan_oleh: data.diajukan_oleh,
      disetujui_oleh: null,
      tanggal_persetujuan: null,
      id_tahun: data.id_tahun,
      berkas_pendukung: data.berkas_list ?? [],
    };
    mutateStore((store) => {
      store.siswa.push(draft);
      store.mutasi.unshift(mutasi);
      store.pendingMutasiRombel[mutasi.id_mutasi] = data.id_rombel_tujuan;
      store.auditLog.unshift({
        id_log: createId("au"),
        id_user: data.diajukan_oleh,
        nama_tabel: "riwayat_mutasi",
        id_record: mutasi.id_mutasi,
        aksi: "Create",
        timestamp: nowIso(),
      });
    });
    return mutasi;
  },
  async ajukanKeluar(data) {
    await simulateLatency();
    maybeThrowSimulatedError();
    if (!data.no_surat_mutasi.trim()) {
      throw new Error("Nomor surat mutasi wajib diisi untuk mutasi keluar.");
    }
    const siswa = loadStore().siswa.find((s) => s.id_siswa === data.id_siswa);
    if (!siswa || siswa.status_siswa !== "Aktif") {
      throw new Error("Siswa tidak aktif / tidak ditemukan.");
    }
    const mutasi: RiwayatMutasi = {
      id_mutasi: createId("mt"),
      id_siswa: data.id_siswa,
      jenis_mutasi: "Keluar",
      sekolah_asal: null,
      sekolah_tujuan: data.sekolah_tujuan,
      tanggal_mutasi: data.tanggal_mutasi,
      no_surat_mutasi: data.no_surat_mutasi,
      alasan: data.alasan,
      status_persetujuan: "Menunggu Persetujuan",
      diajukan_oleh: data.diajukan_oleh,
      disetujui_oleh: null,
      tanggal_persetujuan: null,
      id_tahun: data.id_tahun,
      berkas_pendukung: data.berkas_list ?? [],
    };
    mutateStore((store) => {
      store.mutasi.unshift(mutasi);
      store.auditLog.unshift({
        id_log: createId("au"),
        id_user: data.diajukan_oleh,
        nama_tabel: "riwayat_mutasi",
        id_record: mutasi.id_mutasi,
        aksi: "Create",
        timestamp: nowIso(),
      });
    });
    return mutasi;
  },
};
