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
import { bebanMengajarMock, ketersediaanGuruMock, ruangFasilitasMock } from "./master-jadwal.mock";

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
import { wilayahApi } from "./wilayah.api";
import { penugasanJabatanApi } from "./penugasan-jabatan.api";
import { lembagaApi } from "./lembaga.api";
import { mutasiApi } from "./mutasi.api";
import { keanggotaanApi } from "./keanggotaan.api";
import { bebanMengajarApi, ketersediaanGuruApi, ruangFasilitasApi } from "./master-jadwal.api";
import { penugasanDomainApi } from "./penugasan-domain.api";
import { mockPenugasanDomainService } from "./penugasan-domain.mock";
import { loadStore, resetStore, SIMULATE_ERROR_KEY } from "./store";

import { madrasahMock } from "./madrasah.mock";
import { madrasahApi } from "./madrasah.api";

import { authApi } from "./auth.api";

import { AbsensiService } from "./absensi.service";
import { JadwalService } from "./jadwal.service";
import { PersuratanService } from "./persuratan.service";
import { SesiTatapMukaService } from "./sesi-tatap-muka.service";
import { IzinGuruService } from "./izin-guru.service";
import { WilayahService } from "./wilayah.service";
import { NilaiService } from "./nilai.service";
import { EkstrakurikulerService } from "./ekstrakurikuler.service";
import { penugasanJabatanService } from "./penugasan-jabatan.service";
import { LembagaServiceInterface } from "./lembaga.service";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

/**
 * Single entry point for services — Swaps between Live Backend API (Tahap 2) and Mock (Tahap 1)
 */
export const services = {
  auth: authApi,
  madrasah: USE_MOCK ? madrasahMock : madrasahApi,
  siswa: USE_MOCK ? siswaMock : siswaApi,
  referensi: USE_MOCK ? referensiMock : referensiApi,
  pegawai: USE_MOCK ? pegawaiMock : pegawaiApi,
  keanggotaan: USE_MOCK ? keanggotaanMock : keanggotaanApi,
  mutasi: USE_MOCK ? mutasiMock : mutasiApi,
  persetujuan: USE_MOCK ? persetujuanMock : persetujuanApi,
  absensi: USE_MOCK ? (absensiMock as AbsensiService) : (absensiApi as AbsensiService),
  jadwal: USE_MOCK ? (jadwalMock as JadwalService) : (jadwalApi as JadwalService),
  persuratan: USE_MOCK ? (persuratanMock as PersuratanService) : (persuratanApi as PersuratanService),
  wawasan: USE_MOCK ? wawasanMock : wawasanApi,
  sesiTatapMuka: USE_MOCK ? (sesiTatapMukaMock as SesiTatapMukaService) : (sesiTatapMukaApi as SesiTatapMukaService),
  izinGuru: USE_MOCK ? (izinGuruMock as IzinGuruService) : (izinGuruApi as IzinGuruService),
  pengaturan: USE_MOCK ? pengaturanMock : pengaturanApi,
  wilayah: USE_MOCK ? (mockWilayahService as WilayahService) : (wilayahApi as WilayahService),
  nilai: USE_MOCK ? (mockNilaiService as NilaiService) : (nilaiApi as NilaiService),
  ekstrakurikuler: USE_MOCK ? (mockEkstrakurikulerService as EkstrakurikulerService) : (ekstrakurikulerApi as EkstrakurikulerService),
  bk: USE_MOCK ? mockBkService : bkApi,
  penugasanJabatan: USE_MOCK ? (mockPenugasanJabatanService as typeof penugasanJabatanService) : (penugasanJabatanApi as typeof penugasanJabatanService),
  lembaga: USE_MOCK ? (lembagaMock as LembagaServiceInterface) : (lembagaApi as LembagaServiceInterface),
  bebanMengajar: USE_MOCK ? bebanMengajarMock : bebanMengajarApi,
  ketersediaanGuru: USE_MOCK ? ketersediaanGuruMock : ketersediaanGuruApi,
  ruangFasilitas: USE_MOCK ? ruangFasilitasMock : ruangFasilitasApi,
  penugasanDomain: USE_MOCK ? mockPenugasanDomainService : penugasanDomainApi,
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
