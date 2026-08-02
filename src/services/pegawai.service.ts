import type { Pegawai, Peran } from "@/types";

export interface PegawaiService {
  getAll(filter?: { peran?: Peran; query?: string }): Promise<Pegawai[]>;
  getById(id_pegawai: string): Promise<Pegawai | null>;
  getByPeran(peran: Peran): Promise<Pegawai[]>;
}
