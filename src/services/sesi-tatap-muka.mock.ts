import type { SesiTatapMuka, AbsensiSiswa, StatusKehadiranGuru } from "@/types";
import type { SesiTatapMukaService, RekapKehadiranDetail } from "./sesi-tatap-muka.service";
import { mutateStore, loadStore, createId, maybeThrowSimulatedError, simulateLatency, nowIso } from "./store";

const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export const sesiTatapMukaMock: SesiTatapMukaService = {
  async getByRombelTanggal(id_rombel, tanggal) {
    maybeThrowSimulatedError();
    await simulateLatency();
    const store = loadStore();
    
    const dateObj = new Date(tanggal);
    const dayName = dayNames[dateObj.getDay()];
    
    // Cari jadwal untuk rombel ini di hari tersebut
    const jadwalHariIni = store.jadwal.filter(j => j.id_rombel === id_rombel && j.hari === dayName);
    
    // Pastikan semua sesi untuk jadwal hari ini sudah ter-inisialisasi
    const sesiList: SesiTatapMuka[] = [];
    
    let isMutated = false;
    mutateStore((mutStore) => {
      for (const jadwal of jadwalHariIni) {
        let sesi = mutStore.sesiTatapMuka.find(s => s.id_jadwal === jadwal.id_jadwal && s.tanggal === tanggal);
        if (!sesi) {
          sesi = {
            id_sesi: createId("st"),
            id_jadwal: jadwal.id_jadwal,
            tanggal,
            id_pegawai_pelaksana: null,
            waktu_input: null,
            is_guru_pengganti: false,
            id_izin_terkait: null,
            status_kehadiran_guru: "Tidak Terlaksana",
            jurnal_materi: null,
          };
          mutStore.sesiTatapMuka.push(sesi);
          isMutated = true;
        }
        sesiList.push(sesi);
      }
    });

    if (!isMutated) {
      return sesiList;
    }
    
    return loadStore().sesiTatapMuka.filter(s => 
      s.tanggal === tanggal && jadwalHariIni.some(j => j.id_jadwal === s.id_jadwal)
    );
  },

  async catatPresensi(id_sesi, id_pegawai_pelaksana, absensiSiswa, jurnal_materi) {
    maybeThrowSimulatedError();
    await simulateLatency();
    
    let updatedSesi: SesiTatapMuka | null = null;
    mutateStore((store) => {
      const sesi = store.sesiTatapMuka.find(s => s.id_sesi === id_sesi);
      if (!sesi) throw new Error("Sesi tidak ditemukan");
      
      const jadwal = store.jadwal.find(j => j.id_jadwal === sesi.id_jadwal);
      if (!jadwal) throw new Error("Jadwal tidak ditemukan");

      sesi.id_pegawai_pelaksana = id_pegawai_pelaksana;
      sesi.waktu_input = nowIso();
      sesi.jurnal_materi = jurnal_materi;
      
      const isGuruPengganti = id_pegawai_pelaksana !== jadwal.id_pegawai;
      sesi.is_guru_pengganti = isGuruPengganti;
      
      if (!isGuruPengganti) {
        // Cek keterlambatan
        const [jam, menit] = jadwal.jam_mulai.split(":").map(Number);
        const waktuSeharusnya = new Date(sesi.tanggal);
        waktuSeharusnya.setHours(jam, menit, 0, 0);
        
        const waktuInput = new Date(sesi.waktu_input);
        const selisihMenit = (waktuInput.getTime() - waktuSeharusnya.getTime()) / 60000;
        
        if (selisihMenit > store.pengaturan.ambangToleransiTerlambatMenit) {
          sesi.status_kehadiran_guru = "Terlambat";
        } else {
          sesi.status_kehadiran_guru = "Tepat Waktu";
        }
        sesi.id_izin_terkait = null;
      } else {
        // Cek izin guru
        const izin = store.izinGuru.find(i => i.id_pegawai === jadwal.id_pegawai && i.tanggal_izin === sesi.tanggal);
        if (izin) {
          sesi.id_izin_terkait = izin.id_izin;
          sesi.status_kehadiran_guru = "Digantikan Terjadwal";
        } else {
          sesi.id_izin_terkait = null;
          sesi.status_kehadiran_guru = "Digantikan Mendadak";
        }
      }
      
      // Simpan absensi siswa
      for (const abs of absensiSiswa) {
        // Hapus absensi sebelumnya jika ada
        const existingIdx = store.absensi.findIndex(a => a.id_siswa === abs.id_siswa && a.id_sesi === sesi.id_sesi);
        if (existingIdx >= 0) {
          store.absensi.splice(existingIdx, 1);
        }
        
        store.absensi.push({
          id_absensi: createId("ab"),
          tanggal: sesi.tanggal,
          id_siswa: abs.id_siswa,
          id_rombel: abs.id_rombel,
          id_sesi: sesi.id_sesi,
          status: abs.status,
          catatan: abs.catatan ?? null,
        });
      }
      
      store.auditLog.push({
        id_log: createId("au"),
        id_user: id_pegawai_pelaksana,
        nama_tabel: "sesi_tatap_muka",
        id_record: sesi.id_sesi,
        aksi: "Update",
        timestamp: nowIso(),
      });
      
      updatedSesi = sesi;
    });

    return updatedSesi!;
  },

  async getRekapTanggal(tanggal) {
    maybeThrowSimulatedError();
    await simulateLatency();
    const store = loadStore();
    
    const dateObj = new Date(tanggal);
    const dayName = dayNames[dateObj.getDay()];
    
    // Cari semua jadwal di hari ini
    const jadwalHariIni = store.jadwal.filter(j => j.hari === dayName);
    
    const result = {
      terjadwal: jadwalHariIni.length,
      diinput: 0,
      tepatWaktu: 0,
      terlambat: 0,
      digantikan: 0,
      daftarDetail: [] as RekapKehadiranDetail[],
    };
    
    for (const jadwal of jadwalHariIni) {
      const sesi = store.sesiTatapMuka.find(s => s.id_jadwal === jadwal.id_jadwal && s.tanggal === tanggal);
      
      const guruSeharusnya = store.pegawai.find(p => p.id_pegawai === jadwal.id_pegawai);
      const rombel = store.rombel.find(r => r.id_rombel === jadwal.id_rombel);
      const mapel = store.mapel.find(m => m.id_mapel === jadwal.id_mapel);
      
      let namaGuruPelaksana: string | null = null;
      let status = "Tidak Terlaksana";
      
      if (sesi && sesi.waktu_input) {
        result.diinput++;
        if (sesi.status_kehadiran_guru === "Tepat Waktu") result.tepatWaktu++;
        if (sesi.status_kehadiran_guru === "Terlambat") result.terlambat++;
        if (sesi.is_guru_pengganti) result.digantikan++;
        
        const guruPelaksana = store.pegawai.find(p => p.id_pegawai === sesi.id_pegawai_pelaksana);
        namaGuruPelaksana = guruPelaksana?.nama_lengkap_gelar ?? null;
        status = sesi.status_kehadiran_guru;
      }
      
      result.daftarDetail.push({
        id_sesi: sesi ? sesi.id_sesi : `unsaved_${jadwal.id_jadwal}`,
        nama_guru_seharusnya: guruSeharusnya?.nama_lengkap_gelar ?? "Unknown",
        nama_guru_pelaksana: namaGuruPelaksana,
        status,
        mapel: mapel?.nama_mapel ?? "Unknown",
        rombel: rombel?.nama_rombel ?? "Unknown",
      });
    }
    
    return result;
  },

  async getRekapKedisiplinan(bulan) {
    maybeThrowSimulatedError();
    await simulateLatency();
    const store = loadStore();
    
    const gurus = store.pegawai.filter(p => p.tugas_utama === "Guru");
    
    return gurus.map(guru => {
      const jadwalGuru = store.jadwal.filter(j => j.id_pegawai === guru.id_pegawai);
      const sesiBulanIni = store.sesiTatapMuka.filter(s =>
        jadwalGuru.some(j => j.id_jadwal === s.id_jadwal) &&
        s.tanggal.startsWith(bulan)
      );

      let tepatWaktu = 0;
      let terlambat = 0;
      let digantikanTerjadwal = 0;
      let digantikanMendadakBulanIni = 0;

      for (const s of sesiBulanIni) {
        if (s.status_kehadiran_guru === "Tepat Waktu") tepatWaktu++;
        else if (s.status_kehadiran_guru === "Terlambat") terlambat++;
        else if (s.status_kehadiran_guru === "Digantikan Terjadwal") digantikanTerjadwal++;
        else if (s.status_kehadiran_guru === "Digantikan Mendadak") digantikanMendadakBulanIni++;
      }

      const sesiTerpenuhi = tepatWaktu + terlambat;
      
      const realisasiJtmPersen = sesiBulanIni.length > 0
        ? Math.round((sesiTerpenuhi / sesiBulanIni.length) * 100)
        : 0;

      const isFlagged = digantikanMendadakBulanIni >= store.pengaturan.ambangFlagDigantikanMendadak;

      return {
        id_pegawai: guru.id_pegawai,
        nama: guru.nama_lengkap_gelar,
        tepatWaktu,
        terlambat,
        digantikanTerjadwal,
        digantikanMendadakBulanIni,
        totalSesi: sesiBulanIni.length,
        realisasiJtmPersen,
        isFlagged,
      };
    });
  }
};
