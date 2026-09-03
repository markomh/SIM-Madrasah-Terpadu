import { useAuth } from "@/components/auth-context";
import type { PermissionKey } from "@/lib/permission-registry";
import {
  isAdminMadrasah,
  isKepalaMadrasah,
  isOperatorKesiswaan,
  isGuruBk,
  isWaliKelas,
  isPembinaEkstrakurikuler,
  isPengajarAktif,
} from "@/lib/access";

export function usePermission(key: PermissionKey): boolean {
  const ctx = useAuth();
  const user = ctx.currentUser;
  if (!user) return false;

  const id = user.id_pegawai;
  const caps = user.capabilities;

  const admin = caps?.isAdminMadrasah ?? isAdminMadrasah(id, ctx.penugasanList);
  const kamad = caps?.isKepalaMadrasah ?? isKepalaMadrasah(id, ctx.penugasanList);
  const ops = caps?.isOperatorKesiswaan ?? isOperatorKesiswaan(id, ctx.penugasanList);
  const bk = caps?.isGuruBk ?? isGuruBk(id, ctx.penugasanList);
  const wali = caps?.isWaliKelas ?? isWaliKelas(id, ctx.rombelList);
  const pembina = caps?.isPembinaEkstrakurikuler ?? isPembinaEkstrakurikuler(id, ctx.ekstraList);
  const pengajar = caps?.isPengajarAktif ?? isPengajarAktif(id, ctx.jadwalList);

  switch (key) {
    case "core.view_dashboard":
      return true;
    case "persetujuan.approve_reject_pindah_rombel":
    case "persetujuan.approve_reject_mutasi":
      return kamad;
    case "kesiswaan.crud_siswa":
    case "kesiswaan.kenaikan_kelas.view":
    case "kesiswaan.process_execute_kenaikan_kelas":
    case "kesiswaan.submit_pindah_rombel_request":
    case "kesiswaan.submit_mutasi":
      return admin || ops || kamad || wali || bk;
    case "akademik.view_crud_jadwal":
    case "akademik.submit_batch_attendance":
    case "akademik.input_nilai":
      return admin || kamad || wali || pengajar;
    case "kepegawaian.crud_pegawai_hr_nik_data_":
    case "kepegawaian.record_izin_guru":
    case "kepegawaian.manage_kedisiplinan":
      return admin || kamad;
    case "ekstrakurikuler.crud_ekskul_keanggotaan_absensi":
      return admin || pembina;
    case "bk.crud_catatan_bk":
    case "bk.read_catatan_bk_with_tingkat_kerahasiaan_rahasia":
      return kamad || bk;
    case "persuratan.create_manage_surat":
    case "persuratan (sub-feature).create_surat_template":
      return admin || ops || kamad;
    case "wawasan.view_ai_insights":
      return admin || kamad || wali;
    case "referensi.crud_tahun_ajaran_mata_pelajaran_tingkat_hari_libur_activate_tahun_ajaran":
    case "referensi.read_provinsi_kabupaten_kecamatan_desa":
    case "akun.assign_revoke_jabatan_privilege_grant_":
      return admin;
    default:
      return false;
  }
}
