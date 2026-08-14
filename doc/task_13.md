# INSTRUKSI — Penyesuaian Kontrak Tenant (`id_madrasah`) ke Repo Tahap 1

> `FRONTEND.md` Bab 4 dan 6.2 sudah diperbarui — tarik versi terbaru. Ini murni penyesuaian kontrak (SRS Bab 9P, keputusan multi-tenant sungguhan di Tahap 2), **bukan** fitur baru — Tahap 1 tetap demo satu madrasah.

---

## Tugas 1 — Tambahkan Tipe & Field

1. Buat `src/types/madrasah.ts` — salin `Madrasah` dari `FRONTEND.md` Bab 4.
2. Buat `src/types/mata-pelajaran.ts` (kalau belum formal sebagai file terpisah — cek dulu, mungkin sudah ada di `types/referensi.ts` tapi belum sesuai kontrak) — salin `MataPelajaran` dari Bab 4, termasuk `id_madrasah`.
3. Tambahkan field `id_madrasah: string` ke tipe yang sudah ada: `Siswa`, `Pegawai`, `Rombel`, `TahunAjaran`, `Ekstrakurikuler`, `CatatanBk` — sesuai definisi lengkap di `FRONTEND.md` Bab 4.
4. Perbaiki komentar basi di `Ekstrakurikuler.id_pembina` dan `CatatanBk.id_pegawai_bk` (masih menyebut `tugas_utama = "Pembina Ekstrakurikuler"`/`"Guru BK"` — sudah tidak berlaku sejak model jabatan terpadu, ganti sesuai komentar terbaru di `FRONTEND.md`).

## Tugas 2 — Seed Satu Madrasah + Isi `id_madrasah` di Seluruh Data Seed

1. Di `store.ts`, tambahkan satu baris `Madrasah` (mis. `{ id_madrasah: "md_1", nama_madrasah: "MTs Al-Hikmah", npsn: "...", ... }`).
2. Isi `id_madrasah: "md_1"` ke **setiap** baris seed `siswa`, `pegawai`, `rombel`, `tahunAjaran`, `mataPelajaran`, `ekstrakurikuler`, `catatanBk` yang sudah ada — semuanya merujuk tenant yang sama, konsisten.

## Tugas 3 — Service & Tampilan Header

1. Buat `src/services/madrasah.service.ts` + `.mock.ts`: satu method `getCurrent(): Promise<Madrasah>`, mengembalikan baris seed dari Tugas 2.
2. Di `app-shell.tsx`, tampilkan `nama_madrasah` di header (label statis, **bukan** dropdown/pemilih tenant).

## Batasan — Jangan Dikerjakan

- Jangan bangun UI pemilihan/pergantian madrasah.
- Jangan tambahkan logika filter `id_madrasah` di service layer manapun — cukup pastikan field-nya ada dan konsisten di data, filtering sungguhan itu tanggung jawab Tahap 2.

---

## Definition of Done

- [ ] Seluruh tipe di Tugas 1 sesuai persis kontrak `FRONTEND.md` Bab 4 (nama field, urutan tidak masalah, tapi tidak ada field hilang/berlebih).
- [ ] Seluruh baris seed domain terkait konsisten merujuk `id_madrasah` yang sama.
- [ ] Header menampilkan nama madrasah.
- [ ] Log Deviasi `FRONTEND.md` Bab 9 diisi singkat mencatat penyesuaian ini.
- [ ] `npx tsc --noEmit` bersih.