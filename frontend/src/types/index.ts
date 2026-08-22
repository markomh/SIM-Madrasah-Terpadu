export type * from "./madrasah";
export type * from "./mata-pelajaran";
export type * from "./referensi";
export type * from "./siswa";
export type * from "./keanggotaan";
export type * from "./mutasi";
export type * from "./pegawai";
export type * from "./audit";
export type * from "./absensi";
export type * from "./jadwal";
export type * from "./persuratan";
export type * from "./kehadiran-guru";
export type * from "./wilayah";
export type * from "./nilai";
export type * from "./ekstrakurikuler";
export type * from "./bk";
export type * from "./penugasan-jabatan";
export type * from "./lembaga";
export type * from "./orang-tua";

// FE-04 Strict Union Types RBAC
export type AppRole =
  | "Admin Madrasah"
  | "Kepala Madrasah"
  | "Operator Kesiswaan"
  | "Guru BK"
  | "Wali Kelas"
  | "Pembina Ekstrakurikuler"
  | "Pengajar";

export type Capabilities = {
  isAdminMadrasah: boolean;
  isKepalaMadrasah: boolean;
  isOperatorKesiswaan: boolean;
  isGuruBk: boolean;
  isWaliKelas: boolean;
  isPembinaEkstrakurikuler: boolean;
  isPengajarAktif: boolean;
};

import { Pegawai } from "./pegawai";
import { PenugasanJabatan } from "./penugasan-jabatan";

export type AuthUser = Pegawai & {
  capabilities?: Capabilities;
  penugasan_aktif?: PenugasanJabatan[];
};
