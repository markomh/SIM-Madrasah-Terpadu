import type { Ekstrakurikuler, KeanggotaanEkstra, AbsensiEkstra } from "@/types/ekstrakurikuler";

export interface EkstrakurikulerService {
  getAll(filter?: { id_pembina?: string }): Promise<Ekstrakurikuler[]>;
  create(data: Omit<Ekstrakurikuler, "id_ekstra">): Promise<Ekstrakurikuler>;
  update(id_ekstra: string, data: Partial<Ekstrakurikuler>): Promise<Ekstrakurikuler>;
  
  getKeanggotaan(id_ekstra: string): Promise<KeanggotaanEkstra[]>;
  addAnggota(data: Omit<KeanggotaanEkstra, "id_keanggotaan" | "tanggal_mulai" | "tanggal_selesai" | "status">): Promise<KeanggotaanEkstra>;
  removeAnggota(id_keanggotaan: string): Promise<KeanggotaanEkstra>;
  
  getAbsensi(id_ekstra: string, tanggal: string): Promise<AbsensiEkstra[]>;
  catatAbsensi(data: Omit<AbsensiEkstra, "id_absensi_ekstra">): Promise<AbsensiEkstra>;
}
