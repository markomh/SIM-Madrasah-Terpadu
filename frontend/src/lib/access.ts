import type { PenugasanJabatan, JenisJabatan, Rombel, Ekstrakurikuler, JadwalPelajaran, AuthUser } from "@/types";

export type CapabilityAction = "read" | "create" | "update" | "delete" | "approve" | "export";

export function hasJabatan(idPegawai: string, jenis: JenisJabatan, list?: PenugasanJabatan[]): boolean {
  if (!idPegawai || !Array.isArray(list)) return false;
  return list.some(p => p.id_pegawai === idPegawai && p.jenis_jabatan === jenis && p.status === "Aktif");
}

export const isKepalaMadrasah = (id: string, list?: PenugasanJabatan[]) => hasJabatan(id, "Kepala Madrasah", list);
export const isAdminMadrasah = (id: string, list?: PenugasanJabatan[]) => hasJabatan(id, "Admin Madrasah", list);
export const isOperatorKesiswaan = (id: string, list?: PenugasanJabatan[]) => hasJabatan(id, "Operator Kesiswaan", list);
export const isGuruBk = (id: string, list?: PenugasanJabatan[]) => hasJabatan(id, "Guru BK", list);

export function isWaliKelas(idPegawai: string, rombelList?: Rombel[]): boolean {
  if (!idPegawai || !Array.isArray(rombelList)) return false;
  return rombelList.some(r => r.id_wali_kelas === idPegawai);
}

export function getRombelWaliKelas(idPegawai: string, rombelList?: Rombel[]): Rombel[] {
  if (!idPegawai || !Array.isArray(rombelList)) return [];
  return rombelList.filter(r => r.id_wali_kelas === idPegawai);
}

export function isPembinaEkstrakurikuler(idPegawai: string, ekstraList?: Ekstrakurikuler[]): boolean {
  if (!idPegawai || !Array.isArray(ekstraList)) return false;
  return ekstraList.some(e => e.id_pembina === idPegawai);
}

export function isPengajar(
  idPegawai: string,
  idRombel: string,
  idMapel: string,
  semester: string,
  jadwalList?: JadwalPelajaran[]
): boolean {
  if (!idPegawai || !Array.isArray(jadwalList)) return false;
  return jadwalList.some(
    (j) =>
      j.id_pegawai === idPegawai &&
      j.id_rombel === idRombel &&
      j.id_mapel === idMapel &&
      j.semester === semester
  );
}

export function isPengajarAktif(idPegawai: string, jadwalList?: JadwalPelajaran[]): boolean {
  if (!idPegawai || !Array.isArray(jadwalList)) return false;
  return jadwalList.some((j) => j.id_pegawai === idPegawai);
}

/**
 * Capability-aware Access Model (Page Access -> Data Access -> Action Capability)
 */
export interface UserAccessContext {
  currentUser: AuthUser | null;
  penugasanList?: PenugasanJabatan[];
  rombelList?: Rombel[];
  ekstraList?: Ekstrakurikuler[];
  jadwalList?: JadwalPelajaran[];
}

export function canApprove(ctx: UserAccessContext): boolean {
  const id = ctx.currentUser?.id_pegawai ?? "";
  if (!id) return false;
  const caps = ctx.currentUser?.capabilities;
  if (caps) return caps.isKepalaMadrasah;
  return isKepalaMadrasah(id, ctx.penugasanList);
}

export function canCreate(ctx: UserAccessContext): boolean {
  const id = ctx.currentUser?.id_pegawai ?? "";
  if (!id) return false;
  const caps = ctx.currentUser?.capabilities;
  if (caps) return caps.isAdminMadrasah || caps.isOperatorKesiswaan || caps.isKepalaMadrasah;
  return (
    isAdminMadrasah(id, ctx.penugasanList) ||
    isOperatorKesiswaan(id, ctx.penugasanList) ||
    isKepalaMadrasah(id, ctx.penugasanList)
  );
}

export function canUpdate(ctx: UserAccessContext): boolean {
  return canCreate(ctx);
}

export function canDelete(ctx: UserAccessContext): boolean {
  const id = ctx.currentUser?.id_pegawai ?? "";
  if (!id) return false;
  const caps = ctx.currentUser?.capabilities;
  if (caps) return caps.isAdminMadrasah;
  return isAdminMadrasah(id, ctx.penugasanList);
}

export function canExport(ctx: UserAccessContext): boolean {
  return canCreate(ctx);
}

export function canRead(ctx: UserAccessContext): boolean {
  return !!ctx.currentUser;
}

