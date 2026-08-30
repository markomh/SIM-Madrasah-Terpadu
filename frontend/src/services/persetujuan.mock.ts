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
import { persuratanMock } from "./persuratan.mock";

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
        const rombelTujuan = store.pendingMutasiRombel[id_mutasi] ?? "rb_7a";
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
    const rombel = aktif ? store.rombel.find(r => r.id_rombel === aktif.id_rombel) : null;
    
    return persuratanMock.buildDraftFromTemplate({
      kodeTemplate: "SKP-MUTASI",
      placeholders: {
        NAMA_SISWA: siswa?.nama_lengkap ?? "",
        NISN: siswa?.nisn ?? "",
        NAMA_KELAS: rombel?.nama_rombel ?? "",
        SEKOLAH_TUJUAN: mutasi.sekolah_tujuan ?? "",
        ALASAN_PINDAH: mutasi.alasan ?? "",
      },
      perihal: "Surat Keterangan Pindah (SKP) - " + (siswa?.nama_lengkap ?? ""),
      jenisSurat: "Surat Keterangan",
      idSiswaTerkait: mutasi.id_siswa,
      tujuanSurat: mutasi.sekolah_tujuan ?? "Sekolah Tujuan",
      dibuatOleh: mutasi.diajukan_oleh,
    });
  },

  async approveAndSignMutasiSkp(id_mutasi: string, id_penandatangan: string) {
    await simulateLatency();
    maybeThrowSimulatedError();
    
    const store = loadStore();
    const mutasiData = store.mutasi.find((m) => m.id_mutasi === id_mutasi);
    if (!mutasiData) throw new Error("Data mutasi tidak ditemukan");
    if (mutasiData.status_persetujuan !== "Menunggu Persetujuan") {
      throw new Error("Mutasi sudah diproses sebelumnya");
    }

    const siswa = store.siswa.find(s => s.id_siswa === mutasiData.id_siswa);
    const aktif = store.anggotaRombel.find(a => a.id_siswa === mutasiData.id_siswa && a.tanggal_selesai === null);
    const rombel = aktif ? store.rombel.find(r => r.id_rombel === aktif.id_rombel) : null;

    // Call createAndSign to generate the real letter using service layer
    const signedSurat = await persuratanMock.createAndSign({
      kodeTemplate: "SKP-MUTASI",
      placeholders: {
        NAMA_SISWA: siswa?.nama_lengkap ?? "",
        NISN: siswa?.nisn ?? "",
        NAMA_KELAS: rombel?.nama_rombel ?? "",
        SEKOLAH_TUJUAN: mutasiData.sekolah_tujuan ?? "",
        ALASAN_PINDAH: mutasiData.alasan ?? "",
      },
      perihal: "Surat Keterangan Pindah (SKP) - " + (siswa?.nama_lengkap ?? ""),
      jenisSurat: "Surat Keterangan",
      idSiswaTerkait: mutasiData.id_siswa,
      tujuanSurat: mutasiData.sekolah_tujuan ?? "Sekolah Tujuan",
      dibuatOleh: mutasiData.diajukan_oleh,
      idPenandatangan: id_penandatangan,
    });
    
    let resultMutasi: RiwayatMutasi | null = null;
    
    mutateStore((storeState) => {
      const mutasi = storeState.mutasi.find((m) => m.id_mutasi === id_mutasi);
      if (!mutasi) throw new Error("Data mutasi tidak ditemukan");
      
      // 1. Update Mutasi
      mutasi.status_persetujuan = "Disetujui";
      mutasi.disetujui_oleh = id_penandatangan;
      mutasi.tanggal_persetujuan = todayIso();
      mutasi.id_surat_skp = signedSurat.id_surat;
      
      // 2. Update Siswa
      const siswaInStore = storeState.siswa.find((s) => s.id_siswa === mutasi.id_siswa);
      if (siswaInStore) siswaInStore.status_siswa = "Mutasi Keluar";
      
      // 3. Update AnggotaRombel
      const aktifInStore = storeState.anggotaRombel.find(
        (a) => a.id_siswa === mutasi.id_siswa && a.tanggal_selesai === null
      );
      if (aktifInStore) {
        aktifInStore.tanggal_selesai = todayIso();
        aktifInStore.status_keanggotaan = "Keluar";
      }
      
      // 5. Audit Log
      storeState.auditLog.unshift({
        id_log: createId("au"),
        id_user: id_penandatangan,
        nama_tabel: "riwayat_mutasi",
        id_record: id_mutasi,
        aksi: "Approve",
        timestamp: nowIso(),
      });
      
      resultMutasi = mutasi;
    });
    
    if (!resultMutasi) throw new Error("Gagal menyetujui mutasi");
    return { mutasi: resultMutasi, surat: signedSurat };
  },

  async batchApprove(input, disetujui_oleh) {
    await simulateLatency();
    maybeThrowSimulatedError();
    let approvedPindah = 0;
    let approvedMutasi = 0;
    const gagal: { id: string; jenis: "pindah_rombel" | "mutasi"; alasan: string }[] = [];

    const pindahList = input.id_anggota_list ?? [];
    const mutasiList = input.id_mutasi_list ?? [];

    for (const id_anggota of pindahList) {
      try {
        await persetujuanMock.approvePindahRombel(id_anggota, disetujui_oleh);
        approvedPindah++;
      } catch (err) {
        gagal.push({
          id: id_anggota,
          jenis: "pindah_rombel",
          alasan: err instanceof Error ? err.message : String(err),
        });
      }
    }

    for (const id_mutasi of mutasiList) {
      try {
        const m = loadStore().mutasi.find((x) => x.id_mutasi === id_mutasi);
        if (m?.jenis_mutasi === "Keluar") {
          await persetujuanMock.approveAndSignMutasiSkp(id_mutasi, disetujui_oleh);
        } else {
          await persetujuanMock.approveMutasi(id_mutasi, disetujui_oleh);
        }
        approvedMutasi++;
      } catch (err) {
        gagal.push({
          id: id_mutasi,
          jenis: "mutasi",
          alasan: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return { approved_pindah: approvedPindah, approved_mutasi: approvedMutasi, gagal };
  },

  async batchReject(input, disetujui_oleh, alasan) {
    await simulateLatency();
    maybeThrowSimulatedError();
    let rejectedPindah = 0;
    let rejectedMutasi = 0;
    const gagal: { id: string; jenis: "pindah_rombel" | "mutasi"; alasan: string }[] = [];

    const pindahList = input.id_anggota_list ?? [];
    const mutasiList = input.id_mutasi_list ?? [];

    for (const id_anggota of pindahList) {
      try {
        await persetujuanMock.rejectPindahRombel(id_anggota, disetujui_oleh, alasan);
        rejectedPindah++;
      } catch (err) {
        gagal.push({
          id: id_anggota,
          jenis: "pindah_rombel",
          alasan: err instanceof Error ? err.message : String(err),
        });
      }
    }

    for (const id_mutasi of mutasiList) {
      try {
        await persetujuanMock.rejectMutasi(id_mutasi, disetujui_oleh, alasan);
        rejectedMutasi++;
      } catch (err) {
        gagal.push({
          id: id_mutasi,
          jenis: "mutasi",
          alasan: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return { rejected_pindah: rejectedPindah, rejected_mutasi: rejectedMutasi, gagal };
  },
};

