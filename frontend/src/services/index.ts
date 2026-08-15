import { siswaMock } from "./siswa.mock";
import { referensiMock } from "./referensi.mock";
import { pegawaiMock } from "./pegawai.mock";
import { keanggotaanMock } from "./keanggotaan.mock";
import { mutasiMock } from "./mutasi.mock";
import { persetujuanMock } from "./persetujuan.mock";
import { absensiMock } from "./absensi.mock";
import { jadwalMock } from "./jadwal.mock";
import { persuratanMock } from "./persuratan.mock";
import { wawasanMock } from "./wawasan.mock";
import { sesiTatapMukaMock } from "./sesi-tatap-muka.mock";
import { izinGuruMock } from "./izin-guru.mock";
import { pengaturanMock } from "./pengaturan.mock";
import { mockWilayahService } from "./wilayah.mock";
import { mockNilaiService } from "./nilai.mock";
import { mockEkstrakurikulerService } from "./ekstrakurikuler.mock";
import { mockBkService } from "./bk.mock";
import { mockPenugasanJabatanService } from "./penugasan-jabatan.mock";
import { lembagaMock } from "./lembaga.mock";

import { siswaApi } from "./siswa.api";
import { pegawaiApi } from "./pegawai.api";
import { referensiApi } from "./referensi.api";
import { jadwalApi } from "./jadwal.api";
import { absensiApi, sesiTatapMukaApi } from "./sesi-tatap-muka.api";
import { izinGuruApi } from "./izin-guru.api";
import { nilaiApi } from "./nilai.api";
import { ekstrakurikulerApi } from "./ekstrakurikuler.api";
import { bkApi } from "./bk.api";
import { persuratanApi } from "./persuratan.api";
import { persetujuanApi } from "./persetujuan.api";
import { wawasanApi } from "./wawasan.api";
import { pengaturanApi } from "./pengaturan.api";
import {
  wilayahApi,
  penugasanJabatanApi,
  lembagaApi,
  mutasiApi,
  keanggotaanApi,
} from "./remaining-api";
import { loadStore, resetStore, SIMULATE_ERROR_KEY } from "./store";

import { madrasahMock } from "./madrasah.mock";
import { madrasahApi } from "./madrasah.api";

import { authApi } from "./auth.api";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

/**
 * Single entry point for services — Swaps between Live Backend API (Tahap 2) and Mock (Tahap 1)
 */
export const services = {
  auth: authApi,
  madrasah: USE_MOCK ? madrasahMock : madrasahApi,
  siswa: USE_MOCK ? siswaMock : (siswaApi as unknown as typeof siswaMock),
  referensi: USE_MOCK ? referensiMock : (referensiApi as unknown as typeof referensiMock),
  pegawai: USE_MOCK ? pegawaiMock : (pegawaiApi as unknown as typeof pegawaiMock),
  keanggotaan: USE_MOCK ? keanggotaanMock : (keanggotaanApi as unknown as typeof keanggotaanMock),
  mutasi: USE_MOCK ? mutasiMock : (mutasiApi as unknown as typeof mutasiMock),
  persetujuan: USE_MOCK ? persetujuanMock : persetujuanApi,
  absensi: USE_MOCK ? absensiMock : (absensiApi as unknown as typeof absensiMock),
  jadwal: USE_MOCK ? jadwalMock : (jadwalApi as unknown as typeof jadwalMock),
  persuratan: USE_MOCK ? persuratanMock : (persuratanApi as unknown as typeof persuratanMock),
  wawasan: USE_MOCK ? wawasanMock : wawasanApi,
  sesiTatapMuka: USE_MOCK ? sesiTatapMukaMock : (sesiTatapMukaApi as unknown as typeof sesiTatapMukaMock),
  izinGuru: USE_MOCK ? izinGuruMock : (izinGuruApi as unknown as typeof izinGuruMock),
  pengaturan: USE_MOCK ? pengaturanMock : pengaturanApi,
  wilayah: USE_MOCK ? mockWilayahService : (wilayahApi as unknown as typeof mockWilayahService),
  nilai: USE_MOCK ? mockNilaiService : (nilaiApi as unknown as typeof mockNilaiService),
  ekstrakurikuler: USE_MOCK ? mockEkstrakurikulerService : (ekstrakurikulerApi as unknown as typeof mockEkstrakurikulerService),
  bk: USE_MOCK ? mockBkService : (bkApi as unknown as typeof mockBkService),
  penugasanJabatan: USE_MOCK ? mockPenugasanJabatanService : (penugasanJabatanApi as unknown as typeof mockPenugasanJabatanService),
  lembaga: USE_MOCK ? lembagaMock : (lembagaApi as unknown as typeof lembagaMock),
};

export function getAuditLog() {
  return loadStore().auditLog;
}

export function resetDemoData() {
  return resetStore();
}

export function setSimulateError(enabled: boolean) {
  if (typeof window === "undefined") return;
  if (enabled) window.localStorage.setItem(SIMULATE_ERROR_KEY, "1");
  else window.localStorage.removeItem(SIMULATE_ERROR_KEY);
}

export function isSimulateErrorEnabled() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SIMULATE_ERROR_KEY) === "1";
}

export { maskNik } from "./store";
