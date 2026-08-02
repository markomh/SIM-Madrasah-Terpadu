export type StatusSurat = "Draft" | "Menunggu Tanda Tangan" | "Ditandatangani" | "Ditolak";

export type Surat = {
  id_surat: string;
  nomor_surat: string;
  judul: string;
  jenis: string;
  status: StatusSurat;
  dibuat_oleh: string;
  ditandatangani_oleh: string | null;
  tanggal_dibuat: string;
  isi_ringkas: string;
  hasil_ai: boolean;
};
