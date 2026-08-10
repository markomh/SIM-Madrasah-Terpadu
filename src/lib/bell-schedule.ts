export type PeriodType = "KBM" | "UPACARA" | "IBADAH" | "ISTIRAHAT" | "ISHOMA" | "SENAM";

export interface MasterPeriodSlot {
  id_slot: string;
  nama: string; // e.g. "Jam Ke-1", "Upacara Bendera", "Istirahat Pagi"
  tipe: PeriodType;
  jam_mulai: string; // Format 24 Jam: "07:00"
  jam_selesai: string; // Format 24 Jam: "07:45"
  hariKhusus?: string[]; // jika hanya berlaku di hari tertentu, misal ["Senin"] untuk Upacara
  keterangan?: string;
}

export interface BellSchedulePreset {
  id_preset: string;
  nama_preset: string;
  jenjang: "MI" | "MTs" | "MA" | "Khusus";
  deskripsi: string;
  durasiJpMenit: number;
  slots: MasterPeriodSlot[];
}

export const DEFAULT_BELL_PRESETS: BellSchedulePreset[] = [

  {
    id_preset: "mi_madrasah",
    nama_preset: "Madrasah Ibtidaiyah 35 Menit / JP",
    jenjang: "MI",
    deskripsi: "Standar KBM tingkat MI/SD dengan durasi 35 menit per jam pelajaran.",
    durasiJpMenit: 35,
    slots: [
      {
        id_slot: "slot_mi_upacara",
        nama: "Upacara Bendera & Apel Pagi",
        tipe: "UPACARA",
        jam_mulai: "07:00",
        jam_selesai: "07:35",
        hariKhusus: ["Senin"],
      },
      {
        id_slot: "slot_mi_dhuha",
        nama: "Sholat Dhuha Bersama",
        tipe: "IBADAH",
        jam_mulai: "07:00",
        jam_selesai: "07:35",
        hariKhusus: ["Selasa", "Rabu", "Kamis", "Sabtu"],
      },
      {
        id_slot: "slot_mi_senam",
        nama: "Senam Ceria Jumat",
        tipe: "SENAM",
        jam_mulai: "06:45",
        jam_selesai: "07:25",
        hariKhusus: ["Jumat"],
      },
      {
        id_slot: "slot_mi_jp_1",
        nama: "Jam Ke-1",
        tipe: "KBM",
        jam_mulai: "07:35",
        jam_selesai: "08:10",
      },
      {
        id_slot: "slot_mi_jp_2",
        nama: "Jam Ke-2",
        tipe: "KBM",
        jam_mulai: "08:10",
        jam_selesai: "08:45",
      },
      {
        id_slot: "slot_mi_jp_3",
        nama: "Jam Ke-3",
        tipe: "KBM",
        jam_mulai: "08:45",
        jam_selesai: "09:20",
      },
      {
        id_slot: "slot_mi_ist_1",
        nama: "Keluar Main & Istirahat Pagi",
        tipe: "ISTIRAHAT",
        jam_mulai: "09:20",
        jam_selesai: "09:50",
      },
      {
        id_slot: "slot_mi_jp_4",
        nama: "Jam Ke-4",
        tipe: "KBM",
        jam_mulai: "09:50",
        jam_selesai: "10:25",
      },
      {
        id_slot: "slot_mi_jp_5",
        nama: "Jam Ke-5",
        tipe: "KBM",
        jam_mulai: "10:25",
        jam_selesai: "11:00",
      },
      {
        id_slot: "slot_mi_jp_6",
        nama: "Jam Ke-6",
        tipe: "KBM",
        jam_mulai: "11:00",
        jam_selesai: "11:35",
        hariKhusus: ["Senin", "Selasa", "Rabu", "Kamis", "Sabtu"],
      },
      {
        id_slot: "slot_mi_ishoma",
        nama: "Sholat Dhuhur & Kepulangan",
        tipe: "ISHOMA",
        jam_mulai: "11:35",
        jam_selesai: "12:15",
        hariKhusus: ["Senin", "Selasa", "Rabu", "Kamis", "Sabtu"],
      },
    ],
  },
  {
    id_preset: "mts_madrasah",
    nama_preset: "Madrasah Tsanawiyah 40 Menit / JP",
    jenjang: "MTs",
    deskripsi: "Standar alokasi waktu KBM tingkat MTs dengan Upacara Senin, Dhuha pagi, 2 sesi istirahat, dan 8 JP KBM.",
    durasiJpMenit: 40,
    slots: [
      {
        id_slot: "slot_mts_upacara",
        nama: "Upacara Bendera & Apel Pagi",
        tipe: "UPACARA",
        jam_mulai: "07:00",
        jam_selesai: "07:45",
        hariKhusus: ["Senin"],
        keterangan: "Seluruh sivitas madrasah di lapangan utama",
      },
      {
        id_slot: "slot_mts_dhuha",
        nama: "Pembiasaan Sholat Dhuha & Tahfidz",
        tipe: "IBADAH",
        jam_mulai: "07:00",
        jam_selesai: "07:45",
        hariKhusus: ["Selasa", "Rabu", "Kamis", "Sabtu"],
        keterangan: "Sholat Dhuha berjamaah dan muroja'ah hafalan",
      },
      {
        id_slot: "slot_mts_senam",
        nama: "Senam Pagi & Jumat Bersih",
        tipe: "SENAM",
        jam_mulai: "06:45",
        jam_selesai: "07:30",
        hariKhusus: ["Jumat"],
        keterangan: "Senam Kebugaran Jasmani & Operasi Semut",
      },
      {
        id_slot: "slot_mts_jp_1",
        nama: "Jam Ke-1",
        tipe: "KBM",
        jam_mulai: "07:45",
        jam_selesai: "08:25",
      },
      {
        id_slot: "slot_mts_jp_2",
        nama: "Jam Ke-2",
        tipe: "KBM",
        jam_mulai: "08:25",
        jam_selesai: "09:05",
      },
      {
        id_slot: "slot_mts_jp_3",
        nama: "Jam Ke-3",
        tipe: "KBM",
        jam_mulai: "09:05",
        jam_selesai: "09:45",
      },
      {
        id_slot: "slot_mts_ist_1",
        nama: "Keluar Main & Istirahat Pagi",
        tipe: "ISTIRAHAT",
        jam_mulai: "09:45",
        jam_selesai: "10:15",
        keterangan: "Jeda makan snack & relaksasi siswa",
      },
      {
        id_slot: "slot_mts_jp_4",
        nama: "Jam Ke-4",
        tipe: "KBM",
        jam_mulai: "10:15",
        jam_selesai: "10:55",
      },
      {
        id_slot: "slot_mts_jp_5",
        nama: "Jam Ke-5",
        tipe: "KBM",
        jam_mulai: "10:55",
        jam_selesai: "11:35",
        hariKhusus: ["Senin", "Selasa", "Rabu", "Kamis", "Sabtu"],
      },
      {
        id_slot: "slot_mts_jumat",
        nama: "Sholat Jumat Berjamaah & Keputrian",
        tipe: "ISHOMA",
        jam_mulai: "11:30",
        jam_selesai: "13:00",
        hariKhusus: ["Jumat"],
        keterangan: "KBM Jumat selesai sebelum adzan Jumat",
      },
      {
        id_slot: "slot_mts_ishoma",
        nama: "Sholat Dhuhur Berjamaah & Ishoma",
        tipe: "ISHOMA",
        jam_mulai: "11:35",
        jam_selesai: "12:20",
        hariKhusus: ["Senin", "Selasa", "Rabu", "Kamis", "Sabtu"],
        keterangan: "Sholat berjamaah di masjid madrasah",
      },
      {
        id_slot: "slot_mts_jp_6",
        nama: "Jam Ke-6",
        tipe: "KBM",
        jam_mulai: "12:20",
        jam_selesai: "13:00",
        hariKhusus: ["Senin", "Selasa", "Rabu", "Kamis", "Sabtu"],
      },
      {
        id_slot: "slot_mts_jp_7",
        nama: "Jam Ke-7",
        tipe: "KBM",
        jam_mulai: "13:00",
        jam_selesai: "13:40",
        hariKhusus: ["Senin", "Selasa", "Rabu", "Kamis", "Sabtu"],
      },
      {
        id_slot: "slot_mts_jp_8",
        nama: "Jam Ke-8",
        tipe: "KBM",
        jam_mulai: "13:40",
        jam_selesai: "14:20",
        hariKhusus: ["Senin", "Selasa", "Rabu", "Kamis", "Sabtu"],
      },
    ],
  },
  {
    id_preset: "ma_madrasah",
    nama_preset: "Madrasah Aliyah 45 Menit / JP",
    jenjang: "MA",
    deskripsi: "Standar KBM tingkat MA/SMA dengan durasi 45 menit per jam pelajaran.",
    durasiJpMenit: 45,
    slots: [
      {
        id_slot: "slot_ma_upacara",
        nama: "Upacara Bendera & Apel Pagi",
        tipe: "UPACARA",
        jam_mulai: "07:00",
        jam_selesai: "07:45",
        hariKhusus: ["Senin"],
        keterangan: "Seluruh sivitas madrasah di lapangan utama",
      },
      {
        id_slot: "slot_ma_dhuha",
        nama: "Pembiasaan Sholat Dhuha & Tahfidz",
        tipe: "IBADAH",
        jam_mulai: "07:00",
        jam_selesai: "07:45",
        hariKhusus: ["Selasa", "Rabu", "Kamis", "Sabtu"],
        keterangan: "Sholat Dhuha berjamaah dan muroja'ah hafalan",
      },
      {
        id_slot: "slot_ma_senam",
        nama: "Senam Pagi & Jumat Bersih",
        tipe: "SENAM",
        jam_mulai: "06:45",
        jam_selesai: "07:30",
        hariKhusus: ["Jumat"],
      },
      {
        id_slot: "slot_ma_jp_1",
        nama: "Jam Ke-1",
        tipe: "KBM",
        jam_mulai: "07:45",
        jam_selesai: "08:30",
      },
      {
        id_slot: "slot_ma_jp_2",
        nama: "Jam Ke-2",
        tipe: "KBM",
        jam_mulai: "08:30",
        jam_selesai: "09:15",
      },
      {
        id_slot: "slot_ma_jp_3",
        nama: "Jam Ke-3",
        tipe: "KBM",
        jam_mulai: "09:15",
        jam_selesai: "10:00",
      },
      {
        id_slot: "slot_ma_ist_1",
        nama: "Keluar Main & Istirahat Pagi",
        tipe: "ISTIRAHAT",
        jam_mulai: "10:00",
        jam_selesai: "10:30",
      },
      {
        id_slot: "slot_ma_jp_4",
        nama: "Jam Ke-4",
        tipe: "KBM",
        jam_mulai: "10:30",
        jam_selesai: "11:15",
      },
      {
        id_slot: "slot_ma_jumat",
        nama: "Sholat Jumat Berjamaah & Keputrian",
        tipe: "ISHOMA",
        jam_mulai: "11:30",
        jam_selesai: "13:00",
        hariKhusus: ["Jumat"],
      },
      {
        id_slot: "slot_ma_jp_5",
        nama: "Jam Ke-5",
        tipe: "KBM",
        jam_mulai: "11:15",
        jam_selesai: "12:00",
        hariKhusus: ["Senin", "Selasa", "Rabu", "Kamis", "Sabtu"],
      },
      {
        id_slot: "slot_ma_ishoma",
        nama: "Sholat Dhuhur Berjamaah & Ishoma",
        tipe: "ISHOMA",
        jam_mulai: "12:00",
        jam_selesai: "12:45",
        hariKhusus: ["Senin", "Selasa", "Rabu", "Kamis", "Sabtu"],
      },
      {
        id_slot: "slot_ma_jp_6",
        nama: "Jam Ke-6",
        tipe: "KBM",
        jam_mulai: "12:45",
        jam_selesai: "13:30",
        hariKhusus: ["Senin", "Selasa", "Rabu", "Kamis", "Sabtu"],
      },
      {
        id_slot: "slot_ma_jp_7",
        nama: "Jam Ke-7",
        tipe: "KBM",
        jam_mulai: "13:30",
        jam_selesai: "14:15",
        hariKhusus: ["Senin", "Selasa", "Rabu", "Kamis", "Sabtu"],
      },
      {
        id_slot: "slot_ma_jp_8",
        nama: "Jam Ke-8",
        tipe: "KBM",
        jam_mulai: "14:15",
        jam_selesai: "15:00",
        hariKhusus: ["Senin", "Selasa", "Rabu", "Kamis", "Sabtu"],
      },
    ],
  },

  {
    id_preset: "ramadhan_madrasah",
    nama_preset: "Khusus Ramadhan — 30 Menit / JP",
    jenjang: "Khusus",
    deskripsi: "Penyesuaian jam KBM Ramadhan: durasi 30 menit, tanpa jam keluar main, kepulangan lebih awal.",
    durasiJpMenit: 30,
    slots: [
      {
        id_slot: "slot_ramadhan_tahfidz",
        nama: "Tadarus Al-Qur'an Pagi",
        tipe: "IBADAH",
        jam_mulai: "07:30",
        jam_selesai: "08:00",
      },
      {
        id_slot: "slot_r_jp_1",
        nama: "Jam Ke-1",
        tipe: "KBM",
        jam_mulai: "08:00",
        jam_selesai: "08:30",
      },
      {
        id_slot: "slot_r_jp_2",
        nama: "Jam Ke-2",
        tipe: "KBM",
        jam_mulai: "08:30",
        jam_selesai: "09:00",
      },
      {
        id_slot: "slot_r_jp_3",
        nama: "Jam Ke-3",
        tipe: "KBM",
        jam_mulai: "09:00",
        jam_selesai: "09:30",
      },
      {
        id_slot: "slot_r_jp_4",
        nama: "Jam Ke-4",
        tipe: "KBM",
        jam_mulai: "09:30",
        jam_selesai: "10:00",
      },
      {
        id_slot: "slot_r_jp_5",
        nama: "Jam Ke-5",
        tipe: "KBM",
        jam_mulai: "10:00",
        jam_selesai: "10:30",
      },
      {
        id_slot: "slot_r_jp_6",
        nama: "Jam Ke-6",
        tipe: "KBM",
        jam_mulai: "10:30",
        jam_selesai: "11:00",
      },
      {
        id_slot: "slot_r_dhuhr",
        nama: "Sholat Dhuhur Berjamaah & Kultum",
        tipe: "ISHOMA",
        jam_mulai: "11:45",
        jam_selesai: "12:30",
      },
    ],
  },
];

const PRESET_STORAGE_KEY = "sim_madrasah_bell_presets_v2";

/**
 * Memuat preset dari LocalStorage jika ada kustomisasi admin, fallback ke default.
 */
export function loadBellPresets(): BellSchedulePreset[] {
  if (typeof window === "undefined") return DEFAULT_BELL_PRESETS;
  try {
    const raw = localStorage.getItem(PRESET_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { }
  return DEFAULT_BELL_PRESETS;
}

/**
 * Menyimpan preset kustomisasi ke LocalStorage.
 */
export function saveBellPresets(presets: BellSchedulePreset[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
  } catch { }
}

/**
 * Mereset preset ke konfigurasi bawaan.
 */
export function resetPresetsToDefault(): BellSchedulePreset[] {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(PRESET_STORAGE_KEY);
    } catch { }
  }
  return DEFAULT_BELL_PRESETS;
}

export interface QuickSlotOption {
  label: string;
  nama: string;
  jam_mulai: string;
  jam_selesai: string;
}

export interface QuickKbmStructure {
  sesiPagi: QuickSlotOption[];
  sesiSiang: QuickSlotOption[];
  doubleBlockSlots: QuickSlotOption[];
}

/**
 * Mendapatkan daftar slot KBM yang sah dari Master Jam untuk hari dan preset tertentu.
 * Form bertindak murni sebagai CONSUMER dari Master Jam.
 */
export function getQuickKbmOptions(
  preset: BellSchedulePreset = DEFAULT_BELL_PRESETS[0],
  hari?: string
): QuickKbmStructure {
  // Ambil hanya slot KBM yang valid untuk hari tersebut
  const validKbmSlots = preset.slots.filter((s) => {
    if (s.tipe !== "KBM") return false;
    if (hari && s.hariKhusus && s.hariKhusus.length > 0) {
      return s.hariKhusus.includes(hari);
    }
    return true;
  });

  // Cari titik jeda istirahat pertama di hari tersebut
  const firstBreak = preset.slots.find((s) => {
    if (s.tipe !== "ISTIRAHAT" && s.tipe !== "ISHOMA") return false;
    if (hari && s.hariKhusus && s.hariKhusus.length > 0) {
      return s.hariKhusus.includes(hari);
    }
    return true;
  });

  const breakStartTime = firstBreak ? firstBreak.jam_mulai : "12:00";

  const sesiPagi: QuickSlotOption[] = [];
  const sesiSiang: QuickSlotOption[] = [];

  validKbmSlots.forEach((s) => {
    const item: QuickSlotOption = {
      label: `${s.nama} (${s.jam_mulai} – ${s.jam_selesai})`,
      nama: s.nama,
      jam_mulai: s.jam_mulai,
      jam_selesai: s.jam_selesai,
    };

    if (s.jam_mulai < breakStartTime) {
      sesiPagi.push(item);
    } else {
      sesiSiang.push(item);
    }
  });

  // Blok 2 JP: hanya terbentuk dari dua jam berurutan yang jam_selesai-nya bersambung tanpa jeda istirahat
  const doubleBlockSlots: QuickSlotOption[] = [];
  for (let i = 0; i < validKbmSlots.length - 1; i++) {
    const s1 = validKbmSlots[i];
    const s2 = validKbmSlots[i + 1];
    if (s1.jam_selesai === s2.jam_mulai) {
      doubleBlockSlots.push({
        label: `Blok 2 JP: ${s1.nama} & ${s2.nama} (${s1.jam_mulai} – ${s2.jam_selesai})`,
        nama: `${s1.nama} & ${s2.nama}`,
        jam_mulai: s1.jam_mulai,
        jam_selesai: s2.jam_selesai,
      });
    }
  }

  return {
    sesiPagi,
    sesiSiang,
    doubleBlockSlots,
  };
}

/**
 * Mendapatkan rutinitas institusional & jeda istirahat untuk hari tertentu dari Master Jam.
 */
export function getInstitutionalRoutinesForDay(
  hari: string,
  preset: BellSchedulePreset = DEFAULT_BELL_PRESETS[0]
): MasterPeriodSlot[] {
  return preset.slots.filter((s) => {
    if (s.tipe === "KBM") return false;
    if (!s.hariKhusus || s.hariKhusus.length === 0) return true;
    return s.hariKhusus.includes(hari);
  });
}

/**
 * Menentukan preset yang relevan berdasarkan tingkat rombel secara otomatis.
 */
export function getPresetForRombel(
  presets: BellSchedulePreset[],
  namaRombel?: string,
  idTingkat?: string,
  fallbackPresetId?: string
): BellSchedulePreset {
  if (namaRombel) {
    const clean = namaRombel.toUpperCase();
    if (clean.startsWith("10") || clean.startsWith("11") || clean.startsWith("12") || clean.startsWith("X") || clean.startsWith("XI") || clean.startsWith("XII")) {
      const ma = presets.find((p) => p.jenjang === "MA");
      if (ma) return ma;
    } else if (clean.startsWith("7") || clean.startsWith("8") || clean.startsWith("9") || clean.startsWith("VII") || clean.startsWith("VIII") || clean.startsWith("IX")) {
      const mts = presets.find((p) => p.jenjang === "MTs");
      if (mts) return mts;
    } else if (["1", "2", "3", "4", "5", "6", "I", "II", "III", "IV", "V", "VI"].some((k) => clean.startsWith(k))) {
      const mi = presets.find((p) => p.jenjang === "MI");
      if (mi) return mi;
    }
  }

  if (fallbackPresetId) {
    const found = presets.find((p) => p.id_preset === fallbackPresetId);
    if (found) return found;
  }

  return presets[0] ?? DEFAULT_BELL_PRESETS[0];
}
