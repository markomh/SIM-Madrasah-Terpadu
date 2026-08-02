import type { Surat } from "@/types";

export interface PersuratanService {
  getAll(): Promise<Surat[]>;
  create(data: Omit<Surat, "id_surat" | "nomor_surat" | "status" | "ditandatangani_oleh" | "tanggal_dibuat">): Promise<Surat>;
  requestSign(id_surat: string): Promise<Surat>;
  sign(id_surat: string, ditandatangani_oleh: string): Promise<Surat>;
  generateAiDraft(instruksi: string, dibuat_oleh: string): Promise<Surat>;
}
