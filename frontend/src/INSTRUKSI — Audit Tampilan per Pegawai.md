# INSTRUKSI — Audit Tampilan per Pegawai Demo (Role Switcher)

**Tujuan:** memastikan setiap pegawai di data seed menampilkan menu, halaman, dan data yang **benar dan sesuai jabatan/penugasannya masing-masing** — tidak kurang (menu yang seharusnya ada tapi hilang), tidak lebih (menu/data milik orang lain yang bocor), dan tidak generik (data yang tampil harus benar-benar milik pegawai tersebut, bukan data pegawai lain yang kebetulan tampil karena filter salah).

## Cara Kerja

Untuk **setiap pegawai** di `store.ts` yang bisa dipilih lewat Role Switcher (`/akun`):

1. Pilih pegawai tersebut di Role Switcher.
2. Catat status pegawai tersebut lebih dulu (referensi dari `lib/access.ts`): `tugas_utama`, hasil `isKepalaMadrasah`, `isAdminMadrasah`, `isOperatorKesiswaan`, `isGuruBk`, `isWaliKelas` (+ rombel mana), `isPembinaEkstrakurikuler` (+ ekstra mana), dan daftar `jadwal` miliknya (mengajar apa, di rombel mana, semester apa).
3. Cek **navigasi** (`app-shell.tsx`): menu yang tampil harus persis cocok dengan status di poin 2 — tidak ada menu ekstra, tidak ada menu yang seharusnya ada tapi hilang.
4. Cek **dashboard (`/`)**: setiap blok yang tampil (Kepala Madrasah, Wali Kelas, dst.) harus berisi data **milik pegawai ini**, bukan data pegawai lain atau data kosong/placeholder yang seharusnya terisi.
5. Untuk **setiap halaman** yang menunya tampil, buka halamannya dan periksa:
   - **Header/judul halaman** — sesuai konteks pegawai (mis. nama rombel yang benar untuk Wali Kelas, bukan rombel pertama di daftar secara default).
   - **Data/tabel yang tampil** — terfilter sesuai kepemilikan (mis. `/akademik/nilai` hanya menampilkan dropdown rombel+mapel dari `jadwal` milik pegawai ini; `/ekstrakurikuler` untuk Pembina hanya menampilkan kegiatan yang dibinanya; `/bk` menyembunyikan catatan "Rahasia" milik Guru BK lain).
   - **Form/aksi yang tersedia** — tombol/aksi yang muncul harus sesuai kewenangan (mis. tombol approve hanya untuk Kepala Madrasah, tombol input nilai hanya untuk mapel yang benar-benar diajarnya).
   - **Jadwal** — jadwal mengajar yang tampil adalah jadwal pegawai ini, bukan jadwal pegawai lain.
6. Coba akses langsung (ketik URL manual) ke **satu halaman yang seharusnya tidak boleh diakses** pegawai ini (mis. Operator Kesiswaan membuka `/kepegawaian/kedisiplinan`) — pastikan diblokir dengan pesan yang jelas, bukan menampilkan data.

## Perhatian Khusus

- **`pg_demo_terpadu`** (Guru + Kepala Madrasah + Wali Kelas 10-A + mengajar Matematika 10-A + Pembina Pramuka) — pegawai paling kritis untuk diaudit. Pastikan **seluruh** blok/menu dari keempat statusnya tampil bersamaan, dan tidak ada satu pun yang tertindih/hilang karena bentrok logika `visible`.
- Pegawai dengan `tugas_utama: "Tendik"` — pastikan tidak melihat menu apa pun yang seharusnya khusus Guru (mengajar, presensi sesi, nilai), kecuali dia juga punya `penugasan_jabatan` aktif yang relevan.
- Guru BK — pastikan pegawai BK lain (kalau ada lebih dari satu di seed) **tidak bisa saling membaca** catatan "Rahasia" satu sama lain.

## Keluaran

Untuk setiap temuan yang tidak sesuai, **perbaiki langsung di kode** (bukan hanya dilaporkan) dan catat ringkas di Log Deviasi `FRONTEND.md` Bab 9: pegawai mana, halaman mana, apa yang salah, apa perbaikannya.

## Definition of Done

- [ ] Semua pegawai di seed sudah diperiksa satu per satu sesuai langkah di atas.
- [ ] Tidak ada menu/data yang bocor lintas pegawai.
- [ ] `pg_demo_terpadu` menampilkan seluruh blok dari 4 statusnya secara bersamaan tanpa cacat.
- [ ] Percobaan akses URL langsung ke halaman terlarang menghasilkan blokir yang jelas, bukan data.
- [ ] `npx tsc --noEmit` tetap bersih.