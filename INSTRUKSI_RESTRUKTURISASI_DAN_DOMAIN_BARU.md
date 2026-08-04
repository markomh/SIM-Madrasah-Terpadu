# INSTRUKSI LANJUTAN — Restrukturisasi Navigasi + Penyelesaian Domain Baru
# (Nilai Dasar, Ekstrakurikuler, Bimbingan Konseling, Master Wilayah)

> `FRONTEND.md` sudah diperbarui total (Bab 4, 6, 7, 8) — **tarik versi terbaru dan baca ulang seluruhnya sebelum mulai**, jangan hanya membaca dokumen ini. Instruksi di bawah adalah ringkasan eksekusi, bukan pengganti kontrak lengkap di `FRONTEND.md`.

Kerjakan dua bagian ini **berurutan** — Bagian A dulu, baru Bagian B. Kalau navigasi dipindah setelah domain baru dibangun, akan ada rework ganda.

---

## Bagian A — Restrukturisasi Navigasi (kerjakan dulu)

**Masalah yang diperbaiki:** grup "GURU & TENDIK" mencampur fungsi Kepegawaian (HRD) dengan fungsi KBM (Penjadwalan, Presensi Sesi) — guru mapel tidak intuitif mencari absensi siswa di menu profil pegawai.

1. **Pindahkan direktori rute:**
   - `src/app/guru-tendik/jadwal` → `src/app/akademik/jadwal`
   - `src/app/guru-tendik/presensi-siswa` → `src/app/akademik/presensi-siswa`
   - `src/app/kesiswaan/absensi` → `src/app/akademik/rekap-presensi`
   - `src/app/guru-tendik/pegawai` → `src/app/kepegawaian/pegawai`
   - `src/app/guru-tendik/izin` → `src/app/kepegawaian/izin`
   - `src/app/guru-tendik/kedisiplinan` → `src/app/kepegawaian/kedisiplinan`

2. **Perbarui `src/components/app-shell.tsx`:** ganti struktur grup sesuai tabel di `FRONTEND.md` Bab 6 — grup baru "AKADEMIK" dan "KEPEGAWAIAN" menggantikan "GURU & TENDIK", field `href` mengikuti path baru di atas.

3. **Cari dan perbaiki seluruh referensi ke path lama** — jalankan `grep -rn "guru-tendik" src/` setelah pemindahan, pastikan hasilnya kosong. Perhatikan khusus: tautan "Isi Presensi" di halaman rekap presensi (query-param prefill `rombel`/`tanggal`/`sesi`) yang mengarah ke `/guru-tendik/presensi-siswa` — ubah ke `/akademik/presensi-siswa`.

4. **Jangan sisakan rute lama sebagai redirect/alias** — hapus total foldernya, bukan sekadar menambah rute baru di sampingnya.

**Verifikasi Bagian A selesai:** `grep -rn "guru-tendik" src/` kosong, dan navigasi di aplikasi menampilkan grup "AKADEMIK" + "KEPEGAWAIAN" terpisah.

---

## Bagian B — Domain Baru

### B.1 — Master Wilayah

- `src/types/wilayah.ts` — salin dari `FRONTEND.md` Bab 4 (`MasterProvinsi`, `MasterKabupaten`, `MasterKecamatan`, `MasterDesa`).
- `src/services/wilayah.service.ts` + `.mock.ts` — **read-only**, hanya `getProvinsi()`, `getKabupaten(id_provinsi)`, `getKecamatan(id_kabupaten)`, `getDesa(id_kecamatan)` — dipakai dropdown berjenjang di form.
- Tambahkan `alamat_detail` dan `id_desa` ke `src/types/siswa.ts` dan `src/types/pegawai.ts`, serta ke form Tambah/Edit Siswa dan form Pegawai (dropdown provinsi→kabupaten→kecamatan→desa berjenjang, tiap level baru aktif setelah level atasnya dipilih).
- Tambahkan `mapel_sertifikasi: string[]` ke `Pegawai` — cukup multi-select mapel di form, belum perlu ada validasi otomatis yang memakainya (itu tugas Tahap 2).
- Seed data: minimal 1 provinsi → 1 kabupaten → 2 kecamatan → beberapa desa, cukup untuk mendemokan dropdown berjenjang berfungsi.
- Tambahkan sub-halaman "Master Wilayah" (read-only) di `/referensi`.

### B.2 — Nilai Dasar (`/akademik/nilai`)

- `src/types/nilai.ts` — salin dari `FRONTEND.md` Bab 4 (`KomponenNilai`, `NilaiSiswa`).
- `src/services/nilai.service.ts` + `.mock.ts`:
  ```typescript
  export interface NilaiService {
    getKomponen(id_mapel: string): Promise<KomponenNilai[]>;
    getNilai(filter: { id_rombel: string; semester: string; id_mapel?: string }): Promise<NilaiSiswa[]>;
    inputNilai(data: Omit<NilaiSiswa, "id_nilai" | "tanggal_input">): Promise<NilaiSiswa>;
  }
  ```
  Di `inputNilai`, **validasi wajib**: cek `store.jadwal` ada baris dengan `id_pegawai === data.id_pegawai_penilai && id_mapel === (komponen terkait).id_mapel && id_rombel === data.id_rombel && semester === data.semester`. Jika tidak ada, `throw new Error(...)` — jangan hanya divalidasi di form React, karena itu bisa dilewati.
- Halaman `/akademik/nilai`: Guru Mapel memilih rombel+mapel+semester (dibatasi hanya kombinasi yang dia ajar, dari `services.jadwal`), input nilai per komponen per siswa. Wali Kelas melihat versi read-only lintas semua mapel di rombelnya.

### B.3 — Ekstrakurikuler (`/ekstrakurikuler`)

- `src/types/ekstrakurikuler.ts` — salin dari `FRONTEND.md` Bab 4.
- `src/services/ekstrakurikuler.service.ts` + `.mock.ts` — CRUD `Ekstrakurikuler`, `KeanggotaanEkstra` (ikuti pola riwayat `keanggotaan.mock.ts` yang sudah ada — `tanggal_selesai` ditutup saat siswa keluar, bukan dihapus), dan `AbsensiEkstra`.
- Halaman: Admin bisa CRUD semua ekstrakurikuler; Pembina Ekstrakurikuler **hanya melihat/mengelola ekstrakurikuler dengan `id_pembina === currentUser.id_pegawai`** — filter ini di service (`getAll` menerima parameter pembina), bukan cuma disembunyikan di UI.
- Tambahkan peran `"Pembina Ekstrakurikuler"` ke role switcher `/akun`.

### B.4 — Bimbingan Konseling (`/bk`)

- `src/types/bk.ts` — salin dari `FRONTEND.md` Bab 4.
- `src/services/bk.service.ts` + `.mock.ts`:
  ```typescript
  export interface BkService {
    getBySiswa(id_siswa: string, requesterId: string, requesterRole: Peran): Promise<CatatanBk[]>;
    create(data: Omit<CatatanBk, "id_catatan">): Promise<CatatanBk>;
  }
  ```
  Di `getBySiswa`, **filter di dalam fungsi ini**: jika `tingkat_kerahasiaan === "Rahasia"`, hanya kembalikan baris tersebut jika `requesterId === catatan.id_pegawai_bk` atau `requesterRole === "Kepala Madrasah"`. Baris yang tidak lolos filter **tidak boleh ada di array yang dikembalikan sama sekali** — bukan dikembalikan lalu disembunyikan di komponen.
- Halaman `/bk`: form catat (Guru BK), daftar catatan per siswa dengan badge kerahasiaan, Kepala Madrasah bisa melihat semua tapi tidak bisa menulis.
- Tambahkan peran `"Guru BK"` ke role switcher `/akun`.

---

## Definition of Done — Instruksi Ini

Salin checklist dari `FRONTEND.md` Bab 8 (item yang ditandai "baru" khusus untuk perubahan ini), ditambah:

- [ ] `grep -rn "guru-tendik" src/` kosong.
- [ ] Uji manual: input nilai dengan `id_pegawai_penilai` yang **bukan** guru terjadwal mapel/rombel/semester tsb → sistem menolak (error), bukan tersimpan diam-diam.
- [ ] Uji manual: buat 1 `catatan_bk` "Rahasia" atas nama Guru BK A, lalu panggil `getBySiswa` dengan `requesterId` Guru BK B (bukan Kepala Madrasah) → catatan tersebut **tidak muncul** di hasil.
- [ ] Role switcher `/akun` mencakup 8 peran total (termasuk 2 peran baru).
- [ ] Log Deviasi `FRONTEND.md` Bab 9 diisi untuk setiap keputusan tambahan yang diambil (mis. detail UX dropdown wilayah berjenjang, dsb).
- [ ] `npx tsc --noEmit` bersih di akhir seluruh pekerjaan (Bagian A + B).
