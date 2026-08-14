import type { Madrasah } from "@/types";
import type { MadrasahService } from "./madrasah.service";
import { loadStore, simulateLatency } from "./store";

export const madrasahMock: MadrasahService = {
  async getCurrent(): Promise<Madrasah> {
    await simulateLatency();
    const store = loadStore();
    return (
      store.madrasah[0] ?? {
        id_madrasah: "md_1",
        nama_madrasah: "MTs Terpadu Nusantara",
        npsn: "10892345",
        alamat: "Jl. Pendidikan No. 123, Kompleks Islamic Center",
        id_desa: "desa_1",
        status_aktif: true,
      }
    );
  },
};
