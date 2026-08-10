import type { KomponenNilai, NilaiSiswa } from "@/types/nilai";

export interface NilaiService {
  getKomponen(id_mapel: string): Promise<KomponenNilai[]>;
  addKomponen(data: Omit<KomponenNilai, "id_komponen">): Promise<KomponenNilai>;
  updateKomponen(id_komponen: string, data: Partial<KomponenNilai>): Promise<KomponenNilai>;
  deleteKomponen(id_komponen: string): Promise<void>;
  getNilai(filter: { id_rombel: string; semester: string; id_mapel?: string }): Promise<NilaiSiswa[]>;
  inputNilai(data: Omit<NilaiSiswa, "id_nilai" | "tanggal_input">): Promise<NilaiSiswa>;
  batchInputNilai(entries: Omit<NilaiSiswa, "id_nilai" | "tanggal_input">[]): Promise<NilaiSiswa[]>;
}
