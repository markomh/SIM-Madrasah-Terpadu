import type { IzinGuru } from "@/types";
import type { IzinGuruService } from "./izin-guru.service";
import { mutateStore, loadStore, createId, maybeThrowSimulatedError, simulateLatency, nowIso } from "./store";

export const izinGuruMock: IzinGuruService = {
  async getAll(filter) {
    maybeThrowSimulatedError();
    await simulateLatency();
    const store = loadStore();
    let result = store.izinGuru;
    
    if (filter?.id_pegawai) {
      result = result.filter(i => i.id_pegawai === filter.id_pegawai);
    }
    if (filter?.tanggal_izin) {
      result = result.filter(i => i.tanggal_izin === filter.tanggal_izin);
    }
    
    // Sort descending by tanggal_izin
    return result.sort((a, b) => new Date(b.tanggal_izin).getTime() - new Date(a.tanggal_izin).getTime());
  },

  async create(data) {
    maybeThrowSimulatedError();
    await simulateLatency();
    
    let newIzin: IzinGuru | null = null;
    
    mutateStore((store) => {
      // Hitung status rekonsiliasi
      // Terlambat jika > 1x24 jam dari tanggal_izin (Asumsi pukul 00:00 tanggal izin dibanding dilaporkan_pada)
      const tanggalIzinObj = new Date(data.tanggal_izin);
      const dilaporkanPadaObj = new Date(data.dilaporkan_pada);
      const selisihJam = (dilaporkanPadaObj.getTime() - tanggalIzinObj.getTime()) / (1000 * 3600);
      
      const status_rekonsiliasi = selisihJam > 24 ? "Terlambat" : "Tepat Waktu";
      
      newIzin = {
        id_izin: createId("iz"),
        ...data,
        status_rekonsiliasi
      };
      
      store.izinGuru.push(newIzin);
      
      // Rekonsiliasi retroaktif sesi_tatap_muka
      for (const sesi of store.sesiTatapMuka) {
        if (sesi.tanggal === data.tanggal_izin) {
          const jadwal = store.jadwal.find(j => j.id_jadwal === sesi.id_jadwal);
          if (jadwal && jadwal.id_pegawai === data.id_pegawai) {
            if (sesi.status_kehadiran_guru === "Digantikan Mendadak") {
              sesi.status_kehadiran_guru = "Digantikan Terjadwal";
              sesi.id_izin_terkait = newIzin.id_izin;
            }
          }
        }
      }
      
      store.auditLog.push({
        id_log: createId("au"),
        id_user: data.dicatat_oleh,
        nama_tabel: "izin_guru",
        id_record: newIzin.id_izin,
        aksi: "Create",
        timestamp: nowIso(),
      });
    });

    return newIzin!;
  }
};
