# INSTRUKSI KOREKSI — Halaman Rekap Kedisiplinan Guru
# (`src/app/guru-tendik/kedisiplinan/page.tsx`)

> Dokumen ini menindaklanjuti hasil peninjauan repo commit `6e7dfec`. Tiga temuan spesifik di bawah wajib diperbaiki. Setelah selesai, isi entri baru di `FRONTEND.md` Bab 9 (Log Deviasi) untuk mendokumentasikan koreksi ini — bukan hanya memperbaiki kode diam-diam.

---

## Temuan 1 — Pelanggaran Service Layer (prioritas tertinggi, perbaiki dulu)

**Masalah:** `kedisiplinan/page.tsx` memanggil `import("@/services/store").then(m => m.loadStore())` langsung di komponen, melewati lapisan service. Ini melanggar Bab 5 `FRONTEND.md`: *"Tidak ada panggilan data di luar `services/`."*

**Perbaikan wajib:**

1. Tambahkan method baru **`getRekapKedisiplinan()`** ke `src/services/sesi-tatap-muka.service.ts` (interface) dan implementasikan di `sesi-tatap-muka.mock.ts` — **jangan** buat file service terpisah baru kecuali Anda mencatatnya di Log Deviasi; method ini secara konsep masih bagian dari domain sesi tatap muka.

   ```typescript
   // sesi-tatap-muka.service.ts — tambahkan ke interface
   export type RekapKedisiplinanGuru = {
     id_pegawai: string;
     nama: string;
     tepatWaktu: number;
     terlambat: number;
     digantikanTerjadwal: number;
     digantikanMendadakBulanIni: number; // lihat Temuan 3 — HARUS terfilter bulan berjalan
     totalSesi: number;
     realisasiJtmPersen: number;         // lihat Temuan 2 — HARUS rasio, bukan totalSesi * 2
     isFlagged: boolean;
   };

   export interface SesiTatapMukaService {
     // ...method yang sudah ada, tidak diubah...
     getRekapKedisiplinan(bulan: string /* format "YYYY-MM" */): Promise<RekapKedisiplinanGuru[]>;
   }
   ```

2. Pindahkan **seluruh logika kalkulasi** (yang sekarang ada di `useEffect` halaman) ke dalam implementasi mock method ini — termasuk delay (`simulateLatency`) dan error simulasi (`maybeThrowSimulatedError`), mengikuti pola yang sudah konsisten di seluruh service lain di repo ini.

3. Ubah `kedisiplinan/page.tsx` agar hanya memanggil:
   ```typescript
   services.sesiTatapMuka.getRekapKedisiplinan(bulanIni)
   ```
   Hapus baris `import("@/services/store")` sepenuhnya dari file halaman ini. Halaman tidak boleh tahu apa-apa tentang bentuk internal `store.ts`.

---

## Temuan 2 — Rumus Realisasi JTM Salah

**Masalah:** kode saat ini `jtmRealisasi = totalSesi * 2` dengan komentar `"Assuming 2 JTM per session roughly for demo"`. Ini bukan rumus dari dokumen manapun — dikarang sendiri dan tidak dicatat sebagai deviasi.

**Rumus yang benar** (SRS `SIM_Madrasah_Terpadu_SRS_v2.md` Bab 10 poin 15, kutip ulang agar tidak ambigu):

> Realisasi JTM = (jumlah sesi berstatus **"Tepat Waktu"** atau **"Terlambat"**) ÷ (jumlah sesi **terjadwal** di `jadwal_pelajaran` untuk guru tersebut, pada rentang bulan yang sama)

**Perbaikan wajib** di dalam `getRekapKedisiplinan` (Temuan 1):

```typescript
// Per guru, untuk bulan yang diminta:
const jadwalGuru = jadwal.filter(j => j.id_pegawai === guru.id_pegawai);
const sesiBulanIni = sesiTatapMuka.filter(s =>
  jadwalGuru.some(j => j.id_jadwal === s.id_jadwal) &&
  s.tanggal.startsWith(bulan) // bulan = "YYYY-MM"
);

const sesiTerpenuhi = sesiBulanIni.filter(
  s => s.status_kehadiran_guru === "Tepat Waktu" || s.status_kehadiran_guru === "Terlambat"
).length;

// Jumlah sesi terjadwal = jumlah jadwal_pelajaran guru ini yang seharusnya jatuh di bulan tsb.
// Jika jadwal bersifat rutin mingguan (tanpa tanggal spesifik per kemunculan), hitung dari
// jumlah kemunculan hari jadwal dalam bulan tsb — BUKAN dari jumlah baris sesi_tatap_muka yang
// sudah tercatat (karena sesi yang belum pernah dibuka getByRombelTanggal tidak akan ada barisnya).
// Jika perhitungan kemunculan hari-dalam-bulan ini kompleks untuk versi mock, boleh disederhanakan
// jadi "jumlah baris sesi_tatap_muka bulan ini" SEBAGAI PENDEKATAN SEMENTARA — tapi WAJIB dicatat
// eksplisit di Log Deviasi bahwa ini adalah pendekatan sementara untuk Tahap 1, dan Tahap 2 backend
// harus menghitungnya dari jadwal_pelajaran x kalender, bukan dari baris yang kebetulan sudah dibuka.

const realisasiJtmPersen = sesiBulanIni.length > 0
  ? Math.round((sesiTerpenuhi / sesiBulanIni.length) * 100)
  : 0;
```

Tampilkan `realisasiJtmPersen` di tabel sebagai persentase (mis. "87%"), bukan angka mentah tanpa satuan seperti sebelumnya.

---

## Temuan 3 — Flag Kedisiplinan Tidak Difilter Bulan Berjalan

**Masalah:** `digantikanMendadak` dihitung dari **seluruh riwayat** guru, bukan hanya bulan berjalan — bertentangan dengan SRS Bab 10 poin 15: *"≥3 kali dalam 1 bulan"*.

**Perbaikan wajib** — masih di dalam `getRekapKedisiplinan(bulan)` yang sama:

```typescript
const digantikanMendadakBulanIni = sesiBulanIni.filter(
  s => s.status_kehadiran_guru === "Digantikan Mendadak"
).length;

const isFlagged = digantikanMendadakBulanIni >= pengaturan.ambangFlagDigantikanMendadak;
```

Karena `getRekapKedisiplinan` sekarang menerima parameter `bulan`, halaman wajib punya **pemilih bulan** (default: bulan berjalan) — tambahkan dropdown/input bulan sederhana di atas tabel, agar Kepala Madrasah bisa juga melihat riwayat bulan sebelumnya, bukan cuma bulan ini. Ini konsisten dengan kebutuhan riil Kepala Madrasah melihat tren, bukan snapshot tunggal (SRS Bab 4B).

---

## Definition of Done — Koreksi Ini

- [ ] Tidak ada lagi `import("@/services/store")` atau akses `loadStore()` langsung di file manapun di dalam `src/app/`.
- [ ] `realisasiJtmPersen` dihitung sebagai rasio sesuai rumus SRS, ditampilkan sebagai persentase.
- [ ] `isFlagged` dan `digantikanMendadakBulanIni` terfilter ke bulan yang dipilih, bukan sepanjang masa.
- [ ] Halaman kedisiplinan punya pemilih bulan, default ke bulan berjalan.
- [ ] Jika pendekatan sementara untuk "jumlah sesi terjadwal" (disebutkan di Temuan 2) dipakai, **wajib** ada entri baru di Log Deviasi Bab 9 `FRONTEND.md` yang menjelaskan keterbatasannya untuk Tahap 2.
- [ ] Entri Log Deviasi baru juga ditambahkan untuk mencatat bahwa rumus JTM sebelumnya (`totalSesi * 2`) adalah kekeliruan yang sudah dikoreksi — agar riwayat keputusan tetap transparan, bukan ditimpa diam-diam.
- [ ] `npx tsc --noEmit` tetap bersih setelah perubahan.