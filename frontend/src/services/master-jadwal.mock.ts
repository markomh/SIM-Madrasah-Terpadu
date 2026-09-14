import { BebanMengajar, KetersediaanGuru, RuangFasilitas } from "../types/master-jadwal";

export const ruangFasilitasMock = {
  getAll: async (): Promise<RuangFasilitas[]> => [
    { id_ruang: "rf-1", nama_ruang: "Laboratorium Komputer 1", tipe_fasilitas: "Terbatas" },
    { id_ruang: "rf-2", nama_ruang: "Laboratorium IPA", tipe_fasilitas: "Terbatas" },
    { id_ruang: "rf-3", nama_ruang: "Lapangan Olahraga Utama", tipe_fasilitas: "Terbatas" },
    { id_ruang: "rf-4", nama_ruang: "Ruang Kelas Reguler A", tipe_fasilitas: "Reguler" }
  ],
  create: async (data: Omit<RuangFasilitas, "id_ruang">): Promise<RuangFasilitas> => ({
    ...data,
    id_ruang: `rf-${Date.now()}`
  }),
  update: async (id: string, data: Partial<RuangFasilitas>): Promise<RuangFasilitas> => ({
    id_ruang: id,
    nama_ruang: data.nama_ruang || "Ruang Mock",
    tipe_fasilitas: data.tipe_fasilitas || "Reguler"
  }),
  delete: async (id: string): Promise<void> => {}
};

let mockBebanMengajar: BebanMengajar[] = [
  { id_beban: "bm-1", id_tahun: "ta_2627", semester: "Ganjil", id_rombel: "rb_7a", id_mapel: "mp_mtk", id_pegawai: "019153a0-f8f2-777b-bb66-6b211a7e28a5", jtm_total: 5 },
  { id_beban: "bm-2", id_tahun: "ta_2627", semester: "Ganjil", id_rombel: "rb_7a", id_mapel: "mp_bind", id_pegawai: "pg_guru_b", jtm_total: 6 },
  { id_beban: "bm-3", id_tahun: "ta_2627", semester: "Ganjil", id_rombel: "rb_7a", id_mapel: "mp_ipa", id_pegawai: "pg_guru_b", jtm_total: 5 },
  { id_beban: "bm-4", id_tahun: "ta_2627", semester: "Ganjil", id_rombel: "rb_7b", id_mapel: "mp_mtk", id_pegawai: "019153a0-f8f2-777b-bb66-6b211a7e28a5", jtm_total: 5 },
  { id_beban: "bm-5", id_tahun: "ta_2627", semester: "Ganjil", id_rombel: "rb_8a", id_mapel: "mp_mtk", id_pegawai: "019153a0-f8f2-777b-bb66-6b211a7e28a5", jtm_total: 5 },
];

export const bebanMengajarMock = {
  getAll: async (): Promise<BebanMengajar[]> => [...mockBebanMengajar],
  create: async (data: Omit<BebanMengajar, "id_beban">): Promise<BebanMengajar> => {
    const existingIndex = mockBebanMengajar.findIndex(
      b => b.id_rombel === data.id_rombel && b.id_mapel === data.id_mapel
    );
    const newItem: BebanMengajar = {
      ...data,
      id_beban: existingIndex >= 0 ? mockBebanMengajar[existingIndex].id_beban : `bm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    };
    if (existingIndex >= 0) {
      mockBebanMengajar[existingIndex] = newItem;
    } else {
      mockBebanMengajar.push(newItem);
    }
    return newItem;
  },
  update: async (id: string, data: Partial<BebanMengajar>): Promise<BebanMengajar> => {
    const idx = mockBebanMengajar.findIndex(b => b.id_beban === id);
    if (idx >= 0) {
      mockBebanMengajar[idx] = { ...mockBebanMengajar[idx], ...data };
      return mockBebanMengajar[idx];
    }
    return {
      id_beban: id,
      id_tahun: data.id_tahun || "ta_2627",
      semester: data.semester || "Ganjil",
      id_rombel: data.id_rombel || "rb_7a",
      id_mapel: data.id_mapel || "mp_mtk",
      id_pegawai: data.id_pegawai || "p-1",
      jtm_total: data.jtm_total || 4
    };
  },
  delete: async (id: string): Promise<void> => {
    mockBebanMengajar = mockBebanMengajar.filter(b => b.id_beban !== id);
  }
};

export const ketersediaanGuruMock = {
  getAll: async (): Promise<KetersediaanGuru[]> => [
    { id_ketersediaan: "kg-1", id_pegawai: "p-2", hari: "Senin", jam_mulai: "07:00", jam_selesai: "12:00", is_mandatory: true, alasan: "Tugas Luar / MGMP" }
  ],
  create: async (data: Omit<KetersediaanGuru, "id_ketersediaan">): Promise<KetersediaanGuru> => ({
    ...data,
    id_ketersediaan: `kg-${Date.now()}`
  }),
  update: async (id: string, data: Partial<KetersediaanGuru>): Promise<KetersediaanGuru> => ({
    id_ketersediaan: id,
    id_pegawai: data.id_pegawai || "p-1",
    hari: data.hari || "Senin",
    jam_mulai: data.jam_mulai || "07:00",
    jam_selesai: data.jam_selesai || "08:00",
    is_mandatory: data.is_mandatory || false,
    alasan: data.alasan
  }),
  delete: async (id: string): Promise<void> => {}
};
