export type JenjangMadrasah = "MI" | "MTs" | "MA" | "MAK";
export type StatusAkreditasi = "A" | "B" | "C" | "Belum Akreditasi";

export type ProfilMadrasah = {
  id_profil: string;
  npsn: string;
  nsm: string;
  nama_madrasah: string;
  jenjang: JenjangMadrasah;
  status_akreditasi: StatusAkreditasi;
  /** Teks alamat lengkap + nama kota/kab untuk titi mangsa surat */
  alamat: string;
  /** Digunakan untuk penulisan titi mangsa surat, mis: "Mataram, 5 Agustus 2026" */
  kabupaten_kota: string;
  id_desa: string | null;
  telepon: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  /**
   * FK ke id_pegawai yang sedang menjabat Kepala Madrasah (dari penugasan_jabatan).
   * Null jika Kamad adalah PLT/Pjs dari luar yang tidak terdaftar di tabel pegawai.
   * Saat diisi, gunakan data dari pegawai; fallback ke nama_kepala_madrasah string.
   */
  id_kepala_madrasah: string | null;
  /** Fallback/override string untuk Kamad PLT/Pjs luar yang belum terdaftar di pegawai */
  nama_kepala_madrasah: string | null;
  nip_kepala_madrasah: string | null;
};

export type TemplateSurat = {
  id_template: string;
  kode_template: string;    // aligned with backend DDL unique key, e.g. "SK-AKTIF", "ST-TUGAS"
  nama_template: string;
  kategori: string;         // "Keterangan", "Tugas", "Keputusan", "Rekomendasi"
  header_html: string | null;
  /** @alias format_html — template body dengan variabel {{NAMA_SISWA}}, {{NISN}}, dll */
  body_template: string;
  /** @deprecated use body_template. Kept as alias for backward compat with mock components */
  format_html: string;
  /** Array nama variabel placeholder yang WAJIB diisi sebelum diterbitkan */
  variabel_placeholder: string[];
  /** @deprecated use variabel_placeholder */
  variabel_dibutuhkan: string[];
  aktif: boolean;
};
