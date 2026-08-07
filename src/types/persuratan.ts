/**
 * StatusSurat — aligned with backend DDL enum.
 * @note "Draft" is kept as alias for "Draf" for mock backward compat.
 */
export type StatusSurat =
  | "Draf"
  | "Menunggu TTD"
  | "Diterbitkan"
  | "Ditolak"
  | "Diarsipkan"
  | "Draft"                  // @deprecated alias -> "Draf"
  | "Menunggu Tanda Tangan"  // @deprecated alias -> "Menunggu TTD"
  | "Ditandatangani";        // @deprecated alias -> "Diterbitkan"

/**
 * Snapshot penandatangan — diisi SAAT tombol "Tandatangani" diklik.
 * Data ini TIDAK boleh diambil ulang dari live pegawai setelah tersimpan
 * (kekekalan arsip hukum: pergantian Kamad tidak merusak arsip lama).
 */
export type MetaPenandatangan = {
  id_pegawai: string;
  nama: string;
  nip: string | null;
  jabatan: string;
  tanggal_ttd: string; // ISO date string
  hash_esign?: string | null; // diisi backend saat dokumen resmi diterbitkan
};

export type Surat = {
  id_surat: string;
  nomor_surat: string;
  /** Judul singkat surat — aligned dengan kolom `perihal` di backend DDL */
  perihal: string;
  /** @deprecated use perihal */
  judul?: string;
  /** Kategorisasi surat — fallback ad-hoc jika id_template null */
  jenis_surat: string;
  /** @deprecated use jenis_surat */
  jenis?: string;
  id_template: string | null;
  tanggal_surat: string; // ISO date string
  tujuan_surat: string;
  /** Isi lengkap surat (HTML/teks) */
  isi_surat: string;
  /** @deprecated use isi_surat */
  isi_ringkas?: string;
  status: StatusSurat;
  /** id_pegawai pembuat surat — padanan FK dibuat_oleh di DDL */
  dibuat_oleh: string;
  /**
   * FK eksplisit ke id_pegawai yang ditunjuk untuk menandatangani.
   * Diisi saat status berubah ke "Menunggu TTD". Memungkinkan query
   * efisien "daftar surat menunggu TTD saya" tanpa parsing JSON.
   */
  id_penandatangan: string | null;
  /** @deprecated use id_penandatangan */
  ditandatangani_oleh?: string | null;
  /** FK opsional ke id_siswa jika surat terkait siswa (mis. SK Aktif) */
  id_siswa_terkait: string | null;
  /** FK opsional ke id_pegawai jika surat terkait pegawai (mis. Surat Tugas) */
  id_pegawai_terkait: string | null;
  /** Flag apakah draf surat dihasilkan dengan bantuan AI */
  hasil_ai: boolean;
  /** Snapshot identitas Kamad yang menandatangani — diisi saat sign(), tidak berubah setelahnya */
  meta_penandatangan: MetaPenandatangan | null;
};
