import type { AbsensiSiswa } from "@/types";

export interface AbsensiService {
  getRekapHarian(id_rombel: string, tanggal: string): Promise<AbsensiSiswa[]>;
}
