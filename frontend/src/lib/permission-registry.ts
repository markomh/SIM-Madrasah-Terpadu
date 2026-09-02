// AUTO-GENERATED dari contract_matrix.csv — JANGAN edit manual.
// Regenerate: `node scripts/generate-permission-registry.mjs`

export type PermissionKey =
  | "core.view_dashboard"
  | "persetujuan.approve_reject_pindah_rombel"
  | "persetujuan.approve_reject_mutasi"
  | "kesiswaan.crud_siswa"
  | "kesiswaan.kenaikan_kelas.view"
  | "kesiswaan.process_execute_kenaikan_kelas"
  | "kesiswaan.submit_pindah_rombel_request"
  | "kesiswaan.submit_mutasi"
  | "akademik.view_crud_jadwal"
  | "akademik.submit_batch_attendance"
  | "akademik.input_nilai"
  | "kepegawaian.crud_pegawai_hr_nik_data_"
  | "kepegawaian.record_izin_guru"
  | "kepegawaian.manage_kedisiplinan"
  | "ekstrakurikuler.crud_ekskul_keanggotaan_absensi"
  | "bk.crud_catatan_bk"
  | "bk.read_catatan_bk_with_tingkat_kerahasiaan_rahasia"
  | "persuratan.create_manage_surat"
  | "persuratan (sub-feature).create_surat_template"
  | "wawasan.view_ai_insights"
  | "referensi.crud_tahun_ajaran_mata_pelajaran_tingkat_hari_libur_activate_tahun_ajaran"
  | "referensi.read_provinsi_kabupaten_kecamatan_desa"
  | "akun.assign_revoke_jabatan_privilege_grant_";

export const PERMISSION_REGISTRY: Record<PermissionKey, {
  roles: string[];
  makerChecker?: "maker" | "checker" | "approver" | null;
  uiClass: "executive" | "operational" | "scoped_contributor" | "shared";
}> = {
  "core.view_dashboard": {
    roles: ["Admin","Kamad","Operator","Guru BK","Wali Kelas","is_pengajar_aktif"],
    makerChecker: null,
    uiClass: "shared",
  },
  "persetujuan.approve_reject_pindah_rombel": {
    roles: ["Kepala Madrasah"],
    makerChecker: "approver",
    uiClass: "executive",
  },
  "persetujuan.approve_reject_mutasi": {
    roles: ["Kepala Madrasah"],
    makerChecker: "approver",
    uiClass: "executive",
  },
  "kesiswaan.crud_siswa": {
    roles: ["Admin","Kamad","Operator","Wali Kelas","Guru BK"],
    makerChecker: null,
    uiClass: "shared",
  },
  "kesiswaan.kenaikan_kelas.view": {
    roles: ["Admin","Operator","Kamad"],
    makerChecker: null,
    uiClass: "shared",
  },
  "kesiswaan.process_execute_kenaikan_kelas": {
    roles: ["Admin","Operator","Kamad"],
    makerChecker: null,
    uiClass: "shared",
  },
  "kesiswaan.submit_pindah_rombel_request": {
    roles: ["Admin","Kamad","Operator","Wali Kelas","Guru BK"],
    makerChecker: "maker",
    uiClass: "operational",
  },
  "kesiswaan.submit_mutasi": {
    roles: ["Admin","Kamad","Operator","Wali Kelas","Guru BK"],
    makerChecker: "maker",
    uiClass: "operational",
  },
  "akademik.view_crud_jadwal": {
    roles: ["Admin","Kamad","Wali Kelas","is_pengajar_aktif"],
    makerChecker: null,
    uiClass: "shared",
  },
  "akademik.submit_batch_attendance": {
    roles: ["Admin","Kamad","Wali Kelas","is_pengajar_aktif"],
    makerChecker: null,
    uiClass: "shared",
  },
  "akademik.input_nilai": {
    roles: ["Admin","Kamad","Wali Kelas","is_pengajar_aktif"],
    makerChecker: null,
    uiClass: "shared",
  },
  "kepegawaian.crud_pegawai_hr_nik_data_": {
    roles: ["Admin","Kamad"],
    makerChecker: null,
    uiClass: "shared",
  },
  "kepegawaian.record_izin_guru": {
    roles: ["Admin","Kamad"],
    makerChecker: null,
    uiClass: "shared",
  },
  "kepegawaian.manage_kedisiplinan": {
    roles: ["Admin","Kamad"],
    makerChecker: null,
    uiClass: "shared",
  },
  "ekstrakurikuler.crud_ekskul_keanggotaan_absensi": {
    roles: ["Admin","Pembina Ekstrakurikuler"],
    makerChecker: null,
    uiClass: "shared",
  },
  "bk.crud_catatan_bk": {
    roles: ["Kamad","Guru BK"],
    makerChecker: null,
    uiClass: "scoped_contributor",
  },
  "bk.read_catatan_bk_with_tingkat_kerahasiaan_rahasia": {
    roles: ["Kamad","Guru BK"],
    makerChecker: null,
    uiClass: "shared",
  },
  "persuratan.create_manage_surat": {
    roles: ["Admin","Operator","Kamad"],
    makerChecker: null,
    uiClass: "shared",
  },
  "persuratan (sub-feature).create_surat_template": {
    roles: ["Admin","Operator","Kamad"],
    makerChecker: null,
    uiClass: "shared",
  },
  "wawasan.view_ai_insights": {
    roles: ["Admin","Kamad","Wali Kelas"],
    makerChecker: null,
    uiClass: "shared",
  },
  "referensi.crud_tahun_ajaran_mata_pelajaran_tingkat_hari_libur_activate_tahun_ajaran": {
    roles: ["Admin"],
    makerChecker: null,
    uiClass: "shared",
  },
  "referensi.read_provinsi_kabupaten_kecamatan_desa": {
    roles: ["Admin"],
    makerChecker: null,
    uiClass: "shared",
  },
  "akun.assign_revoke_jabatan_privilege_grant_": {
    roles: ["Admin"],
    makerChecker: null,
    uiClass: "shared",
  },
};
