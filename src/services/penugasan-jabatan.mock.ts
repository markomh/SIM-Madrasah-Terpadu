import type { PenugasanJabatan } from "@/types";
import { loadStore, mutateStore } from "./store";
import { simulateLatency } from "./store";

export async function getAllPenugasan(): Promise<PenugasanJabatan[]> {
  await simulateLatency();
  return loadStore().penugasanJabatan;
}

export async function getPenugasanByPegawai(idPegawai: string): Promise<PenugasanJabatan[]> {
  await simulateLatency();
  return loadStore().penugasanJabatan.filter((p) => p.id_pegawai === idPegawai);
}

export async function createPenugasan(data: Omit<PenugasanJabatan, "id_penugasan" | "status" | "tanggal_selesai">): Promise<PenugasanJabatan> {
  await simulateLatency();
  return mutateStore((store) => {
    const id = `pj_${Math.random().toString(36).slice(2, 8)}`;
    const newItem: PenugasanJabatan = {
      ...data,
      id_penugasan: id,
      status: "Aktif",
      tanggal_selesai: null,
    };
    store.penugasanJabatan.push(newItem);
    return newItem;
  }) as unknown as PenugasanJabatan;
}

export async function akhiriPenugasan(idPenugasan: string, tanggalSelesai: string): Promise<void> {
  await simulateLatency();
  mutateStore((store) => {
    const item = store.penugasanJabatan.find((p) => p.id_penugasan === idPenugasan);
    if (item) {
      item.status = "Berakhir";
      item.tanggal_selesai = tanggalSelesai;
    }
  });
}

export const mockPenugasanJabatanService = {
  getAll: getAllPenugasan,
  getByPegawai: getPenugasanByPegawai,
  create: createPenugasan,
  akhiri: akhiriPenugasan,
};
