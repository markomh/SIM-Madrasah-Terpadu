import type { KomponenNilai, NilaiSiswa } from "@/types/nilai";

export interface NilaiService {
  getKomponen(id_mapel: string): Promise<KomponenNilai[]>;
  getNilai(filter: { id_rombel: string; semester: string; id_mapel?: string }): Promise<NilaiSiswa[]>;
  inputNilai(data: Omit<NilaiSiswa, "id_nilai" | "tanggal_input">): Promise<NilaiSiswa>;
}
