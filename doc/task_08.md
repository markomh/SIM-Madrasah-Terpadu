# INSTRUKSI KOREKSI — Isu Kuning Tersisa: Bug Store Ekstrakurikuler & Pengecualian JTM

---

## Bagian A — BUG KRITIS: `ekstrakurikuler.mock.ts` Terisolasi dari Store Utama

**Ini prioritas tertinggi di seluruh instruksi ini.** `src/services/ekstrakurikuler.mock.ts` menyimpan data di array `let` tingkat modul (`mockEkstra`, `mockKeanggotaan`, `mockAbsensi`) — **sama sekali terpisah** dari `loadStore()`/`mutateStore()` yang dipakai semua domain lain. Akibat nyata yang sudah terbukti:

- `store.ts` men-*seed* `ek_1` "Pramuka" dengan `id_pembina: "pg_demo_terpadu"` — tapi `ekstrakurikuler.mock.ts` punya `ek_1` "Pramuka" **versinya sendiri** dengan `id_pembina: "pg_pembina"`. Dua ID pegawai berbeda untuk "entitas yang sama".
- Karena `auth-context.tsx` memanggil `services.ekstrakurikuler.getAll()` (yang membaca dari array terisolasi ini, bukan dari `store.ekstrakurikuler`), **skenario pembuktian rangkap jabatan `pg_demo_terpadu` tidak lagi valid** — `isPembinaEkstrakurikuler` untuknya kemungkinan besar sekarang `false`, padahal seharusnya `true`.
- Data yang diinput lewat halaman `/ekstrakurikuler` (tambah ekstra, tambah anggota) **tidak ikut tersimpan** ke mekanisme persistensi `localStorage` (`STORAGE_KEY_V5`) yang dipakai domain lain — kemungkinan besar hilang setiap refresh browser, tidak konsisten dengan seluruh modul lain yang sudah diaudit.

**Perbaikan wajib:**
1. Hapus seluruh array `let mockEkstra`, `let mockKeanggotaan`, `let mockAbsensi` dari `ekstrakurikuler.mock.ts`.
2. Ganti setiap operasi baca/tulis agar memakai `loadStore()` (baca) dan `mutateStore()` (tulis) terhadap `store.ekstrakurikuler`, `store.keanggotaanEkstra`, `store.absensiEkstra` — persis pola yang dipakai `sesi-tatap-muka.mock.ts`, `persetujuan.mock.ts`, dan seluruh service lain.
3. Hapus data seed duplikat (`pg_pembina` sebagai pembina "Pramuka") dari file ini — satu-satunya sumber seed yang sah adalah `store.ts`.
4. **Uji manual wajib**: pilih `pg_demo_terpadu` di role switcher, buka `/ekstrakurikuler`, pastikan dia muncul sebagai Pembina "Pramuka". Tambah satu ekstrakurikuler baru, refresh browser, pastikan data itu **tetap ada** (bukti persistensi lewat `store` yang benar).
5. **Verifikasi silang**: cek apakah pola isolasi store yang sama terjadi di file service lain — jalankan `grep -rn "^let mock\|^const mock.*: .*\[\] =" src/services/*.mock.ts` dan pastikan **hanya** `store.ts` yang jadi sumber data persisten; kalau ditemukan pola serupa di file lain, perbaiki dengan cara yang sama.

---

## Bagian B — Pengecualian Kepala Madrasah & Penyesuaian Guru BK dari Ambang JTM Belum Diimplementasikan

**Latar belakang:** SRS Bab 10 poin 15 sudah direvisi untuk mengecualikan Kepala Madrasah dari ambang flag kedisiplinan & realisasi JTM standar (selaras Permendikbud 6/2018 Pasal 15 — beban kerja manajerial tidak terekam lewat `jadwal_pelajaran`). Ini **belum masuk** ke `getRekapKedisiplinan` di `sesi-tatap-muka.mock.ts` — fungsi itu saat ini memproses **semua** `pegawai.tugas_utama === "Guru"` tanpa pengecualian.

**Perbaikan wajib** di `getRekapKedisiplinan`:
1. Sebelum melakukan `.map()` ke seluruh guru, filter keluar pegawai yang punya baris `penugasan_jabatan` aktif dengan `jenis_jabatan === "Kepala Madrasah"` — pegawai ini **tidak muncul sama sekali** di hasil rekap kedisiplinan standar (bukan muncul dengan nilai 0/dikecualikan sebagian, tapi memang tidak dievaluasi ambang tersebut).
2. Untuk Guru BK (`penugasan_jabatan` aktif "Guru BK"): tetap tampilkan di rekap **tapi hanya jika** dia juga punya baris `jadwal_pelajaran` (artinya dia juga mengajar mapel). Kalau Guru BK murni tanpa jadwal mengajar sama sekali, **jangan** tampilkan dia sebagai "0% realisasi JTM" seolah itu pelanggaran — keluarkan dari daftar yang dievaluasi ambang, sama seperti Kepala Madrasah.
3. Tambahkan catatan singkat di UI halaman `/kepegawaian/kedisiplinan` (mis. teks kecil di bawah tabel) yang menjelaskan bahwa Kepala Madrasah dan Guru BK non-pengajar sengaja tidak muncul di rekap ini, supaya tidak terlihat seperti data hilang/bug bagi pengguna.

**Uji manual wajib**: pastikan `pg_demo_terpadu` (Kepala Madrasah) **tidak muncul** di tabel `/kepegawaian/kedisiplinan` sama sekali, meski realisasi JTM mengajarnya (kalau ada) rendah.

---

## Bagian C — Disambiguasi Penamaan "JTM" (dokumentasi menyusul dari SRS/backend.md)

SRS Bab 10 poin 22 (baru) menegaskan ada **dua metrik JTM berbeda**: "Realisasi Kehadiran JTM" (kedisiplinan, dari `sesi_tatap_muka`) vs "JTM Terjadwal" (beban kerja/sertifikasi, dari `jadwal_pelajaran`, fitur baru di halaman Jadwal). Tidak ada perbaikan kode wajib di sini — hanya pastikan label UI di kedua halaman (`/kepegawaian/kedisiplinan` dan `/akademik/jadwal`) **tidak sama-sama menampilkan teks generik "JTM"** tanpa keterangan — beri label eksplisit "Realisasi Kehadiran JTM" vs "JTM Terjadwal (Sertifikasi)" di kedua tempat kalau belum begitu.

---

## Definition of Done

- [ ] `ekstrakurikuler.mock.ts` sepenuhnya memakai `loadStore()`/`mutateStore()`, tidak ada array `let` module-level lagi.
- [ ] `pg_demo_terpadu` terverifikasi muncul sebagai Pembina Pramuka setelah perbaikan.
- [ ] Data ekstrakurikuler bertahan setelah refresh browser (persistensi terverifikasi manual).
- [ ] `grep -rn "^let mock\|^const mock.*: .*\[\] ="` terhadap seluruh `src/services/*.mock.ts` sudah diverifikasi bersih dari pola isolasi serupa.
- [ ] Kepala Madrasah tidak muncul di rekap kedisiplinan/JTM standar.
- [ ] Guru BK tanpa jadwal mengajar tidak muncul sebagai pelanggaran 0% JTM.
- [ ] Label "Realisasi Kehadiran JTM" vs "JTM Terjadwal (Sertifikasi)" jelas berbeda di kedua halaman.
- [ ] Log Deviasi `FRONTEND.md` Bab 9 diisi untuk ketiga perbaikan ini.
- [ ] `npx tsc --noEmit` bersih.