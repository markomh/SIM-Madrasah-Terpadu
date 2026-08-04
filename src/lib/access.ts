import type { PenugasanJabatan, JenisJabatan, Rombel, Ekstrakurikuler, JadwalPelajaran } from "@/types";

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

export function isPengajar(idPegawai: string, jadwalList?: JadwalPelajaran[]): boolean {
  if (!idPegawai || !Array.isArray(jadwalList)) return false;
  return jadwalList.some(j => j.id_pegawai === idPegawai);
}

