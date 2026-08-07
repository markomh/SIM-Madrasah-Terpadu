import type { Surat, MetaPenandatangan } from "@/types";
import type { PersuratanService } from "./persuratan.service";
import { createId, loadStore, maybeThrowSimulatedError, mutateStore, simulateLatency, todayIso } from "./store";
import { lembagaMock } from "./lembaga.mock";

export const persuratanMock: PersuratanService = {
  async getAll(filter) {
    await simulateLatency();
    maybeThrowSimulatedError();
    let result = loadStore().surat;
    if (filter) {
      if (filter.status) result = result.filter(s => s.status === filter.status);
      if (filter.jenis_surat) result = result.filter(s => s.jenis_surat === filter.jenis_surat);
    }
    return result;
  },

  async create(data) {
    await simulateLatency();
    maybeThrowSimulatedError();

    // Penomoran dinamis mengambil identitas instansi dari LembagaService (jika tidak diinput manual)
    const profil = await lembagaMock.getProfil();
    const urutan = String(loadStore().surat.length + 1).padStart(3, "0");
    const tahun = new Date().getFullYear();
    const kodeInstansi = profil.nama_madrasah.replace(/\s+/g, "");
    const generatedNomor = `421/${urutan}/${kodeInstansi}/${tahun}`;

    const created: Surat = {
      ...data,
      id_surat: createId("sr"),
      nomor_surat: data.nomor_surat || generatedNomor,
      status: "Draf",
      id_penandatangan: null,
      tanggal_surat: todayIso(),
      meta_penandatangan: null,
    };
    mutateStore((s) => s.surat.unshift(created));
    return created;
  },

  async requestSign(id_surat, id_penandatangan) {
    await simulateLatency();
    maybeThrowSimulatedError();
    let updated: Surat | null = null;
    mutateStore((store) => {
      const idx = store.surat.findIndex((s) => s.id_surat === id_surat);
      if (idx < 0) throw new Error("Surat tidak ditemukan");
      store.surat[idx] = { ...store.surat[idx], status: "Menunggu TTD", id_penandatangan };
      updated = store.surat[idx];
    });
    if (!updated) throw new Error("Surat tidak ditemukan");
    return updated;
  },

  /**
   * Langkah 3 — Kekekalan Arsip (Snapshotting):
   * Saat TTD diklik, nama & NIP Kamad direkam mati ke dalam meta_penandatangan.
   * Setelah ini, render tampilan surat WAJIB membaca dari snapshot, bukan data live.
   */
  async sign(id_surat, id_penandatangan) {
    await simulateLatency();
    maybeThrowSimulatedError();

    // Ambil data live Kamad untuk dibuat snapshot satu kali
    const pegawaiList = loadStore().pegawai;
    const kamad = pegawaiList.find((p) => p.id_pegawai === id_penandatangan);
    const penugasanList = loadStore().penugasanJabatan;
    const penugasan = penugasanList.find(
      (p) => p.id_pegawai === id_penandatangan && p.jenis_jabatan === "Kepala Madrasah" && p.status === "Aktif"
    );

    const snapshot: MetaPenandatangan = {
      id_pegawai: id_penandatangan,
      nama: kamad?.nama_lengkap_gelar ?? "Kepala Madrasah",
      nip: kamad?.nip ?? null,
      jabatan: penugasan?.jenis_jabatan ?? "Kepala Madrasah",
      tanggal_ttd: todayIso(),
    };

    let updated: Surat | null = null;
    mutateStore((store) => {
      const idx = store.surat.findIndex((s) => s.id_surat === id_surat);
      if (idx < 0) throw new Error("Surat tidak ditemukan");
      store.surat[idx] = {
        ...store.surat[idx],
        status: "Diterbitkan",
        id_penandatangan,
        meta_penandatangan: snapshot,
      };
      updated = store.surat[idx];
    });
    if (!updated) throw new Error("Surat tidak ditemukan");
    return updated;
  },

  async generateAiDraft(instruksi, dibuat_oleh) {
    await simulateLatency();
    maybeThrowSimulatedError();
    return this.create({
      nomor_surat: "",
      perihal: `Draf AI: ${instruksi.slice(0, 40)}`,
      jenis_surat: "Surat Tugas",
      id_template: null,
      tujuan_surat: "",
      isi_surat: `Hasil AI — perlu verifikasi. Instruksi: ${instruksi}`,
      id_siswa_terkait: null,
      id_pegawai_terkait: null,
      dibuat_oleh,
      hasil_ai: true,
    });
  },
};
