// Parameter Ekuivalensi JTM dinamis
export type ParameterEkuivalensiJTM = {
  id_parameter: string;
  jenis: string; // "Kepala Madrasah", "Wali Kelas", dll
  nilai_jtm: number;
  periode_berlaku: string; // id_tahun
  sumber_ketentuan: string;
  status: "Aktif" | "Tidak Aktif";
};

// Kuota JTM per mapel per tingkat
export type KuotaJTMKurikulum = {
  id_kuota: string;
  id_kurikulum: string;
  id_tingkat: string;
  id_mapel: string;
  alokasi_jtm: number;
};

// BebanMengajar (Pembagian Tugas Mengajar) sudah ada di types/master-jadwal.ts
// dan secara konseptual identik dengan assignment. Kita re-export atau referensikan saja.
export type { BebanMengajar } from "./master-jadwal";

// Plotting BK / TIK (EVIDENCE REQUIRED: formula ekuivalensi)
export type PlottingBKTIK = {
  id_plotting: string;
  id_pegawai: string;
  id_rombel: string;
  id_tahun: string;
};

// Computed Projection (Read Model) - tidak disimpan di database secara terpisah
export type DetailBebanKerja = {
  id_mapel: string;
  id_rombel: string;
  jtm: number;
};

export type DetailTugasTambahan = {
  jenis: string;
  jtm_ekuivalen: number;
};

export type RekapBebanKerjaGuru = {
  id_pegawai: string;
  nama_guru: string;
  
  // Komponen beban kerja
  jtm_mengajar: number;
  jtm_wali_kelas: number;
  jtm_tugas_tambahan: number;
  jtm_bk_tik: number; // Placeholder (EVIDENCE REQUIRED)
  total_beban_kerja: number;
  
  // Indikator (bukan engine final)
  indikator_beban_24: "Terpenuhi" | "Belum Terpenuhi";
  indikator_linearitas: "Sesuai" | "Tidak Sesuai" | "Belum Dapat Diperiksa"; // EVIDENCE REQUIRED
  
  // Detail
  detail_mengajar: DetailBebanKerja[];
  detail_tugas_tambahan: DetailTugasTambahan[];
};

// Lifecycle SK
export type StatusSK = "DRAFT" | "VALIDASI" | "SIAP_DISAHKAN" | "DISAHKAN";

export type PeriodePembagianTugas = {
  id_periode: string;
  id_tahun: string;
  status_sk: StatusSK;
  tanggal_draft: string | null;
  tanggal_validasi: string | null;
  tanggal_pengesahan: string | null;
  catatan: string | null;
};
