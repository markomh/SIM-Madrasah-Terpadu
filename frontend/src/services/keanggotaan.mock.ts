import type { AnggotaRombel, PemetaanKenaikan } from "@/types";
import type { KeanggotaanService } from "./keanggotaan.service";
import {
  createId,
  loadStore,
  maybeThrowSimulatedError,
  mutateStore,
  nowIso,
  simulateLatency,
  todayIso,
} from "./store";

export const keanggotaanMock: KeanggotaanService = {
  async getAnggotaAktif(filter) {
    await simulateLatency();
    maybeThrowSimulatedError();
    let result = loadStore().anggotaRombel.filter(
      (a) => a.tanggal_selesai === null && a.status_persetujuan !== "Menunggu Persetujuan",
    );
    if (filter?.id_rombel) result = result.filter((a) => a.id_rombel === filter.id_rombel);
    if (filter?.id_siswa) result = result.filter((a) => a.id_siswa === filter.id_siswa);
    return result;
  },

  async getPending() {
    await simulateLatency();
    maybeThrowSimulatedError();
    return loadStore().anggotaRombel.filter((a) => a.status_persetujuan === "Menunggu Persetujuan");
  },

  async getPemetaan(id_tahun) {
    await simulateLatency();
    maybeThrowSimulatedError();
    const items = loadStore().pemetaanKenaikan;
    return id_tahun ? items.filter((p) => p.id_tahun === id_tahun) : items;
  },

  async setPemetaan(items) {
    await simulateLatency();
    maybeThrowSimulatedError();
    const store = loadStore();
    const tingkatByRombel = new Map(
      store.rombel.map((r) => [r.id_rombel, store.tingkat.find((t) => t.id_tingkat === r.id_tingkat)]),
    );
    for (const item of items) {
      const asal = tingkatByRombel.get(item.id_rombel_asal);
      const tujuan = tingkatByRombel.get(item.id_rombel_tujuan);
      if (!asal || !tujuan || tujuan.urutan !== asal.urutan + 1) {
        throw new Error(
          `Pemetaan tidak valid: rombel tujuan harus tingkat urutan +1 dari asal (${item.id_rombel_asal} → ${item.id_rombel_tujuan}).`,
        );
      }
    }
    const created: PemetaanKenaikan[] = items.map((item) => ({
      ...item,
      id_pemetaan: createId("pk"),
    }));
    mutateStore((s) => {
      const tahun = items[0]?.id_tahun;
      s.pemetaanKenaikan = s.pemetaanKenaikan.filter((p) => p.id_tahun !== tahun).concat(created);
    });
    return created;
  },

  async prosesKenaikanMassal(id_tahun_tujuan, diajukanOleh) {
    await simulateLatency();
    maybeThrowSimulatedError();
    let processed = 0;
    mutateStore((store) => {
      const pemetaan = store.pemetaanKenaikan.filter((p) => p.id_tahun === id_tahun_tujuan);
      if (pemetaan.length === 0) throw new Error("Belum ada pemetaan kenaikan untuk tahun tujuan.");
      const today = todayIso();
      for (const map of pemetaan) {
        const aktif = store.anggotaRombel.filter(
          (a) =>
            a.id_rombel === map.id_rombel_asal &&
            a.tanggal_selesai === null &&
            a.status_persetujuan !== "Menunggu Persetujuan",
        );
        for (const row of aktif) {
          row.tanggal_selesai = today;
          row.status_keanggotaan = "Naik Kelas";
          store.anggotaRombel.push({
            id_anggota: createId("ar"),
            id_siswa: row.id_siswa,
            id_rombel: map.id_rombel_tujuan,
            tanggal_mulai: today,
            tanggal_selesai: null,
            status_keanggotaan: "Aktif",
            jenis_perpindahan: "Kenaikan Tingkat",
            status_persetujuan: "Tidak Perlu",
            diajukan_oleh: diajukanOleh,
            disetujui_oleh: null,
            tanggal_persetujuan: null,
          });
          processed += 1;
        }
      }
      store.auditLog.unshift({
        id_log: createId("au"),
        id_user: diajukanOleh,
        nama_tabel: "anggota_rombel",
        id_record: id_tahun_tujuan,
        aksi: "Update",
        timestamp: nowIso(),
      });
    });
    return { processed };
  },

  async ajukanPindahRombel(input) {
    await simulateLatency();
    maybeThrowSimulatedError();
    const store = loadStore();
    const aktif = store.anggotaRombel.find(
      (a) =>
        a.id_siswa === input.id_siswa &&
        a.tanggal_selesai === null &&
        a.status_persetujuan !== "Menunggu Persetujuan",
    );
    if (!aktif) throw new Error("Siswa tidak memiliki keanggotaan aktif.");
    const rombelAsal = store.rombel.find((r) => r.id_rombel === aktif.id_rombel);
    const rombelTujuan = store.rombel.find((r) => r.id_rombel === input.id_rombel_tujuan);
    if (!rombelAsal || !rombelTujuan) throw new Error("Rombel tidak ditemukan.");
    if (rombelAsal.id_rombel === rombelTujuan.id_rombel) {
      throw new Error("Rombel tujuan sama dengan rombel asal.");
    }
    const tingkatAsal = store.tingkat.find((t) => t.id_tingkat === rombelAsal.id_tingkat);
    const tingkatTujuan = store.tingkat.find((t) => t.id_tingkat === rombelTujuan.id_tingkat);
    if (!tingkatAsal || !tingkatTujuan) throw new Error("Tingkat pendidikan tidak ditemukan.");

    const sameLevel = tingkatAsal.urutan === tingkatTujuan.urutan;
    let result: AnggotaRombel | null = null;

    mutateStore((s) => {
      const current = s.anggotaRombel.find(
        (a) =>
          a.id_siswa === input.id_siswa &&
          a.tanggal_selesai === null &&
          a.status_persetujuan !== "Menunggu Persetujuan",
      );
      if (!current) throw new Error("Keanggotaan aktif tidak ditemukan.");

      if (sameLevel) {
        current.tanggal_selesai = input.tanggal_efektif;
        current.status_keanggotaan = "Pindah Rombel";
        const baru: AnggotaRombel = {
          id_anggota: createId("ar"),
          id_siswa: input.id_siswa,
          id_rombel: input.id_rombel_tujuan,
          tanggal_mulai: input.tanggal_efektif,
          tanggal_selesai: null,
          status_keanggotaan: "Aktif",
          jenis_perpindahan: "Pindah Rombel",
          status_persetujuan: "Tidak Perlu",
          diajukan_oleh: input.diajukan_oleh,
          disetujui_oleh: null,
          tanggal_persetujuan: null,
        };
        s.anggotaRombel.push(baru);
        result = baru;
      } else {
        const pending: AnggotaRombel = {
          id_anggota: createId("ar"),
          id_siswa: input.id_siswa,
          id_rombel: input.id_rombel_tujuan,
          tanggal_mulai: input.tanggal_efektif,
          tanggal_selesai: null,
          status_keanggotaan: "Aktif",
          jenis_perpindahan: "Kenaikan Tingkat",
          status_persetujuan: "Menunggu Persetujuan",
          diajukan_oleh: input.diajukan_oleh,
          disetujui_oleh: null,
          tanggal_persetujuan: null,
        };
        s.anggotaRombel.push(pending);
        result = pending;
      }
      s.auditLog.unshift({
        id_log: createId("au"),
        id_user: input.diajukan_oleh,
        nama_tabel: "anggota_rombel",
        id_record: result!.id_anggota,
        aksi: "Create",
        timestamp: nowIso(),
      });
    });

    if (!result) throw new Error("Gagal mengajukan pindah rombel");
    return result;
  },

  async pindahRombelMassal(input) {
    await simulateLatency();
    maybeThrowSimulatedError();
    const store = loadStore();
    
    const rombelTujuan = store.rombel.find((r) => r.id_rombel === input.id_rombel_tujuan);
    if (!rombelTujuan) throw new Error("Rombel tujuan tidak ditemukan.");
    const tingkatTujuan = store.tingkat.find((t) => t.id_tingkat === rombelTujuan.id_tingkat);
    if (!tingkatTujuan) throw new Error("Tingkat pendidikan rombel tujuan tidak ditemukan.");

    let processed = 0;

    mutateStore((s) => {
      for (const id_siswa of input.id_siswa_list) {
        const current = s.anggotaRombel.find(
          (a) =>
            a.id_siswa === id_siswa &&
            a.tanggal_selesai === null &&
            a.status_persetujuan !== "Menunggu Persetujuan",
        );
        if (!current) continue; // Skip jika tidak aktif
        if (current.id_rombel === input.id_rombel_tujuan) continue; // Skip jika sudah di rombel tujuan

        const rombelAsal = s.rombel.find((r) => r.id_rombel === current.id_rombel);
        if (!rombelAsal) continue;
        const tingkatAsal = s.tingkat.find((t) => t.id_tingkat === rombelAsal.id_tingkat);
        if (!tingkatAsal) continue;

        const sameLevel = tingkatAsal.urutan === tingkatTujuan.urutan;

        current.tanggal_selesai = input.tanggal_efektif;
        current.status_keanggotaan = sameLevel ? "Pindah Rombel" : "Naik Kelas";

        const baru: AnggotaRombel = {
          id_anggota: createId("ar"),
          id_siswa: id_siswa,
          id_rombel: input.id_rombel_tujuan,
          tanggal_mulai: input.tanggal_efektif,
          tanggal_selesai: null,
          status_keanggotaan: "Aktif",
          jenis_perpindahan: sameLevel ? "Pindah Rombel" : "Kenaikan Tingkat",
          status_persetujuan: "Tidak Perlu", // Massal oleh admin dianggap langsung valid
          diajukan_oleh: input.diajukan_oleh,
          disetujui_oleh: null,
          tanggal_persetujuan: null,
        };
        s.anggotaRombel.push(baru);

        s.auditLog.unshift({
          id_log: createId("au"),
          id_user: input.diajukan_oleh,
          nama_tabel: "anggota_rombel",
          id_record: baru.id_anggota,
          aksi: "Create",
          timestamp: nowIso(),
        });
        
        processed++;
      }
    });

    return { processed };
  },
};
