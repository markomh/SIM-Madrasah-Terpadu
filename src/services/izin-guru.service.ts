import type { IzinGuru } from "@/types";

export interface IzinGuruService {
  getAll(filter?: { id_pegawai?: string; tanggal_izin?: string; }): Promise<IzinGuru[]>;
  create(data: Omit<IzinGuru, "id_izin" | "status_rekonsiliasi">): Promise<IzinGuru>;
}
