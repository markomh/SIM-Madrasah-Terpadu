import type { Surat, MetaPenandatangan, Pegawai, PenugasanJabatan } from "@/types";
import type { PersuratanService } from "./persuratan.service";
import { createId, loadStore, maybeThrowSimulatedError, mutateStore, simulateLatency, todayIso, type DemoStore } from "./store";
import { lembagaMock } from "./lembaga.mock";

function getNomorSuratBaru(storeState: DemoStore, nama_madrasah: string) {
  const urutan = String(storeState.surat.length + 1).padStart(3, "0");
  const tahun = new Date().getFullYear();
  const kodeInstansi = nama_madrasah.replace(/\s+/g, "");
  return `421/${urutan}/${kodeInstansi}/${tahun}`;
}

function getSnapshotPenandatangan(storeState: DemoStore, id_penandatangan: string): MetaPenandatangan {
  const pegawaiList = storeState.pegawai;
  const kamad = pegawaiList.find((p: Pegawai) => p.id_pegawai === id_penandatangan);
  const penugasanList = storeState.penugasanJabatan;
  const penugasan = penugasanList.find(
    (p: PenugasanJabatan) => p.id_pegawai === id_penandatangan && p.jenis_jabatan === "Kepala Madrasah" && p.status === "Aktif"
  );

  return {
    id_pegawai: id_penandatangan,
    nama: kamad?.nama_lengkap_gelar ?? "Kepala Madrasah",
    nip: kamad?.nip ?? null,
    jabatan: penugasan?.jenis_jabatan ?? "Kepala Madrasah",
    tanggal_ttd: todayIso(),
  };
}

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

    const profil = await lembagaMock.getProfil();
    let created: Surat | null = null;
    
    mutateStore((store) => {
      const generatedNomor = getNomorSuratBaru(store, profil.nama_madrasah);
      created = {
        ...data,
        id_surat: createId("sr"),
        nomor_surat: data.nomor_surat || generatedNomor,
        status: "Draf",
        id_penandatangan: null,
        tanggal_surat: todayIso(),
        meta_penandatangan: null,
      };
      store.surat.unshift(created);
    });

    return created!;
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

    let updated: Surat | null = null;
    mutateStore((store) => {
      const snapshot = getSnapshotPenandatangan(store, id_penandatangan);
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

  async reject(id_surat) {
    await simulateLatency();
    maybeThrowSimulatedError();

    let updated: Surat | null = null;
    mutateStore((store) => {
      const idx = store.surat.findIndex((s) => s.id_surat === id_surat);
      if (idx < 0) throw new Error("Surat tidak ditemukan");
      store.surat[idx] = {
        ...store.surat[idx],
        status: "Ditolak",
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

  async buildDraftFromTemplate(params) {
    await simulateLatency();
    const store = loadStore();
    const tpl = store.templateSurat.find(t => t.kode_template === params.kodeTemplate);
    if (!tpl) throw new Error(`Template surat ${params.kodeTemplate} tidak ditemukan di database lokal.`);
    
    let isi = tpl.body_template;
    for (const [key, value] of Object.entries(params.placeholders)) {
      isi = isi.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    
    const profil = await lembagaMock.getProfil();
    isi = isi.replace(/\{\{NAMA_MADRASAH\}\}/g, profil.nama_madrasah);

    const generatedNomor = getNomorSuratBaru(store, profil.nama_madrasah);

    const surat: Surat = {
      id_surat: "sr_preview_only",
      nomor_surat: generatedNomor,
      perihal: params.perihal,
      jenis_surat: params.jenisSurat,
      id_template: tpl.id_template,
      tanggal_surat: todayIso(),
      tujuan_surat: params.tujuanSurat ?? "Tujuan Surat",
      isi_surat: isi,
      id_siswa_terkait: params.idSiswaTerkait ?? null,
      id_pegawai_terkait: params.idPegawaiTerkait ?? null,
      status: "Draf",
      dibuat_oleh: params.dibuatOleh,
      id_penandatangan: null,
      hasil_ai: false,
      meta_penandatangan: null,
    };
    return surat;
  },

  async createAndSign(params) {
    await simulateLatency();
    maybeThrowSimulatedError();
    const draft = await this.buildDraftFromTemplate(params);
    const profil = await lembagaMock.getProfil();
    
    let createdAndSigned: Surat | null = null;
    
    mutateStore((store) => {
      const { 
        id_surat: _id, 
        status: _status, 
        id_penandatangan: _idP, 
        tanggal_surat: _tgl, 
        meta_penandatangan: _meta, 
        nomor_surat: _noSurat, 
        ...createData 
      } = draft;

      const generatedNomor = getNomorSuratBaru(store, profil.nama_madrasah);
      const snapshot = getSnapshotPenandatangan(store, params.idPenandatangan);
      
      createdAndSigned = {
        ...createData,
        id_surat: createId("sr"),
        nomor_surat: generatedNomor,
        status: "Diterbitkan",
        id_penandatangan: params.idPenandatangan,
        tanggal_surat: todayIso(),
        meta_penandatangan: snapshot,
      };
      
      store.surat.unshift(createdAndSigned);
    });
    
    if (!createdAndSigned) throw new Error("Gagal membuat dan menandatangani surat");
    return createdAndSigned;
  },
};

