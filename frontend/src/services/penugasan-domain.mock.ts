import type { 
  ParameterEkuivalensiJTM, 
  KuotaJTMKurikulum, 
  PlottingBKTIK, 
  RekapBebanKerjaGuru,
  StatusSK,
  PeriodePembagianTugas 
} from "@/types/penugasan";
import { loadStore, saveStore, simulateLatency } from "./store";
import { bebanMengajarMock } from "./master-jadwal.mock";

let mockParameters: ParameterEkuivalensiJTM[] = [
  { id_parameter: "p_1", jenis: "Kepala Madrasah", nilai_jtm: 24, periode_berlaku: "ta_2627", sumber_ketentuan: "Permendikbud No.15/2018", status: "Aktif" },
  { id_parameter: "p_2", jenis: "Wali Kelas", nilai_jtm: 6, periode_berlaku: "ta_2627", sumber_ketentuan: "Regulasi Kemenag", status: "Aktif" },
  { id_parameter: "p_3", jenis: "Wakil Kepala", nilai_jtm: 12, periode_berlaku: "ta_2627", sumber_ketentuan: "Standar Madrasah", status: "Aktif" },
  { id_parameter: "p_4", jenis: "Admin Madrasah", nilai_jtm: 0, periode_berlaku: "ta_2627", sumber_ketentuan: "Standar Madrasah", status: "Aktif" },
];

let mockKuota: KuotaJTMKurikulum[] = [
  { id_kuota: "k_1", id_kurikulum: "kur_merdeka", id_tingkat: "t_7", id_mapel: "mp_mtk", alokasi_jtm: 5 },
  { id_kuota: "k_2", id_kurikulum: "kur_merdeka", id_tingkat: "t_7", id_mapel: "mp_pai", alokasi_jtm: 3 },
  { id_kuota: "k_3", id_kurikulum: "kur_merdeka", id_tingkat: "t_8", id_mapel: "mp_mtk", alokasi_jtm: 5 },
];

// mockPlottingBK is fetched from store now

let mockPeriode: PeriodePembagianTugas[] = [
  { id_periode: "per_1", id_tahun: "ta_2627", status_sk: "DRAFT", tanggal_draft: new Date().toISOString(), tanggal_validasi: null, tanggal_pengesahan: null, catatan: "Penyusunan awal tahun" }
];

export async function getParameterEkuivalensi(id_tahun: string): Promise<ParameterEkuivalensiJTM[]> {
  await simulateLatency();
  return mockParameters.filter(p => p.periode_berlaku === id_tahun && p.status === "Aktif");
}

export async function getKuotaKurikulum(): Promise<KuotaJTMKurikulum[]> {
  await simulateLatency();
  return mockKuota;
}

export async function getPlottingBK(id_tahun?: string): Promise<PlottingBKTIK[]> {
  await simulateLatency();
  const store = loadStore();
  if (!id_tahun) return store.plottingBk || [];
  return (store.plottingBk || []).filter((p: PlottingBKTIK) => p.id_tahun === id_tahun);
}

export async function createPlottingBK(data: { id_pegawai: string; id_rombel: string; id_tahun: string }): Promise<PlottingBKTIK> {
  await simulateLatency();
  const store = loadStore();
  if (!store.plottingBk) store.plottingBk = [];
  const newItem: PlottingBKTIK = {
    id_plotting: `pbk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    id_pegawai: data.id_pegawai,
    id_rombel: data.id_rombel,
    id_tahun: data.id_tahun,
  };
  store.plottingBk.push(newItem);
  saveStore(store);
  return newItem;
}

export async function deletePlottingBK(id_plotting: string): Promise<boolean> {
  await simulateLatency();
  const store = loadStore();
  if (store.plottingBk) {
    store.plottingBk = store.plottingBk.filter((p: PlottingBKTIK) => p.id_plotting !== id_plotting);
    saveStore(store);
  }
  return true;
}

export async function getPeriodePembagianTugas(id_tahun: string): Promise<PeriodePembagianTugas | null> {
  await simulateLatency();
  return mockPeriode.find(p => p.id_tahun === id_tahun) || null;
}

export async function updateStatusSK(id_tahun: string, status: StatusSK): Promise<PeriodePembagianTugas> {
  await simulateLatency();
  const periode = mockPeriode.find(p => p.id_tahun === id_tahun);
  if (!periode) throw new Error("Periode tidak ditemukan");
  
  periode.status_sk = status;
  if (status === "VALIDASI") periode.tanggal_validasi = new Date().toISOString();
  if (status === "DISAHKAN") periode.tanggal_pengesahan = new Date().toISOString();
  
  return { ...periode };
}

export async function hitungRekapBebanKerja(id_tahun: string): Promise<RekapBebanKerjaGuru[]> {
  await simulateLatency();
  const store = loadStore();
  const parameters = mockParameters.filter(p => p.periode_berlaku === id_tahun && p.status === "Aktif");
  
  const rekapMap = new Map<string, RekapBebanKerjaGuru>();
  
  store.pegawai.forEach(p => {
    rekapMap.set(p.id_pegawai, {
      id_pegawai: p.id_pegawai,
      nama_guru: p.nama_lengkap_gelar,
      jtm_mengajar: 0,
      jtm_wali_kelas: 0,
      jtm_tugas_tambahan: 0,
      jtm_bk_tik: 0,
      total_beban_kerja: 0,
      indikator_beban_24: "Belum Terpenuhi",
      indikator_linearitas: "Belum Dapat Diperiksa",
      detail_mengajar: [],
      detail_tugas_tambahan: []
    });
  });

  // 1. Beban Mengajar
  const bebanMengajar = await bebanMengajarMock.getAll();
  bebanMengajar.forEach(bm => {
    if (bm.id_tahun === id_tahun) {
      const p = rekapMap.get(bm.id_pegawai);
      if (p) {
        p.jtm_mengajar += bm.jtm_total;
        p.detail_mengajar.push({ id_mapel: bm.id_mapel, id_rombel: bm.id_rombel, jtm: bm.jtm_total });
      }
    }
  });

  // 2. Wali Kelas
  const paramWaliKelas = parameters.find(p => p.jenis === "Wali Kelas")?.nilai_jtm || 0;
  store.rombel.forEach(r => {
    if (r.id_tahun === id_tahun && r.id_wali_kelas) {
      const p = rekapMap.get(r.id_wali_kelas);
      if (p) {
        p.jtm_wali_kelas += paramWaliKelas;
      }
    }
  });

  // 3. Tugas Tambahan Jabatan
  store.penugasanJabatan.forEach(pj => {
    if (pj.status === "Aktif" && pj.jenis_jabatan !== "Admin Madrasah" && pj.jenis_jabatan !== "Operator Kesiswaan") {
      const param = parameters.find(p => p.jenis === pj.jenis_jabatan);
      if (param) {
        const p = rekapMap.get(pj.id_pegawai);
        if (p) {
          p.jtm_tugas_tambahan += param.nilai_jtm;
          p.detail_tugas_tambahan.push({ jenis: pj.jenis_jabatan, jtm_ekuivalen: param.nilai_jtm });
        }
      }
    }
  });

  // 3b. Pembina Ekstrakurikuler (+2 JTM)
  (store.ekstrakurikuler || []).forEach(e => {
    if (e.id_pembina) {
      const p = rekapMap.get(e.id_pembina);
      if (p) {
        p.jtm_tugas_tambahan += 2;
        p.detail_tugas_tambahan.push({ jenis: `Pembina Ekskul: ${e.nama_ekstra}`, jtm_ekuivalen: 2 });
      }
    }
  });

  // 4. Plotting BK / TIK
  const validRombelIds = new Set(store.rombel.map(r => r.id_rombel));
  const plottingBkList = (store.plottingBk || []).filter((p: PlottingBKTIK) => p.id_tahun === id_tahun && validRombelIds.has(p.id_rombel));
  
  const teacherRombelsMap = new Map<string, Set<string>>();
  plottingBkList.forEach((pbk: PlottingBKTIK) => {
    if (!teacherRombelsMap.has(pbk.id_pegawai)) {
      teacherRombelsMap.set(pbk.id_pegawai, new Set());
    }
    teacherRombelsMap.get(pbk.id_pegawai)!.add(pbk.id_rombel);
  });

  teacherRombelsMap.forEach((rombelIdSet, idPegawai) => {
    let totalKonseli = 0;
    rombelIdSet.forEach(rId => {
      const countInAnggota = (store.anggotaRombel || []).filter(
        (a) => a.id_rombel === rId && a.tanggal_selesai === null
      ).length;
      const count = countInAnggota > 0 ? countInAnggota : 5;
      totalKonseli += count;
    });

    const p = rekapMap.get(idPegawai);
    if (p) {
      p.jtm_bk_tik = Math.round((totalKonseli / 150) * 24);
    }
  });

  // 5. Hitung Total
  const results = Array.from(rekapMap.values());
  results.forEach(r => {
    r.total_beban_kerja = r.jtm_mengajar + r.jtm_wali_kelas + r.jtm_tugas_tambahan + r.jtm_bk_tik;
    r.indikator_beban_24 = r.total_beban_kerja >= 24 ? "Terpenuhi" : "Belum Terpenuhi";
  });

  return results.sort((a, b) => b.total_beban_kerja - a.total_beban_kerja);
}

export const mockPenugasanDomainService = {
  getParameterEkuivalensi,
  getKuotaKurikulum,
  getPlottingBK,
  createPlottingBK,
  deletePlottingBK,
  getPeriodePembagianTugas,
  updateStatusSK,
  hitungRekapBebanKerja
};
