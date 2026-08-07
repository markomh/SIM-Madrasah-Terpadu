import type { AnggotaRombel, RiwayatMutasi, Surat } from "@/types";
import type { PersetujuanItem, PersetujuanService } from "./persetujuan.service";
import {
  createId,
  loadStore,
  maybeThrowSimulatedError,
  mutateStore,
  nowIso,
  simulateLatency,
  todayIso,
} from "./store";

export const persetujuanMock: PersetujuanService = {
  async getPending() {
    await simulateLatency();
    maybeThrowSimulatedError();
    const store = loadStore();
    const items: PersetujuanItem[] = [
      ...store.anggotaRombel
        .filter((a) => a.status_persetujuan === "Menunggu Persetujuan")
        .map((data) => ({ jenis: "pindah_rombel" as const, data })),
      ...store.mutasi
        .filter((m) => m.status_persetujuan === "Menunggu Persetujuan")
        .map((data) => ({ jenis: "mutasi" as const, data })),
    ];
    return items;
  },

  async approvePindahRombel(id_anggota, disetujui_oleh) {
    await simulateLatency();
    maybeThrowSimulatedError();
    let result: AnggotaRombel | null = null;
    mutateStore((store) => {
      const pending = store.anggotaRombel.find((a) => a.id_anggota === id_anggota);
      if (!pending || pending.status_persetujuan !== "Menunggu Persetujuan") {
        throw new Error("Pengajuan tidak ditemukan / sudah diproses.");
      }
      const old = store.anggotaRombel.find(
        (a) =>
          a.id_siswa === pending.id_siswa &&
          a.tanggal_selesai === null &&
          a.status_persetujuan !== "Menunggu Persetujuan" &&
          a.id_anggota !== pending.id_anggota,
      );
      const tgl = todayIso();
      if (old) {
        old.tanggal_selesai = tgl;
        old.status_keanggotaan = "Naik Kelas";
      }
      pending.status_persetujuan = "Disetujui";
      pending.status_keanggotaan = "Aktif";
      pending.disetujui_oleh = disetujui_oleh;
      pending.tanggal_persetujuan = tgl;
      pending.tanggal_mulai = tgl;
      result = pending;
      store.auditLog.unshift({
        id_log: createId("au"),
        id_user: disetujui_oleh,
        nama_tabel: "anggota_rombel",
        id_record: id_anggota,
        aksi: "Approve",
        timestamp: nowIso(),
      });
    });
    if (!result) throw new Error("Gagal menyetujui");
    return result;
  },

  async rejectPindahRombel(id_anggota, disetujui_oleh, alasan) {
    await simulateLatency();
    maybeThrowSimulatedError();
    void alasan;
    let result: AnggotaRombel | null = null;
    mutateStore((store) => {
      const pending = store.anggotaRombel.find((a) => a.id_anggota === id_anggota);
      if (!pending || pending.status_persetujuan !== "Menunggu Persetujuan") {
        throw new Error("Pengajuan tidak ditemukan / sudah diproses.");
      }
      pending.status_persetujuan = "Ditolak";
      pending.disetujui_oleh = disetujui_oleh;
      pending.tanggal_persetujuan = todayIso();
      pending.tanggal_selesai = todayIso();
      result = pending;
      store.auditLog.unshift({
        id_log: createId("au"),
        id_user: disetujui_oleh,
        nama_tabel: "anggota_rombel",
        id_record: id_anggota,
        aksi: "Reject",
        timestamp: nowIso(),
      });
    });
    if (!result) throw new Error("Gagal menolak");
    return result;
  },

  async approveMutasi(id_mutasi, disetujui_oleh) {
    await simulateLatency();
    maybeThrowSimulatedError();
    let result: RiwayatMutasi | null = null;
    mutateStore((store) => {
      const mutasi = store.mutasi.find((m) => m.id_mutasi === id_mutasi);
      if (!mutasi || mutasi.status_persetujuan !== "Menunggu Persetujuan") {
        throw new Error("Mutasi tidak ditemukan / sudah diproses.");
      }
      const tgl = todayIso();
      mutasi.status_persetujuan = "Disetujui";
      mutasi.disetujui_oleh = disetujui_oleh;
      mutasi.tanggal_persetujuan = tgl;

      if (mutasi.jenis_mutasi === "Masuk") {
        const rombelTujuan = store.pendingMutasiRombel[id_mutasi] ?? "rb_10a";
        store.anggotaRombel.push({
          id_anggota: createId("ar"),
          id_siswa: mutasi.id_siswa,
          id_rombel: rombelTujuan,
          tanggal_mulai: tgl,
          tanggal_selesai: null,
          status_keanggotaan: "Aktif",
          jenis_perpindahan: "Mutasi Masuk",
          status_persetujuan: "Tidak Perlu",
          diajukan_oleh: mutasi.diajukan_oleh,
          disetujui_oleh: disetujui_oleh,
          tanggal_persetujuan: tgl,
        });
        delete store.pendingMutasiRombel[id_mutasi];
      } else {
        const siswa = store.siswa.find((s) => s.id_siswa === mutasi.id_siswa);
        if (siswa) siswa.status_siswa = "Mutasi Keluar";
        const aktif = store.anggotaRombel.find(
          (a) =>
            a.id_siswa === mutasi.id_siswa &&
            a.tanggal_selesai === null &&
            a.status_persetujuan !== "Menunggu Persetujuan",
        );
        if (aktif) {
          aktif.tanggal_selesai = tgl;
          aktif.status_keanggotaan = "Keluar";
        }
      }
      result = mutasi;
      store.auditLog.unshift({
        id_log: createId("au"),
        id_user: disetujui_oleh,
        nama_tabel: "riwayat_mutasi",
        id_record: id_mutasi,
        aksi: "Approve",
        timestamp: nowIso(),
      });
    });
    if (!result) throw new Error("Gagal menyetujui mutasi");
    return result;
  },

  async rejectMutasi(id_mutasi, disetujui_oleh, alasan) {
    await simulateLatency();
    maybeThrowSimulatedError();
    let result: RiwayatMutasi | null = null;
    mutateStore((store) => {
      const mutasi = store.mutasi.find((m) => m.id_mutasi === id_mutasi);
      if (!mutasi || mutasi.status_persetujuan !== "Menunggu Persetujuan") {
        throw new Error("Mutasi tidak ditemukan / sudah diproses.");
      }
      mutasi.status_persetujuan = "Ditolak";
      mutasi.disetujui_oleh = disetujui_oleh;
      mutasi.tanggal_persetujuan = todayIso();
      mutasi.alasan = `${mutasi.alasan} | Ditolak: ${alasan}`;
      if (mutasi.jenis_mutasi === "Masuk") {
        store.siswa = store.siswa.filter((s) => s.id_siswa !== mutasi.id_siswa);
        delete store.pendingMutasiRombel[id_mutasi];
      }
      result = mutasi;
      store.auditLog.unshift({
        id_log: createId("au"),
        id_user: disetujui_oleh,
        nama_tabel: "riwayat_mutasi",
        id_record: id_mutasi,
        aksi: "Reject",
        timestamp: nowIso(),
      });
    });
    if (!result) throw new Error("Gagal menolak mutasi");
    return result;
  },

  async previewMutasiSkp(id_mutasi: string) {
    await simulateLatency();
    const store = loadStore();
    const mutasi = store.mutasi.find(m => m.id_mutasi === id_mutasi);
    if (!mutasi) throw new Error("Mutasi tidak ditemukan");
    if (mutasi.jenis_mutasi !== "Keluar") throw new Error("Hanya mutasi keluar yang dapat menerbitkan SKP");
    
    const siswa = store.siswa.find(s => s.id_siswa === mutasi.id_siswa);
    const aktif = store.anggotaRombel.find(a => a.id_siswa === mutasi.id_siswa && a.tanggal_selesai === null);
    
    const tpl = store.templateSurat.find(t => t.kode_template === "SKP-MUTASI");
    if (!tpl) throw new Error("Template surat SKP-MUTASI tidak ditemukan di database lokal.");
    
    let isi = tpl.body_template;
    if (siswa) {
      isi = isi.replace(/\{\{NAMA_SISWA\}\}/g, siswa.nama_lengkap)
               .replace(/\{\{NISN\}\}/g, siswa.nisn);
    }
    if (aktif) {
      const rombel = store.rombel.find(r => r.id_rombel === aktif.id_rombel);
      if (rombel) isi = isi.replace(/\{\{NAMA_KELAS\}\}/g, rombel.nama_rombel);
    }
    isi = isi.replace(/\{\{SEKOLAH_TUJUAN\}\}/g, mutasi.sekolah_tujuan ?? "")
             .replace(/\{\{ALASAN_PINDAH\}\}/g, mutasi.alasan ?? "")
             .replace(/\{\{NAMA_MADRASAH\}\}/g, store.profilMadrasah.nama_madrasah);
             
    const surat: Surat = {
      id_surat: "sr_preview_only", // transient ID
      nomor_surat: "421/SKP/" + store.profilMadrasah.nama_madrasah.replace(/\s+/g, "") + "/" + new Date().getFullYear(),
      perihal: "Surat Keterangan Pindah (SKP) - " + (siswa?.nama_lengkap ?? ""),
      jenis_surat: "Surat Keterangan",
      id_template: tpl.id_template,
      tanggal_surat: todayIso(),
      tujuan_surat: mutasi.sekolah_tujuan ?? "Sekolah Tujuan",
      isi_surat: isi,
      id_siswa_terkait: mutasi.id_siswa,
      id_pegawai_terkait: null,
      status: "Draf",
      dibuat_oleh: mutasi.diajukan_oleh,
      id_penandatangan: null,
      hasil_ai: false,
      meta_penandatangan: null,
    };
    return surat;
  },

  async approveAndSignMutasiSkp(id_mutasi: string, id_penandatangan: string) {
    await simulateLatency();
    maybeThrowSimulatedError();
    
    const draftSkp = await this.previewMutasiSkp(id_mutasi);
    draftSkp.id_surat = createId("sr"); // generate real ID
    
    let resultMutasi: RiwayatMutasi | null = null;
    let resultSurat: Surat | null = null;
    
    mutateStore((store) => {
      const mutasi = store.mutasi.find((m) => m.id_mutasi === id_mutasi);
      if (!mutasi) throw new Error("Data mutasi tidak ditemukan");
      if (mutasi.status_persetujuan !== "Menunggu Persetujuan") {
        throw new Error("Mutasi sudah diproses sebelumnya");
      }
      
      // 1. Update Mutasi
      mutasi.status_persetujuan = "Disetujui";
      mutasi.disetujui_oleh = id_penandatangan;
      mutasi.tanggal_persetujuan = todayIso();
      
      // 2. Update Siswa
      const siswa = store.siswa.find((s) => s.id_siswa === mutasi.id_siswa);
      if (siswa) siswa.status_siswa = "Mutasi Keluar";
      
      // 3. Update AnggotaRombel
      const aktif = store.anggotaRombel.find(
        (a) => a.id_siswa === mutasi.id_siswa && a.tanggal_selesai === null
      );
      if (aktif) {
        aktif.tanggal_selesai = todayIso();
        aktif.status_keanggotaan = "Keluar";
      }
      
      // 4. Generate Signature Snapshot for Surat
      const kamad = store.pegawai.find((p) => p.id_pegawai === id_penandatangan);
      const penugasan = store.penugasanJabatan.find(
        (p) => p.id_pegawai === id_penandatangan && p.jenis_jabatan === "Kepala Madrasah" && p.status === "Aktif"
      );
      
      const signedSurat: Surat = {
        ...draftSkp,
        status: "Diterbitkan",
        id_penandatangan,
        meta_penandatangan: {
          id_pegawai: id_penandatangan,
          nama: kamad?.nama_lengkap_gelar ?? "Kepala Madrasah",
          nip: kamad?.nip ?? null,
          jabatan: penugasan?.jenis_jabatan ?? "Kepala Madrasah",
          tanggal_ttd: todayIso(),
        }
      };
      
      mutasi.id_surat_skp = signedSurat.id_surat;
      store.surat.unshift(signedSurat);
      
      // 5. Audit Log
      store.auditLog.unshift({
        id_log: createId("au"),
        id_user: id_penandatangan,
        nama_tabel: "riwayat_mutasi",
        id_record: id_mutasi,
        aksi: "Approve",
        timestamp: nowIso(),
      });
      
      resultMutasi = mutasi;
      resultSurat = signedSurat;
    });
    
    if (!resultMutasi || !resultSurat) throw new Error("Gagal menyetujui mutasi");
    return { mutasi: resultMutasi, surat: resultSurat };
  },
};
