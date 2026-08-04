import type { Pegawai } from "@/types";

export type PegawaiFilter = {
  query?: string;
  tugas_utama?: "Guru" | "Tendik";
};

export type PegawaiService = {
  getAll(filter?: PegawaiFilter): Promise<Pegawai[]>;
  getById(id_pegawai: string): Promise<Pegawai | null>;
  getByTugasUtama(tugas_utama: "Guru" | "Tendik"): Promise<Pegawai[]>;
};
