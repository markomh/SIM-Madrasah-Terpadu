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
import { loadStore, resetStore, SIMULATE_ERROR_KEY } from "./store";

/** Single entry point — Stage 2 swaps mock implementations here. */
export const services = {
  siswa: siswaMock,
  referensi: referensiMock,
  pegawai: pegawaiMock,
  keanggotaan: keanggotaanMock,
  mutasi: mutasiMock,
  persetujuan: persetujuanMock,
  absensi: absensiMock,
  jadwal: jadwalMock,
  persuratan: persuratanMock,
  wawasan: wawasanMock,
  sesiTatapMuka: sesiTatapMukaMock,
  izinGuru: izinGuruMock,
  pengaturan: pengaturanMock,
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
