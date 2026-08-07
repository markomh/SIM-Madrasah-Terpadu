import type { Surat } from "@/types";

export interface PersuratanService {
  getAll(filter?: { status?: string; jenis_surat?: string }): Promise<Surat[]>;
  create(data: Omit<Surat, "id_surat" | "status" | "id_penandatangan" | "tanggal_surat" | "meta_penandatangan">): Promise<Surat>;
  requestSign(id_surat: string, id_penandatangan: string): Promise<Surat>;
  sign(id_surat: string, id_penandatangan: string): Promise<Surat>;
  generateAiDraft(instruksi: string, dibuat_oleh: string): Promise<Surat>;
}
