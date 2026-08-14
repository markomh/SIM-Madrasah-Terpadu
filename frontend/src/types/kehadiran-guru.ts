export type StatusKehadiranGuru =
  | "Tepat Waktu"
  | "Terlambat"
  | "Digantikan Terjadwal"
  | "Digantikan Mendadak"
  | "Tidak Terlaksana";
export type JenisIzin = "Direncanakan H-1" | "Mendesak-Darurat";

export type SesiTatapMuka = {
  id_sesi: string;
  id_jadwal: string;
  tanggal: string;
  id_pegawai_pelaksana: string | null;
  waktu_input: string | null;
  is_guru_pengganti: boolean;       // read-only, dihitung sistem — jangan diinput manual di form
  id_izin_terkait: string | null;   // FK ke IzinGuru
  jurnal_materi: string | null;
  status_kehadiran_guru: StatusKehadiranGuru; // read-only, dihitung sistem
};

export type SaluranPelaporan = "Langsung/Tatap Muka" | "WA Pribadi Kepala Madrasah" | "WA Group";
export type StatusRekonsiliasi = "Tepat Waktu" | "Terlambat";

export type IzinGuru = {
  id_izin: string;
  id_pegawai: string;
  tanggal_izin: string;
  jenis_izin: JenisIzin;
  alasan: string;
  id_pegawai_pengganti: string | null;
  saluran_pelaporan: SaluranPelaporan;
  dilaporkan_pada: string;
  status_rekonsiliasi: StatusRekonsiliasi;
  dicatat_oleh: string;
};
