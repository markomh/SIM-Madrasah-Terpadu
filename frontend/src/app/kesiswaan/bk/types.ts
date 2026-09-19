import type { Siswa, Rombel, Pegawai } from "@/types";
import type { CatatanBk, KategoriCatatanBk, TingkatKerahasiaan } from "@/types/bk";

export type BidangLayanan = "Pribadi" | "Sosial" | "Akademik" | "Karir";
export type StatusLayanan = "Proses" | "Selesai";
export type PendekatanLayanan =
  | "Tatap Muka (Individual)"
  | "Bimbingan Kelompok"
  | "Mediasi"
  | "Kunjungan Rumah (Home Visit)";

export interface PelanggaranSiswa {
  id_pelanggaran: string;
  id_siswa: string;
  id_madrasah?: string;
  id_pegawai_pencatat: string;
  tanggal: string;
  kategori: string;
  item_pelanggaran: string;
  bobot_poin: number;
  catatan_kronologi: string;
}

export interface JurnalKonseling {
  id_jurnal: string;
  id_madrasah?: string;
  id_siswa: string;
  id_pegawai_bk: string;
  tanggal: string;
  waktu: string;
  pendekatan: PendekatanLayanan;
  bidang: BidangLayanan;
  topik: string;
  uraian: string;
  tindak_lanjut: string;
  status: StatusLayanan;
  tingkat_kerahasiaan: TingkatKerahasiaan;
}

export interface SuratPanggilanSP {
  id_sp: string;
  id_madrasah?: string;
  id_siswa: string;
  nomor_surat: string;
  tanggal_terbit: string;
  hari_pemanggilan: string;
  tanggal_pemanggilan: string;
  jam_pemanggilan: string;
  ruangan_tujuan: string;
  keperluan: string;
  total_poin_saat_terbit: number;
  status: "Diterbitkan" | "Selesai" | "Dibatalkan";
}

export interface MasterKategoriPelanggaran {
  kategori: string;
  items: {
    nama: string;
    poin: number;
  }[];
}

export const MASTER_PELANGGARAN: MasterKategoriPelanggaran[] = [
  {
    kategori: "Kedisiplinan & Ketertiban",
    items: [
      { nama: "Membolos di jam pelajaran", poin: 20 },
      { nama: "Bolos sekolah satu hari penuh", poin: 25 },
      { nama: "Terlambat masuk sekolah (> 15 menit)", poin: 10 },
      { nama: "Keluar lingkungan sekolah tanpa izin", poin: 15 },
      { nama: "Tidak mengikuti upacara bendera / apel", poin: 10 },
    ],
  },
  {
    kategori: "Kerapian & Atribut",
    items: [
      { nama: "Atribut seragam tidak lengkap (dasi, sabuk, badge, kaos kaki)", poin: 5 },
      { nama: "Memakai seragam tidak sesuai jadwal harian", poin: 5 },
      { nama: "Rambut panjang / tidak rapi / diwarnai (putra)", poin: 10 },
      { nama: "Memakai perhiasan / makeup berlebihan", poin: 5 },
      { nama: "Sepatu tidak sesuai ketentuan sekolah", poin: 5 },
    ],
  },
  {
    kategori: "Etika, Perilaku & Sikap",
    items: [
      { nama: "Mengganggu ketertiban KBM di kelas", poin: 5 },
      { nama: "Bersikap tidak sopan / membangkang instruksi guru", poin: 20 },
      { nama: "Menggunakan ponsel saat jam pelajaran tanpa izin", poin: 10 },
      { nama: "Membuang sampah sembarangan / merusak fasilitas", poin: 15 },
      { nama: "Berkelahi / terlibat pertikaian fisik di sekolah", poin: 40 },
      { nama: "Melakukan perundungan (bullying) verbal / fisik", poin: 50 },
      { nama: "Merokok / membawa rokok atau vape di sekolah", poin: 50 },
    ],
  },
  {
    kategori: "Pelanggaran Berat & Kriminalitas",
    items: [
      { nama: "Membawa senjata tajam atau benda berbahaya", poin: 75 },
      { nama: "Melakukan pencurian atau pemerasan di sekolah", poin: 75 },
      { nama: "Membawa / mengedarkan konten asusila", poin: 75 },
      { nama: "Penyalahgunaan narkoba / zat adiktif", poin: 100 },
    ],
  },
];

export interface KonseliDetail extends Siswa {
  id_rombel: string;
  nama_rombel: string;
  nama_wali_kelas: string;
  total_poin: number;
  kasus_terakhir: string | null;
  tanggal_kasus_terakhir: string | null;
  jumlah_layanan: number;
  riwayat_pelanggaran: PelanggaranSiswa[];
  riwayat_konseling: JurnalKonseling[];
  riwayat_sp: SuratPanggilanSP[];
  data_ortu?: {
    nama_ayah?: string;
    pekerjaan_ayah?: string;
    penghasilan_ayah?: string;
    nama_ibu?: string;
    pekerjaan_ibu?: string;
    no_hp_ortu?: string;
    alamat?: string;
  };
}
