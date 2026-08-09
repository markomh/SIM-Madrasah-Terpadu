import type { Surat } from "@/types";

export interface PersuratanService {
  getAll(filter?: { status?: string; jenis_surat?: string }): Promise<Surat[]>;
  create(data: Omit<Surat, "id_surat" | "status" | "id_penandatangan" | "tanggal_surat" | "meta_penandatangan">): Promise<Surat>;
  requestSign(id_surat: string, id_penandatangan: string): Promise<Surat>;
  sign(id_surat: string, id_penandatangan: string): Promise<Surat>;
  generateAiDraft(instruksi: string, dibuat_oleh: string): Promise<Surat>;

  /** Membangun draft Surat dari template + placeholder, TANPA menyimpan ke store.
   *  Dipakai untuk preview sebelum aksi final (mis. pratinjau SKP sebelum disetujui). */
  buildDraftFromTemplate(params: {
    kodeTemplate: string;
    placeholders: Record<string, string>;
    perihal: string;
    jenisSurat: string;
    idSiswaTerkait?: string | null;
    idPegawaiTerkait?: string | null;
    tujuanSurat?: string;
    dibuatOleh: string;
  }): Promise<Surat>;

  /** Membuat surat DAN langsung menandatangani dalam satu transaksi —
   *  untuk kasus approve+sign sekaligus seperti SKP mutasi. Nomor surat & snapshot
   *  penandatangan WAJIB memakai logika yang sama persis dengan create()+sign() biasa. */
  createAndSign(params: {
    kodeTemplate: string;
    placeholders: Record<string, string>;
    perihal: string;
    jenisSurat: string;
    idSiswaTerkait?: string | null;
    idPegawaiTerkait?: string | null;
    tujuanSurat?: string;
    dibuatOleh: string;
    idPenandatangan: string;
  }): Promise<Surat>;
}
