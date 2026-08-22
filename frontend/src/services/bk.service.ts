import type { CatatanBk } from "@/types/bk";


export interface BkService {
  getBySiswa(id_siswa: string, requesterId: string): Promise<CatatanBk[]>;
  create(data: Omit<CatatanBk, "id_catatan" | "id_madrasah"> & { id_madrasah?: string }): Promise<CatatanBk>;
  update(id: string, data: Partial<CatatanBk>): Promise<CatatanBk>;
  delete(id: string): Promise<void>;
}
