# INSTRUKSI KOREKSI FINAL — Model Jabatan Terpadu
# (Menggantikan sepenuhnya `INSTRUKSI_KOREKSI_RANGKAP_JABATAN.md` — JANGAN kerjakan file itu, cakupannya sudah dilebur & diperluas di sini)

> `FRONTEND.md` sudah direvisi total (Bab 4, 6) dan `SIM_Madrasah_Terpadu_SRS_v2.md` Bab 9B, 9B.1, 10, 11, 12 juga direvisi total. **Tarik kedua dokumen versi terbaru dan baca ulang sebelum eksekusi** — instruksi ini adalah ringkasan kerja, kontrak lengkapnya ada di kedua dokumen tersebut.

---

## Mengapa Instruksi Sebelumnya Tidak Cukup

Perbaikan sebelumnya hanya menjadikan **Wali Kelas** dan **Pembina Ekstrakurikuler** sebagai status turunan, tapi masih membiarkan **Kepala Madrasah**, **Admin Madrasah**, **Operator Kesiswaan**, dan **Guru BK** sebagai nilai `Peran` eksklusif. Ini bug yang sama persis, hanya belum tuntas: di kenyataan lapangan, Kepala Madrasah hampir selalu tetap seorang guru aktif mengajar — bukan jabatan struktural yang meniadakan status mengajarnya. Prinsip yang benar: **Guru adalah satu entitas tunggal**, seluruh jabatan tambahan bersifat aditif tanpa kecuali.

---

## Model Final (baca dulu sebelum menyentuh kode)

Tiga lapis, tiga sumber kebenaran berbeda, semuanya aditif:

1. **`pegawai.tugas_utama`** — hanya `"Guru"` atau `"Tendik"`. Kategori dasar, bukan jabatan.
2. **`penugasan_jabatan`** (tabel baru) — menaungi 4 jabatan berskala madrasah: **Kepala Madrasah, Admin Madrasah, Operator Kesiswaan, Guru BK**. Satu pegawai boleh punya beberapa baris aktif sekaligus.
3. **Relasi yang sudah ada** — **Wali Kelas** dari `rombel.id_wali_kelas`, **Pembina Ekstrakurikuler** dari `ekstrakurikuler.id_pembina`. Sengaja **tidak** dipindah ke `penugasan_jabatan` (mencegah dua sumber kebenaran untuk hal yang sama).

**"Guru Kelas" vs "Guru Mapel"** bukan status tersimpan — keduanya cuma pola distribusi baris `jadwal_pelajaran` (Guru Kelas: satu rombel banyak mapel; Guru Mapel: satu mapel banyak rombel). Hak input presensi/nilai selalu dicek dari `jadwal_pelajaran` langsung, sistem tidak perlu tahu "tipe" guru yang mana.

---

## Tugas 1 — Skema Data

1. `src/types/pegawai.ts`: `Pegawai.peran` **dihapus total**. Tambahkan `tugas_utama: "Guru" | "Tendik"`.
2. Buat `src/types/penugasan-jabatan.ts`:
   ```typescript
   export type JenisJabatan = "Kepala Madrasah" | "Admin Madrasah" | "Operator Kesiswaan" | "Guru BK";
   export type StatusPenugasan = "Aktif" | "Berakhir";
   export type PenugasanJabatan = {
     id_penugasan: string;
     id_pegawai: string;
     jenis_jabatan: JenisJabatan;
     id_tahun: string;
     tanggal_mulai: string;
     tanggal_selesai: string | null;
     status: StatusPenugasan;
   };
   ```
3. Tambahkan `penugasanJabatan: PenugasanJabatan[]` ke store, dengan service `penugasan-jabatan.service.ts` + `.mock.ts` (CRUD dasar: `getAll()`, `getByPegawai(id)`, `create()`, `akhiri(id_penugasan)`).

## Tugas 2 — Buat `src/lib/access.ts` (Satu-Satunya Sumber Logika Akses)

```typescript
import type { PenugasanJabatan, JenisJabatan, Rombel, Ekstrakurikuler, JadwalPelajaran } from "@/types";

export function hasJabatan(idPegawai: string, jenis: JenisJabatan, list: PenugasanJabatan[]): boolean {
  return list.some(p => p.id_pegawai === idPegawai && p.jenis_jabatan === jenis && p.status === "Aktif");
}
export const isKepalaMadrasah = (id: string, list: PenugasanJabatan[]) => hasJabatan(id, "Kepala Madrasah", list);
export const isAdminMadrasah = (id: string, list: PenugasanJabatan[]) => hasJabatan(id, "Admin Madrasah", list);
export const isOperatorKesiswaan = (id: string, list: PenugasanJabatan[]) => hasJabatan(id, "Operator Kesiswaan", list);
export const isGuruBk = (id: string, list: PenugasanJabatan[]) => hasJabatan(id, "Guru BK", list);

export function isWaliKelas(idPegawai: string, rombelList: Rombel[]): boolean {
  return rombelList.some(r => r.id_wali_kelas === idPegawai);
}
export function getRombelWaliKelas(idPegawai: string, rombelList: Rombel[]): Rombel[] {
  return rombelList.filter(r => r.id_wali_kelas === idPegawai);
}
export function isPembinaEkstrakurikuler(idPegawai: string, ekstraList: Ekstrakurikuler[]): boolean {
  return ekstraList.some(e => e.id_pembina === idPegawai);
}
export function isPengajar(
  idPegawai: string, idRombel: string, idMapel: string, semester: string, jadwalList: JadwalPelajaran[]
): boolean {
  return jadwalList.some(j => j.id_pegawai === idPegawai && j.id_rombel === idRombel && j.id_mapel === idMapel && j.semester === semester);
}
```

**Tidak boleh ada perbandingan string peran di file lain manapun** — semua lewat fungsi-fungsi ini, dipanggil ulang dari data yang sedang dimuat, tidak pernah disimpan sebagai field/state statis.

## Tugas 3 — Refaktor Seluruh Pemakaian `peran`

`grep -rln 'peran' src/` untuk memetakan file terdampak (kemungkinan mencakup, tapi jangan berasumsi lengkap — verifikasi sendiri): `app-shell.tsx`, `auth-context.tsx`, `store.ts`, halaman dashboard `page.tsx`, halaman `akun`, halaman `izin`, halaman `kedisiplinan`, halaman `nilai`, `ekstrakurikuler`, `bk`, dan halaman mana pun yang sempat dibangun dengan asumsi `Peran` lama.

Untuk tiap pemakaian:
- `peran === "Kepala Madrasah"` → `isKepalaMadrasah(currentUser.id_pegawai, penugasanList)`
- `peran === "Admin Madrasah"` → `isAdminMadrasah(...)`
- `peran === "Operator Kesiswaan"` → `isOperatorKesiswaan(...)`
- `peran === "Guru BK"` → `isGuruBk(...)`
- `peran === "Wali Kelas"` → `isWaliKelas(...)`
- `peran === "Pembina Ekstrakurikuler"` → `isPembinaEkstrakurikuler(...)`
- `peran === "Guru Mapel"` → `currentUser.tugas_utama === "Guru"` (ditambah `isPengajar(...)` jika konteksnya spesifik rombel+mapel)

`app-shell.tsx`: struktur `roles: [...]` per item navigasi diganti jadi fungsi kondisi (`visible: (ctx) => ...`) yang mengevaluasi kombinasi status di atas — satu item nav bisa tampil karena beberapa alasan berbeda sekaligus (mis. menu Nilai tampil kalau `tugas_utama === "Guru"` **atau** dia `isWaliKelas` di suatu rombel, karena dua-duanya berujung ke halaman yang sama dengan tampilan berbeda).

## Tugas 4 — Perbaiki `/akun` dan Role Switcher

1. Role switcher tidak lagi memilih "peran" dari dropdown — pilih **satu pegawai** dari daftar (nama + ringkasan jabatannya, mis. "Bu Fatimah — Guru, Kepala Madrasah, Wali Kelas 9-A").
2. Tambahkan sub-halaman/panel sederhana di `/akun` untuk **assign/akhiri `PenugasanJabatan`** — Admin memilih pegawai, memilih `jenis_jabatan`, sistem membuat baris baru (`status: "Aktif"`) atau menutup baris lama (`status: "Berakhir"`, isi `tanggal_selesai`).

## Tugas 5 — Data Seed Pembuktian

Di `store.ts`, pastikan minimal **satu pegawai demo** dengan kombinasi jabatan yang menguji seluruh mekanisme sekaligus:
- `tugas_utama: "Guru"`
- Baris `penugasan_jabatan` aktif: `"Kepala Madrasah"`
- Muncul di `rombel.id_wali_kelas` untuk satu rombel
- Muncul di `jadwal_pelajaran.id_pegawai` untuk mapel di rombel yang **sama** dengan rombel wali kelasnya
- (opsional tapi disarankan) muncul juga di `ekstrakurikuler.id_pembina`

## Tugas 6 — `/akademik/nilai` (jika belum benar dari instruksi sebelumnya)

- Dropdown pilihan rombel+mapel+semester untuk **input** berasal dari `isPengajar` (filter `jadwal_pelajaran` milik `currentUser`), bukan dari status jabatan apa pun.
- Tab/bagian "Rekap Rombel Saya" muncul untuk **setiap** rombel hasil `getRombelWaliKelas(currentUser.id_pegawai, rombelList)` — bisa lebih dari satu tab kalau (secara hipotetis) dia wali kelas di lebih dari satu rombel, jangan hardcode asumsi satu.

---

## Definition of Done

- [ ] `grep -rn "peran" src/` — setiap hasil yang tersisa harus bisa dijelaskan (bukan sisa kode lama yang lupa dihapus). Idealnya field `peran` di `Pegawai` sudah tidak ada sama sekali.
- [ ] `grep -rn 'jenis_jabatan\|isKepalaMadrasah\|isAdminMadrasah\|isOperatorKesiswaan\|isGuruBk\|isWaliKelas\|isPembinaEkstrakurikuler\|isPengajar'` menunjukkan fungsi-fungsi `lib/access.ts` benar-benar dipakai di banyak tempat, bukan cuma didefinisikan lalu tidak dipanggil.
- [ ] Uji manual: pilih pegawai demo dari Tugas 5 di role switcher → dashboard menampilkan **minimal 3 blok berbeda sekaligus** (Kepala Madrasah + Wali Kelas + Guru mengajar), dan sidebar menampilkan menu dari ketiganya bersamaan.
- [ ] Uji manual: pegawai demo tersebut bisa input nilai mapel yang diajarnya di rombelnya sendiri, dan hasilnya muncul di tab "Rekap Rombel Saya" miliknya.
- [ ] `/akun` bisa menambah/mengakhiri `PenugasanJabatan` untuk pegawai mana pun, dan perubahan itu langsung memengaruhi apa yang tampil saat pegawai itu dipilih di role switcher.
- [ ] Log Deviasi `FRONTEND.md` Bab 9 diisi menjelaskan migrasi ini menggantikan pendekatan `Peran` sebelumnya.
- [ ] `npx tsc --noEmit` bersih.